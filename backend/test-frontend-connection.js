import axios from 'axios';

const BASE_URL = 'http://localhost:5001/api';

async function testFrontendConnection() {
  try {
    console.log('🧪 Testing Frontend Connection...\n');

    // Test 1: Check if server is reachable
    console.log('1. Testing server reachability...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Server is reachable');
      console.log('   Response:', healthResponse.data);
    } catch (error) {
      console.log('❌ Server not reachable:', error.message);
      return;
    }

    // Test 2: Test authentication endpoint
    console.log('\n2. Testing authentication endpoint...');
    try {
      const authResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'bhargav@gmail.com',
        password: '123456'
      }, {
        withCredentials: true
      });
      
      console.log('✅ Authentication endpoint working');
      console.log('   User:', authResponse.data.user?.fullName);
      console.log('   Role:', authResponse.data.user?.role);
      
      const setCookieHeader = authResponse.headers['set-cookie'];
      if (setCookieHeader) {
        const cookies = setCookieHeader.map(cookie => cookie.split(';')[0]);
        console.log('   Cookies received:', cookies.length);
      }
    } catch (error) {
      console.log('❌ Authentication failed:', error.response?.data?.message || error.message);
      return;
    }

    // Test 3: Test rooms endpoint
    console.log('\n3. Testing rooms endpoint...');
    try {
      const authResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'bhargav@gmail.com',
        password: '123456'
      }, {
        withCredentials: true
      });
      
      const setCookieHeader = authResponse.headers['set-cookie'];
      const cookies = setCookieHeader ? setCookieHeader.map(cookie => cookie.split(';')[0]) : [];
      
      const roomsResponse = await axios.get(`${BASE_URL}/rooms/my-rooms`, {
        headers: {
          'Cookie': cookies.join('; ')
        },
        withCredentials: true
      });
      
      console.log('✅ Rooms endpoint working');
      console.log('   Rooms found:', roomsResponse.data.rooms?.length || 0);
    } catch (error) {
      console.log('❌ Rooms endpoint failed:', error.response?.data?.message || error.message);
    }

    console.log('\n🔍 Test completed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFrontendConnection();
