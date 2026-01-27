
import mongoose from "mongoose";
import dotenv from "dotenv";
import Call from "../src/models/Call.js";

dotenv.config();

const checkCalls = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        console.log("\n--- LATEST 5 CALL RECORDS ---");
        const calls = await Call.find()
            .sort({ createdAt: -1 })
            .limit(5);

        if (calls.length === 0) {
            console.log("No call records found in database.");
        } else {
            calls.forEach((call, index) => {
                console.log(`\n[Call #${index + 1}]`);
                console.log(`ID: ${call._id}`);
                console.log(`Room ID: ${call.roomId}`);
                console.log(`Caller: ${call.callerName || 'N/A'}`);
                console.log(`Receiver: ${call.receiverName || 'N/A'}`);
                console.log(`Type: ${call.type || 'video'}`);
                console.log(`Status: ${call.status}`);
                console.log(`Started At: ${call.startedAt}`);
                console.log(`Ended At: ${call.endedAt || 'Still ongoing'}`);
                console.log(`Transcript count: ${call.transcripts.length}`);
            });
        }

        mongoose.disconnect();
    } catch (error) {
        console.error("Error checking calls:", error);
        process.exit(1);
    }
};

checkCalls();
