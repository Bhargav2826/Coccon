import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BASE_URL = 'http://localhost:5001/api';

// Create a simple test image (base64 encoded PNG)
function createTestImage() {
  // This is a minimal 1x1 pixel PNG image in base64
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const imageBuffer = Buffer.from(pngBase64, 'base64');
  const testImagePath = path.join(process.cwd(), 'test-image.png');
  fs.writeFileSync(testImagePath, imageBuffer);
  return testImagePath;
}

async function testImageUpload() {
  try {
    console.log('🧪 Testing Image File Upload...\n');

    // Test 1: Check server health
    console.log('1. Checking server health...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Server is healthy:', healthResponse.data.status);
    } catch (error) {
      console.log('❌ Server health check failed:', error.message);
      return;
    }

    // Test 2: Login as existing faculty user
    console.log('\n2. Logging in faculty user...');
    const facultyData = {
      email: 'test-faculty@example.com',
      password: 'testpass123'
    };

    let authToken = null;
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, facultyData);
      
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

    // Test 3: Get existing room or create one
    console.log('\n3. Getting faculty rooms...');
    let roomId = null;
    try {
      const roomsResponse = await axios.get(`${BASE_URL}/rooms/my-rooms`, {
        headers: {
          Cookie: authToken
        }
      });
      
      if (roomsResponse.data.rooms && roomsResponse.data.rooms.length > 0) {
        roomId = roomsResponse.data.rooms[0]._id;
        console.log('✅ Using existing room:', roomId);
      } else {
        // Create a new room
        const roomResponse = await axios.post(`${BASE_URL}/rooms/create`, {
          roomName: 'Test Room for Image Upload'
        }, {
          headers: {
            Cookie: authToken
          }
        });
        
        roomId = roomResponse.data.room._id;
        console.log('✅ Created new room:', roomId);
      }
    } catch (error) {
      console.log('❌ Failed to get/create room:', error.response?.data?.message);
      return;
    }

    // Test 4: Test image upload
    console.log('\n4. Testing image upload...');
    const testImagePath = createTestImage();
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testImagePath), {
      filename: 'test-image.png',
      contentType: 'image/png'
    });
    formData.append('roomId', roomId);
    
    try {
      const uploadResponse = await axios.post(`${BASE_URL}/faculty-messaging/send-file`, formData, {
        headers: {
          ...formData.getHeaders(),
          Cookie: authToken
        },
      });
      
      console.log('✅ Image upload successful!');
      console.log('   Response:', uploadResponse.data);
      
    } catch (error) {
      console.log('❌ Image upload failed:');
      console.log('   Status:', error.response?.status);
      console.log('   Message:', error.response?.data?.message);
      console.log('   Error:', error.response?.data?.error);
      
      if (error.response?.data) {
        console.log('   Full error response:', JSON.stringify(error.response.data, null, 2));
      }
    }

    // Clean up
    try {
      fs.unlinkSync(testImagePath);
      console.log('\n✅ Test image cleaned up');
    } catch (error) {
      console.log('\n⚠️ Could not clean up test image:', error.message);
    }

    console.log('\n🔍 Image upload test completed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testImageUpload();
