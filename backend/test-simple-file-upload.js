import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BASE_URL = 'http://localhost:5001/api';

// Create a simple test file
function createTestFile() {
  const testContent = 'This is a test image file for faculty messaging.';
  const testFilePath = path.join(process.cwd(), 'test-image.txt');
  fs.writeFileSync(testFilePath, testContent);
  return testFilePath;
}

async function testSimpleFileUpload() {
  try {
    console.log('🧪 Testing Simple File Upload...\n');

    // Test 1: Check server health
    console.log('1. Checking server health...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Server is healthy:', healthResponse.data.status);
    } catch (error) {
      console.log('❌ Server health check failed:', error.message);
      return;
    }

    // Test 2: Create a faculty user
    console.log('\n2. Creating faculty user...');
    const facultyData = {
      email: 'test-faculty@example.com',
      password: 'testpass123',
      fullName: 'Test Faculty',
      role: 'faculty'
    };

    let authToken = null;
    try {
      const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, facultyData);
      console.log('✅ Faculty user created');
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.message.includes('already exists')) {
        console.log('✅ Faculty user already exists');
      } else {
        console.log('❌ Failed to create faculty user:', error.response?.data?.message);
        return;
      }
    }

    // Test 3: Login to get auth token
    console.log('\n3. Logging in faculty user...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: facultyData.email,
        password: facultyData.password
      });
      
      // Extract JWT token from cookies
      const cookies = loginResponse.headers['set-cookie'];
      if (cookies) {
        const jwtCookie = cookies.find(cookie => cookie.startsWith('jwt='));
        if (jwtCookie) {
          authToken = jwtCookie.split(';')[0];
          console.log('✅ Faculty login successful');
        }
      }
      
      if (!authToken) {
        console.log('❌ Could not extract auth token');
        return;
      }
    } catch (error) {
      console.log('❌ Faculty login failed:', error.response?.data?.message);
      return;
    }

    // Test 4: Create a room
    console.log('\n4. Creating test room...');
    let roomId = null;
    try {
      const roomResponse = await axios.post(`${BASE_URL}/rooms/create`, {
        roomName: 'Test Room for File Upload'
      }, {
        headers: {
          Cookie: authToken
        }
      });
      
      roomId = roomResponse.data.room._id;
      console.log('✅ Test room created:', roomId);
    } catch (error) {
      console.log('❌ Failed to create room:', error.response?.data?.message);
      return;
    }

    // Test 5: Test file upload
    console.log('\n5. Testing file upload...');
    const testFilePath = createTestFile();
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('roomId', roomId);
    
    try {
      const uploadResponse = await axios.post(`${BASE_URL}/faculty-messaging/send-file`, formData, {
        headers: {
          ...formData.getHeaders(),
          Cookie: authToken
        },
      });
      
      console.log('✅ File upload successful!');
      console.log('   Response:', uploadResponse.data);
      
    } catch (error) {
      console.log('❌ File upload failed:');
      console.log('   Status:', error.response?.status);
      console.log('   Message:', error.response?.data?.message);
      console.log('   Error:', error.response?.data?.error);
      
      if (error.response?.data?.message) {
        console.log('   Full error response:', JSON.stringify(error.response.data, null, 2));
      }
    }

    // Clean up
    try {
      fs.unlinkSync(testFilePath);
      console.log('\n✅ Test file cleaned up');
    } catch (error) {
      console.log('\n⚠️ Could not clean up test file:', error.message);
    }

    console.log('\n🔍 File upload test completed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSimpleFileUpload();
