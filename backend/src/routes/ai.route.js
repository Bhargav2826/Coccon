
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { analyzeCall, getCallHistory, getChildCalls, analyzeChat, getChatHistory, getChatSessions } from "../controllers/ai.controller.js";

const router = express.Router();

router.post("/analyze-call", protectRoute, analyzeCall);
router.post("/analyze-chat", protectRoute, analyzeChat);
router.get("/calls/:childUid/:targetUid", protectRoute, getCallHistory);
router.get("/chats/:childUid/:targetUid", protectRoute, getChatHistory);
router.get("/chats/sessions/:childUid/:targetUid", protectRoute, getChatSessions);
router.get("/child-calls/:childUid", protectRoute, getChildCalls);

export default router;
