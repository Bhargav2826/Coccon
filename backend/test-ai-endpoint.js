// Test script for AI endpoint
// Run with: node test-ai-endpoint.js

const testAIEndpoint = async () => {
  const baseUrl = "http://localhost:5001";
  
  console.log("🧪 Testing AI Endpoint...\n");
  
  try {
    // Test if the endpoint exists (without authentication)
    const response = await fetch(`${baseUrl}/api/ai/analyze-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        childUid: "test",
        targetUid: "test"
      }),
    });
    
    console.log(`📡 Response Status: ${response.status}`);
    console.log(`📡 Response Headers:`, Object.fromEntries(response.headers.entries()));
    
    if (response.status === 401) {
      console.log("✅ Endpoint exists! (401 Unauthorized is expected without auth)");
    } else if (response.status === 404) {
      console.log("❌ Endpoint not found (404)");
    } else {
      console.log(`📄 Response: ${await response.text()}`);
    }
    
  } catch (error) {
    console.log(`💥 Error:`, error.message);
  }
};

// Run the test
testAIEndpoint().catch(console.error);
