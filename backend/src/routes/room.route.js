import express from "express";
import { createRoom, joinRoom, getFacultyRooms, getStudentRooms, getRoomMembers, deleteRoom, deleteRooms } from "../controllers/room.controller.js";
import { protectRole } from "../middleware/auth.middleware.js";
import { validateCreateRoom, validateJoinRoom, validateRoomId, validateBulkDeleteRooms } from "../middleware/validation.middleware.js";

const router = express.Router();

// Create a new room (faculty only)
router.post("/create", protectRole(["faculty"]), validateCreateRoom, createRoom);

// Join a room using invite code (students and parents)
router.post("/join", protectRole(["student", "parent"]), validateJoinRoom, joinRoom);

// Get all rooms created by the faculty member
router.get("/my-rooms", protectRole(["faculty"]), getFacultyRooms);

// Get all rooms joined by the student
router.get("/joined-rooms", protectRole(["student", "parent"]), getStudentRooms);

// Get members of a specific room
router.get("/:roomId/members", protectRole(["student", "parent", "faculty"]), validateRoomId, getRoomMembers);

// Delete multiple rooms (faculty only) - MUST come before /:roomId route
router.delete("/bulk-delete", protectRole(["faculty"]), validateBulkDeleteRooms, deleteRooms);

// Delete a single room (faculty only)
router.delete("/:roomId", protectRole(["faculty"]), validateRoomId, deleteRoom);

export default router;
