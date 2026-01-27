import axios from 'axios';

const BASE_URL = 'http://localhost:5001/api';

async function testRoomMembers() {
  try {
    console.log('🧪 Testing Room Members Endpoint...\n');

    // Step 1: Login as faculty
    console.log('1. Logging in as faculty...');
    let cookies = [];
    
    try {
      const authResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'bhargav@gmail.com',
        password: '123456'
      }, {
        withCredentials: true
      });
      
      const setCookieHeader = authResponse.headers['set-cookie'];
      if (setCookieHeader) {
        cookies = setCookieHeader.map(cookie => cookie.split(';')[0]);
        console.log('✅ Login successful');
        console.log('   User:', authResponse.data.user?.fullName);
        console.log('   Role:', authResponse.data.user?.role);
      }
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data?.message || error.message);
      return;
    }

    // Step 2: Get faculty rooms
    console.log('\n2. Getting faculty rooms...');
    try {
      const roomsResponse = await axios.get(`${BASE_URL}/rooms/my-rooms`, {
        headers: {
          'Cookie': cookies.join('; ')
        },
        withCredentials: true
      });
      
      const rooms = roomsResponse.data.rooms;
      console.log(`✅ Found ${rooms.length} rooms`);
      
      if (rooms.length === 0) {
        console.log('❌ No rooms found for faculty');
        return;
      }

      const selectedRoom = rooms[0];
      console.log(`   Using room: ${selectedRoom.roomName} (ID: ${selectedRoom._id})`);

      // Step 3: Test room members endpoint
      console.log('\n3. Testing room members endpoint...');
      try {
        const membersResponse = await axios.get(`${BASE_URL}/rooms/${selectedRoom._id}/members`, {
          headers: {
            'Cookie': cookies.join('; ')
          },
          withCredentials: true
        });
        
        console.log('✅ Room members endpoint working!');
        console.log('   Response:', membersResponse.data);
        console.log('   Members count:', membersResponse.data.members?.length || 0);
        
      } catch (error) {
        console.log('❌ Room members endpoint failed:');
        console.log('   Status:', error.response?.status);
        console.log('   Message:', error.response?.data?.message);
        console.log('   Error:', error.response?.data?.error);
        console.log('   Full Error:', error.message);
      }

    } catch (error) {
      console.log('❌ Failed to get rooms:', error.response?.data?.message || error.message);
    }

    console.log('\n🔍 Test completed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRoomMembers();
