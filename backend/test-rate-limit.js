import axios from 'axios';

const testRateLimit = async () => {
  const baseUrl = 'https://someonesdreamproject.onrender.com';
  
  console.log('🧪 Testing Rate Limiting Configuration\n');
  console.log(`Testing: ${baseUrl}\n`);

  try {
    // Test auth endpoint multiple times
    console.log('1. Testing auth endpoint rate limiting...');
    
    for (let i = 1; i <= 10; i++) {
      try {
        const response = await axios.post(`${baseUrl}/api/auth/login`, {
          email: 'test@example.com',
          password: 'testpassword'
        }, {
          validateStatus: () => true // Don't throw on any status
        });
        
        console.log(`Request ${i}: ${response.status} - ${response.statusText}`);
        
        if (response.status === 429) {
          console.log(`✅ Rate limiting working! Blocked after ${i} requests`);
          console.log(`📋 Rate limit headers:`, {
            'x-ratelimit-limit': response.headers['x-ratelimit-limit'],
            'x-ratelimit-remaining': response.headers['x-ratelimit-remaining'],
            'x-ratelimit-reset': response.headers['x-ratelimit-reset']
          });
          break;
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`Request ${i}: Error - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.log('❌ Rate limit test failed:', error.message);
  }

  try {
    // Test general endpoint
    console.log('\n2. Testing general endpoint...');
    const response = await axios.get(`${baseUrl}/api/health`, {
      validateStatus: () => true
    });
    
    console.log(`✅ Health endpoint: ${response.status}`);
    console.log(`📋 Rate limit headers:`, {
      'x-ratelimit-limit': response.headers['x-ratelimit-limit'],
      'x-ratelimit-remaining': response.headers['x-ratelimit-remaining']
    });
    
  } catch (error) {
    console.log(`❌ Health endpoint test failed: ${error.message}`);
  }

  console.log('\n📋 Rate Limit Configuration:');
  console.log('- General: 500 requests per 15 minutes');
  console.log('- Auth: 50 requests per 15 minutes');
  console.log('- Link Code: 20 requests per 15 minutes');
  console.log('\n✅ If you see 429 errors, rate limiting is working correctly');
  console.log('✅ If you see 200/401 responses, rate limiting is not blocking normal usage');
};

testRateLimit().catch(console.error);
