import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5001/api';

// Create a test image
function createTestImage() {
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const imageBuffer = Buffer.from(pngBase64, 'base64');
  const testImagePath = path.join(process.cwd(), 'test-auth.png');
  fs.writeFileSync(testImagePath, imageBuffer);
  return testImagePath;
}

async function testAuthUpload() {
  try {
    console.log('🧪 Testing File Upload With Authentication...\n');

    // Test 1: Check server health
    console.log('1. Checking server health...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Server is healthy');
    } catch (error) {
      console.log('❌ Server health check failed:', error.message);
      return;
    }

    // Test 2: Test authentication with faculty user
    console.log('\n2. Testing authentication...');
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
        console.log('✅ Authentication successful');
        console.log('   User:', authResponse.data.user?.fullName);
        console.log('   Role:', authResponse.data.user?.role);
      } else {
        console.log('⚠️ No cookies received');
      }
      
    } catch (error) {
      console.log('❌ Authentication failed:', error.response?.data?.message || error.message);
      return;
    }

    // Test 3: Test file upload with authentication
    console.log('\n3. Testing file upload with authentication...');
    const testImagePath = createTestImage();
    
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(testImagePath));
      formData.append('roomId', '68a36e125700322a134ea87e');
      
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
      
      if (error.response?.data?.stack) {
        console.log('   Stack Trace:', error.response.data.stack);
      }
    } finally {
      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
      }
    }

    console.log('\n🔍 Test completed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuthUpload();
