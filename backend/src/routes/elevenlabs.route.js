import express from "express";
import { generateTTS } from "../controllers/elevenlabs.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// We keep it protected as it consumes credits
// TEMPORARILY REMOVING protectRoute for testing
router.post("/tts", generateTTS);

export default router;
