import axios from 'axios';

const BASE_URL = 'http://localhost:5001/api';

// Test faculty authentication and role issues
async function testFacultyAuth() {
  try {
    console.log('🧪 Testing Faculty Authentication Issues...\n');

    // Test 1: Check server health
    console.log('1. Testing server health...');
    try {
      const response = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Server is running');
    } catch (error) {
      console.log('❌ Server is not running');
      return;
    }

    // Test 2: Test faculty messaging without auth
    console.log('\n2. Testing faculty messaging without authentication...');
    try {
      const response = await axios.post(`${BASE_URL}/faculty-messaging/send-message`, {
        roomId: '507f1f77bcf86cd799439011',
        message: 'Test message'
      });
      console.log('❌ Should have failed with auth error');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Authentication required (expected)');
      } else if (error.response?.status === 403) {
        console.log('⚠️ Got 403 Forbidden - this might indicate role issues');
        console.log('Response:', error.response.data);
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
      }
    }

    // Test 3: Test with invalid role
    console.log('\n3. Testing with different user roles...');
    console.log('🔍 Common issues that cause 403 errors:');
    console.log('   - User role is not "faculty"');
    console.log('   - JWT token is invalid or expired');
    console.log('   - User account doesn\'t exist in database');
    console.log('   - Missing environment variables (JWT_SECRET_KEY)');

    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check if the user has role="faculty" in the database');
    console.log('2. Verify JWT_SECRET_KEY is set in environment');
    console.log('3. Check if the user is properly logged in');
    console.log('4. Verify Stream Chat API credentials are set');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFacultyAuth();
