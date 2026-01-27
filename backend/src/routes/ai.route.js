
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { analyzeChat, analyzeCall, getCallHistory, getChildCalls } from "../controllers/ai.controller.js";

const router = express.Router();

router.post("/analyze-chat", protectRoute, analyzeChat);
router.post("/analyze-call", protectRoute, analyzeCall);
router.get("/calls/:childUid/:targetUid", protectRoute, getCallHistory);
router.get("/child-calls/:childUid", protectRoute, getChildCalls);

export default router;
