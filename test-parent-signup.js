// Test script to verify parent signup flow
const axios = require('axios');

const BACKEND_URL = 'https://someonesdreamproject.onrender.com';

async function testParentSignup() {
  console.log('🔍 Testing parent signup flow...');
  
  try {
    // Test signup with parent role
    const signupData = {
      fullName: 'Test Parent',
      email: `testparent${Date.now()}@example.com`,
      password: 'testpass123',
      role: 'parent'
    };
    
    console.log('\n1. Testing parent signup...');
    console.log('Signup data:', signupData);
    
    const signupResponse = await axios.post(`${BACKEND_URL}/api/auth/signup`, signupData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Signup successful!');
    console.log('Response status:', signupResponse.status);
    console.log('Response data:', {
      success: signupResponse.data.success,
      user: {
        id: signupResponse.data.user._id,
        fullName: signupResponse.data.user.fullName,
        email: signupResponse.data.user.email,
        role: signupResponse.data.user.role,
        isOnboarded: signupResponse.data.user.isOnboarded
      }
    });
    
    // Check if cookies are set
    const cookies = signupResponse.headers['set-cookie'];
    console.log('Cookies set:', cookies ? 'Yes' : 'No');
    
    // Test auth endpoint with the new user
    console.log('\n2. Testing auth endpoint...');
    const authResponse = await axios.get(`${BACKEND_URL}/api/auth/me`, {
      headers: {
        Cookie: cookies ? cookies.join('; ') : ''
      }
    });
    
    console.log('✅ Auth endpoint successful!');
    console.log('Auth response:', {
      user: {
        id: authResponse.data.user._id,
        fullName: authResponse.data.user.fullName,
        email: authResponse.data.user.email,
        role: authResponse.data.user.role,
        isOnboarded: authResponse.data.user.isOnboarded
      }
    });
    
    console.log('\n✅ Parent signup test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Parent signup test failed:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Response:', error.response?.data);
    
    if (error.response?.status === 400) {
      console.error('\n🔍 400 Error Details:');
      console.error('This usually means validation failed. Check the response data above.');
    }
  }
}

testParentSignup();
