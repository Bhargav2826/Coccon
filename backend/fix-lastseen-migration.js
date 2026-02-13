import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const fixLastSeenTimestamps = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Get all users
        const users = await User.find({});
        console.log(`📊 Found ${users.length} users`);

        // Update each user with a randomized lastSeen in the past
        // This makes it more realistic - some users were online recently, others days ago
        for (const user of users) {
            // Random time between 1 hour ago and 30 days ago
            const hoursAgo = Math.floor(Math.random() * (30 * 24 - 1)) + 1; // 1 hour to 30 days
            const lastSeenDate = new Date(Date.now() - (hoursAgo * 60 * 60 * 1000));

            await User.findByIdAndUpdate(user._id, {
                lastSeen: lastSeenDate
            });

            console.log(`✅ Updated ${user.fullName}: Last seen ${hoursAgo} hours ago`);
        }

        console.log('✅ Migration completed successfully');
        console.log('💡 Note: Users will have realistic "last seen" times now');
        console.log('💡 When users actually disconnect, their real lastSeen will be updated');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

fixLastSeenTimestamps();
