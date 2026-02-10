import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const apiKey = process.env.SARVAM_API_KEY;
console.log("Testing Sarvam API with key:", apiKey ? `${apiKey.substring(0, 5)}...` : "Missing");

async function testSarvam() {
    try {
        const response = await axios.post(
            "https://api.sarvam.ai/v1/chat/completions",
            {
                model: "sarvam-m", // Based on the error message, 'sarvam-m' is a valid model
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    { role: "user", content: "Hello, this is a test." }
                ],
                max_tokens: 50,
                temperature: 0.1
            },
            {
                headers: {
                    "api-subscription-key": apiKey,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("✅ Success! Response:", response.data);
    } catch (error) {
        console.error("❌ Failed!");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Error:", error.message);
        }
    }
}

testSarvam();
