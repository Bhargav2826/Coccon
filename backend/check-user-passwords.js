import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Import User model
import User from './src/models/User.js';

async function checkUserPasswords() {
  try {
    console.log('🔍 Checking User Passwords...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all faculty users
    const facultyUsers = await User.find({ role: 'faculty' });
    console.log(`📊 Found ${facultyUsers.length} faculty users:`);

    facultyUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.fullName} (${user.email}) - Role: ${user.role}`);
    });

    // Test common passwords
    const testPasswords = [
      'password123',
      'password',
      '123456',
      'admin',
      'faculty',
      'test123',
      'password123!',
      'Password123'
    ];

    console.log('\n🔍 Testing passwords for faculty users...');
    
    for (const user of facultyUsers) {
      console.log(`\nTesting passwords for: ${user.fullName} (${user.email})`);
      
      for (const password of testPasswords) {
        try {
          const isMatch = await bcrypt.compare(password, user.password);
          if (isMatch) {
            console.log(`✅ Password found: "${password}"`);
            break;
          }
        } catch (error) {
          console.log(`❌ Error testing password "${password}":`, error.message);
        }
      }
    }

    // Create a test faculty user if none exist or all passwords are unknown
    console.log('\n🔍 Creating a test faculty user...');
    
    const testFaculty = await User.findOne({ email: 'test-faculty@example.com' });
    if (!testFaculty) {
      const hashedPassword = await bcrypt.hash('password123', 12);
      const newFaculty = new User({
        fullName: 'Test Faculty',
        email: 'test-faculty@example.com',
        password: hashedPassword,
        role: 'faculty'
      });
      await newFaculty.save();
      console.log('✅ Created test faculty user: test-faculty@example.com / password123');
    } else {
      console.log('✅ Test faculty user already exists');
    }

    console.log('\n🔍 Test completed');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

checkUserPasswords();
