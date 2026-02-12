import mongoose from "mongoose";

const groupMessageSchema = new mongoose.Schema(
    {
        group: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "GroupChat",
            required: true,
        },
        sender: {
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
        voiceUrl: {
            type: String,
        },
        isReadBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            }
        ],
        reactions: [
            {
                userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                emoji: String,
            }
        ],
        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "GroupMessage",
            default: null
        },
        isEdited: {
            type: Boolean,
            default: false
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
    },
    { timestamps: true }
);

const GroupMessage = mongoose.model("GroupMessage", groupMessageSchema);

export default GroupMessage;
