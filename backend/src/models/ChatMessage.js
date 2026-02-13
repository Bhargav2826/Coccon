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
        isRead: {
            type: Boolean,
            default: false,
        },
        reactions: [
            {
                userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                emoji: String,
            }
        ],
        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ChatMessage",
            default: null
        },
        isEdited: {
            type: Boolean,
            default: false
        },
        editHistory: [
            {
                text: String,
                updatedAt: { type: Date, default: Date.now }
            }
        ],
        isDeleted: {
            type: Boolean,
            default: false
        },
        starredBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        voiceUrl: {
            type: String
        },
        poll: {
            question: { type: String },
            options: [
                {
                    text: { type: String },
                    voters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
                }
            ],
            allowMultiple: { type: Boolean, default: false }
        },
        contact: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
    },
    { timestamps: true }
);

// Prevent model overwrite error
const ChatMessage = mongoose.models.ChatMessage || mongoose.model("ChatMessage", chatMessageSchema);

export default ChatMessage;
