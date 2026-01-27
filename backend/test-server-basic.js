import axios from 'axios';

const testBasicServer = async () => {
  const baseUrl = 'https://someonesdreamproject.onrender.com';
  
  console.log('🔍 Basic Server Test\n');
  console.log(`Testing: ${baseUrl}\n`);

  try {
    // Test basic connectivity
    console.log('1. Testing basic connectivity...');
    const response = await axios.get(`${baseUrl}/api/health`, {
      timeout: 10000,
      validateStatus: () => true // Don't throw on any status
    });
    
    console.log(`✅ Server responded: ${response.status}`);
    console.log(`📋 Response:`, response.data);
    console.log(`📋 Headers:`, {
      'content-type': response.headers['content-type'],
      'server': response.headers['server']
    });
    
  } catch (error) {
    console.log('❌ Server test failed');
    console.log(`Error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🔧 Issue: Server is not running or not accessible');
    } else if (error.code === 'ENOTFOUND') {
      console.log('🔧 Issue: Domain not found - check URL');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('🔧 Issue: Server timeout - server might be starting up');
    } else {
      console.log('🔧 Issue: Unknown error - check server logs');
    }
  }

  try {
    // Test root endpoint
    console.log('\n2. Testing root endpoint...');
    const rootResponse = await axios.get(baseUrl, {
      timeout: 10000,
      validateStatus: () => true
    });
    
    console.log(`✅ Root responded: ${rootResponse.status}`);
    
  } catch (error) {
    console.log(`❌ Root test failed: ${error.message}`);
  }

  console.log('\n📋 Next Steps:');
  console.log('1. Check Render dashboard for backend service status');
  console.log('2. Check deployment logs for errors');
  console.log('3. Verify environment variables are set');
  console.log('4. Check if MongoDB connection is working');
};

testBasicServer().catch(console.error);
