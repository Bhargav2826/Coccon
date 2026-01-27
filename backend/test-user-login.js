import axios from 'axios';

const BASE_URL = 'http://localhost:5001/api';

async function testUserLogin() {
  try {
    console.log('🧪 Testing User Login...\n');

    // Test different faculty users
    const facultyUsers = [
      { email: 'faculty@gmail.com', password: 'password123' },
      { email: 'faculty2@gmail.com', password: 'password123' },
      { email: 'bhargav@gmail.com', password: 'password123' },
      { email: 'test-faculty@example.com', password: 'password123' }
    ];

    for (const user of facultyUsers) {
      console.log(`Testing login for: ${user.email}`);
      try {
        const authResponse = await axios.post(`${BASE_URL}/auth/login`, {
          email: user.email,
          password: user.password
        }, {
          withCredentials: true
        });
        
        console.log(`✅ Login successful for ${user.email}`);
        console.log(`   User: ${authResponse.data.user?.fullName}`);
        console.log(`   Role: ${authResponse.data.user?.role}`);
        console.log(`   ID: ${authResponse.data.user?._id}`);
        return user; // Return the successful user
      } catch (error) {
        console.log(`❌ Login failed for ${user.email}: ${error.response?.data?.message || error.message}`);
      }
    }

    console.log('\n❌ No faculty users could be authenticated');
    return null;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return null;
  }
}

testUserLogin();
