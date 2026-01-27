const axios = require('axios');

const baseUrl = 'http://localhost:5001/api';

async function testLogout() {
  console.log('Testing logout functionality...\n');

  try {
    // Test 1: Check if we can access auth/me without authentication
    console.log('1. Testing auth/me without authentication...');
    try {
      const response = await axios.get(`${baseUrl}/auth/me`, {
        withCredentials: true
      });
      console.log('❌ auth/me accessible without auth:', response.data);
    } catch (error) {
      console.log('✅ auth/me properly protected:', error.response?.status, error.response?.data?.message);
    }

    // Test 2: Try to logout without authentication
    console.log('\n2. Testing logout without authentication...');
    try {
      const response = await axios.post(`${baseUrl}/auth/logout`, {}, {
        withCredentials: true
      });
      console.log('✅ Logout successful:', response.data);
    } catch (error) {
      console.log('❌ Logout failed:', error.response?.status, error.response?.data?.message);
    }

    // Test 3: Check auth/me again after logout
    console.log('\n3. Testing auth/me after logout...');
    try {
      const response = await axios.get(`${baseUrl}/auth/me`, {
        withCredentials: true
      });
      console.log('❌ auth/me still accessible after logout:', response.data);
    } catch (error) {
      console.log('✅ auth/me properly protected after logout:', error.response?.status, error.response?.data?.message);
    }

    console.log('\n✅ Logout test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLogout();
