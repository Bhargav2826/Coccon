import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5001/api';

// Create a test image
function createTestImage() {
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const imageBuffer = Buffer.from(pngBase64, 'base64');
  const testImagePath = path.join(process.cwd(), 'test-frontend-flow.png');
  fs.writeFileSync(testImagePath, imageBuffer);
  return testImagePath;
}

async function testFrontendFlow() {
  try {
    console.log('🧪 Testing Frontend Flow Simulation...\n');

    // Step 1: Login as faculty
    console.log('1. Logging in as faculty...');
    let cookies = [];
    
    try {
      const authResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'bhargav@gmail.com',
        password: '123456'
      }, {
        withCredentials: true
      });
      
      const setCookieHeader = authResponse.headers['set-cookie'];
      if (setCookieHeader) {
        cookies = setCookieHeader.map(cookie => cookie.split(';')[0]);
        console.log('✅ Login successful');
        console.log('   User:', authResponse.data.user?.fullName);
        console.log('   Role:', authResponse.data.user?.role);
      }
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data?.message || error.message);
      return;
    }

    // Step 2: Get faculty rooms (simulate FacultyDashboard)
    console.log('\n2. Getting faculty rooms...');
    try {
      const roomsResponse = await axios.get(`${BASE_URL}/rooms/my-rooms`, {
        headers: {
          'Cookie': cookies.join('; ')
        },
        withCredentials: true
      });
      
      const rooms = roomsResponse.data.rooms;
      console.log(`✅ Found ${rooms.length} rooms`);
      
      if (rooms.length === 0) {
        console.log('❌ No rooms found for faculty');
        return;
      }

      // Display room details
      rooms.forEach((room, index) => {
        console.log(`   ${index + 1}. ${room.roomName} (ID: ${room._id})`);
        console.log(`      Members: ${room.members?.length || 0}`);
      });

      // Step 3: Test file upload with first room (simulate FacultyMessaging)
      console.log('\n3. Testing file upload with first room...');
      const selectedRoom = rooms[0];
      console.log(`   Using room: ${selectedRoom.roomName} (ID: ${selectedRoom._id})`);
      
      const testImagePath = createTestImage();
      
      try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(testImagePath));
        formData.append('roomId', selectedRoom._id);
        
        console.log('   Sending file upload request...');
        const uploadResponse = await axios.post(`${BASE_URL}/faculty-messaging/send-file`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Cookie': cookies.join('; ')
          },
          withCredentials: true,
          timeout: 30000,
        });
        
        console.log('✅ File upload successful!');
        console.log('   Response:', uploadResponse.data);
        
      } catch (error) {
        console.log('❌ File upload failed:');
        console.log('   Status:', error.response?.status);
        console.log('   Message:', error.response?.data?.message);
        console.log('   Error:', error.response?.data?.error);
        console.log('   Full Error:', error.message);
      } finally {
        if (fs.existsSync(testImagePath)) {
          fs.unlinkSync(testImagePath);
        }
      }

    } catch (error) {
      console.log('❌ Failed to get rooms:', error.response?.data?.message || error.message);
    }

    console.log('\n🔍 Test completed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFrontendFlow();
