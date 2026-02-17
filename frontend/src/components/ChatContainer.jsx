import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import { useAuth } from "../contexts/AuthContext";
import { useSocketContext } from "../contexts/SocketContext";
import { FileIcon, DownloadCloud, Check, CheckCheck, Play, Pause, Reply, Edit2, Trash2, Star, MoreVertical, Smile, Download, X } from "lucide-react";
import { motion, useAnimation } from "framer-motion";
import LottieReaction, { REACTION_LOTTIES } from "./LottieReaction";
import UserAvatar from "./UserAvatar";

const VoicePlayer = ({ url }) => {
    const audioRef = useRef(null);
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const toggle = () => {
        if (!audioRef.current) return;
        if (playing) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(err => {
                console.error("Audio Playback Error:", err);
            });
        }
    };

    const formatTime = (time) => {
        if (isNaN(time) || time === Infinity) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="flex items-center gap-4 bg-white/10 dark:bg-base-300/80 backdrop-blur-md p-3 rounded-2xl min-w-[240px] border border-white/5 shadow-lg group transition-all hover:bg-white/20">
            <audio
                ref={audioRef}
                src={url}
                crossOrigin="anonymous"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => {
                    setPlaying(false);
                    setCurrentTime(0);
                }}
                onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                onLoadedMetadata={(e) => {
                    if (e.target.duration !== Infinity && !isNaN(e.target.duration)) {
                        setDuration(e.target.duration);
                    }
                }}
                preload="metadata"
            />

            {/* Play Button with Gradient */}
            <button
                onClick={toggle}
                className="size-10 flex items-center justify-center rounded-full bg-gradient-to-tr from-primary to-primary-focus text-primary-content shadow-md shadow-primary/20 transform active:scale-90 transition-all hover:scale-105"
                type="button"
            >
                {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} className="translate-x-0.5" fill="currentColor" />}
            </button>

            {/* Audio Waveform/Progress */}
            <div className="flex-1 flex flex-col gap-1.5 cursor-pointer" onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const clickedProgress = x / rect.width;
                if (audioRef.current && duration) {
                    audioRef.current.currentTime = clickedProgress * duration;
                }
            }}>
                <div className="h-1 bg-white/20 rounded-full overflow-hidden relative">
                    <div
                        className="h-full bg-primary rounded-full absolute left-0 top-0 transition-all duration-75"
                        style={{ width: `${progress}%` }}
                    />
                    {/* Pulsing head indicator */}
                    <div
                        className="size-2.5 bg-white rounded-full absolute top-1/2 -translate-y-1/2 shadow-sm border border-primary transition-all duration-75"
                        style={{ left: `calc(${progress}% - 5px)` }}
                    />
                </div>

                <div className="flex justify-between items-center text-[11px] font-medium opacity-70 tracking-tight">
                    <span className="text-primary">{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Micro Wave Animation when playing */}
            {playing && (
                <div className="flex items-center gap-0.5 h-3 opacity-50">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-0.5 bg-primary rounded-full animate-bounce" style={{ height: '100%', animationDelay: `${i * 0.1}s` }} />
                    ))}
                </div>
            )}
        </div>
    );
};

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
    const [expandedImage, setExpandedImage] = useState(null);

    useEffect(() => {
        setExpandedImage(null);
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
                {selectedGroup?.type === 'classroom' && selectedGroup.admin !== authUser._id ? (
                    <div className="p-4 bg-base-200 border-t border-base-300 text-center">
                        <p className="text-primary font-medium">Only Faculty Make or Send The Messages</p>
                    </div>
                ) : (
                    <MessageInput />
                )}
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
                            <UserAvatar
                                user={isSentByMe ? authUser : (selectedGroup ? message.sender : selectedUser)}
                                size="sm" // Small for message bubbles
                                showStatus={false}
                                className="chat-image"
                            />

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

                                {message.voiceUrl || (message.fileType && message.fileType.startsWith("audio")) ? (
                                    <VoicePlayer key={`voice-${message._id}`} url={message.voiceUrl || message.fileUrl} />
                                ) : (message.fileUrl || message.image) && (
                                    <div className="mt-1">
                                        {message.fileType === "image" || (!message.fileType && message.image) ? (
                                            <div className="relative group/image">
                                                <img
                                                    src={message.fileUrl || message.image}
                                                    className="max-w-[250px] rounded-lg border border-black/5 cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => setExpandedImage(message.fileUrl || message.image)}
                                                />
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

                                {message.callLink && (
                                    <div className="mt-2 mb-1">
                                        {message.isCallEnded ? (
                                            <div className="flex items-center justify-center p-2 rounded-lg bg-black/20 text-sm font-medium opacity-80 cursor-not-allowed w-full">
                                                This call is ended
                                            </div>
                                        ) : (
                                            <a
                                                href={message.callLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-primary btn-sm w-full gap-2 no-underline text-white"
                                            >
                                                <div className="size-2 rounded-full bg-red-500 animate-pulse" />
                                                Join Video Call
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

            {selectedGroup?.type === 'classroom' && selectedGroup.admin !== authUser._id ? (
                <div className="p-4 bg-base-200 border-t border-base-300 text-center">
                    <p className="text-primary font-medium">Only Faculty Make or Send The Messages</p>
                </div>
            ) : (
                <MessageInput />
            )}

            {/* Image Modal */}
            {expandedImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
                    <button
                        onClick={() => setExpandedImage(null)}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-50 backdrop-blur-sm"
                    >
                        <X size={24} />
                    </button>
                    <img
                        src={expandedImage}
                        className="max-w-full max-h-full rounded-lg object-contain shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <div className="absolute inset-0 -z-10" onClick={() => setExpandedImage(null)} />
                </div>
            )}
        </div>
    );
};

export default ChatContainer;

