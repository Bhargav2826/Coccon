import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5001/api';

// Create a test image
function createTestImage() {
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const imageBuffer = Buffer.from(pngBase64, 'base64');
  const testImagePath = path.join(process.cwd(), 'test-frontend-file-debug.png');
  fs.writeFileSync(testImagePath, imageBuffer);
  return testImagePath;
}

async function testFrontendFileDebug() {
  try {
    console.log('🧪 Testing Frontend File Debug...\n');

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

    // Step 2: Get faculty rooms
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

      const selectedRoom = rooms[0];
      console.log(`   Using room: ${selectedRoom.roomName} (ID: ${selectedRoom._id})`);

      // Step 3: Test file upload with different file types
      console.log('\n3. Testing file upload with different file types...');
      
      // Test 1: PNG image
      console.log('\n   Test 1: PNG image...');
      const testImagePath = createTestImage();
      const imageStats = fs.statSync(testImagePath);
      console.log(`   File size: ${imageStats.size} bytes`);
      
      const formData = new FormData();
      formData.append('file', fs.createReadStream(testImagePath));
      formData.append('roomId', selectedRoom._id);

      try {
        const uploadResponse = await axios.post(`${BASE_URL}/faculty-messaging/send-file`, formData, {
          headers: {
            ...formData.getHeaders(),
            'Cookie': cookies.join('; ')
          },
          withCredentials: true,
          timeout: 30000
        });
        
        console.log('✅ PNG upload successful!');
        console.log('   Response:', uploadResponse.data);
      } catch (error) {
        console.log('❌ PNG upload failed:');
        console.log('   Status:', error.response?.status);
        console.log('   Message:', error.response?.data?.message);
        console.log('   Error:', error.response?.data?.error);
      }

      // Test 2: Text file
      console.log('\n   Test 2: Text file...');
      const textFilePath = path.join(process.cwd(), 'test-frontend-file-debug.txt');
      fs.writeFileSync(textFilePath, 'This is a test text file for debugging.');
      const textStats = fs.statSync(textFilePath);
      console.log(`   File size: ${textStats.size} bytes`);
      
      const textFormData = new FormData();
      textFormData.append('file', fs.createReadStream(textFilePath));
      textFormData.append('roomId', selectedRoom._id);

      try {
        const textUploadResponse = await axios.post(`${BASE_URL}/faculty-messaging/send-file`, textFormData, {
          headers: {
            ...textFormData.getHeaders(),
            'Cookie': cookies.join('; ')
          },
          withCredentials: true,
          timeout: 30000
        });
        
        console.log('✅ Text file upload successful!');
        console.log('   Response:', textUploadResponse.data);
      } catch (error) {
        console.log('❌ Text file upload failed:');
        console.log('   Status:', error.response?.status);
        console.log('   Message:', error.response?.data?.message);
        console.log('   Error:', error.response?.data?.error);
      }

      // Clean up test files
      if (fs.existsSync(testImagePath)) fs.unlinkSync(testImagePath);
      if (fs.existsSync(textFilePath)) fs.unlinkSync(textFilePath);

    } catch (error) {
      console.log('❌ Failed to get rooms:', error.response?.data?.message || error.message);
    }

    console.log('\n🔍 Test completed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFrontendFileDebug();
