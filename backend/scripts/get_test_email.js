
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/User.js";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({}).limit(1);
        if (users.length > 0) {
            console.log(`Test Email: ${users[0].email}`);
        } else {
            console.log("No users found");
        }
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

checkUsers();
