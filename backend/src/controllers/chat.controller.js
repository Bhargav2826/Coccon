import User from "../models/User.js";
import ChatMessage from "../models/ChatMessage.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import cloudinary from "../lib/cloudinary.js";

export const getUsersForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

        res.status(200).json(filteredUsers);
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
        const { text, image, file, fileName, fileType } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        if (!receiverId) {
            return res.status(400).json({ error: "Receiver ID is required" });
        }

        let fileUrl = "";
        let finalFileType = "text";

        // Handle Image or File Upload
        const fileToUpload = file || image;
        if (fileToUpload) {
            try {
                const uploadResponse = await cloudinary.uploader.upload(fileToUpload, {
                    resource_type: "auto",
                });
                fileUrl = uploadResponse.secure_url;
                finalFileType = uploadResponse.resource_type; // 'image', 'video', or 'raw'
            } catch (uploadError) {
                console.error("Cloudinary upload error:", uploadError);
                return res.status(500).json({ error: `Failed to upload file to Cloudinary: ${uploadError.message}` });
            }
        }

        const newMessage = new ChatMessage({
            sender: senderId,
            receiver: receiverId,
            text: text || "",
            image: finalFileType === "image" ? fileUrl : undefined,
            fileUrl: fileUrl || undefined,
            fileType: finalFileType,
            fileName: fileName || undefined,
        });

        await newMessage.save();

        // Broadcast via socket
        try {
            const receiverSocketId = getReceiverSocketId(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("newMessage", newMessage.toObject());
            }
        } catch (socketError) {
            console.error("Socket emission error:", socketError);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Error in sendMessage controller detail:", error);
        res.status(500).json({ error: `Server Error: ${error.message}` });
    }
};
