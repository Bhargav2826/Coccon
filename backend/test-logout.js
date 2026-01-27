import axios from 'axios';

const testLogout = async () => {
  const baseUrl = 'https://someonesdreamproject.onrender.com';
  
  console.log('🧪 Testing Logout Functionality\n');
  console.log(`Testing: ${baseUrl}\n`);

  try {
    // Test 1: Try to access protected endpoint without auth
    console.log('1. Testing access to protected endpoint without authentication...');
    try {
      const response = await axios.get(`${baseUrl}/api/auth/me`, {
        validateStatus: () => true
      });
      console.log(`✅ Auth check response: ${response.status} - ${response.statusText}`);
      if (response.status === 401) {
        console.log('✅ Correctly requires authentication');
      }
    } catch (error) {
      console.log(`❌ Auth check failed: ${error.message}`);
    }

    // Test 2: Test logout endpoint
    console.log('\n2. Testing logout endpoint...');
    try {
      const response = await axios.post(`${baseUrl}/api/auth/logout`, {}, {
        validateStatus: () => true
      });
      console.log(`✅ Logout response: ${response.status} - ${response.statusText}`);
      console.log(`📋 Response data:`, response.data);
      
      if (response.status === 200) {
        console.log('✅ Logout endpoint working correctly');
      } else {
        console.log('❌ Logout endpoint returned unexpected status');
      }
    } catch (error) {
      console.log(`❌ Logout test failed: ${error.message}`);
    }

    // Test 3: Test logout with CORS headers
    console.log('\n3. Testing logout with CORS headers...');
    try {
      const response = await axios.post(`${baseUrl}/api/auth/logout`, {}, {
        headers: {
          'Origin': 'https://someonesdreamproject-1.onrender.com',
          'Content-Type': 'application/json'
        },
        validateStatus: () => true
      });
      console.log(`✅ Logout with CORS: ${response.status} - ${response.statusText}`);
      
      // Check CORS headers
      const corsHeaders = {
        'access-control-allow-origin': response.headers['access-control-allow-origin'],
        'access-control-allow-credentials': response.headers['access-control-allow-credentials']
      };
      console.log('📋 CORS Headers:', corsHeaders);
      
    } catch (error) {
      console.log(`❌ Logout CORS test failed: ${error.message}`);
    }

  } catch (error) {
    console.log('❌ Logout test failed:', error.message);
  }

  console.log('\n📋 Logout Test Summary:');
  console.log('1. Protected endpoints should return 401 without auth');
  console.log('2. Logout endpoint should return 200 with success message');
  console.log('3. CORS headers should be present for frontend requests');
  console.log('4. Cookie should be cleared with proper options');
};

testLogout().catch(console.error);
