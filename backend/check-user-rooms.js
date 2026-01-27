import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Import models
import User from './src/models/User.js';
import Room from './src/models/Room.js';

async function checkUserRooms() {
  try {
    console.log('🔍 Checking User Rooms...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the faculty user
    const facultyUser = await User.findOne({ email: 'bhargav@gmail.com' });
    if (!facultyUser) {
      console.log('❌ Faculty user not found');
      return;
    }

    console.log(`👨‍🏫 Faculty User: ${facultyUser.fullName} (${facultyUser.email})`);
    console.log(`   ID: ${facultyUser._id}`);

    // Find rooms owned by this faculty
    const ownedRooms = await Room.find({ faculty: facultyUser._id }).populate('members', 'fullName email');
    console.log(`\n📚 Rooms owned by ${facultyUser.fullName}:`);
    
    if (ownedRooms.length === 0) {
      console.log('   No rooms found');
    } else {
      ownedRooms.forEach((room, index) => {
        console.log(`\n   ${index + 1}. Room: ${room.roomName}`);
        console.log(`      ID: ${room._id}`);
        console.log(`      Members: ${room.members.length}`);
        room.members.forEach((member, mIndex) => {
          console.log(`         ${mIndex + 1}. ${member.fullName} (${member.email})`);
        });
      });
    }

    // Find rooms where this faculty is a member
    const memberRooms = await Room.find({ members: facultyUser._id }).populate('faculty', 'fullName email');
    console.log(`\n👥 Rooms where ${facultyUser.fullName} is a member:`);
    
    if (memberRooms.length === 0) {
      console.log('   No rooms found');
    } else {
      memberRooms.forEach((room, index) => {
        console.log(`\n   ${index + 1}. Room: ${room.roomName}`);
        console.log(`      ID: ${room._id}`);
        console.log(`      Faculty: ${room.faculty?.fullName || 'None'} (${room.faculty?.email || 'None'})`);
      });
    }

    // Create a test room if none exist
    if (ownedRooms.length === 0) {
      console.log('\n🔍 Creating a test room...');
      
      // Find a student to add to the room
      const student = await User.findOne({ role: 'student' });
      if (student) {
        const newRoom = new Room({
          roomName: 'Test Faculty Room',
          faculty: facultyUser._id,
          members: [student._id],
          description: 'Test room for faculty file upload'
        });
        await newRoom.save();
        console.log('✅ Created test room with student member');
        console.log(`   Room ID: ${newRoom._id}`);
        console.log(`   Student: ${student.fullName} (${student.email})`);
      } else {
        console.log('❌ No students found to create room');
      }
    }

    console.log('\n🔍 Test completed');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

checkUserRooms();
