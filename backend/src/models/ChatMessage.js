import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        text: {
            type: String,
        },
        image: {
            type: String,
        },
        fileUrl: {
            type: String,
        },
        fileName: {
            type: String,
        },
        fileType: {
            type: String,
        },
    },
    { timestamps: true }
);

// Prevent model overwrite error
const ChatMessage = mongoose.models.ChatMessage || mongoose.model("ChatMessage", chatMessageSchema);

export default ChatMessage;
