import express from "express";
import { 
  sendRoomMessage, 
  sendRoomFile, 
  sendVideoCallLink,
  startFacultyVideoCall,
  getStudentFacultyMessages,
  getRoomMessages,
  markMessageAsRead
} from "../controllers/faculty-messaging.controller.js";
import { protectRoute, protectRole } from "../middleware/auth.middleware.js";
import { validateFacultyMessage, validateFacultyVideoCall, validateStartFacultyVideoCall, validateFacultyFile } from "../middleware/validation.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

// Faculty-only routes
router.post("/send-message", protectRole(["faculty"]), validateFacultyMessage, sendRoomMessage);
router.post("/send-file", protectRole(["faculty"]), upload.single("file"), validateFacultyFile, sendRoomFile);
router.post("/send-video-call", protectRole(["faculty"]), validateFacultyVideoCall, sendVideoCallLink);
router.post("/start-video-call", protectRole(["faculty"]), validateStartFacultyVideoCall, startFacultyVideoCall);

// Student and faculty accessible routes
router.get("/student-messages", protectRoute, getStudentFacultyMessages);
router.get("/room/:roomId/messages", protectRoute, getRoomMessages);
router.put("/messages/:messageId/read", protectRoute, markMessageAsRead);

export default router;
