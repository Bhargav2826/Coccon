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
  const testImagePath = path.join(process.cwd(), 'test-complete-image.png');
  fs.writeFileSync(testImagePath, imageBuffer);
  return testImagePath;
}

async function testCompleteFileUpload() {
  try {
    console.log('🧪 Testing Complete Faculty File Upload Flow...\n');

    // Test 1: Check server health
    console.log('1. Checking server health...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Server is healthy');
    } catch (error) {
      console.log('❌ Server health check failed:', error.message);
      return;
    }

    // Test 2: Check environment variables
    console.log('\n2. Checking environment variables...');
    const requiredEnvVars = [
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY', 
      'CLOUDINARY_API_SECRET',
      'STREAM_API_KEY',
      'STREAM_API_SECRET'
    ];
    
    let envVarsOk = true;
    requiredEnvVars.forEach(varName => {
      if (process.env[varName]) {
        console.log(`✅ ${varName}: Set`);
      } else {
        console.log(`❌ ${varName}: Not set`);
        envVarsOk = false;
      }
    });

    if (!envVarsOk) {
      console.log('⚠️ Some environment variables are missing');
    }

    // Test 3: Test authentication endpoint
    console.log('\n3. Testing authentication...');
    try {
      const authResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'bhargav@gmail.com',
        password: 'password123'
      });
      console.log('✅ Authentication successful');
      console.log('   User role:', authResponse.data.user?.role);
      console.log('   User ID:', authResponse.data.user?._id);
    } catch (error) {
      console.log('❌ Authentication failed:', error.response?.data?.message || error.message);
      return;
    }

    // Test 4: Test file upload endpoint directly (without auth)
    console.log('\n4. Testing file upload endpoint (no auth)...');
    const testImagePath = createTestImage();
    
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(testImagePath));
      formData.append('roomId', '68a4277378bb0bc7b8b1c5d5');
      
      const uploadResponse = await axios.post(`${BASE_URL}/faculty-messaging/send-file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 10000,
      });
      
      console.log('❌ Unexpected success - should have returned 401');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly returned 401 (Unauthorized)');
      } else if (error.code === 'ECONNABORTED') {
        console.log('❌ Request timed out - this is the issue!');
        console.log('   The endpoint is hanging without authentication');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.message);
      }
    } finally {
      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
      }
    }

    // Test 5: Test with authentication
    console.log('\n5. Testing file upload with authentication...');
    let authToken;
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'bhargav@gmail.com',
        password: 'password123'
      });
      authToken = loginResponse.data.token;
      
      const formData = new FormData();
      formData.append('file', fs.createReadStream(createTestImage()));
      formData.append('roomId', '68a4277378bb0bc7b8b1c5d5');
      
      const uploadResponse = await axios.post(`${BASE_URL}/faculty-messaging/send-file`, formData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });
      
      console.log('✅ File upload with auth successful!');
      console.log('   Response:', uploadResponse.data);
      
    } catch (error) {
      console.log('❌ File upload with auth failed:');
      console.log('   Status:', error.response?.status);
      console.log('   Message:', error.response?.data?.message);
      console.log('   Error:', error.message);
      
      if (error.code === 'ECONNABORTED') {
        console.log('   ⚠️ Request timed out - this matches the frontend issue');
      }
    }

    console.log('\n🔍 Complete file upload test finished');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCompleteFileUpload();
