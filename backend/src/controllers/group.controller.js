import GroupChat from "../models/GroupChat.js";
import GroupMessage from "../models/GroupMessage.js";
import User from "../models/User.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import cloudinary from "../lib/cloudinary.js";

export const createGroup = async (req, res) => {
    try {
        const { name, members, description, groupPic } = req.body;
        const adminId = req.user._id;

        const newGroup = new GroupChat({
            name,
            description,
            groupPic,
            admin: adminId,
            members: [...members, adminId],
        });

        await newGroup.save();

        // Notify all members
        newGroup.members.forEach(memberId => {
            const socketId = getReceiverSocketId(memberId);
            if (socketId) io.to(socketId).emit("newGroup", newGroup);
        });

        res.status(201).json(newGroup);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getGroups = async (req, res) => {
    try {
        const userId = req.user._id;
        const groups = await GroupChat.find({ members: userId }).populate("lastMessage");

        const groupsWithUnread = await Promise.all(
            groups.map(async (group) => {
                const unreadCount = await GroupMessage.countDocuments({
                    group: group._id,
                    sender: { $ne: userId },
                    isReadBy: { $ne: userId }
                });
                return {
                    ...group.toObject(),
                    unreadCount
                };
            })
        );

        res.status(200).json(groupsWithUnread);
    } catch (error) {
        console.error("Error in getGroups:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const sendGroupMessage = async (req, res) => {
    try {
        const { text, image, file, fileName, fileType, voiceUrl, replyTo, poll, contact } = req.body;
        const { groupId } = req.params;
        const senderId = req.user._id;

        const group = await GroupChat.findById(groupId);
        if (!group) return res.status(404).json({ error: "Group not found" });

        // Check if it's a classroom group and restrict posting to admin (faculty) only
        if (group.type === 'classroom' && group.admin.toString() !== senderId.toString()) {
            return res.status(403).json({ error: "Only faculty can send messages in this classroom group" });
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
                } catch (error) {
                    console.error("Cloudinary upload error:", error);
                }
            } else if (typeof fileToUpload === "string" && fileToUpload.startsWith("http")) {
                finalFileUrl = fileToUpload;
            }
        }

        const newMessage = new GroupMessage({
            group: groupId,
            sender: senderId,
            text,
            image: (finalFileType === "image" || image) ? (finalFileUrl || image) : undefined,
            fileUrl: !isVoiceMessage ? (finalFileUrl || (fileType !== "text" ? file : undefined)) : undefined,
            fileType: finalFileType,
            fileName,
            voiceUrl: finalVoiceUrl || voiceUrl || undefined,
            replyTo,
            poll,
            contact,
        });

        await newMessage.save();
        const populatedMessage = await newMessage.populate([
            { path: "sender", select: "fullName profilePic role academicSubjects emojiAvatar lottieAvatar lastProfileUpdate profileVisibility" },
            { path: "replyTo" },
            { path: "contact", select: "fullName profilePic email role academicSubjects emojiAvatar lottieAvatar lastProfileUpdate profileVisibility" }
        ]);

        group.lastMessage = newMessage._id;
        await group.save();

        // Broadcast to all group members
        group.members.forEach(memberId => {
            const socketId = getReceiverSocketId(memberId);
            if (socketId) io.to(socketId).emit("newGroupMessage", { groupId, message: populatedMessage });
        });

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error("Error in sendGroupMessage:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getGroupMessages = async (req, res) => {
    try {
        const { groupId } = req.params;
        const messages = await GroupMessage.find({ group: groupId })
            .populate("sender", "fullName profilePic role academicSubjects emojiAvatar lottieAvatar lastProfileUpdate profileVisibility")
            .populate("replyTo")
            .sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

export const voteGroupPoll = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { optionIndex } = req.body;
        const userId = req.user._id;

        const message = await GroupMessage.findById(messageId).populate("group");
        if (!message) return res.status(404).json({ error: "Message not found" });

        const poll = message.poll;
        if (!poll) return res.status(400).json({ error: "This is not a poll" });

        const option = poll.options[optionIndex];
        if (!option) return res.status(400).json({ error: "Option not found" });

        // Check vote
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

        const populatedMessage = await GroupMessage.findById(message._id)
            .populate("sender", "fullName profilePic role academicSubjects emojiAvatar lottieAvatar lastProfileUpdate profileVisibility")
            .populate("replyTo")
            .populate("contact", "fullName profilePic email role academicSubjects emojiAvatar lottieAvatar lastProfileUpdate profileVisibility");

        // Broadcast to group members
        const group = message.group;
        if (group && group.members) {
            group.members.forEach((memberId) => {
                const socketStr = memberId.toString();
                io.to(socketStr).emit("messageUpdate", populatedMessage);
            });
        }

        res.status(200).json(populatedMessage);
    } catch (error) {
        console.error("Error in voteGroupPoll:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
