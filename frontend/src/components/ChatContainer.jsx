import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import { useAuth } from "../contexts/AuthContext";
import { useSocketContext } from "../contexts/SocketContext";
import { FileIcon, DownloadCloud, Check, CheckCheck, Play, Pause, Reply, Edit2, Trash2, Star, MoreVertical, Smile, Download } from "lucide-react";
import { motion, useAnimation } from "framer-motion";
import LottieReaction, { REACTION_LOTTIES } from "./LottieReaction";

const ChatContainer = () => {
    const {
        messages,
        getMessages,
        getGroupMessages,
        isMessagesLoading,
        selectedUser,
        selectedGroup,
        subscribeToMessages,
        unsubscribeFromMessages,
        typingUser,
        addReaction,
        setReplyMessage,
        deleteMessage,
        updateMessage,
        searchQuery,
        updateLastSeen,
        starMessage,
    } = useChatStore();
    const { authUser } = useAuth();
    const { socket } = useSocketContext();
    const messageEndRef = useRef(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [editText, setEditText] = useState("");
    const [showReactionPicker, setShowReactionPicker] = useState(null);

    useEffect(() => {
        updateLastSeen();
        const interval = setInterval(updateLastSeen, 60000); // Every minute

        if (selectedGroup) {
            getGroupMessages(selectedGroup._id);
        } else if (selectedUser) {
            getMessages(selectedUser._id);
        }

        subscribeToMessages(socket);
        return () => {
            unsubscribeFromMessages(socket);
            clearInterval(interval);
        };
    }, [selectedUser?._id, selectedGroup?._id, getMessages, getGroupMessages, subscribeToMessages, unsubscribeFromMessages, socket, updateLastSeen]);

    useEffect(() => {
        if (messageEndRef.current && messages) {
            messageEndRef.current.scrollIntoView({ behavior: "smooth" });
        }

        if (selectedUser && messages.length > 0 && socket) {
            const unreadMessages = messages
                .filter(m => m.sender === selectedUser._id && !m.isRead)
                .map(m => m._id);

            if (unreadMessages.length > 0) {
                socket.emit("messageRead", { messageIds: unreadMessages, senderId: selectedUser._id });
            }
        }

        if (selectedGroup && messages.length > 0 && socket) {
            const unreadMessages = messages
                .filter(m => m.sender !== authUser._id && (!m.isReadBy || !m.isReadBy.includes(authUser._id)))
                .map(m => m._id);

            if (unreadMessages.length > 0) {
                socket.emit("groupMessageRead", { messageIds: unreadMessages, groupId: selectedGroup._id });
            }
        }
    }, [messages, selectedUser, selectedGroup, socket, authUser._id]);

    const handleEdit = (message) => {
        setEditingMessage(message);
        setEditText(message.text);
    };

    const saveEdit = async () => {
        if (!editText.trim()) return;
        await updateMessage(editingMessage._id, editText);
        setEditingMessage(null);
    };

    const handleDownload = async (url, fileName) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const urlBlob = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = urlBlob;
            link.download = fileName || `image-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(urlBlob);
        } catch (error) {
            console.error("Download failed:", error);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName || `image-${Date.now()}`;
            link.target = "_blank";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const VoicePlayer = ({ url }) => {
        const [playing, setPlaying] = useState(false);
        const audioRef = useRef(new Audio(url));

        const toggle = () => {
            if (playing) audioRef.current.pause();
            else audioRef.current.play();
            setPlaying(!playing);
        };

        return (
            <div className="flex items-center gap-2 bg-base-200/50 p-2 rounded-lg min-w-[120px]">
                <button onClick={toggle} className="btn btn-circle btn-xs btn-primary">
                    {playing ? <Pause size={12} /> : <Play size={12} />}
                </button>
                <div className="h-1 flex-1 bg-primary/20 rounded-full overflow-hidden">
                    <div className={`h-full bg-primary ${playing ? 'w-full transition-all duration-1000' : 'w-0'}`} />
                </div>
            </div>
        );
    };

    if (isMessagesLoading) {
        return (
            <div className="flex-1 flex flex-col overflow-auto">
                <ChatHeader />
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {[...Array(6)].map((_, idx) => (
                        <div key={idx} className={`chat ${idx % 2 === 0 ? "chat-start" : "chat-end"}`}>
                            <div className="chat-image avatar"><div className="size-10 rounded-full bg-base-300 animate-pulse" /></div>
                            <div className="chat-bubble bg-transparent p-0"><div className="h-10 w-48 bg-base-300 animate-pulse rounded" /></div>
                        </div>
                    ))}
                </div>
                <MessageInput />
            </div>
        );
    }

    const wallpaper = selectedUser ? authUser?.chatWallpapers?.[selectedUser._id] : null;

    return (
        <div className="flex-1 flex flex-col overflow-auto relative" style={{ backgroundImage: wallpaper ? `url(${wallpaper})` : 'none', backgroundSize: 'cover' }}>
            <ChatHeader />

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                    const isSentByMe = message.sender?._id === authUser._id || message.sender === authUser._id;
                    const isDeleted = message.isDeleted;
                    const isHighlighted = searchQuery && message.text?.toLowerCase().includes(searchQuery.toLowerCase());

                    return (
                        <div key={message._id} className={`chat ${isSentByMe ? "chat-end" : "chat-start"}`} ref={messageEndRef}>
                            <div className="chat-image avatar">
                                <div className="size-10 rounded-full border">
                                    <img src={(isSentByMe ? authUser.profilePic : (selectedGroup ? message.sender?.profilePic : selectedUser.profilePic)) || "/avatar.png"} />
                                </div>
                            </div>

                            <div className="chat-header mb-1 opacity-50">
                                {selectedGroup && !isSentByMe && <span className="mr-1 text-xs font-bold">{message.sender?.fullName}</span>}
                            </div>

                            <motion.div
                                drag="x"
                                dragConstraints={{ left: 0, right: 100 }}
                                dragElastic={0.2}
                                onDragEnd={(e, info) => {
                                    if (info.offset.x > 80) {
                                        setReplyMessage(message);
                                    }
                                }}
                                className={`chat-bubble group relative flex flex-col gap-1 cursor-default ${isSentByMe ? "chat-bubble-primary" : "bg-neutral text-neutral-content"}`}
                            >
                                {/* Pull-to-reply Indicator */}
                                <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 opacity-0 group-drag:opacity-50 transition-opacity">
                                    <Reply size={20} className="text-primary" />
                                </div>

                                {/* Context Menu */}
                                {!isDeleted && (
                                    <div className={`absolute top-0 ${isSentByMe ? "-left-8" : "-right-8"} opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1`}>
                                        <button onClick={() => setShowReactionPicker(showReactionPicker === message._id ? null : message._id)} className="btn btn-ghost btn-circle btn-xs text-base-content"><Smile size={12} /></button>
                                        <button onClick={() => setReplyMessage(message)} className="btn btn-ghost btn-circle btn-xs text-base-content"><Reply size={12} /></button>
                                        <button onClick={() => starMessage(message._id)} className="btn btn-ghost btn-circle btn-xs text-base-content"><Star size={12} className={message.starredBy?.includes(authUser._id) ? "fill-yellow-400 text-yellow-400" : ""} /></button>
                                        {isSentByMe && (
                                            <>
                                                <button onClick={() => handleEdit(message)} className="btn btn-ghost btn-circle btn-xs text-base-content"><Edit2 size={12} /></button>
                                                <button onClick={() => deleteMessage(message._id)} className="btn btn-ghost btn-circle btn-xs text-error"><Trash2 size={12} /></button>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Reaction Picker Popover */}
                                {showReactionPicker === message._id && (
                                    <div className={`absolute bottom-full mb-2 ${isSentByMe ? "right-0" : "left-0"} bg-base-200 p-1 rounded-full shadow-xl flex gap-1 z-20 border border-base-300 animate-in fade-in zoom-in duration-200`}>
                                        {Object.keys(REACTION_LOTTIES).map((emoji) => (
                                            <button
                                                key={emoji}
                                                onClick={() => {
                                                    addReaction(socket, message._id, emoji, !!selectedGroup);
                                                    setShowReactionPicker(null);
                                                }}
                                                className="hover:scale-125 transition-transform p-1"
                                            >
                                                <LottieReaction emoji={emoji} size={24} />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Reply Preview */}
                                {message.replyTo && (
                                    <div className="mb-1 p-2 bg-black/10 rounded border-l-2 border-primary text-xs opacity-80 cursor-pointer overflow-hidden max-w-xs">
                                        <span className="font-bold block">{message.replyTo.sender?.fullName || "User"}</span>
                                        <span className="truncate block">{message.replyTo.text || "Media"}</span>
                                    </div>
                                )}

                                {message.voiceUrl ? (
                                    <VoicePlayer url={message.voiceUrl} />
                                ) : (message.fileUrl || message.image) && (
                                    <div className="mt-1">
                                        {message.fileType === "image" || (!message.fileType && message.image) ? (
                                            <div className="relative group/image">
                                                <img src={message.fileUrl || message.image} className="max-w-[250px] rounded-lg border border-black/5" />
                                                <button
                                                    onClick={() => handleDownload(message.fileUrl || message.image, message.fileName)}
                                                    className="absolute bottom-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity"
                                                    title="Download Image"
                                                >
                                                    <Download size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <a href={message.fileUrl} target="_blank" className="flex items-center gap-3 p-3 bg-black/10 rounded-lg border border-black/5">
                                                <FileIcon className="size-5 text-primary" />
                                                <span className="text-sm truncate max-w-[120px]">{message.fileName || "File"}</span>
                                                <DownloadCloud className="size-4 opacity-50" />
                                            </a>
                                        )}
                                    </div>
                                )}

                                {editingMessage?._id === message._id ? (
                                    <div className="flex flex-col gap-1">
                                        <textarea className="textarea textarea-bordered textarea-xs text-base-content" value={editText} onChange={(e) => setEditText(e.target.value)} />
                                        <div className="flex justify-end gap-1">
                                            <button onClick={() => setEditingMessage(null)} className="btn btn-xs btn-ghost">Cancel</button>
                                            <button onClick={saveEdit} className="btn btn-xs btn-primary">Save</button>
                                        </div>
                                    </div>
                                ) : message.text && (
                                    <p className={`text-sm ${isDeleted ? 'italic opacity-50' : ''}`}>
                                        {message.text}
                                        {message.isEdited && <span className="text-[10px] opacity-50 ml-1">(edited)</span>}
                                    </p>
                                )}

                                {/* Reactions and Metadata */}
                                <div className="flex items-center justify-between gap-2 mt-1">
                                    <div className="flex flex-wrap gap-1">
                                        {message.reactions?.length > 0 &&
                                            message.reactions.map((r, i) => (
                                                <div key={i} className="bg-black/10 rounded-full px-1 py-0.5 flex items-center gap-1">
                                                    <LottieReaction emoji={r.emoji} size={14} />
                                                </div>
                                            ))
                                        }
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <time className="text-[10px] opacity-60">
                                            {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </time>
                                        {isSentByMe && (
                                            message.isRead ? <CheckCheck className="size-3 text-primary-content" /> : <Check className="size-3 opacity-60" />
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    );
                })}
            </div>

            {typingUser === selectedUser?._id && !selectedGroup && (
                <div className="px-6 py-2 flex items-center gap-3 animate-typing-in">
                    <div className="flex gap-1">
                        <span className="size-1.5 bg-green-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="size-1.5 bg-green-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="size-1.5 bg-green-500 rounded-full animate-bounce" />
                    </div>
                    <span className="text-xs text-zinc-500 italic">{selectedUser.fullName} is typing...</span>
                </div>
            )}

            <MessageInput />
        </div>
    );
};

export default ChatContainer;

