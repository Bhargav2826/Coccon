import { useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import { useAuth } from "../contexts/AuthContext";
import { useSocketContext } from "../contexts/SocketContext";
import { FileIcon, DownloadCloud, Check, CheckCheck, Smile } from "lucide-react";

const ChatContainer = () => {
    const {
        messages,
        getMessages,
        isMessagesLoading,
        selectedUser,
        subscribeToMessages,
        unsubscribeFromMessages,
        typingUser,
        addReaction,
    } = useChatStore();
    const { authUser } = useAuth();
    const { socket } = useSocketContext();
    const messageEndRef = useRef(null);

    useEffect(() => {
        getMessages(selectedUser._id);

        subscribeToMessages(socket);

        return () => unsubscribeFromMessages(socket);
    }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages, socket]);

    useEffect(() => {
        if (messageEndRef.current && messages) {
            messageEndRef.current.scrollIntoView({ behavior: "smooth" });
        }

        // Mark messages as read when they are viewed
        if (selectedUser && messages.length > 0 && socket) {
            const unreadMessages = messages
                .filter(m => m.sender === selectedUser._id && !m.isRead)
                .map(m => m._id);

            if (unreadMessages.length > 0) {
                socket.emit("messageRead", { messageIds: unreadMessages, senderId: selectedUser._id });
            }
        }
    }, [messages, selectedUser, socket]);

    if (isMessagesLoading) {
        return (
            <div className="flex-1 flex flex-col overflow-auto">
                <ChatHeader />
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {[...Array(6)].map((_, idx) => (
                        <div key={idx} className={`chat ${idx % 2 === 0 ? "chat-start" : "chat-end"}`}>
                            <div className="chat-image avatar">
                                <div className="size-10 rounded-full bg-base-300 animate-pulse" />
                            </div>
                            <div className="chat-header mb-1">
                                <div className="h-4 w-16 bg-base-300 animate-pulse rounded" />
                            </div>
                            <div className="chat-bubble bg-transparent p-0">
                                <div className="h-10 w-48 bg-base-300 animate-pulse rounded" />
                            </div>
                        </div>
                    ))}
                </div>
                <MessageInput />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-auto">
            <ChatHeader />

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                    const isSentByMe = message.sender === authUser._id;
                    const displayFile = message.fileUrl || message.image;
                    const isImage = message.fileType === "image" || (!message.fileType && message.image);

                    return (
                        <div
                            key={message._id}
                            className={`chat ${isSentByMe ? "chat-end" : "chat-start"}`}
                            ref={messageEndRef}
                        >
                            <div className="chat-image avatar">
                                <div className="size-10 rounded-full border">
                                    <img
                                        src={
                                            isSentByMe
                                                ? authUser.profilePic || "/avatar.png"
                                                : selectedUser.profilePic || "/avatar.png"
                                        }
                                        alt="profile pic"
                                    />
                                </div>
                            </div>
                            <div className={`chat-bubble group relative flex flex-col gap-1 ${isSentByMe ? "chat-bubble-primary" : "bg-neutral text-neutral-content"}`}>
                                {/* Reaction Picker */}
                                <div className={`absolute -top-10 ${isSentByMe ? "right-0" : "left-0"} hidden group-hover:flex items-center gap-1 bg-base-200 border border-base-300 p-1.5 rounded-2xl shadow-xl z-20`}>
                                    {["❤️", "👍", "😂", "😮", "😢", "🔥"].map((emoji) => (
                                        <button
                                            key={emoji}
                                            onClick={() => addReaction(socket, message._id, emoji)}
                                            className="hover:scale-125 transition-transform px-1 active:scale-95"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>

                                {displayFile && (
                                    <div className="mt-1">
                                        {isImage ? (
                                            <img
                                                src={displayFile}
                                                alt="Attachment"
                                                className="max-w-[250px] sm:max-w-sm rounded-lg shadow-sm border border-black/5"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <a
                                                href={displayFile}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 bg-black/10 rounded-lg hover:bg-black/20 transition-colors border border-black/5"
                                            >
                                                <div className="p-2 bg-primary/20 rounded-md">
                                                    <FileIcon className="size-5 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate max-w-[150px]">
                                                        {message.fileName || "Download File"}
                                                    </p>
                                                    <p className="text-[10px] opacity-60 uppercase">
                                                        {message.fileType || "File"}
                                                    </p>
                                                </div>
                                                <DownloadCloud className="size-4 opacity-50" />
                                            </a>
                                        )}
                                    </div>
                                )}
                                {message.text && (
                                    <p className="text-sm leading-relaxed font-medium">
                                        {message.text}
                                    </p>
                                )}

                                {/* Reactions Display */}
                                {message.reactions?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {message.reactions.map((reaction, i) => (
                                            <div
                                                key={i}
                                                className={`flex items-center gap-1 bg-black/10 rounded-full px-1.5 py-0.5 border border-black/5 text-[10px] cursor-help`}
                                                title={`Reacted with ${reaction.emoji}`}
                                            >
                                                {reaction.emoji}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center justify-between gap-2 mt-1">
                                    <time className="text-[10px] opacity-60">
                                        {new Date(message.createdAt).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </time>
                                    {isSentByMe && (
                                        <div className="flex items-center">
                                            {message.isRead ? (
                                                <CheckCheck className="size-3 text-primary-content" />
                                            ) : (
                                                <Check className="size-3 opacity-60" />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Typing Indicator */}
            {typingUser === selectedUser._id && (
                <div className="px-5 py-2 flex items-center gap-2">
                    <div className="flex gap-1">
                        <span className="size-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="size-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="size-1.5 bg-primary rounded-full animate-bounce" />
                    </div>
                    <span className="text-xs text-base-content/50 italic">{selectedUser.fullName} is typing...</span>
                </div>
            )}

            <MessageInput />
        </div>
    );
};

export default ChatContainer;
