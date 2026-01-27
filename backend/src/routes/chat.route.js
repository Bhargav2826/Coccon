import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getStreamToken, streamWebhook } from "../controllers/chat.controller.js";

const router = express.Router();

router.get("/token", protectRoute, getStreamToken);

// Webhook endpoint for Stream Chat (no authentication required)
router.post("/webhook", streamWebhook);

export default router;
