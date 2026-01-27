import axios from 'axios';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5001/api';

// Test credentials - replace with actual test user credentials
const FACULTY_CREDENTIALS = {
  email: 'faculty@test.com',
  password: 'password123'
};

const STUDENT_CREDENTIALS = {
  email: 'student@test.com', 
  password: 'password123'
};

let facultyToken = null;
let studentToken = null;
let testRoomId = null;

// Helper function to make authenticated requests
const makeAuthRequest = async (token, method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `jwt=${token}`
      },
      withCredentials: true
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ ${method} ${endpoint} failed:`, error.response?.data || error.message);
    throw error;
  }
};

// Test faculty login
async function testFacultyLogin() {
  console.log('🔐 Testing faculty login...');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, FACULTY_CREDENTIALS, {
      withCredentials: true
    });
    
    // Extract token from cookies
    const cookies = response.headers['set-cookie'];
    if (cookies) {
      const jwtCookie = cookies.find(cookie => cookie.startsWith('jwt='));
      if (jwtCookie) {
        facultyToken = jwtCookie.split(';')[0].split('=')[1];
        console.log('✅ Faculty login successful');
        return true;
      }
    }
    
    console.log('⚠️ No JWT cookie found in response');
    return false;
  } catch (error) {
    console.error('❌ Faculty login failed:', error.response?.data || error.message);
    return false;
  }
}

// Test student login
async function testStudentLogin() {
  console.log('🔐 Testing student login...');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, STUDENT_CREDENTIALS, {
      withCredentials: true
    });
    
    // Extract token from cookies
    const cookies = response.headers['set-cookie'];
    if (cookies) {
      const jwtCookie = cookies.find(cookie => cookie.startsWith('jwt='));
      if (jwtCookie) {
        studentToken = jwtCookie.split(';')[0].split('=')[1];
        console.log('✅ Student login successful');
        return true;
      }
    }
    
    console.log('⚠️ No JWT cookie found in response');
    return false;
  } catch (error) {
    console.error('❌ Student login failed:', error.response?.data || error.message);
    return false;
  }
}

// Test creating a room
async function testCreateRoom() {
  console.log('🏠 Testing room creation...');
  
  try {
    const roomData = {
      roomName: 'Test Video Call Room'
    };
    
    const response = await makeAuthRequest(facultyToken, 'POST', '/rooms/create', roomData);
    testRoomId = response.room._id;
    
    console.log('✅ Room created successfully:', {
      roomId: testRoomId,
      roomName: response.room.roomName,
      inviteCode: response.room.inviteCode
    });
    
    return true;
  } catch (error) {
    console.error('❌ Room creation failed:', error.response?.data || error.message);
    return false;
  }
}

// Test joining a room
async function testJoinRoom() {
  console.log('👥 Testing room join...');
  
  try {
    // First get the room details to get the invite code
    const roomsResponse = await makeAuthRequest(facultyToken, 'GET', '/rooms/my-rooms');
    const room = roomsResponse.find(r => r._id === testRoomId);
    
    if (!room) {
      console.error('❌ Test room not found');
      return false;
    }
    
    const joinData = {
      inviteCode: room.inviteCode
    };
    
    const response = await makeAuthRequest(studentToken, 'POST', '/rooms/join', joinData);
    
    console.log('✅ Student joined room successfully');
    return true;
  } catch (error) {
    console.error('❌ Room join failed:', error.response?.data || error.message);
    return false;
  }
}

// Test starting a faculty video call
async function testStartFacultyVideoCall() {
  console.log('🎥 Testing faculty video call...');
  
  try {
    const callData = {
      roomId: testRoomId,
      callTitle: 'Test Faculty Video Call',
      targetUserId: null // Send to all members
    };
    
    const response = await makeAuthRequest(facultyToken, 'POST', '/faculty-messaging/start-video-call', callData);
    
    console.log('✅ Faculty video call started successfully:', {
      callId: response.callId,
      callUrl: response.callUrl,
      totalSent: response.totalSent,
      totalFailed: response.totalFailed
    });
    
    if (response.results) {
      console.log('📊 Results:', response.results);
    }
    
    return response;
  } catch (error) {
    console.error('❌ Faculty video call failed:', error.response?.data || error.message);
    return false;
  }
}

// Test getting Stream token
async function testGetStreamToken() {
  console.log('🎫 Testing Stream token generation...');
  
  try {
    const response = await makeAuthRequest(facultyToken, 'GET', '/chat/token');
    
    if (response.token) {
      console.log('✅ Stream token generated successfully');
      return true;
    } else {
      console.error('❌ No token in response');
      return false;
    }
  } catch (error) {
    console.error('❌ Stream token generation failed:', error.response?.data || error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting faculty video call tests...\n');
  
  // Test 1: Faculty login
  const facultyLoginSuccess = await testFacultyLogin();
  if (!facultyLoginSuccess) {
    console.log('❌ Cannot proceed without faculty login');
    return;
  }
  
  // Test 2: Student login
  const studentLoginSuccess = await testStudentLogin();
  if (!studentLoginSuccess) {
    console.log('⚠️ Student login failed, but continuing with faculty tests');
  }
  
  // Test 3: Create room
  const roomCreated = await testCreateRoom();
  if (!roomCreated) {
    console.log('❌ Cannot proceed without room creation');
    return;
  }
  
  // Test 4: Join room (if student login was successful)
  if (studentLoginSuccess) {
    await testJoinRoom();
  }
  
  // Test 5: Get Stream token
  await testGetStreamToken();
  
  // Test 6: Start faculty video call
  const videoCallResult = await testStartFacultyVideoCall();
  
  console.log('\n📋 Test Summary:');
  console.log('✅ Faculty Login:', facultyLoginSuccess);
  console.log('✅ Student Login:', studentLoginSuccess);
  console.log('✅ Room Creation:', roomCreated);
  console.log('✅ Video Call Start:', !!videoCallResult);
  
  if (videoCallResult) {
    console.log('\n🎥 Video Call Details:');
    console.log('Call ID:', videoCallResult.callId);
    console.log('Call URL:', videoCallResult.callUrl);
    console.log('Members notified:', videoCallResult.totalSent);
    console.log('Failed notifications:', videoCallResult.totalFailed);
  }
  
  console.log('\n✨ Tests completed!');
}

// Run the tests
runTests().catch(console.error);
