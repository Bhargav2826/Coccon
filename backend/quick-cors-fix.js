import axios from 'axios';

const testEndpoints = async () => {
  const baseUrl = 'https://someonesdreamproject.onrender.com';
  const frontendOrigin = 'https://someonesdreamproject-1.onrender.com';
  
  console.log('🔧 Quick CORS Fix Test\n');
  console.log(`Backend: ${baseUrl}`);
  console.log(`Frontend: ${frontendOrigin}\n`);

  const endpoints = [
    '/api/health',
    '/api/auth/me',
    '/api/users/friend-requests/count'
  ];

  for (const endpoint of endpoints) {
    console.log(`🔍 Testing: ${endpoint}`);
    
    try {
      // Test without CORS headers first
      const response = await axios.get(`${baseUrl}${endpoint}`);
      console.log(`✅ Basic request: ${response.status}`);
    } catch (error) {
      console.log(`❌ Basic request failed: ${error.response?.status || 'Network Error'}`);
    }

    try {
      // Test with CORS headers
      const corsResponse = await axios.get(`${baseUrl}${endpoint}`, {
        headers: {
          'Origin': frontendOrigin,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      console.log(`✅ CORS request: ${corsResponse.status}`);
      
      // Check CORS headers
      const corsHeaders = {
        'access-control-allow-origin': corsResponse.headers['access-control-allow-origin'],
        'access-control-allow-credentials': corsResponse.headers['access-control-allow-credentials'],
        'access-control-allow-methods': corsResponse.headers['access-control-allow-methods'],
        'access-control-allow-headers': corsResponse.headers['access-control-allow-headers']
      };
      
      console.log('📋 CORS Headers:', corsHeaders);
      
      if (corsHeaders['access-control-allow-origin'] === frontendOrigin) {
        console.log('✅ CORS configured correctly!');
      } else {
        console.log('❌ CORS not configured correctly');
        console.log(`Expected: ${frontendOrigin}`);
        console.log(`Got: ${corsHeaders['access-control-allow-origin']}`);
      }
      
    } catch (error) {
      console.log(`❌ CORS request failed: ${error.response?.status || 'Network Error'}`);
      if (error.response?.headers) {
        console.log('📋 Response Headers:', {
          'access-control-allow-origin': error.response.headers['access-control-allow-origin'],
          'access-control-allow-credentials': error.response.headers['access-control-allow-credentials']
        });
      }
    }
    
    console.log('---\n');
  }
};

const testPreflight = async () => {
  const baseUrl = 'https://someonesdreamproject.onrender.com';
  const frontendOrigin = 'https://someonesdreamproject-1.onrender.com';
  
  console.log('🛫 Testing OPTIONS preflight request...\n');
  
  try {
    const response = await axios.options(`${baseUrl}/api/auth/login`, {
      headers: {
        'Origin': frontendOrigin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      }
    });
    
    console.log(`✅ Preflight successful: ${response.status}`);
    console.log('📋 Preflight Headers:', {
      'access-control-allow-origin': response.headers['access-control-allow-origin'],
      'access-control-allow-credentials': response.headers['access-control-allow-credentials'],
      'access-control-allow-methods': response.headers['access-control-allow-methods'],
      'access-control-allow-headers': response.headers['access-control-allow-headers']
    });
    
  } catch (error) {
    console.log(`❌ Preflight failed: ${error.response?.status || 'Network Error'}`);
    if (error.response?.headers) {
      console.log('📋 Error Headers:', {
        'access-control-allow-origin': error.response.headers['access-control-allow-origin'],
        'access-control-allow-credentials': error.response.headers['access-control-allow-credentials']
      });
    }
  }
};

// Run tests
console.log('🚀 Starting CORS diagnostics...\n');
testEndpoints()
  .then(() => testPreflight())
  .then(() => {
    console.log('\n📋 Summary:');
    console.log('1. Check if backend is running (health endpoint)');
    console.log('2. Verify CORS headers are present');
    console.log('3. Ensure frontend origin is allowed');
    console.log('4. Check environment variables in Render dashboard');
  })
  .catch(console.error);
