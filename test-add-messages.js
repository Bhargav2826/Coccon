const mongoose = require('mongoose');

// Connect to MongoDB
const MONGODB_URI = 'mongodb://localhost:27017/streamify';
mongoose.connect(MONGODB_URI);

// Define Message schema (simplified version)
const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  messageType: {
    type: String,
    enum: ["text", "image", "file", "system"],
    default: "text",
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room",
  },
  streamMessageId: {
    type: String,
    unique: true,
  },
  fileUrl: {
    type: String,
  },
  fileName: {
    type: String,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);

async function addTestMessages() {
  console.log('🧪 Adding test messages to verify direct chat detection\n');

  try {
    // Replace these with actual user IDs from your database
    const childId = 'CHILD_USER_ID_HERE'; // Replace with actual child ID
    const classroomMemberId = 'CLASSROOM_MEMBER_ID_HERE'; // Replace with actual classroom member ID
    const friendId = 'FRIEND_ID_HERE'; // Replace with actual friend ID

    console.log('📝 Adding test messages...');

    // Add a message from child to classroom member
    const message1 = new Message({
      sender: childId,
      recipient: classroomMemberId,
      content: "Hi! How are you doing with the homework?",
      messageType: "text",
      streamMessageId: `test-msg-1-${Date.now()}`
    });

    // Add a message from classroom member to child
    const message2 = new Message({
      sender: classroomMemberId,
      recipient: childId,
      content: "I'm doing well, thanks! How about you?",
      messageType: "text",
      streamMessageId: `test-msg-2-${Date.now()}`
    });

    // Add a message from child to friend
    const message3 = new Message({
      sender: childId,
      recipient: friendId,
      content: "Want to play games later?",
      messageType: "text",
      streamMessageId: `test-msg-3-${Date.now()}`
    });

    await message1.save();
    await message2.save();
    await message3.save();

    console.log('✅ Test messages added successfully!');
    console.log('📊 Messages added:');
    console.log(`   - Child → Classroom Member: "${message1.content}"`);
    console.log(`   - Classroom Member → Child: "${message2.content}"`);
    console.log(`   - Child → Friend: "${message3.content}"`);

    // Test the aggregation query
    console.log('\n🔍 Testing aggregation query...');
    const chatPartners = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: childId },
            { recipient: childId }
          ]
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", childId] },
              "$recipient",
              "$sender"
            ]
          }
        }
      }
    ]);

    console.log('✅ Aggregation query results:');
    console.log(`   - Found ${chatPartners.length} chat partners`);
    chatPartners.forEach((partner, index) => {
      console.log(`   ${index + 1}. Partner ID: ${partner._id}`);
    });

    console.log('\n💡 Now test the parent dashboard to see if direct chat detection works!');

  } catch (error) {
    console.error('❌ Error adding test messages:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

// Instructions for use
console.log('📋 Instructions:');
console.log('1. Replace the user IDs with actual IDs from your database');
console.log('2. Run this script to add test messages');
console.log('3. Check the parent dashboard to see if direct chat detection works');
console.log('4. Look for the "Direct Chat" counter and badges\n');

addTestMessages();
