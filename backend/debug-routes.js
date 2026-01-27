// Debug script to check all registered routes
// Run with: node debug-routes.js

import express from "express";
import authRoutes from "./src/routes/auth.route.js";
import userRoutes from "./src/routes/user.route.js";
import chatRoutes from "./src/routes/chat.route.js";
import roomRoutes from "./src/routes/room.route.js";
import aiRoutes from "./src/routes/ai.route.js";

const app = express();

// Register routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/ai", aiRoutes);

console.log("🔍 Checking all registered routes...\n");

// Get all registered routes
const routes = [];
app._router.stack.forEach(middleware => {
  if (middleware.route) {
    // Routes registered directly on the app
    routes.push({
      path: middleware.route.path,
      methods: Object.keys(middleware.route.methods)
    });
  } else if (middleware.name === 'router') {
    // Router middleware
    middleware.handle.stack.forEach(handler => {
      if (handler.route) {
        const path = middleware.regexp.source.replace('^\\/','').replace('\\/?(?=\\/|$)','');
        routes.push({
          path: `/${path}${handler.route.path}`,
          methods: Object.keys(handler.route.methods)
        });
      }
    });
  }
});

console.log("📋 Registered Routes:");
routes.forEach(route => {
  console.log(`  ${route.methods.join('|').toUpperCase()} ${route.path}`);
});

console.log("\n🎯 Looking for AI routes specifically:");
const aiRoutes = routes.filter(route => route.path.includes('/ai'));
if (aiRoutes.length > 0) {
  aiRoutes.forEach(route => {
    console.log(`  ✅ ${route.methods.join('|').toUpperCase()} ${route.path}`);
  });
} else {
  console.log("  ❌ No AI routes found!");
}

console.log("\n🔍 All routes with 'ai' in path:");
routes.forEach(route => {
  if (route.path.includes('ai')) {
    console.log(`  ${route.methods.join('|').toUpperCase()} ${route.path}`);
  }
});
