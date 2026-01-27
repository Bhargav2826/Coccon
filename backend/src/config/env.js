import dotenv from "dotenv";

// Load .env file
dotenv.config();

console.log("🔧 Env Config Loaded. Initial NODE_ENV:", process.env.NODE_ENV);

// Force production on Render or if PROD flag is set
// This overrides any "development" setting that might have come from .env
if (process.env.RENDER || process.env.NODE_ENV === 'production') {
    console.log("🚀 Enforcing Production Configuration");
    console.log("   - Setting NODE_ENV to production");
    process.env.NODE_ENV = "production";

    // Ensure security features are enabled
    console.log("   - Enabling Rate Limits & Helmet");
    process.env.DISABLE_RATE_LIMIT = "false";
    process.env.DISABLE_HELMET = "false";
}

console.log("✅ Final NODE_ENV:", process.env.NODE_ENV);
