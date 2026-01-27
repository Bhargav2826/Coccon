// Test script for signup validation
// Run with: node test-signup.js

const testCases = [
  {
    name: "Valid Student Signup",
    data: {
      email: "student@example.com",
      password: "password123",
      fullName: "John Doe",
      role: "student"
    }
  },
  {
    name: "Valid Parent Signup",
    data: {
      email: "parent@example.com",
      password: "password123",
      fullName: "Jane Smith",
      role: "parent"
    }
  },
  {
    name: "Valid Faculty Signup",
    data: {
      email: "faculty@example.com",
      password: "password123",
      fullName: "Dr. Johnson",
      role: "faculty"
    }
  },
  {
    name: "Invalid Email",
    data: {
      email: "invalid-email",
      password: "password123",
      fullName: "Test User",
      role: "student"
    }
  },
  {
    name: "Short Password",
    data: {
      email: "test@example.com",
      password: "123",
      fullName: "Test User",
      role: "student"
    }
  },
  {
    name: "Invalid Role",
    data: {
      email: "test@example.com",
      password: "password123",
      fullName: "Test User",
      role: "invalid-role"
    }
  }
];

async function testSignup() {
  const baseUrl = "http://localhost:5001";
  
  console.log("🧪 Testing Signup Validation...\n");
  
  for (const testCase of testCases) {
    console.log(`📝 Testing: ${testCase.name}`);
    console.log(`📦 Data:`, testCase.data);
    
    try {
      const response = await fetch(`${baseUrl}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testCase.data),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ SUCCESS: ${response.status}`);
        console.log(`📄 Response:`, result);
      } else {
        console.log(`❌ FAILED: ${response.status}`);
        console.log(`📄 Response:`, result);
      }
    } catch (error) {
      console.log(`💥 ERROR:`, error.message);
    }
    
    console.log("─".repeat(50));
  }
}

// Run the test
testSignup().catch(console.error);
