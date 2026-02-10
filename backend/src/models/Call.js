
import mongoose from "mongoose";

const callSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],
        roomId: {
            type: String,
            required: false, // Optional for chat sessions
            // unique: true, // Removed to allow separate call records for same room
        },
        callerName: {
            type: String,
        },
        receiverName: {
            type: String,
        },
        transcripts: [
            {
                sender: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
                text: {
                    type: String,
                    required: true,
                },
                timestamp: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        summary: {
            type: String,
            default: "",
        },
        safetyAlert: {
            type: {
                type: String,
                default: "safe",
            },
            message: {
                type: String,
                default: "",
            },
        },
        sentiment: {
            type: String,
            default: "neutral",
        },
        specificIssues: [
            {
                type: String,
            },
        ],
        type: {
            type: String,
            enum: ["audio", "video", "chat"], // Added 'chat' for chat sessions
            default: "video",
        },
        status: {
            type: String,
            enum: ["ongoing", "ended"],
            default: "ongoing",
        },
        startedAt: {
            type: Date,
            default: Date.now,
        },
        endedAt: {
            type: Date,
        },
    },
    { timestamps: true }
);


const Call = mongoose.model("Call", callSchema);

export default Call;
