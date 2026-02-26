import User from "../models/User.js";
import ChatMessage from "../models/ChatMessage.js";
import GroupMessage from "../models/GroupMessage.js";
import Call from "../models/Call.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import cloudinary from "../lib/cloudinary.js";

export const getUsersForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const users = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

        const usersWithDetails = await Promise.all(
            users.map(async (user) => {
                const unreadCount = await ChatMessage.countDocuments({
                    sender: user._id,
                    receiver: loggedInUserId,
                    isRead: false,
                });

                const lastMessage = await ChatMessage.findOne({
                    $or: [
                        { sender: loggedInUserId, receiver: user._id },
                        { sender: user._id, receiver: loggedInUserId },
                    ],
                }).sort({ createdAt: -1 });

                return {
                    ...user.toObject(),
                    unreadCount,
                    lastMessage: lastMessage ? {
                        text: lastMessage.text,
                        image: lastMessage.image,
                        fileUrl: lastMessage.fileUrl,
                        createdAt: lastMessage.createdAt,
                    } : null,
                };
            })
        );

        res.status(200).json(usersWithDetails);
    } catch (error) {
        console.error("Error in getUsersForSidebar: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user._id;

        const messages = await ChatMessage.find({
            $or: [
                { sender: myId, receiver: userToChatId },
                { sender: userToChatId, receiver: myId },
            ],
        }).populate("mentions", "fullName profilePic role").sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (error) {
        console.log("Error in getMessages controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { text, image, file, fileName, fileType, voiceUrl, replyTo, poll, contact, mentions, isForwarded } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        if (!receiverId) {
            return res.status(400).json({ error: "Receiver ID is required" });
        }

        let finalFileUrl = "";
        let finalFileType = fileType || "text";
        let finalVoiceUrl = "";

        // Check if this is a voice message (audio file)
        const isVoiceMessage = fileType && (fileType.startsWith("audio") || fileType === "audio/ogg");

        if (isVoiceMessage && file && !file.startsWith("http")) {
            // Handle voice message upload
            try {
                // Cloudinary can sometimes fail with 'codecs=opus' in the data URI prefix
                const cleanFile = file.replace(/;codecs=[^;,]+/, "");

                const uploadResponse = await cloudinary.uploader.upload(cleanFile, {
                    resource_type: "video", // Cloudinary uses 'video' for audio files
                    format: "mp3",          // Transcode to mp3 for universal support
                });
                finalVoiceUrl = uploadResponse.secure_url;
            } catch (uploadError) {
                console.error("Voice upload error:", uploadError);
            }
        } else {
            // Handle Image or File Upload if sent as base64/buffer
            const fileToUpload = file || image;
            if (fileToUpload && !fileToUpload.startsWith("http")) {
                try {
                    const uploadResponse = await cloudinary.uploader.upload(fileToUpload, {
                        resource_type: "auto",
                    });
                    finalFileUrl = uploadResponse.secure_url;
                    finalFileType = uploadResponse.resource_type;
                } catch (uploadError) {
                    console.error("Cloudinary upload error:", uploadError);
                }
            } else if (typeof fileToUpload === "string" && fileToUpload.startsWith("http")) {
                finalFileUrl = fileToUpload;
            }
        }

        const newMessage = new ChatMessage({
            sender: senderId,
            receiver: receiverId,
            text: text || "",
            image: (finalFileType === "image" || image) ? (finalFileUrl || image) : undefined,
            fileUrl: !isVoiceMessage ? (finalFileUrl || (fileType !== "text" ? file : undefined)) : undefined,
            fileType: finalFileType,
            fileName: fileName || undefined,
            voiceUrl: finalVoiceUrl || voiceUrl || undefined,
            replyTo: replyTo || undefined,
            poll: poll || undefined,
            contact: contact || undefined,
            mentions: mentions || undefined,
            isForwarded: isForwarded || false,
        });

        await newMessage.save();

        if (replyTo) {
            await newMessage.populate("replyTo");
        }
        if (contact) {
            await newMessage.populate("contact", "fullName profilePic email role academicSubjects emojiAvatar lottieAvatar lastProfileUpdate profileVisibility");
        }

        if (mentions && mentions.length > 0) {
            await newMessage.populate("mentions", "fullName profilePic role");
        }

        // Broadcast via socket
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Error in sendMessage:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const updateMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { text } = req.body;
        const userId = req.user._id;

        const message = await ChatMessage.findById(messageId);
        if (!message) return res.status(404).json({ error: "Message not found" });
        if (message.sender.toString() !== userId.toString()) return res.status(403).json({ error: "Unauthorized" });

        message.editHistory.push({ text: message.text, updatedAt: new Date() });
        message.text = text;
        message.isEdited = true;
        await message.save();

        const receiverSocketId = getReceiverSocketId(message.receiver);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageUpdate", message);
        }

        res.status(200).json(message);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        // Try direct chat first
        let message = await ChatMessage.findById(messageId);
        let isGroupMsg = false;

        if (!message) {
            // Try group chat
            message = await GroupMessage.findById(messageId);
            isGroupMsg = true;
        }

        if (!message) return res.status(404).json({ error: "Message not found" });
        if (message.sender.toString() !== userId.toString()) return res.status(403).json({ error: "Unauthorized" });

        message.isDeleted = true;
        // Optimization: We No longer overwrite text/images/voice so Parents can see audits.
        // User-facing UI logic (ChatContainer) will handle the obfuscation.
        await message.save();

        const populatedMessage = await (isGroupMsg ? GroupMessage : ChatMessage)
            .findById(message._id)
            .populate("sender", "fullName profilePic role");

        if (isGroupMsg) {
            const GroupChat = (await import("../models/GroupChat.js")).default;
            const group = await GroupChat.findById(message.group);
            if (group && group.members) {
                group.members.forEach((memberId) => {
                    const socketStr = memberId.toString();
                    io.to(socketStr).emit("messageUpdate", populatedMessage);
                });
            }
        } else {
            const receiverSocketStr = message.receiver.toString();
            const senderSocketStr = message.sender.toString();

            io.to(receiverSocketStr).emit("messageUpdate", populatedMessage);
            io.to(senderSocketStr).emit("messageUpdate", populatedMessage);
        }

        res.status(200).json(populatedMessage);
    } catch (error) {
        console.error("Delete message error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const searchMessages = async (req, res) => {
    try {
        const { query, userId: otherUserId } = req.query;
        const myId = req.user._id;

        const messages = await ChatMessage.find({
            $or: [
                { sender: myId, receiver: otherUserId },
                { sender: otherUserId, receiver: myId },
            ],
            text: { $regex: query, $options: "i" },
            isDeleted: false,
        }).sort({ createdAt: -1 });

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getCallLogs = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user._id;

        const calls = await Call.find({
            participants: { $all: [myId, userToChatId] }
        })
            .populate("participants", "fullName profilePic role academicSubjects emojiAvatar lottieAvatar lastProfileUpdate profileVisibility")
            .sort({ createdAt: -1 });

        res.status(200).json(calls);
    } catch (error) {
        console.error("Error in getCallLogs:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


export const votePoll = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { optionIndex } = req.body;
        const userId = req.user._id;

        const message = await ChatMessage.findById(messageId);
        if (!message) return res.status(404).json({ error: "Message not found" });

        const poll = message.poll;
        if (!poll) return res.status(400).json({ error: "This is not a poll" });

        const option = poll.options[optionIndex];
        if (!option) return res.status(400).json({ error: "Option not found" });

        const existingVoteIndex = option.voters.findIndex(id => id.toString() === userId.toString());

        if (existingVoteIndex !== -1) {
            option.voters.splice(existingVoteIndex, 1);
        } else {
            if (!poll.allowMultiple) {
                poll.options.forEach((opt) => {
                    const idx = opt.voters.findIndex(id => id.toString() === userId.toString());
                    if (idx !== -1) opt.voters.splice(idx, 1);
                });
            }
            option.voters.push(userId);
        }

        await message.save();

        const populatedMessage = await ChatMessage.findById(message._id)
            .populate("replyTo")
            .populate("contact", "fullName profilePic email role academicSubjects emojiAvatar lottieAvatar lastProfileUpdate profileVisibility")
            .populate("mentions", "fullName profilePic role");

        // Broadcast to both so all their active devices instantly sync
        const receiverSocketStr = message.receiver.toString();
        const senderSocketStr = message.sender.toString();

        io.to(receiverSocketStr).emit("messageUpdate", populatedMessage);
        io.to(senderSocketStr).emit("messageUpdate", populatedMessage);

        res.status(200).json(populatedMessage);
    } catch (error) {
        console.error("Error in votePoll:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const forwardMessage = async (req, res) => {
    try {
        const { messageId, targetType, targetId } = req.body; // targetType: 'user' or 'group'
        const senderId = req.user._id;

        if (!messageId || !targetType || !targetId) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // 1. Find the original message (could be in ChatMessage or GroupMessage)
        let originalMessage = await ChatMessage.findById(messageId);
        if (!originalMessage) {
            originalMessage = await GroupMessage.findById(messageId);
        }

        if (!originalMessage) {
            return res.status(404).json({ error: "Original message not found" });
        }

        // 2. Prepare the new message content (cloning from original)
        const messageData = {
            sender: senderId,
            text: originalMessage.text,
            image: originalMessage.image,
            fileUrl: originalMessage.fileUrl,
            fileName: originalMessage.fileName,
            fileType: originalMessage.fileType,
            voiceUrl: originalMessage.voiceUrl,
            contact: originalMessage.contact,
            poll: originalMessage.poll,
            isForwarded: true,
        };

        let newMessage;

        if (targetType === "user") {
            newMessage = new ChatMessage({
                ...messageData,
                receiver: targetId,
            });
            await newMessage.save();

            // Populate sender
            await newMessage.populate("sender", "fullName profilePic role");

            // Broadcast via socket
            const receiverSocketId = getReceiverSocketId(targetId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("newMessage", newMessage);
            }
        } else if (targetType === "group") {
            newMessage = new GroupMessage({
                ...messageData,
                group: targetId,
            });
            await newMessage.save();

            // Populate sender
            await newMessage.populate("sender", "fullName profilePic role");

            // Update group's last message
            const GroupChat = (await import("../models/GroupChat.js")).default;
            const group = await GroupChat.findById(targetId);
            if (group) {
                group.lastMessage = newMessage._id;
                await group.save();

                // Broadcast to all group members
                group.members.forEach(memberId => {
                    const socketId = getReceiverSocketId(memberId);
                    if (socketId) io.to(socketId).emit("newGroupMessage", { groupId: targetId, message: newMessage });
                });
            }
        } else {
            return res.status(400).json({ error: "Invalid target type" });
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Error in forwardMessage:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
