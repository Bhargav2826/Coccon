import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BASE_URL = 'http://localhost:5001/api';

// Create a test file for upload
function createTestFile() {
  const testContent = 'This is a test file for faculty messaging upload.';
  const testFilePath = path.join(process.cwd(), 'test-file.txt');
  fs.writeFileSync(testFilePath, testContent);
  return testFilePath;
}

// Test authenticated file upload
async function testAuthenticatedFileUpload() {
  try {
    console.log('🧪 Testing Authenticated Faculty File Upload...\n');

    // Test 1: Check if server is running
    console.log('1. Testing server connectivity...');
    try {
      const response = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Server is running');
    } catch (error) {
      console.log('❌ Server is not running');
      return;
    }

    // Test 2: Create a faculty user and login
    console.log('\n2. Testing faculty authentication...');
    
    const facultyData = {
      email: 'faculty-test@example.com',
      password: 'testpass123',
      fullName: 'Test Faculty',
      role: 'faculty'
    };

    let authToken = null;
    let facultyId = null;

    try {
      // Try to signup first
      const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, facultyData);
      console.log('✅ Faculty user created');
      facultyId = signupResponse.data.user._id;
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.message.includes('already exists')) {
        console.log('✅ Faculty user already exists');
      } else {
        console.log('❌ Failed to create faculty user:', error.response?.data?.message);
        return;
      }
    }

    // Login to get auth token
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
        console.log('❌ Could not extract auth token from cookies');
        return;
      }
    } catch (error) {
      console.log('❌ Faculty login failed:', error.response?.data?.message);
      return;
    }

    // Test 3: Create a room for testing
    console.log('\n3. Creating test room...');
    
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

    // Test 4: Test file upload with authentication
    console.log('\n4. Testing authenticated file upload...');
    
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
      console.log('❌ File upload failed:', error.response?.status, error.response?.data);
      console.log('   Error details:', error.response?.data);
    }

    // Clean up
    try {
      fs.unlinkSync(testFilePath);
      console.log('\n✅ Test file cleaned up');
    } catch (error) {
      console.log('\n⚠️ Could not clean up test file:', error.message);
    }

    console.log('\n🔍 Authenticated file upload test completed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuthenticatedFileUpload();
