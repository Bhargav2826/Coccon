import axios from 'axios';

const testCors = async () => {
  const testUrls = [
    'https://someonesdreamproject.onrender.com',
    'https://someonesdreamproject-1.onrender.com'
  ];

  console.log('🧪 Testing CORS configuration...\n');

  for (const url of testUrls) {
    try {
      console.log(`🔍 Testing: ${url}/api/health`);
      const response = await axios.get(`${url}/api/health`, {
        headers: {
          'Origin': 'https://someonesdreamproject-1.onrender.com'
        }
      });
      console.log(`✅ SUCCESS: ${response.status} - ${response.data.message}`);
    } catch (error) {
      console.log(`❌ FAILED: ${error.response?.status || 'Network Error'} - ${error.message}`);
      if (error.response?.headers) {
        console.log(`   CORS Headers:`, {
          'access-control-allow-origin': error.response.headers['access-control-allow-origin'],
          'access-control-allow-credentials': error.response.headers['access-control-allow-credentials']
        });
      }
    }
    console.log('');
  }
};

testCors().catch(console.error);
