import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const updateExistingUsersLastSeen = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Update all users who don't have a lastSeen value or have an invalid one
        const result = await User.updateMany(
            {
                $or: [
                    { lastSeen: { $exists: false } },
                    { lastSeen: null }
                ]
            },
            {
                $set: { lastSeen: new Date() }
            }
        );

        console.log(`✅ Updated ${result.modifiedCount} users with lastSeen timestamp`);

        // Also update all users to ensure they have the latest schema
        const allUsersCount = await User.countDocuments();
        console.log(`📊 Total users in database: ${allUsersCount}`);

        await mongoose.disconnect();
        console.log('✅ Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

updateExistingUsersLastSeen();
