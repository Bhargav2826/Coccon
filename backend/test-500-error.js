import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5001/api';

// Create a test image
function createTestImage() {
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const imageBuffer = Buffer.from(pngBase64, 'base64');
  const testImagePath = path.join(process.cwd(), 'test-500-error.png');
  fs.writeFileSync(testImagePath, imageBuffer);
  return testImagePath;
}

async function test500Error() {
  try {
    console.log('🧪 Testing 500 Error in File Upload...\n');

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

    // Test 3: Test file upload with detailed error logging
    console.log('\n3. Testing file upload with error details...');
    const testImagePath = createTestImage();
    
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(testImagePath));
      formData.append('roomId', '68a4277378bb0bc7b8b1c5d5');
      
      console.log('   Sending request...');
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
      console.log('❌ File upload failed with 500 error:');
      console.log('   Status:', error.response?.status);
      console.log('   Status Text:', error.response?.statusText);
      console.log('   Headers:', error.response?.headers);
      console.log('   Data:', error.response?.data);
      console.log('   Error Message:', error.message);
      
      if (error.response?.data?.error) {
        console.log('   Server Error:', error.response.data.error);
      }
      
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

test500Error();
