
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/User.js";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars
dotenv.config({ path: join(__dirname, '../.env') });

const migrateProfilePics = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        const users = await User.find({
            $or: [
                { profilePic: { $exists: false } },
                { profilePic: "" },
                { profilePic: null },
                { profilePic: { $regex: "avatar.iran.liara.run" } }
            ]
        });

        console.log(`Found ${users.length} users with missing profile pictures.`);

        for (const user of users) {
            const name = user.fullName || "User";
            const newPic = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

            user.profilePic = newPic;
            await user.save();
            console.log(`Updated avatar for: ${user.fullName}`);
        }

        console.log("✅ Migration complete!");
        process.exit(0);

    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
};

migrateProfilePics();
