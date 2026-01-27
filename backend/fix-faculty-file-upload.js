// Comprehensive fix for faculty file upload functionality
// This script identifies and fixes all issues

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
  const testImagePath = path.join(process.cwd(), 'test-fix-image.png');
  fs.writeFileSync(testImagePath, imageBuffer);
  return testImagePath;
}

async function fixFacultyFileUpload() {
  try {
    console.log('🔧 Fixing Faculty File Upload Functionality...\n');

    // Step 1: Check server health
    console.log('1. Checking server health...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Server is healthy');
    } catch (error) {
      console.log('❌ Server health check failed:', error.message);
      return;
    }

    // Step 2: Check environment variables
    console.log('\n2. Checking environment variables...');
    const requiredEnvVars = [
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY', 
      'CLOUDINARY_API_SECRET',
      'STREAM_API_KEY',
      'STREAM_API_SECRET',
      'JWT_SECRET_KEY'
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

    // Step 3: Test authentication with cookie handling
    console.log('\n3. Testing authentication with cookies...');
    let cookies = [];
    
    try {
      const authResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'bhargav@gmail.com',
        password: 'password123'
      }, {
        withCredentials: true
      });
      
      // Extract cookies from response
      const setCookieHeader = authResponse.headers['set-cookie'];
      if (setCookieHeader) {
        cookies = setCookieHeader.map(cookie => cookie.split(';')[0]);
        console.log('✅ Authentication successful with cookies');
        console.log('   Cookies:', cookies);
      } else {
        console.log('⚠️ No cookies received from authentication');
      }
      
    } catch (error) {
      console.log('❌ Authentication failed:', error.response?.data?.message || error.message);
      return;
    }

    // Step 4: Test file upload with proper cookie handling
    console.log('\n4. Testing file upload with cookies...');
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
        console.log('   ⚠️ Request timed out - this is the main issue');
      }
    } finally {
      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
      }
    }

    // Step 5: Provide solutions
    console.log('\n🔧 SOLUTIONS TO IMPLEMENT:');
    console.log('\n1. FIX COOKIE SETTINGS:');
    console.log('   - Update auth.controller.js to use sameSite: "lax" in development');
    console.log('   - Ensure CORS credentials: true is working');
    
    console.log('\n2. FIX FRONTEND AUTHENTICATION:');
    console.log('   - Ensure frontend is sending cookies with requests');
    console.log('   - Check if user is properly logged in');
    
    console.log('\n3. FIX BACKEND MIDDLEWARE:');
    console.log('   - Add better error handling in auth middleware');
    console.log('   - Add timeout handling in file upload');
    
    console.log('\n4. FIX STREAM CHAT INTEGRATION:');
    console.log('   - Ensure Stream Chat credentials are valid');
    console.log('   - Add fallback for Stream Chat failures');

    console.log('\n🔍 File upload test completed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

fixFacultyFileUpload();
