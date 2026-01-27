
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/User.js";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const checkUsers = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({}).limit(10);
    console.log("Checking samples:");
    users.forEach(u => {
        console.log(`- ${u.fullName}: [${u.profilePic}]`);
    });
    process.exit(0);
};

checkUsers();
