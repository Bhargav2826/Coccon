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
        const { selectedUser, messages } = get();
        try {
            const res = await sendMessage(selectedUser._id, messageData);
            set({ messages: [...messages, res] });
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
        const { selectedUser } = get();
        if (!selectedUser || !socket) return;

        socket.on("newMessage", (newMessage) => {
            const isMessageSentToMe = newMessage.sender === selectedUser._id;
            if (!isMessageSentToMe) return;

            set({
                messages: [...get().messages, newMessage],
            });

            // Auto mark as read if chat is open
            socket.emit("messageRead", { messageIds: [newMessage._id], senderId: selectedUser._id });
        });

        socket.on("typing", ({ senderId, isTyping }) => {
            if (senderId === selectedUser._id) {
                set({ typingUser: isTyping ? senderId : null });
            }
        });

        socket.on("messagesReadUpdate", ({ messageIds, receiverId }) => {
            if (receiverId === selectedUser._id) {
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

    setSelectedUser: (selectedUser) => set({ selectedUser, typingUser: null }),
}));
