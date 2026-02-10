import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const API_KEY = process.env.SARVAM_API_KEY;

console.log("🔑 Testing Sarvam API Key:", API_KEY ? `${API_KEY.substring(0, 10)}...` : "❌ MISSING");

async function testSarvamAPI() {
    try {
        console.log("\n🤖 Making test request to Sarvam AI...\n");

        const response = await axios.post(
            "https://api.sarvam.ai/v1/chat/completions",
            {
                model: "sarvam-m",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant. Respond with valid JSON only."
                    },
                    {
                        role: "user",
                        content: "Analyze this chat: 'Hello, how are you?' 'I am fine, thanks!' Return JSON with fields: summary, specific_issues (array), safety (object with type and message), sentiment."
                    }
                ],
                temperature: 0.3,
                max_tokens: 500
            },
            {
                headers: {
                    "api-subscription-key": API_KEY,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("✅ SUCCESS! Sarvam API is working");
        console.log("\n📊 Response:");
        console.log("Status:", response.status);
        console.log("Model:", response.data.model);
        console.log("\n📝 Raw Content:");
        console.log(response.data.choices[0].message.content);

        // Try to parse it
        const rawContent = response.data.choices[0].message.content;
        let cleanContent = rawContent.replace(/```json\n?|\n?```/g, '').trim();
        const firstBrace = cleanContent.indexOf('{');
        const lastBrace = cleanContent.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
        }

        console.log("\n🧹 Cleaned Content:");
        console.log(cleanContent);

        const parsed = JSON.parse(cleanContent);
        console.log("\n✅ Successfully parsed JSON:");
        console.log(JSON.stringify(parsed, null, 2));

    } catch (error) {
        console.error("\n❌ ERROR!");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Message:", error.message);
            console.error("Stack:", error.stack);
        }
        process.exit(1);
    }
}

testSarvamAPI();
