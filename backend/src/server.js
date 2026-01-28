import "./polyfill.js";
import express from "express";
import "./config/env.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";
import roomRoutes from "./routes/room.route.js";
import aiRoutes from "./routes/ai.route.js";
import facultyMessagingRoutes from "./routes/faculty-messaging.route.js";
import livekitRoutes from "./routes/livekit.route.js";

import { server, app } from "./lib/socket.js";
import { connectDB } from "./lib/db.js";
import { rateLimit as rateLimitConfig, helmet as helmetConfig, cors as corsConfig, requestLimits, development } from "./config/security.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";

const PORT = process.env.PORT || 5001;

const __dirname = path.resolve();

// Security middleware - Disable helmet in development if needed
if (!development.disableHelmet) {
  console.log("🛡️ Applying Helmet Security Headers (CSP is active)");
  app.use(helmet(helmetConfig));
} else {
  console.log("🚫 Helmet Security Headers are DISABLED via DISABLE_HELMET environment variable");
}

// ... (retain rate limit config)

// Rate limiting - Disable in development if needed
const generalLimiter = process.env.NODE_ENV === "development" && process.env.DISABLE_RATE_LIMIT === "true"
  ? (req, res, next) => next()
  : rateLimit(rateLimitConfig.general);

const authLimiter = process.env.NODE_ENV === "development" && process.env.DISABLE_RATE_LIMIT === "true"
  ? (req, res, next) => next()
  : rateLimit(rateLimitConfig.auth);

const linkCodeLimiter = process.env.NODE_ENV === "development" && process.env.DISABLE_RATE_LIMIT === "true"
  ? (req, res, next) => next()
  : rateLimit(rateLimitConfig.linkCode);

// Log development settings
if (process.env.NODE_ENV === "development") {
  console.log("🔧 Development Mode Active");
  if (process.env.DISABLE_RATE_LIMIT === "true") {
    console.log("🚫 Rate Limiting: DISABLED");
  } else {
    console.log("⚡ Rate Limiting: ENABLED (Higher limits for development)");
  }
  if (process.env.DISABLE_HELMET === "true") {
    console.log("🚫 Security Headers: DISABLED");
  } else {
    console.log("🛡️ Security Headers: ENABLED");
  }
}

app.use(cors(corsConfig));

app.use(express.json({ limit: requestLimits.json }));
app.use(cookieParser());

// Apply rate limiters to specific routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", generalLimiter, userRoutes);
app.use("/api/chat", generalLimiter, chatRoutes);
app.use("/api/rooms", generalLimiter, roomRoutes);
app.use("/api/ai", generalLimiter, aiRoutes);
app.use("/api/faculty-messaging", generalLimiter, facultyMessagingRoutes);
app.use("/api/livekit", generalLimiter, livekitRoutes);

// Apply stricter rate limiting to link code endpoints
app.use("/api/users/generate-link-code", linkCodeLimiter);
app.use("/api/users/use-link-code", linkCodeLimiter);

// Health check endpoint for Render
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Production static files
if (process.env.NODE_ENV === "production") {
  const frontendDistPath = path.join(__dirname, "../frontend/dist");
  const indexPath = path.join(frontendDistPath, "index.html");

  // Serve static files from the frontend build (if it exists)
  console.log("📂 Serving frontend from:", frontendDistPath);
  app.use(express.static(frontendDistPath));

  // Handle all other routes by serving the React app (but not API routes)
  app.get("*", (req, res, next) => {
    // Skip API routes - let them be handled by the API middleware or 404 handler
    if (req.path.startsWith('/api/')) {
      return next();
    }

    // Try to serve the React app, fallback to error if not found
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.log('Frontend build not found, returning API-only response');
        res.status(404).json({
          message: 'Frontend not built. Please ensure frontend is built before deployment.',
          error: 'Frontend build missing'
        });
      }
    });
  });
}

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
