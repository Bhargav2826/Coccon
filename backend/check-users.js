import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/User.js";

// Load environment variables
dotenv.config();

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get all users
    const users = await User.find({}).select('fullName email role');
    
    console.log(`📊 Found ${users.length} users:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.fullName} (${user.email}) - ${user.role}`);
    });
    
    // Show faculty users specifically
    const facultyUsers = users.filter(user => user.role === 'faculty');
    console.log(`\n👨‍🏫 Faculty users (${facultyUsers.length}):`);
    facultyUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.fullName} (${user.email})`);
    });
    
    // Show student users
    const studentUsers = users.filter(user => user.role === 'student');
    console.log(`\n👨‍🎓 Student users (${studentUsers.length}):`);
    studentUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.fullName} (${user.email})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkUsers();
