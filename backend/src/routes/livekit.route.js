
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getLiveKitToken } from "../controllers/livekit.controller.js";

const router = express.Router();

router.post("/token", protectRoute, getLiveKitToken);

export default router;
