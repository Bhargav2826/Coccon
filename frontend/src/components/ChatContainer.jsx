import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import { useAuth } from "../contexts/AuthContext";
import { useSocketContext } from "../contexts/SocketContext";
import { FileIcon, DownloadCloud, Check, CheckCheck, Play, Pause, Reply, Edit2, Trash2, Star, MoreVertical, Smile, Download, X, Forward } from "lucide-react";
import { motion, useAnimation } from "framer-motion";
import LottieReaction, { REACTION_LOTTIES } from "./LottieReaction";
import UserAvatar from "./UserAvatar";
import ForwardModal from "./ForwardModal";
import MessageSkeleton from "./MessageSkeleton";
import ProgressiveImage from "./ProgressiveImage";

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
        <div className="flex items-center gap-2 sm:gap-4 bg-white/10 dark:bg-base-300/80 backdrop-blur-md p-2 sm:p-3 rounded-2xl min-w-0 flex-1 border border-white/5 shadow-lg group transition-all hover:bg-white/20">
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
        searchResults,
        updateLastSeen,
        starMessage,
        votePoll,
        forwardMessage,
        replyMessage,
    } = useChatStore();
    const { authUser } = useAuth();
    const { socket } = useSocketContext();
    const messageEndRef = useRef(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [editText, setEditText] = useState("");
    const [showReactionPicker, setShowReactionPicker] = useState(null);
    const [expandedImage, setExpandedImage] = useState(null);
    const [forwardMessageId, setForwardMessageId] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null); // ID of message with open context menu

    const highlightMentions = (text, mentions, isSentByMe) => {
        if (!text) return "";

        const validMentions = (mentions || [])
            .filter(m => m && typeof m === 'object' && m.fullName)
            .sort((a, b) => b.fullName.length - a.fullName.length);

        // Uses the primary theme color (selected color palette)
        const highlightClass = isSentByMe
            ? "bg-base-100 text-primary px-1.5 py-0.5 rounded-md font-black shadow-sm mx-0.5"
            : "bg-primary/15 text-primary px-1.5 py-0.5 rounded-md font-black mx-0.5";

        if (validMentions.length === 0) {
            // Fallback for manual mentions or unpopulated data
            const parts = text.split(/(@[^\s]+)/g);
            return parts.map((part, i) => (
                part.startsWith("@") && part.length > 1
                    ? <span key={i} className={highlightClass}>{part}</span>
                    : part
            ));
        }

        let result = [text];
        validMentions.forEach((m, idx) => {
            const trigger = `@${m.fullName}`;
            let next = [];
            result.forEach(chunk => {
                if (typeof chunk === 'string') {
                    const pieces = chunk.split(trigger);
                    pieces.forEach((piece, i) => {
                        next.push(piece);
                        if (i < pieces.length - 1) {
                            next.push(
                                <span key={`${m._id}-${idx}-${i}`} className={highlightClass}>
                                    {trigger}
                                </span>
                            );
                        }
                    });
                } else {
                    next.push(chunk);
                }
            });
            result = next;
        });
        return result;
    };

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
        const handleClickOutside = (e) => {
            if (openMenuId && !e.target.closest('.message-options-menu')) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenuId]);

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
                <MessageSkeleton />
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
                    const isSentByMe = message.sender?._id === authUser._id || message.sender === authUser._id || message.sender === "me";
                    const isDeleted = message.isDeleted || message.text === "This message was deleted";
                    const isHighlighted = searchQuery && message.text?.toLowerCase().includes(searchQuery.toLowerCase());

                    return (
                        <div key={message._id} className={`chat ${isSentByMe ? "chat-end" : "chat-start"} ${message.isOptimistic ? "opacity-70" : ""}`} ref={messageEndRef}>
                            <UserAvatar
                                user={isSentByMe ? authUser : (selectedGroup ? message.sender : selectedUser)}
                                size="sm" // Small for message bubbles
                                showStatus={false}
                                className="chat-image"
                            />

                            <div className="chat-header mb-1 opacity-50 flex items-center gap-2">
                                {selectedGroup && !isSentByMe && <span className="mr-1 text-xs font-bold">{message.sender?.fullName}</span>}
                                {message.isForwarded && (
                                    <div className="flex items-center gap-1 text-[10px] italic">
                                        <Forward size={10} />
                                        <span>Forwarded</span>
                                    </div>
                                )}
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

                                {/* Three-Dot More Button */}
                                {!isDeleted && !message.isOptimistic && (
                                    <div className={`absolute top-1 ${isSentByMe ? "left-1" : "right-1"} z-20 opacity-0 group-hover:opacity-100 transition-opacity`}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenuId(openMenuId === message._id ? null : message._id);
                                            }}
                                            className="btn btn-ghost btn-circle btn-xs text-current/50 hover:text-current hover:bg-current/10 transition-colors"
                                        >
                                            <MoreVertical size={14} />
                                        </button>
                                    </div>
                                )}

                                {/* Message Options Dialog/Dropdown */}
                                {openMenuId === message._id && (
                                    <div
                                        className={`absolute ${isSentByMe ? "left-0" : "right-0"} top-8 z-[60] w-48 bg-base-100 rounded-2xl shadow-2xl border border-base-300 p-2 animate-in fade-in zoom-in-95 duration-200 message-options-menu text-base-content`}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex flex-col gap-1">
                                            <button
                                                onClick={() => { setReplyMessage(message); setOpenMenuId(null); }}
                                                className="flex items-center gap-3 w-full p-2.5 hover:bg-base-200 rounded-xl transition-all group"
                                            >
                                                <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                                                    <Reply size={14} />
                                                </div>
                                                <span className="text-xs font-semibold">Reply</span>
                                            </button>

                                            <button
                                                onClick={() => { setForwardMessageId(message._id); setOpenMenuId(null); }}
                                                className="flex items-center gap-3 w-full p-2.5 hover:bg-base-200 rounded-xl transition-all group"
                                            >
                                                <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform">
                                                    <Forward size={14} />
                                                </div>
                                                <span className="text-xs font-semibold">Forward</span>
                                            </button>

                                            <button
                                                onClick={() => { starMessage(message._id); setOpenMenuId(null); }}
                                                className="flex items-center gap-3 w-full p-2.5 hover:bg-base-200 rounded-xl transition-all group"
                                            >
                                                <div className={`p-1.5 ${message.starredBy?.includes(authUser._id) ? "bg-yellow-100 text-yellow-500" : "bg-gray-100 text-gray-600"} rounded-lg group-hover:scale-110 transition-transform`}>
                                                    <Star size={14} className={message.starredBy?.includes(authUser._id) ? "fill-current" : ""} />
                                                </div>
                                                <span className="text-xs font-semibold">Star</span>
                                            </button>

                                            <button
                                                onClick={() => { setShowReactionPicker(message._id); setOpenMenuId(null); }}
                                                className="flex items-center gap-3 w-full p-2.5 hover:bg-base-200 rounded-xl transition-all group"
                                            >
                                                <div className="p-1.5 bg-pink-100 text-pink-600 rounded-lg group-hover:scale-110 transition-transform">
                                                    <Smile size={14} />
                                                </div>
                                                <span className="text-xs font-semibold">React</span>
                                            </button>

                                            {isSentByMe && (
                                                <>
                                                    <div className="h-px bg-base-300 my-1 mx-2" />
                                                    <button
                                                        onClick={() => { handleEdit(message); setOpenMenuId(null); }}
                                                        className="flex items-center gap-3 w-full p-2.5 hover:bg-base-200 rounded-xl transition-all group"
                                                    >
                                                        <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform">
                                                            <Edit2 size={14} />
                                                        </div>
                                                        <span className="text-xs font-semibold">Edit Message</span>
                                                    </button>

                                                    <button
                                                        onClick={() => { deleteMessage(message._id); setOpenMenuId(null); }}
                                                        className="flex items-center gap-3 w-full p-2.5 hover:bg-red-50 text-red-600 rounded-xl transition-all group"
                                                    >
                                                        <div className="p-1.5 bg-red-100 text-red-600 rounded-lg group-hover:scale-110 transition-transform">
                                                            <Trash2 size={14} />
                                                        </div>
                                                        <span className="text-xs font-semibold">Delete</span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
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

                                {isDeleted ? (
                                    <p className="text-sm italic opacity-60 flex items-center gap-1.5 py-1">
                                        🚫 This message was deleted
                                    </p>
                                ) : (
                                    <>
                                        {/* Reply Preview */}
                                        {message.replyTo && (
                                            <div className="mb-1 p-2 bg-black/10 rounded border-l-2 border-primary text-[10px] sm:text-xs opacity-80 cursor-pointer overflow-hidden max-w-full">
                                                <span className="font-bold block truncate">{message.replyTo.sender?.fullName || "User"}</span>
                                                <span className="truncate block">{message.replyTo.text || "Media"}</span>
                                            </div>
                                        )}

                                        {message.voiceUrl || (message.fileType && message.fileType.startsWith("audio")) ? (
                                            <VoicePlayer key={`voice-${message._id}`} url={message.voiceUrl || message.fileUrl} />
                                        ) : (message.fileUrl || message.image) && (
                                            <div className="mt-1">
                                                {message.fileType === "image" || (!message.fileType && message.image) ? (
                                                    <div className="relative group/image">
                                                        <ProgressiveImage
                                                            src={message.fileUrl || message.image}
                                                            className="max-w-full sm:max-w-[250px] rounded-lg border border-black/5 cursor-pointer hover:opacity-90 transition-opacity h-auto object-cover"
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
                                        ) : message.text ? (
                                            <p className="text-sm">
                                                {highlightMentions(message.text, message.mentions, isSentByMe)}
                                                {message.isEdited && <span className="text-[10px] opacity-50 ml-1">(edited)</span>}
                                            </p>
                                        ) : null}

                                        {/* Poll Widget */}
                                        {message.poll && message.poll.question && (
                                            <div className="mt-1 flex flex-col gap-2 w-full max-w-sm">
                                                <h4 className="font-bold text-sm mb-1">{message.poll.question}</h4>
                                                <div className="flex flex-col gap-2">
                                                    {message.poll.options.map((option, idx) => {
                                                        const totalVotes = message.poll.options.reduce((sum, opt) => sum + (opt.voters?.length || 0), 0);
                                                        const votes = option.voters?.length || 0;
                                                        const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                                                        const hasVoted = option.voters?.includes(authUser._id);

                                                        return (
                                                            <div
                                                                key={idx}
                                                                className={`relative rounded-lg p-2.5 cursor-pointer transition-all border ${isSentByMe
                                                                    ? (hasVoted ? 'border-white bg-white/20 shadow-sm' : 'border-white/20 hover:bg-white/10')
                                                                    : (hasVoted ? 'border-primary bg-primary/10 shadow-sm' : 'border-base-content/20 hover:bg-base-content/10')
                                                                    } flex justify-between items-center overflow-hidden`}
                                                                onClick={() => votePoll(message._id, idx, !!selectedGroup)}
                                                            >
                                                                <div
                                                                    className={`absolute left-0 top-0 bottom-0 ${isSentByMe
                                                                        ? (hasVoted ? 'bg-white/30' : 'bg-white/10')
                                                                        : (hasVoted ? 'bg-primary/20' : 'bg-base-content/5')
                                                                        }`}
                                                                    style={{ width: `${percentage}%`, transition: 'width 0.3s ease-in-out' }}
                                                                />
                                                                <span className="relative z-10 text-sm pr-2 break-words leading-tight whitespace-normal">{option.text}</span>
                                                                {votes > 0 && <span className="relative z-10 text-xs font-bold">{votes}</span>}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div className="text-[10px] opacity-60 mt-1 min-w-[150px]">
                                                    {message.poll.options.reduce((sum, opt) => sum + (opt.voters?.length || 0), 0)} votes
                                                </div>
                                            </div>
                                        )}
                                    </>
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

            {/* Forward Modal */}
            <ForwardModal
                isOpen={!!forwardMessageId}
                onClose={() => setForwardMessageId(null)}
                messageId={forwardMessageId}
            />
        </div>
    );
};

export default ChatContainer;

