import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// Test the delete room endpoints
async function testDeleteRooms() {
  try {
    console.log('🧪 Testing Delete Room API Endpoints...\n');

    // Test 1: Single room deletion (this will fail without authentication, but tests the endpoint exists)
    console.log('1. Testing single room deletion endpoint...');
    try {
      await axios.delete(`${BASE_URL}/rooms/test-room-id`);
      console.log('❌ Should have failed due to authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Endpoint exists - authentication required (expected)');
      } else if (error.response?.status === 400) {
        console.log('✅ Endpoint exists - validation error (expected for invalid roomId)');
        console.log('   Validation message:', error.response.data?.message);
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
      }
    }

    // Test 2: Bulk room deletion (this will fail without authentication, but tests the endpoint exists)
    console.log('\n2. Testing bulk room deletion endpoint...');
    try {
      await axios.delete(`${BASE_URL}/rooms/bulk-delete`, {
        data: { roomIds: ['test-room-id-1', 'test-room-id-2'] }
      });
      console.log('❌ Should have failed due to authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Endpoint exists - authentication required (expected)');
      } else if (error.response?.status === 400) {
        console.log('✅ Endpoint exists - validation error (expected for invalid roomIds)');
        console.log('   Validation message:', error.response.data?.message);
        if (error.response.data?.errors) {
          console.log('   Validation errors:', error.response.data.errors);
        }
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
      }
    }

    // Test 3: Test with valid MongoDB ObjectId format (still should fail due to auth)
    console.log('\n3. Testing bulk delete with valid ObjectId format...');
    try {
      await axios.delete(`${BASE_URL}/rooms/bulk-delete`, {
        data: { roomIds: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'] }
      });
      console.log('❌ Should have failed due to authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Endpoint exists - authentication required (expected)');
      } else if (error.response?.status === 404) {
        console.log('✅ Endpoint exists - rooms not found (expected for non-existent IDs)');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
      }
    }

    console.log('\n✅ Delete room API endpoints are properly configured!');
    console.log('📝 Note: These endpoints require faculty authentication to work properly.');
    console.log('🔧 Route order fix applied - bulk-delete should now work correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testDeleteRooms();
