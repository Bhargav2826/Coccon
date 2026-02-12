import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
    getMessages,
    getUsersForSidebar,
    sendMessage,
    updateMessage,
    deleteMessage,
    searchMessages
} from "../controllers/chat.controller.js";
import {
    createGroup,
    getGroups,
    sendGroupMessage,
    getGroupMessages
} from "../controllers/group.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/search", protectRoute, searchMessages);

// Group Chat Routes
router.post("/groups", protectRoute, createGroup);
router.get("/groups", protectRoute, getGroups);
router.post("/groups/:groupId/send", protectRoute, sendGroupMessage);
router.get("/groups/:groupId/messages", protectRoute, getGroupMessages);

router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.put("/update/:messageId", protectRoute, updateMessage);
router.delete("/delete/:messageId", protectRoute, deleteMessage);

export default router;
