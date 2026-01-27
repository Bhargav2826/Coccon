import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5001/api';

// Create a test image
function createTestImage() {
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const imageBuffer = Buffer.from(pngBase64, 'base64');
  const testImagePath = path.join(process.cwd(), 'test-no-auth.png');
  fs.writeFileSync(testImagePath, imageBuffer);
  return testImagePath;
}

async function testNoAuthUpload() {
  try {
    console.log('🧪 Testing File Upload Without Authentication...\n');

    // Test 1: Check server health
    console.log('1. Checking server health...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Server is healthy');
    } catch (error) {
      console.log('❌ Server health check failed:', error.message);
      return;
    }

    // Test 2: Test file upload without authentication (should return 401)
    console.log('\n2. Testing file upload without authentication...');
    const testImagePath = createTestImage();
    
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(testImagePath));
      formData.append('roomId', '68a4277378bb0bc7b8b1c5d5');
      
      console.log('   Sending file upload request without auth...');
      const uploadResponse = await axios.post(`${BASE_URL}/faculty-messaging/send-file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });
      
      console.log('❌ Unexpected success - should have returned 401');
      console.log('   Response:', uploadResponse.data);
      
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly returned 401 (Unauthorized)');
        console.log('   This means the endpoint is working correctly');
      } else if (error.response?.status === 500) {
        console.log('❌ Server returned 500 error:');
        console.log('   Status:', error.response.status);
        console.log('   Message:', error.response.data?.message);
        console.log('   Error:', error.response.data?.error);
        console.log('   This indicates a server-side issue');
      } else {
        console.log('❌ Unexpected error:');
        console.log('   Status:', error.response?.status);
        console.log('   Message:', error.response?.data?.message);
        console.log('   Error:', error.message);
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

testNoAuthUpload();
