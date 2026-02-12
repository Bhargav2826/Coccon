import { create } from "zustand";
import { toast } from "react-hot-toast";
import { getMessages, getUsersForSidebar, sendMessage } from "../lib/api";

export const useChatStore = create((set, get) => ({
    messages: [],
    users: [],
    selectedUser: null,
    isUsersLoading: false,
    isMessagesLoading: false,
    typingUser: null,
    isSubscribed: false,

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
        try {
            const res = await sendMessage(selectedUser._id, messageData);
            set({
                messages: [...messages, res],
                users: users.map(u =>
                    u._id === selectedUser._id ? { ...u, lastMessage: res } : u
                )
            });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send message");
        }
    },

    setTyping: (socket, isTyping) => {
        const { selectedUser } = get();
        if (!selectedUser || !socket) return;
        socket.emit("typing", { receiverId: selectedUser._id, isTyping });
    },

    addReaction: (socket, messageId, emoji) => {
        const { selectedUser } = get();
        if (!selectedUser || !socket) return;
        socket.emit("messageReaction", { messageId, receiverId: selectedUser._id, emoji });
    },

    subscribeToMessages: (socket) => {
        if (!socket || get().isSubscribed) return;

        const { selectedUser } = get();

        socket.on("newMessage", (newMessage) => {
            const { selectedUser, users, messages } = get();
            const isFromSelectedUser = selectedUser && newMessage.sender === selectedUser._id;

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

    setSelectedUser: (selectedUser) => {
        if (selectedUser) {
            set({
                selectedUser,
                typingUser: null,
                users: get().users.map(u =>
                    u._id === selectedUser._id ? { ...u, unreadCount: 0 } : u
                )
            });
        } else {
            set({ selectedUser: null, typingUser: null });
        }
    },
}));

