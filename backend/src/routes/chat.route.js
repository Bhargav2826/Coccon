import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
    getMessages,
    getUsersForSidebar,
    sendMessage,
    updateMessage,
    deleteMessage,
    searchMessages,
    getCallLogs,
    votePoll,
    forwardMessage
} from "../controllers/chat.controller.js";
import {
    createGroup,
    getGroups,
    sendGroupMessage,
    getGroupMessages,
    voteGroupPoll
} from "../controllers/group.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/search", protectRoute, searchMessages);
router.post("/forward", protectRoute, forwardMessage);

// Group Chat Routes
router.post("/groups", protectRoute, createGroup);
router.get("/groups", protectRoute, getGroups);
router.post("/groups/:groupId/send", protectRoute, sendGroupMessage);
router.get("/groups/:groupId/messages", protectRoute, getGroupMessages);
router.put("/groups/vote/:messageId", protectRoute, voteGroupPoll);

router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.put("/update/:messageId", protectRoute, updateMessage);
router.put("/vote/:messageId", protectRoute, votePoll);
router.delete("/delete/:messageId", protectRoute, deleteMessage);
router.get("/calls/:id", protectRoute, getCallLogs);

export default router;
