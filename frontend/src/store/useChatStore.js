import { create } from "zustand";
import { toast } from "react-hot-toast";
import { getMessages, getUsersForSidebar, sendMessage } from "../lib/api";

export const useChatStore = create((set, get) => ({
    messages: [],
    users: [],
    selectedUser: null,
    isUsersLoading: false,
    isMessagesLoading: false,

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

    subscribeToMessages: (socket) => {
        const { selectedUser } = get();
        if (!selectedUser || !socket) return;

        socket.on("newMessage", (newMessage) => {
            const isMessageSentToMe = newMessage.sender === selectedUser._id;
            if (!isMessageSentToMe) return;

            set({
                messages: [...get().messages, newMessage],
            });
        });
    },

    unsubscribeFromMessages: (socket) => {
        if (socket) socket.off("newMessage");
    },

    setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
