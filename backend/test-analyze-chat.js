import axios from 'axios';

// Test the analyze chat endpoint
async function testAnalyzeChat() {
    try {
        console.log("Testing /api/ai/analyze-chat endpoint...");

        // You'll need to replace these with actual IDs from your database
        // and a valid JWT token from a logged-in parent
        const response = await axios.post(
            'http://localhost:5001/api/ai/analyze-chat',
            {
                childUid: 'REPLACE_WITH_ACTUAL_CHILD_ID',
                targetUid: 'REPLACE_WITH_ACTUAL_TARGET_ID',
                date: '2026-02-10' // Today's date
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': 'REPLACE_WITH_ACTUAL_JWT_COOKIE'
                }
            }
        );

        console.log("✅ Success:", response.data);
    } catch (error) {
        console.error("❌ Error:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
            console.error("Headers:", error.response.headers);
        } else {
            console.error("Message:", error.message);
        }
    }
}

testAnalyzeChat();
