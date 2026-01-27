import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5001/api';

// Create a test image
function createTestImage() {
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const imageBuffer = Buffer.from(pngBase64, 'base64');
  const testImagePath = path.join(process.cwd(), 'test-fixes-image.png');
  fs.writeFileSync(testImagePath, imageBuffer);
  return testImagePath;
}

async function testFixes() {
  try {
    console.log('🧪 Testing Faculty File Upload Fixes...\n');

    // Test 1: Check server health
    console.log('1. Checking server health...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Server is healthy');
    } catch (error) {
      console.log('❌ Server health check failed:', error.message);
      return;
    }

    // Test 2: Test authentication
    console.log('\n2. Testing authentication...');
    let cookies = [];
    
    try {
      const authResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'bhargav@gmail.com',
        password: 'password123'
      }, {
        withCredentials: true
      });
      
      const setCookieHeader = authResponse.headers['set-cookie'];
      if (setCookieHeader) {
        cookies = setCookieHeader.map(cookie => cookie.split(';')[0]);
        console.log('✅ Authentication successful');
        console.log('   Cookies received:', cookies.length);
      } else {
        console.log('⚠️ No cookies received');
      }
      
    } catch (error) {
      console.log('❌ Authentication failed:', error.response?.data?.message || error.message);
      return;
    }

    // Test 3: Test file upload
    console.log('\n3. Testing file upload...');
    const testImagePath = createTestImage();
    
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(testImagePath));
      formData.append('roomId', '68a4277378bb0bc7b8b1c5d5');
      
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
      console.log('   Error:', error.message);
      
      if (error.code === 'ECONNABORTED') {
        console.log('   ⚠️ Request timed out');
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

testFixes();
