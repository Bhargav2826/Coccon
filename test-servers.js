import axios from 'axios';

const BACKEND_URL = 'http://localhost:5001';
const FRONTEND_URL = 'http://localhost:5173';

async function testBackend() {
  try {
    console.log('🔍 Testing backend server...');
    const response = await axios.get(`${BACKEND_URL}/api/health`);
    console.log('✅ Backend is running:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Backend is not running:', error.message);
    return false;
  }
}

async function testFrontend() {
  try {
    console.log('🔍 Testing frontend server...');
    const response = await axios.get(FRONTEND_URL);
    console.log('✅ Frontend is running (status:', response.status, ')');
    return true;
  } catch (error) {
    console.error('❌ Frontend is not running:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Testing server connectivity...\n');
  
  const backendOk = await testBackend();
  const frontendOk = await testFrontend();
  
  console.log('\n📋 Test Results:');
  console.log('Backend (localhost:5001):', backendOk ? '✅ Running' : '❌ Not running');
  console.log('Frontend (localhost:5173):', frontendOk ? '✅ Running' : '❌ Not running');
  
  if (backendOk && frontendOk) {
    console.log('\n🎉 Both servers are running! You can now test the video call feature.');
    console.log('🌐 Open http://localhost:5173 in your browser');
  } else {
    console.log('\n⚠️ Some servers are not running. Please check:');
    if (!backendOk) {
      console.log('- Backend: Make sure you have a .env file and run "npm run dev" in the backend folder');
    }
    if (!frontendOk) {
      console.log('- Frontend: Run "npm run dev" in the frontend folder');
    }
  }
}

runTests().catch(console.error);
