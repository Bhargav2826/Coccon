import User from "../models/User.js";
import ChatMessage from "../models/ChatMessage.js";
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
        }).sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (error) {
        console.log("Error in getMessages controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { text, image, file, fileName, fileType, voiceUrl, replyTo, poll, contact } = req.body;
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
        });

        await newMessage.save();

        if (replyTo) {
            await newMessage.populate("replyTo");
        }
        if (contact) {
            await newMessage.populate("contact", "fullName profilePic email");
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

        const message = await ChatMessage.findById(messageId);
        if (!message) return res.status(404).json({ error: "Message not found" });
        if (message.sender.toString() !== userId.toString()) return res.status(403).json({ error: "Unauthorized" });

        message.isDeleted = true;
        message.text = "This message was deleted";
        message.image = undefined;
        message.fileUrl = undefined;
        message.voiceUrl = undefined;
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
            .populate("participants", "fullName profilePic")
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

        const existingVoteIndex = option.voters.indexOf(userId);

        if (existingVoteIndex !== -1) {
            option.voters.splice(existingVoteIndex, 1);
        } else {
            if (!poll.allowMultiple) {
                poll.options.forEach((opt) => {
                    const idx = opt.voters.indexOf(userId);
                    if (idx !== -1) opt.voters.splice(idx, 1);
                });
            }
            option.voters.push(userId);
        }

        await message.save();

        const otherUserId = message.sender.toString() === userId.toString() ? message.receiver : message.sender;
        const otherSocketId = getReceiverSocketId(otherUserId);
        if (otherSocketId) {
            io.to(otherSocketId).emit("messageUpdate", message);
        }

        res.status(200).json(message);
    } catch (error) {
        console.error("Error in votePoll:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
