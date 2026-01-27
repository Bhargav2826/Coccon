
import mongoose from "mongoose";
import dotenv from "dotenv";
import Call from "../src/models/Call.js";
import User from "../src/models/User.js";

dotenv.config();

const checkTranscripts = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        // Fetch the 5 most recent calls
        const calls = await Call.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("participants", "fullName email")
            .populate("transcripts.sender", "fullName email role");

        if (calls.length === 0) {
            console.log("No calls found in the database.");
        } else {
            console.log(`\nFound ${calls.length} recent calls:\n`);

            calls.forEach((call, index) => {
                console.log(`--- Call #${index + 1} ---`);
                console.log(`ID: ${call._id}`);
                console.log(`Room ID: ${call.roomId}`);
                console.log(`Type: ${call.type}`);
                console.log(`Status: ${call.status}`);
                console.log(`Participants: ${call.participants.map(p => p.fullName).join(", ")}`);
                console.log(`StartTime: ${call.createdAt}`);

                console.log(`\nTranscripts (${call.transcripts.length} entries):`);
                if (call.transcripts.length > 0) {
                    call.transcripts.forEach(t => {
                        const senderName = t.sender ? t.sender.fullName : "Unknown";
                        console.log(`[${new Date(t.timestamp).toLocaleTimeString()}] ${senderName}: "${t.text}"`);
                    });
                } else {
                    console.log("  (No transcripts stored yet)");
                }
                console.log("\n-----------------------------------\n");
            });
        }

        mongoose.disconnect();
    } catch (error) {
        console.error("Error checking transcripts:", error);
        process.exit(1);
    }
};

checkTranscripts();
