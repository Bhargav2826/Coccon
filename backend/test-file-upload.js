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

// Test faculty file upload functionality
async function testFileUpload() {
  try {
    console.log('🧪 Testing Faculty File Upload...\n');

    // Test 1: Check if server is running
    console.log('1. Testing server connectivity...');
    try {
      const response = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Server is running');
      console.log('   Response:', response.data);
    } catch (error) {
      console.log('❌ Server is not running or health endpoint not available');
      console.log('   Error:', error.message);
      return;
    }

    // Test 2: Test file upload endpoint without authentication
    console.log('\n2. Testing file upload endpoint without auth...');
    
    const testFilePath = createTestFile();
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('roomId', '507f1f77bcf86cd799439011');
    
    try {
      const response = await axios.post(`${BASE_URL}/faculty-messaging/send-file`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });
      console.log('❌ Should have failed with auth error');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Authentication required (expected)');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
      }
    }

    // Test 3: Test with invalid file type
    console.log('\n3. Testing with invalid file type...');
    
    const invalidFormData = new FormData();
    invalidFormData.append('file', Buffer.from('test content'), {
      filename: 'test.exe',
      contentType: 'application/x-executable'
    });
    invalidFormData.append('roomId', '507f1f77bcf86cd799439011');
    
    try {
      const response = await axios.post(`${BASE_URL}/faculty-messaging/send-file`, invalidFormData, {
        headers: {
          ...invalidFormData.getHeaders(),
        },
      });
      console.log('❌ Should have failed with file type error');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ File type validation working (expected)');
        console.log('   Error:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
      }
    }

    // Test 4: Test with file too large
    console.log('\n4. Testing with large file...');
    
    const largeContent = 'x'.repeat(15 * 1024 * 1024); // 15MB
    const largeFormData = new FormData();
    largeFormData.append('file', Buffer.from(largeContent), {
      filename: 'large-file.txt',
      contentType: 'text/plain'
    });
    largeFormData.append('roomId', '507f1f77bcf86cd799439011');
    
    try {
      const response = await axios.post(`${BASE_URL}/faculty-messaging/send-file`, largeFormData, {
        headers: {
          ...largeFormData.getHeaders(),
        },
      });
      console.log('❌ Should have failed with file size error');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ File size validation working (expected)');
        console.log('   Error:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
      }
    }

    // Test 5: Test Cloudinary configuration
    console.log('\n5. Testing Cloudinary configuration...');
    console.log('   CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Not set');
    console.log('   CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Not set');
    console.log('   CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Not set');

    // Clean up test file
    try {
      fs.unlinkSync(testFilePath);
      console.log('\n✅ Test file cleaned up');
    } catch (error) {
      console.log('\n⚠️ Could not clean up test file:', error.message);
    }

    console.log('\n🔍 File upload endpoint analysis:');
    console.log('   - Endpoint: POST /api/faculty-messaging/send-file');
    console.log('   - Authentication: Required (faculty role)');
    console.log('   - File size limit: 10MB');
    console.log('   - Supported types: Images, PDFs, Documents, Presentations');
    console.log('   - Storage: Cloudinary (with memory fallback)');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFileUpload();
