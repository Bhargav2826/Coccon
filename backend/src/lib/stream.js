import { StreamChat } from "stream-chat";
import "dotenv/config";

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

console.log("🔍 Stream API Key exists:", !!apiKey);
console.log("🔍 Stream API Secret exists:", !!apiSecret);

if (!apiKey || !apiSecret) {
  console.error("Stream API key or Secret is missing");
  console.error("Please check your .env file for STREAM_API_KEY and STREAM_API_SECRET");
}

let streamClient = null;

if (apiKey && apiSecret) {
  streamClient = StreamChat.getInstance(apiKey, apiSecret);
} else {
  console.warn("⚠️ Stream Chat credentials not found. Stream Chat features will be disabled.");
}

export const upsertStreamUser = async (userData) => {
  try {
    if (!streamClient) {
      console.warn("⚠️ Stream Chat client not available, skipping user upsert");
      return userData;
    }
    await streamClient.upsertUsers([userData]);
    return userData;
  } catch (error) {
    console.error("Error upserting Stream user:", error);
  }
};

export const generateStreamToken = (userId) => {
  try {
    if (!streamClient) {
      console.warn("⚠️ Stream Chat client not available, cannot generate token");
      return null;
    }
    // ensure userId is a string
    const userIdStr = userId.toString();
    return streamClient.createToken(userIdStr);
  } catch (error) {
    console.error("Error generating Stream token:", error);
  }
};

// Export server-side client for backend-only operations (e.g., fetching messages for AI)
export const streamServerClient = streamClient;
