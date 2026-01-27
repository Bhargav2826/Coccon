import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BASE_URL = 'http://localhost:5001/api';

// Create a test image
function createTestImage() {
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const imageBuffer = Buffer.from(pngBase64, 'base64');
  const testImagePath = path.join(process.cwd(), 'test-frontend-image.png');
  fs.writeFileSync(testImagePath, imageBuffer);
  return testImagePath;
}

async function testFrontendUpload() {
  try {
    console.log('🧪 Testing Frontend-Style File Upload...\n');

    // Test 1: Check server health
    console.log('1. Checking server health...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Server is healthy');
    } catch (error) {
      console.log('❌ Server health check failed:', error.message);
      return;
    }

    // Test 2: Login as faculty
    console.log('\n2. Logging in faculty user...');
    let authToken;
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'bhargav@gmail.com',
        password: 'password123'
      });
      authToken = loginResponse.data.token;
      console.log('✅ Faculty login successful');
    } catch (error) {
      console.log('❌ Faculty login failed:', error.response?.data?.message || error.message);
      return;
    }

    // Test 3: Get faculty rooms
    console.log('\n3. Getting faculty rooms...');
    let roomId;
    try {
      const roomsResponse = await axios.get(`${BASE_URL}/rooms/faculty`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      roomId = roomsResponse.data.rooms[0]?._id;
      if (!roomId) {
        console.log('❌ No rooms found for faculty');
        return;
      }
      console.log('✅ Using room:', roomId);
    } catch (error) {
      console.log('❌ Failed to get rooms:', error.response?.data?.message || error.message);
      return;
    }

    // Test 4: Test file upload with exact frontend format
    console.log('\n4. Testing file upload (frontend format)...');
    const testImagePath = createTestImage();
    
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(testImagePath));
      formData.append('roomId', roomId.toString());
      
      console.log('🔍 FormData contents:');
      console.log('  - file:', testImagePath);
      console.log('  - roomId:', roomId.toString());
      
      const uploadResponse = await axios.post(`${BASE_URL}/faculty-messaging/send-file`, formData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });
      
      console.log('✅ File upload successful!');
      console.log('   Response:', uploadResponse.data);
      
    } catch (error) {
      console.log('❌ File upload failed:');
      console.log('   Status:', error.response?.status);
      console.log('   Message:', error.response?.data?.message);
      console.log('   Error:', error.message);
      
      if (error.code === 'ECONNABORTED') {
        console.log('   ⚠️ Request timed out - this matches the frontend error');
      }
    } finally {
      // Clean up test file
      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
        console.log('✅ Test image cleaned up');
      }
    }

    console.log('\n🔍 Frontend upload test completed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFrontendUpload();
