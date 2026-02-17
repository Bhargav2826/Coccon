import mongoose from "mongoose";

const groupChatSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            default: "",
        },
        groupPic: {
            type: String,
            default: "",
        },
        type: {
            type: String,
            enum: ['regular', 'classroom'],
            default: 'regular',
        },
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "GroupMessage",
        },
    },
    { timestamps: true }
);

groupChatSchema.pre("save", function (next) {
    if (!this.groupPic || this.groupPic.trim() === "") {
        this.groupPic = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=random`;
    }
    next();
});

const GroupChat = mongoose.model("GroupChat", groupChatSchema);

export default GroupChat;
