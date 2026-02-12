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
        res.status(200).json(groups);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

export const sendGroupMessage = async (req, res) => {
    try {
        const { text, image, file, fileName, fileType, voiceUrl, replyTo } = req.body;
        const { groupId } = req.params;
        const senderId = req.user._id;

        const group = await GroupChat.findById(groupId);
        if (!group) return res.status(404).json({ error: "Group not found" });

        let finalFileUrl = "";
        let finalFileType = fileType || "text";

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

        const newMessage = new GroupMessage({
            group: groupId,
            sender: senderId,
            text,
            image: (finalFileType === "image" || image) ? (finalFileUrl || image) : undefined,
            fileUrl: finalFileUrl || (fileType !== "text" ? file : undefined),
            fileType: finalFileType,
            fileName,
            voiceUrl,
            replyTo,
        });

        await newMessage.save();
        const populatedMessage = await newMessage.populate([
            { path: "sender", select: "fullName profilePic" },
            { path: "replyTo" }
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
            .populate("sender", "fullName profilePic")
            .populate("replyTo")
            .sort({ createdAt: 1 });
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};
