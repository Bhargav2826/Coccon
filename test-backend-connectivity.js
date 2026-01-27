// Test script to check backend connectivity
const axios = require('axios');

const BACKEND_URL = 'https://someonesdreamproject.onrender.com';

async function testBackendConnectivity() {
  console.log('🔍 Testing backend connectivity...');
  
  try {
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BACKEND_URL}/api/health`);
    console.log('✅ Health endpoint response:', healthResponse.data);
    
    // Test theme endpoint (should return 401 if not authenticated)
    console.log('\n2. Testing theme endpoint (unauthenticated)...');
    try {
      const themeResponse = await axios.get(`${BACKEND_URL}/api/users/theme`);
      console.log('✅ Theme endpoint response:', themeResponse.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Theme endpoint correctly returns 401 for unauthenticated requests');
      } else {
        console.log('❌ Theme endpoint error:', error.response?.status, error.response?.data);
      }
    }
    
    console.log('\n✅ Backend connectivity test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Backend connectivity test failed:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('URL:', error.response?.config?.url);
    console.error('Response:', error.response?.data);
    
    if (error.code === 'ENOTFOUND') {
      console.error('\n🔍 The backend URL might be incorrect or the service is not running.');
    }
  }
}

testBackendConnectivity();
