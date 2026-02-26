import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/User.js";

dotenv.config({ path: "./.env" });

const BROKEN_URL = "https://fonts.gstatic.com/s/e/notoemoji/latest/1f9d8/lottie.json";
const FALLBACK_URL = "https://fonts.gstatic.com/s/e/notoemoji/latest/2728/lottie.json"; // Magic

async function fixBrokenAvatars() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB...");

        const usersWithBrokenAvatars = await User.find({ lottieAvatar: BROKEN_URL });
        console.log(`Found ${usersWithBrokenAvatars.length} users with broken lottie avatars.`);

        if (usersWithBrokenAvatars.length > 0) {
            const result = await User.updateMany(
                { lottieAvatar: BROKEN_URL },
                { $set: { lottieAvatar: FALLBACK_URL } }
            );
            console.log(`Successfully updated ${result.modifiedCount} users to a working animation.`);
        }

        console.log("Cleanup complete!");
        process.exit(0);
    } catch (error) {
        console.error("Error during cleanup:", error);
        process.exit(1);
    }
}

fixBrokenAvatars();
