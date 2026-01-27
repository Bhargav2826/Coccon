import axios from 'axios';

const BASE_URL = 'http://localhost:5001/api';

// Test faculty messaging endpoints
async function testFacultyMessaging() {
  try {
    console.log('🧪 Testing Faculty Messaging Endpoints...\n');

    // Test 1: Check if server is running
    console.log('1. Testing server connectivity...');
    try {
      const response = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Server is running');
    } catch (error) {
      console.log('❌ Server is not running or health endpoint not available');
      return;
    }

    // Test 2: Test faculty messaging routes (without auth)
    console.log('\n2. Testing faculty messaging routes...');
    
    try {
      const response = await axios.post(`${BASE_URL}/faculty-messaging/send-message`, {
        roomId: '507f1f77bcf86cd799439011',
        message: 'Test message'
      });
      console.log('❌ Should have failed with auth error');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Authentication required (expected)');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
      }
    }

    console.log('\n✅ Faculty messaging endpoints are accessible');
    console.log('🔍 To test with authentication, you need to:');
    console.log('   1. Login as a faculty user');
    console.log('   2. Create a room');
    console.log('   3. Add students to the room');
    console.log('   4. Try sending messages through the UI');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFacultyMessaging();
