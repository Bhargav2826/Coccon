import axios from 'axios';

const testLocalCors = async () => {
  console.log('🧪 Testing local CORS configuration...\n');

  try {
    console.log('🔍 Testing: http://localhost:5001/api/health');
    const response = await axios.get('http://localhost:5001/api/health', {
      headers: {
        'Origin': 'http://localhost:5173'
      }
    });
    console.log(`✅ SUCCESS: ${response.status} - ${response.data.message}`);
    console.log('CORS Headers:', {
      'access-control-allow-origin': response.headers['access-control-allow-origin'],
      'access-control-allow-credentials': response.headers['access-control-allow-credentials']
    });
  } catch (error) {
    console.log(`❌ FAILED: ${error.response?.status || 'Network Error'} - ${error.message}`);
    if (error.response?.headers) {
      console.log('CORS Headers:', {
        'access-control-allow-origin': error.response.headers['access-control-allow-origin'],
        'access-control-allow-credentials': error.response.headers['access-control-allow-credentials']
      });
    }
  }
};

testLocalCors().catch(console.error);
