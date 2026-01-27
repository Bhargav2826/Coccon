// Test script to check friends API
// Run with: node test-friends-api.js

import mongoose from "mongoose";
import User from "./src/models/User.js";
import "dotenv/config";

const testFriendsAPI = async () => {
  try {
    // Connect to database
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("❌ MONGO_URI environment variable is missing");
      return;
    }
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to database");

    // Get all users
    const users = await User.find().select("_id fullName email role friends");
    
    console.log("\n📋 All Users:");
    users.forEach(user => {
      console.log(`  ${user.fullName} (${user.role}) - ID: ${user._id}`);
      console.log(`    Friends: ${user.friends.length} - [${user.friends.join(', ')}]`);
    });

    // Test with a specific user (first user)
    if (users.length > 0) {
      const testUser = users[0];
      console.log(`\n🧪 Testing with user: ${testUser.fullName}`);
      
      // Simulate the getMyFriends logic
      const userWithFriends = await User.findById(testUser._id)
        .select("friends")
        .populate("friends", "fullName profilePic nativeLanguage learningLanguage");

      console.log(`\n📊 Friends data for ${testUser.fullName}:`);
      console.log("  Raw friends array:", userWithFriends.friends);
      console.log("  Friends count:", userWithFriends.friends.length);
      
      if (userWithFriends.friends.length > 0) {
        console.log("  Friend details:");
        userWithFriends.friends.forEach(friend => {
          console.log(`    - ${friend.fullName} (${friend._id})`);
        });
      }
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from database");
  }
};

// Run the test
testFriendsAPI();
