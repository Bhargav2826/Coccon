import dotenv from "dotenv";

// Load .env file
dotenv.config();

console.log("🔧 Env Config Loaded. Initial NODE_ENV:", process.env.NODE_ENV);

// Force production on Render environment
if (process.env.RENDER) {
    console.log("🚀 Render Environment Detected: Enforcing Production Mode");
    process.env.NODE_ENV = "production";
}

console.log("✅ Final NODE_ENV:", process.env.NODE_ENV);
