import axios from 'axios';

const BASE_URL = 'http://localhost:5001/api';

async function testEndpoint() {
  try {
    console.log('🧪 Testing Faculty Messaging Endpoint...\n');

    // Test 1: Check server health
    console.log('1. Checking server health...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Server is healthy');
      console.log('   Response:', healthResponse.data);
    } catch (error) {
      console.log('❌ Server health check failed:', error.message);
      return;
    }

    // Test 2: Test faculty messaging endpoint without auth
    console.log('\n2. Testing faculty messaging endpoint...');
    try {
      const response = await axios.get(`${BASE_URL}/faculty-messaging/student-messages`);
      console.log('❌ Unexpected success - should require authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly returned 401 (Unauthorized)');
        console.log('   Endpoint is working correctly');
      } else {
        console.log('❌ Unexpected error:');
        console.log('   Status:', error.response?.status);
        console.log('   Message:', error.response?.data?.message);
      }
    }

    console.log('\n🔍 Test completed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEndpoint();
