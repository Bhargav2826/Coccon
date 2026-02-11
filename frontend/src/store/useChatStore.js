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

    getUsers: async () => {
        set({ isUsersLoading: true });
        try {
            const res = await getUsersForSidebar();
            set({ users: res });
        } catch (error) {
            toast.error(error.response.data.message);
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
            toast.error(error.response.data.message);
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
            toast.error(error.response.data.message);
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
        const { selectedUser, users } = get();
        if (!socket) return;

        socket.on("newMessage", (newMessage) => {
            const isFromSelectedUser = selectedUser && newMessage.sender === selectedUser._id;

            if (isFromSelectedUser) {
                set({
                    messages: [...get().messages, newMessage],
                });
                // Auto mark as read if chat is open
                socket.emit("messageRead", { messageIds: [newMessage._id], senderId: selectedUser._id });
            }

            // Always update unread count and last message in sidebar
            set({
                users: get().users.map(u => {
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
            if (selectedUser && senderId === selectedUser._id) {
                set({ typingUser: isTyping ? senderId : null });
            }
        });

        socket.on("messagesReadUpdate", ({ messageIds, receiverId }) => {
            if (selectedUser && receiverId === selectedUser._id) {
                set({
                    messages: get().messages.map(m =>
                        messageIds.includes(m._id) ? { ...m, isRead: true } : m
                    )
                });
            }
        });

        socket.on("messageReactionUpdate", ({ messageId, reactions }) => {
            set({
                messages: get().messages.map(m =>
                    m._id === messageId ? { ...m, reactions } : m
                )
            });
        });
    },

    unsubscribeFromMessages: (socket) => {
        if (socket) {
            socket.off("newMessage");
            socket.off("typing");
            socket.off("messagesReadUpdate");
            socket.off("messageReactionUpdate");
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
