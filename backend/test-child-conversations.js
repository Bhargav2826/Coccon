import mongoose from "mongoose";
import dotenv from "dotenv";
import { streamServerClient } from "./src/lib/stream.js";

dotenv.config();

// Connect to MongoDB
await mongoose.connect(process.env.MONGODB_URI);
console.log("✅ Connected to MongoDB");

// Test function to check Stream Chat conversations
async function testStreamChatConversations() {
  try {
    console.log("🔍 Testing Stream Chat conversation detection...");
    
    // Get a sample child user
    const User = (await import("./src/models/User.js")).default;
    const child = await User.findOne({ role: "student" });
    
    if (!child) {
      console.log("❌ No student found in database");
      return;
    }
    
    console.log(`👤 Testing with child: ${child.fullName} (${child._id})`);
    
    // Get all other users
    const allUsers = await User.find({ _id: { $ne: child._id } }).select("_id fullName");
    console.log(`📊 Found ${allUsers.length} other users to check`);
    
    const streamChatPartners = new Set();
    
    if (streamServerClient) {
      for (const user of allUsers) {
        const userId = user._id.toString();
        const channelId = [child._id.toString(), userId].sort().join("-");
        
        try {
          const channel = streamServerClient.channel("messaging", channelId);
          const queryRes = await channel.query({
            messages: { limit: 1 }
          });
          
          if (queryRes.messages && queryRes.messages.length > 0) {
            streamChatPartners.add(userId);
            console.log(`✅ Found Stream Chat conversation with: ${user.fullName} (${userId})`);
          }
        } catch (error) {
          console.log(`ℹ️ No Stream Chat conversation with: ${user.fullName} (${userId})`);
        }
      }
      
      console.log(`\n📊 Results:`);
      console.log(`- Total users checked: ${allUsers.length}`);
      console.log(`- Stream Chat conversations found: ${streamChatPartners.size}`);
      
      if (streamChatPartners.size > 0) {
        console.log(`- Conversation partners: ${Array.from(streamChatPartners).join(", ")}`);
      }
    } else {
      console.log("❌ Stream Chat client not available");
    }
    
  } catch (error) {
    console.error("❌ Error testing Stream Chat conversations:", error);
  }
}

// Run the test
await testStreamChatConversations();

// Close connection
await mongoose.connection.close();
console.log("✅ Test completed");
