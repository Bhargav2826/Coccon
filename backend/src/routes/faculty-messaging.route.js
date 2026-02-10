import express from "express";
import {
  startFacultyVideoCall,
} from "../controllers/faculty-messaging.controller.js";
import { protectRole } from "../middleware/auth.middleware.js";
import { validateStartFacultyVideoCall } from "../middleware/validation.middleware.js";

const router = express.Router();

// Faculty-only routes
router.post("/start-video-call", protectRole(["faculty"]), validateStartFacultyVideoCall, startFacultyVideoCall);

export default router;
