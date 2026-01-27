
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/User.js";
import Call from "../src/models/Call.js";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars
dotenv.config({ path: join(__dirname, '../.env') });

const createDummyCall = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        // 1. Find a parent
        const parent = await User.findOne({ role: "parent" });
        if (!parent) {
            console.log("❌ No parent found. Please sign up a parent first.");
            process.exit(1);
        }

        // 2. Find a child linked to this parent (or just any child if not linked yet)
        // We try to find a child IN the parent's children array first
        let child;
        if (parent.children && parent.children.length > 0) {
            child = await User.findById(parent.children[0]);
        }

        // Fallback: find any student
        if (!child) {
            child = await User.findOne({ role: "student" });
        }

        if (!child) {
            console.log("❌ No student/child found. Please sign up a student.");
            process.exit(1);
        }

        // 3. Find a separate target user (Faculty or Student)
        const target = await User.findOne({
            _id: { $ne: child._id, $ne: parent._id },
            $or: [{ role: "student" }, { role: "faculty" }]
        });

        if (!target) {
            console.log("❌ No target user found to talk to.");
            process.exit(1);
        }

        console.log(`Creating dummy call between:
    - Child: ${child.fullName} (${child.email})
    - Target: ${target.fullName} (${target.email})
    - Parent: ${parent.fullName} (should check this child on dashboard)
    `);

        // 4. Create the Call Record with explicit timestamps
        // Create a call from 2 hours ago
        const startTime = new Date(Date.now() - 1000 * 60 * 60 * 2);
        const endTime = new Date(Date.now() - 1000 * 60 * 60 * 1.8);

        const call1 = await Call.create({
            participants: [child._id, target._id],
            roomId: `test-call-${Date.now()}`,
            type: 'video',
            status: 'ended',
            startedAt: startTime,
            endedAt: endTime,
            transcripts: [
                {
                    sender: child._id,
                    text: "Hey, are you free to study tonight?",
                    timestamp: new Date(startTime.getTime() + 1000)
                },
                {
                    sender: target._id,
                    text: "Yeah, I can meet you at the library.",
                    timestamp: new Date(startTime.getTime() + 5000)
                },
                {
                    sender: child._id,
                    text: "Cool. I promise I won't play video games this time.",
                    timestamp: new Date(startTime.getTime() + 10000)
                },
                {
                    sender: target._id,
                    text: "Good, because we have a test tomorrow.",
                    timestamp: new Date(startTime.getTime() + 15000)
                }
            ]
        });
        console.log("✅ Created Video Call record:", call1._id);

        // Create a call from yesterday (Audio)
        const yesterdayStart = new Date(Date.now() - 1000 * 60 * 60 * 24);
        const call2 = await Call.create({
            participants: [child._id, target._id],
            roomId: `test-call-2-${Date.now()}`,
            type: 'audio',
            status: 'ended',
            startedAt: yesterdayStart,
            endedAt: new Date(yesterdayStart.getTime() + 1000 * 60 * 10),
            transcripts: [
                {
                    sender: child._id,
                    text: "Did you hear what the teacher said?",
                    timestamp: new Date(yesterdayStart.getTime() + 1000)
                },
                {
                    sender: target._id,
                    text: "No, I was asleep.",
                    timestamp: new Date(yesterdayStart.getTime() + 5000)
                }
            ]
        });
        console.log("✅ Created Audio Call record:", call2._id);

        console.log("\nsuccess! Now follows these steps:");
        console.log("1. Go to Parent Dashboard");
        console.log(`2. Select child: ${child.fullName}`);
        console.log(`3. Find conversation with: ${target.fullName}`);
        console.log("4. Click the 'Phone' icon (Call Summary)");
        console.log("5. You should see summarized analysis of these 2 calls.");

        process.exit(0);

    } catch (err) {
        console.error("Error Seeding:", err);
        process.exit(1);
    }
};

createDummyCall();
