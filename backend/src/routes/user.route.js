import express from "express";
import { protectRoute, protectRole } from "../middleware/auth.middleware.js";
import {
  acceptFriendRequest,
  getFriendRequests,
  getMyFriends,
  getOutgoingFriendReqs,
  getRecommendedUsers,
  sendFriendRequest,
  removeFriend,
  getFriendRequestsCount,
  getMyChildren,
  linkChildToParent,
  getChildConversations,
  generateLinkCode,
  useLinkCode,
  getLinkedAccounts,
  updateTheme,
  getTheme,
  getUserById,
  rejectFriendRequest,
  updateStatus,
  updateWallpaper,
  pinChat,
  muteChat,
  blockUser,
  updateLastSeen,
} from "../controllers/user.controller.js";
import {
  validateFriendRequest,
  validateAcceptFriendRequest,
  validateLinkChild,
  validateGenerateLinkCode,
  validateUseLinkCode,
  validateChildConversations,
  validateObjectId,
} from "../middleware/validation.middleware.js";

const router = express.Router();

// apply auth middleware to all routes
router.use(protectRoute);

router.get("/", getRecommendedUsers);
router.get("/friends", getMyFriends);
// moved /:id down to avoid collision with static routes

router.post("/friend-request/:id", validateFriendRequest, sendFriendRequest);
router.put("/friend-request/:id/accept", validateAcceptFriendRequest, acceptFriendRequest);
router.put("/friend-request/:id/reject", validateAcceptFriendRequest, rejectFriendRequest); // reusing validateAcceptFriendRequest as it just checks requestId
router.delete("/friends/:id", validateObjectId, removeFriend);

router.get("/friend-requests", getFriendRequests);
router.get("/outgoing-friend-requests", getOutgoingFriendReqs);
router.get("/friend-requests/count", getFriendRequestsCount);

// Parent-child relationship routes (parents only)
router.get("/children", protectRole(["parent"]), getMyChildren);
router.post("/link-child", protectRole(["parent"]), validateLinkChild, linkChildToParent);
router.get("/children/:childId/conversations", protectRole(["parent"]), validateChildConversations, getChildConversations);

// Secure linking system routes
router.post("/generate-link-code", protectRole(["parent"]), validateGenerateLinkCode, generateLinkCode);
router.post("/use-link-code", protectRole(["student"]), validateUseLinkCode, useLinkCode);
router.get("/linked-accounts", getLinkedAccounts);

// Theme management routes
router.get("/theme", getTheme);
router.put("/theme", updateTheme);

// Chat preference routes
router.put("/status", updateStatus);
router.put("/wallpaper", updateWallpaper);
router.put("/pin/:userId", pinChat);
router.put("/mute/:userId", muteChat);
router.put("/block/:userId", blockUser);
router.put("/lastseen", updateLastSeen);

// Get user by ID (moved here to avoid route collision with static routes)
router.get("/:id", validateObjectId, getUserById);

export default router;
