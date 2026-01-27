// Script to create test messages for AI analysis
// Run with: node create-test-messages.js

import mongoose from "mongoose";
import Message from "./src/models/Message.js";
import User from "./src/models/User.js";
import "dotenv/config";

const createTestMessages = async () => {
  try {
    // Connect to database
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("❌ MONGO_URI environment variable is missing");
      return;
    }
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to database");

    // Get some users from the database
    const users = await User.find().limit(4);
    
    if (users.length < 2) {
      console.log("❌ Need at least 2 users in database. Please create some users first.");
      return;
    }

    console.log(`📋 Found ${users.length} users:`, users.map(u => `${u.fullName} (${u.role})`));

    // Create test messages between users
    const testMessages = [
      {
        sender: users[0]._id,
        recipient: users[1]._id,
        content: "Hi! How are you doing today?",
        messageType: "text",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        sender: users[1]._id,
        recipient: users[0]._id,
        content: "I'm doing great! Just finished my homework. How about you?",
        messageType: "text",
        createdAt: new Date(Date.now() - 23 * 60 * 60 * 1000) // 23 hours ago
      },
      {
        sender: users[0]._id,
        recipient: users[1]._id,
        content: "That's awesome! I'm working on a project for school. It's really interesting!",
        messageType: "text",
        createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000) // 22 hours ago
      },
      {
        sender: users[1]._id,
        recipient: users[0]._id,
        content: "What kind of project? I'd love to hear about it!",
        messageType: "text",
        createdAt: new Date(Date.now() - 21 * 60 * 60 * 1000) // 21 hours ago
      },
      {
        sender: users[0]._id,
        recipient: users[1]._id,
        content: "It's about environmental science. We're learning about climate change and what we can do to help.",
        messageType: "text",
        createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000) // 20 hours ago
      },
      {
        sender: users[1]._id,
        recipient: users[0]._id,
        content: "That sounds really important! I think it's great that you're learning about that.",
        messageType: "text",
        createdAt: new Date(Date.now() - 19 * 60 * 60 * 1000) // 19 hours ago
      },
      {
        sender: users[0]._id,
        recipient: users[1]._id,
        content: "Thanks! I'm really excited about it. Maybe we can work on something together sometime?",
        messageType: "text",
        createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000) // 18 hours ago
      },
      {
        sender: users[1]._id,
        recipient: users[0]._id,
        content: "That would be amazing! I'd love to collaborate on a project with you.",
        messageType: "text",
        createdAt: new Date(Date.now() - 17 * 60 * 60 * 1000) // 17 hours ago
      }
    ];

    // Clear existing test messages (optional)
    await Message.deleteMany({});
    console.log("🧹 Cleared existing messages");

    // Insert test messages
    const createdMessages = await Message.insertMany(testMessages);
    console.log(`✅ Created ${createdMessages.length} test messages`);

    // Display the messages
    console.log("\n📝 Test Messages Created:");
    for (const msg of createdMessages) {
      const sender = users.find(u => u._id.toString() === msg.sender.toString());
      const recipient = users.find(u => u._id.toString() === msg.recipient.toString());
      console.log(`  ${sender?.fullName} → ${recipient?.fullName}: "${msg.content}"`);
    }

    console.log("\n🎯 Now you can test AI analysis with:");
    console.log(`  childUid: ${users[0]._id}`);
    console.log(`  targetUid: ${users[1]._id}`);

    console.log("\n✨ Test messages created successfully!");
    console.log("🔍 You can now use the AI analysis feature in the Parent Dashboard");

  } catch (error) {
    console.error("❌ Error creating test messages:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from database");
  }
};

// Run the script
createTestMessages();
