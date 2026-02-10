import { useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import { useAuth } from "../contexts/AuthContext";
import { useSocketContext } from "../contexts/SocketContext";
import { FileIcon, DownloadCloud } from "lucide-react";

const ChatContainer = () => {
    const {
        messages,
        getMessages,
        isMessagesLoading,
        selectedUser,
        subscribeToMessages,
        unsubscribeFromMessages,
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
    }, [messages]);

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
                            <div className={`chat-bubble flex flex-col gap-1 ${isSentByMe ? "chat-bubble-primary" : "bg-neutral text-neutral-content"}`}>
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
                                <time className="text-[10px] opacity-60 mt-1">
                                    {new Date(message.createdAt).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </time>
                            </div>
                        </div>
                    );
                })}
            </div>

            <MessageInput />
        </div>
    );
};

export default ChatContainer;
