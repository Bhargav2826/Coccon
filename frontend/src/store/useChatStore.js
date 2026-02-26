import { create } from "zustand";
import { toast } from "react-hot-toast";
import { getMessages, getUsersForSidebar, sendMessage } from "../lib/api";

export const useChatStore = create((set, get) => ({
    messages: [],
    users: [],
    groups: [],
    selectedUser: null,
    selectedGroup: null,
    isUsersLoading: false,
    isMessagesLoading: false,
    typingUser: null,
    isSubscribed: false,
    replyMessage: null,
    starredMessages: [],
    searchQuery: "",
    searchResults: [],

    getUsers: async () => {
        set({ isUsersLoading: true });
        try {
            const res = await getUsersForSidebar();
            set({ users: res });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fetch users");
        } finally {
            set({ isUsersLoading: false });
        }
    },

    getMessages: async (userId) => {
        set({ isMessagesLoading: true });
        try {
            const res = await getMessages(userId);
            set({ messages: res });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fetch messages");
        } finally {
            set({ isMessagesLoading: false });
        }
    },

    sendMessage: async (messageData) => {
        const { selectedUser, messages, users } = get();
        const tempId = `temp-${Date.now()}`;

        // Optimistic message
        const optimisticMessage = {
            _id: tempId,
            sender: "me", // Will be handled by isSentByMe logic in UI
            text: messageData.text || "",
            image: messageData.image || null,
            fileUrl: messageData.fileUrl || null,
            createdAt: new Date().toISOString(),
            isOptimistic: true,
            ...messageData
        };

        set({ messages: [...messages, optimisticMessage] });

        try {
            const res = await sendMessage(selectedUser._id, messageData);
            set({
                messages: get().messages.map(m => m._id === tempId ? res : m),
                users: users.map(u =>
                    u._id === selectedUser._id ? { ...u, lastMessage: res } : u
                )
            });
        } catch (error) {
            set({ messages: get().messages.filter(m => m._id !== tempId) });
            toast.error(error.response?.data?.message || "Failed to send message");
        }
    },

    setTyping: (socket, isTyping) => {
        const { selectedUser } = get();
        if (!selectedUser || !socket) return;
        socket.emit("typing", { receiverId: selectedUser._id, isTyping });
    },

    addReaction: (socket, messageId, emoji, isGroup = false) => {
        const { selectedUser, selectedGroup } = get();
        if (!socket) return;

        if (isGroup) {
            if (!selectedGroup) return;
            socket.emit("groupMessageReaction", { messageId, groupId: selectedGroup._id, emoji });
        } else {
            if (!selectedUser) return;
            socket.emit("messageReaction", { messageId, receiverId: selectedUser._id, emoji });
        }
    },

    subscribeToMessages: (socket) => {
        if (!socket || get().isSubscribed) return;

        const { selectedUser } = get();

        socket.on("newMessage", (newMessage) => {
            const { selectedUser, users, messages } = get();
            const isFromSelectedUser = selectedUser && newMessage.sender === selectedUser._id;

            // Check if we already have this message (e.g. from optimistic update)
            if (messages.some(m => m._id === newMessage._id)) return;

            if (isFromSelectedUser) {
                set({
                    messages: [...messages, newMessage],
                });
                // Auto mark as read if chat is open
                socket.emit("messageRead", { messageIds: [newMessage._id], senderId: selectedUser._id });
            }

            // Always update unread count and last message in sidebar
            set({
                users: users.map(u => {
                    if (u._id === newMessage.sender) {
                        return {
                            ...u,
                            unreadCount: isFromSelectedUser ? 0 : (u.unreadCount || 0) + 1,
                            lastMessage: newMessage
                        };
                    }
                    if (u._id === newMessage.receiver) {
                        return { ...u, lastMessage: newMessage };
                    }
                    return u;
                })
            });
        });

        socket.on("typing", ({ senderId, isTyping }) => {
            const { selectedUser } = get();
            if (selectedUser && senderId === selectedUser._id) {
                set({ typingUser: isTyping ? senderId : null });
            }
        });

        socket.on("messagesReadUpdate", ({ messageIds, receiverId }) => {
            const { selectedUser, messages } = get();
            if (selectedUser && receiverId === selectedUser._id) {
                set({
                    messages: messages.map(m =>
                        messageIds.includes(m._id) ? { ...m, isRead: true } : m
                    )
                });
            }
        });

        socket.on("messageReactionUpdate", ({ messageId, reactions }) => {
            const { messages } = get();
            set({
                messages: messages.map(m =>
                    m._id === messageId ? { ...m, reactions } : m
                )
            });
        });

        socket.on("messageUpdate", (updatedMessage) => {
            const { messages } = get();
            set({
                messages: messages.map(m =>
                    m._id === updatedMessage._id ? { ...m, ...updatedMessage, poll: updatedMessage.poll || m.poll } : m
                )
            });
        });

        socket.on("newGroup", (newGroup) => {
            set({ groups: [...get().groups, newGroup] });
        });

        socket.on("newGroupMessage", ({ groupId, message }) => {
            const { selectedGroup, messages, groups } = get();
            const isFromSelectedGroup = selectedGroup && selectedGroup._id === groupId;

            // Check if we already have this message (e.g. from optimistic update)
            if (messages.some(m => m._id === message._id)) return;

            if (isFromSelectedGroup) {
                set({ messages: [...messages, message] });
                // Auto mark as read if group chat is open
                socket.emit("groupMessageRead", { messageIds: [message._id], groupId });
            }

            set({
                groups: groups.map(g =>
                    g._id === groupId ? {
                        ...g,
                        lastMessage: message,
                        unreadCount: isFromSelectedGroup ? 0 : (g.unreadCount || 0) + 1
                    } : g
                )
            });
        });

        set({ isSubscribed: true });
    },

    unsubscribeFromMessages: (socket) => {
        if (socket) {
            socket.off("newMessage");
            socket.off("typing");
            socket.off("messagesReadUpdate");
            socket.off("messageReactionUpdate");
            set({ isSubscribed: false });
        }
    },

    deleteMessage: async (messageId) => {
        try {
            const { deleteMessage: deleteMsgApi } = await import("../lib/api");
            await deleteMsgApi(messageId);
            set({
                messages: get().messages.map(m =>
                    m._id === messageId ? { ...m, isDeleted: true } : m
                )
            });
        } catch (error) {
            toast.error("Failed to delete message");
        }
    },

    updateMessage: async (messageId, text) => {
        try {
            const { updateMessage: updateMsgApi } = await import("../lib/api");
            const res = await updateMsgApi(messageId, text);
            set({
                messages: get().messages.map(m =>
                    m._id === messageId ? res : m
                )
            });
        } catch (error) {
            toast.error("Failed to update message");
        }
    },

    searchMessages: async (query) => {
        const { selectedUser } = get();
        if (!selectedUser || !query.trim()) {
            set({ searchResults: [], searchQuery: query });
            return;
        }
        try {
            const { searchMessages: searchMsgApi } = await import("../lib/api");
            const res = await searchMsgApi(query, selectedUser._id);
            set({ searchResults: res, searchQuery: query });
        } catch (error) {
            console.error("Search failed:", error);
        }
    },

    getGroups: async () => {
        try {
            const { getGroups: fetchGroups } = await import("../lib/api");
            const res = await fetchGroups();
            set({ groups: res });
        } catch (error) {
            toast.error("Failed to fetch groups");
        }
    },

    createGroup: async (groupData) => {
        try {
            const { createGroup: makeGroup } = await import("../lib/api");
            const res = await makeGroup(groupData);
            set({
                groups: [...get().groups, res],
                selectedGroup: res,
                selectedUser: null,
                messages: []
            });
            toast.success("Group created!");
        } catch (error) {
            toast.error("Failed to create group");
        }
    },

    getGroupMessages: async (groupId) => {
        set({ isMessagesLoading: true });
        try {
            const { getGroupMessages: fetchGMsg } = await import("../lib/api");
            const res = await fetchGMsg(groupId);
            set({ messages: res });
        } catch (error) {
            toast.error("Failed to fetch group messages");
        } finally {
            set({ isMessagesLoading: false });
        }
    },

    sendGroupMessage: async (messageData) => {
        const { selectedGroup, messages } = get();
        const tempId = `temp-group-${Date.now()}`;

        // Optimistic message
        const optimisticMessage = {
            _id: tempId,
            sender: "me",
            text: messageData.text || "",
            image: messageData.image || null,
            fileUrl: messageData.fileUrl || null,
            createdAt: new Date().toISOString(),
            isOptimistic: true,
            ...messageData
        };

        set({ messages: [...messages, optimisticMessage] });

        try {
            const { sendGroupMessage: sendGM } = await import("../lib/api");
            const res = await sendGM(selectedGroup._id, messageData);
            set({ messages: get().messages.map(m => m._id === tempId ? res : m) });
        } catch (error) {
            set({ messages: get().messages.filter(m => m._id !== tempId) });
            toast.error("Failed to send group message");
        }
    },

    starMessage: async (messageId) => {
        try {
            const { starMessage: starMsgApi } = await import("../lib/api");
            await starMsgApi(messageId);
            toast.success("Message starred");
        } catch (error) {
            toast.error("Failed to star message");
        }
    },

    getStarredMessages: async () => {
        try {
            const { getStarredMessages: fetchStarred } = await import("../lib/api");
            const res = await fetchStarred();
            set({ starredMessages: res });
        } catch (error) {
            toast.error("Failed to fetch starred messages");
        }
    },

    updateLastSeen: async () => {
        try {
            const { updateLastSeen: updateLSApi } = await import("../lib/api");
            await updateLSApi();
        } catch (error) {
            console.error("Failed to update last seen");
        }
    },

    setSelectedGroup: (group) => {
        if (group) {
            set({
                selectedGroup: group,
                selectedUser: null,
                messages: [],
                groups: get().groups.map(g =>
                    g._id === group._id ? { ...g, unreadCount: 0 } : g
                )
            });
        } else {
            set({ selectedGroup: null });
        }
    },

    setReplyMessage: (message) => {
        set({ replyMessage: message });
    },

    setSelectedUser: (selectedUser) => {
        if (selectedUser) {
            set({
                selectedUser,
                selectedGroup: null,
                typingUser: null,
                users: get().users.map(u =>
                    u._id === selectedUser._id ? { ...u, unreadCount: 0 } : u
                )
            });
        } else {
            set({ selectedUser: null, typingUser: null });
        }
    },

    votePoll: async (messageId, optionIndex, isGroup = false) => {
        try {
            const { votePoll: voteApi } = await import("../lib/api");
            const res = await voteApi(messageId, optionIndex, isGroup);
            const { messages } = get();
            set({
                messages: messages.map(m =>
                    m._id === messageId ? { ...m, poll: res.poll } : m
                )
            });
        } catch (error) {
            toast.error("Failed to vote");
        }
    },

    forwardMessage: async (messageId, targetType, targetId) => {
        try {
            const { forwardMessage: forwardApi } = await import("../lib/api");
            const res = await forwardApi(messageId, targetType, targetId);

            const { selectedUser, selectedGroup, messages, users, groups } = get();

            // If forwarded to current open chat, add to messages
            const isCurrentChat = (targetType === "user" && selectedUser?._id === targetId) ||
                (targetType === "group" && selectedGroup?._id === targetId);

            if (isCurrentChat) {
                set({ messages: [...messages, res] });
            }

            // Update sidebar last message
            if (targetType === "user") {
                set({
                    users: users.map(u => u._id === targetId ? { ...u, lastMessage: res } : u)
                });
            } else {
                set({
                    groups: groups.map(g => g._id === targetId ? { ...g, lastMessage: res } : g)
                });
            }

            toast.success("Message forwarded!");
        } catch (error) {
            toast.error("Failed to forward message");
        }
    },
}));

