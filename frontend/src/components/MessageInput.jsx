import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { Send, X, FileIcon, Paperclip, Mic, MicOff, Smile, Search, Image as ImageIcon, Camera, Headphones, User, BarChart2, FileText } from "lucide-react";
import { toast } from "react-hot-toast";
import { useSocketContext } from "../contexts/SocketContext";

const MessageInput = () => {
    const [text, setText] = useState("");
    const [filePreview, setFilePreview] = useState(null);
    const [fileType, setFileType] = useState(null);
    const [fileName, setFileName] = useState("");
    const [recording, setRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [showGiphy, setShowGiphy] = useState(false);
    const [giphySearch, setGiphySearch] = useState("");
    const [giphyResults, setGiphyResults] = useState([]);
    const [showAttachments, setShowAttachments] = useState(false);
    const [showContactPicker, setShowContactPicker] = useState(false);
    const [showPollCreator, setShowPollCreator] = useState(false);
    const [pollData, setPollData] = useState({ question: "", options: ["", ""] });

    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const { sendMessage, sendGroupMessage, setTyping, selectedUser, selectedGroup, replyMessage, setReplyMessage, users } = useChatStore();
    const { socket } = useSocketContext();

    const GIPHY_API_KEY = "dc6zaTOxFJmzC"; // Public beta key for demo

    const searchGiphy = async (query) => {
        if (!query) return;
        try {
            const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${query}&limit=10`);
            const data = await res.json();
            setGiphyResults(data.data);
        } catch (error) {
            console.error("Giphy error:", error);
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setText(value);

        if (selectedUser && value.trim()) {
            setTyping(socket, true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                setTyping(socket, false);
            }, 3000);
        } else {
            setTyping(socket, false);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            const chunks = [];
            mediaRecorderRef.current.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
                setAudioBlob(blob);
                const reader = new FileReader();
                reader.onloadend = () => setFilePreview(reader.result);
                reader.readAsDataURL(blob);
                setFileType("audio/ogg");
                setFileName("voice_message.ogg");
            };
            mediaRecorderRef.current.start();
            setRecording(true);
        } catch (error) {
            toast.error("Microphone access denied");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setRecording(false);
        }
    };

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!text.trim() && !filePreview) return;

        const messageData = {
            text: text.trim(),
            file: filePreview,
            fileName: fileName,
            fileType: fileType,
            replyTo: replyMessage?._id,
        };

        try {
            if (selectedGroup) {
                await sendGroupMessage(messageData);
            } else {
                await sendMessage(messageData);
            }

            setText("");
            setReplyMessage(null);
            removeFile();
            setShowGiphy(false);
            setShowAttachments(false);
            setShowPollCreator(false);
            setShowContactPicker(false);
        } catch (error) {
            toast.error("Failed to send message");
        }
    };

    const handleSendPoll = async () => {
        if (!pollData.question.trim() || pollData.options.some(opt => !opt.trim())) {
            return toast.error("Please fill poll question and all options");
        }

        const messageData = {
            poll: {
                question: pollData.question,
                options: pollData.options.map(text => ({ text, votes: [] }))
            },
            replyTo: replyMessage?._id,
        };

        try {
            if (selectedGroup) await sendGroupMessage(messageData);
            else await sendMessage(messageData);
            setShowPollCreator(false);
            setPollData({ question: "", options: ["", ""] });
        } catch (error) {
            toast.error("Failed to create poll");
        }
    };

    const handleSendContact = async (contact) => {
        const messageData = {
            contact: {
                fullName: contact.fullName,
                profilePic: contact.profilePic,
                _id: contact._id
            },
            text: `Contact: ${contact.fullName}`,
            replyTo: replyMessage?._id,
        };

        try {
            if (selectedGroup) await sendGroupMessage(messageData);
            else await sendMessage(messageData);
            setShowContactPicker(false);
        } catch (error) {
            toast.error("Failed to share contact");
        }
    };

    const removeFile = () => {
        setFilePreview(null);
        setFileType(null);
        setFileName("");
        setAudioBlob(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="p-4 w-full relative">
            {replyMessage && (
                <div className="mb-2 p-2 bg-base-300 rounded-lg flex items-center justify-between animate-in slide-in-from-bottom-2">
                    <div className="flex flex-col border-l-2 border-primary pl-2 overflow-hidden">
                        <span className="text-xs font-semibold text-primary">Replying to {replyMessage.sender?.fullName || "User"}</span>
                        <span className="text-xs opacity-70 truncate">{replyMessage.text || "Media"}</span>
                    </div>
                    <button onClick={() => setReplyMessage(null)}><X className="size-4" /></button>
                </div>
            )}

            {filePreview && (
                <div className="mb-3 flex items-center gap-2">
                    <div className="relative group">
                        {fileType?.startsWith("image/") ? (
                            <img src={filePreview} className="w-20 h-20 object-cover rounded-lg" />
                        ) : fileType?.startsWith("audio/") ? (
                            <div className="bg-base-300 p-2 rounded-lg flex items-center gap-2">
                                <Mic className="text-primary" size={20} />
                                <span className="text-xs">Voice Message</span>
                            </div>
                        ) : (
                            <div className="w-20 h-20 flex flex-col items-center justify-center bg-base-300 rounded-lg p-2">
                                <FileIcon size={24} />
                                <span className="text-[10px] truncate w-full text-center">{fileName}</span>
                            </div>
                        )}
                        <button onClick={removeFile} className="absolute -top-2 -right-2 bg-base-content text-base-100 rounded-full p-1"><X size={12} /></button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <div className="flex-1 flex gap-2 relative">
                    <button
                        type="button"
                        className={`btn btn-circle btn-sm ${showAttachments ? "btn-primary" : "btn-ghost"}`}
                        onClick={() => setShowAttachments(!showAttachments)}
                    >
                        <Paperclip size={20} />
                    </button>
                    <button type="button" className="btn btn-circle btn-sm btn-ghost" onClick={() => setShowGiphy(!showGiphy)}><Smile size={20} /></button>

                    {showAttachments && (
                        <div className="absolute bottom-12 left-0 bg-base-100 p-4 rounded-xl shadow-2xl border border-base-300 z-50 mb-2 animate-in fade-in slide-in-from-bottom-2 w-64">
                            <div className="grid grid-cols-3 gap-4">
                                <button className="flex flex-col items-center gap-1 group" onClick={() => { fileInputRef.current.accept = ".doc,.docx,.pdf,.txt"; fileInputRef.current.click(); setShowAttachments(false); }}>
                                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full group-hover:scale-110 transition-transform">
                                        <FileText size={24} />
                                    </div>
                                    <span className="text-xs text-center">Document</span>
                                </button>
                                <button className="flex flex-col items-center gap-1 group" onClick={() => { fileInputRef.current.accept = "image/*,video/*"; fileInputRef.current.click(); setShowAttachments(false); }}>
                                    <div className="p-3 bg-purple-100 text-purple-600 rounded-full group-hover:scale-110 transition-transform">
                                        <ImageIcon size={24} />
                                    </div>
                                    <span className="text-xs text-center">Gallery</span>
                                </button>
                                <button className="flex flex-col items-center gap-1 group" onClick={() => { cameraInputRef.current?.click(); setShowAttachments(false); }}>
                                    <div className="p-3 bg-rose-100 text-rose-600 rounded-full group-hover:scale-110 transition-transform">
                                        <Camera size={24} />
                                    </div>
                                    <span className="text-xs text-center">Camera</span>
                                </button>
                                <button className="flex flex-col items-center gap-1 group" onClick={() => { fileInputRef.current.accept = "audio/*"; fileInputRef.current.click(); setShowAttachments(false); }}>
                                    <div className="p-3 bg-orange-100 text-orange-600 rounded-full group-hover:scale-110 transition-transform">
                                        <Headphones size={24} />
                                    </div>
                                    <span className="text-xs text-center">Audio</span>
                                </button>
                                <button className="flex flex-col items-center gap-1 group" onClick={() => { setShowContactPicker(true); setShowAttachments(false); }}>
                                    <div className="p-3 bg-blue-100 text-blue-600 rounded-full group-hover:scale-110 transition-transform">
                                        <User size={24} />
                                    </div>
                                    <span className="text-xs text-center">Contact</span>
                                </button>
                                <button className="flex flex-col items-center gap-1 group" onClick={() => { setShowPollCreator(true); setShowAttachments(false); }}>
                                    <div className="p-3 bg-teal-100 text-teal-600 rounded-full group-hover:scale-110 transition-transform">
                                        <BarChart2 size={24} />
                                    </div>
                                    <span className="text-xs text-center">Poll</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Modals for Contact and Poll */}
                    {showContactPicker && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                            <div className="bg-base-100 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-base-300">
                                <div className="p-4 border-b border-base-300 flex justify-between items-center bg-base-200">
                                    <h3 className="font-bold">Share Contact</h3>
                                    <button onClick={() => setShowContactPicker(false)}><X size={20} /></button>
                                </div>
                                <div className="max-h-96 overflow-y-auto p-2">
                                    {users.filter(u => u._id !== selectedUser?._id).map(user => (
                                        <div
                                            key={user._id}
                                            className="flex items-center gap-3 p-3 hover:bg-base-200 rounded-xl cursor-pointer"
                                            onClick={() => handleSendContact(user)}
                                        >
                                            <img src={user.profilePic || "/avatar.png"} className="size-10 rounded-full border" />
                                            <span className="font-medium">{user.fullName}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {showPollCreator && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                            <div className="bg-base-100 w-full max-w-md rounded-2xl shadow-2xl border border-base-300">
                                <div className="p-4 border-b border-base-300 flex justify-between items-center bg-base-200 rounded-t-2xl">
                                    <h3 className="font-bold">Create Poll</h3>
                                    <button onClick={() => setShowPollCreator(false)}><X size={20} /></button>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold opacity-70">Question</label>
                                        <input
                                            className="input input-bordered w-full"
                                            placeholder="Ask something..."
                                            value={pollData.question}
                                            onChange={e => setPollData({ ...pollData, question: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold opacity-70">Options</label>
                                        {pollData.options.map((opt, i) => (
                                            <div key={i} className="flex gap-2">
                                                <input
                                                    className="input input-bordered input-sm flex-1"
                                                    placeholder={`Option ${i + 1}`}
                                                    value={opt}
                                                    onChange={e => {
                                                        const newOpts = [...pollData.options];
                                                        newOpts[i] = e.target.value;
                                                        setPollData({ ...pollData, options: newOpts });
                                                    }}
                                                />
                                                {pollData.options.length > 2 && (
                                                    <button onClick={() => setPollData({ ...pollData, options: pollData.options.filter((_, idx) => idx !== i) })} className="btn btn-ghost btn-xs text-error">Remove</button>
                                                )}
                                            </div>
                                        ))}
                                        {pollData.options.length < 5 && (
                                            <button
                                                className="btn btn-ghost btn-xs btn-primary"
                                                onClick={() => setPollData({ ...pollData, options: [...pollData.options, ""] })}
                                            >
                                                + Add Option
                                            </button>
                                        )}
                                    </div>
                                    <button className="btn btn-primary w-full" onClick={handleSendPoll}>Create Poll</button>
                                </div>
                            </div>
                        </div>
                    )}

                    <input
                        type="text"
                        className="w-full input input-bordered rounded-lg input-sm sm:input-md"
                        placeholder="Type a message..."
                        value={text}
                        onChange={handleInputChange}
                    />

                    {showGiphy && (
                        <div className="absolute bottom-12 left-0 w-64 bg-base-200 p-2 rounded-lg shadow-xl z-50 border border-base-300">
                            <div className="flex gap-1 mb-2">
                                <input
                                    autoFocus
                                    className="input input-sm flex-1"
                                    placeholder="Search GIFs..."
                                    value={giphySearch}
                                    onChange={(e) => {
                                        setGiphySearch(e.target.value);
                                        searchGiphy(e.target.value);
                                    }}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-1 h-48 overflow-y-auto">
                                {giphyResults.map(g => (
                                    <img
                                        key={g.id}
                                        src={g.images.fixed_height_small.url}
                                        className="cursor-pointer hover:opacity-80 rounded"
                                        onClick={() => {
                                            setFilePreview(g.images.fixed_height.url);
                                            setFileType("image/gif");
                                            setFileName("giphy.gif");
                                            setShowGiphy(false);
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <input type="file" className="hidden" ref={fileInputRef} onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                            setFileName(file.name);
                            setFileType(file.type);
                            const reader = new FileReader();
                            reader.onloadend = () => setFilePreview(reader.result);
                            reader.readAsDataURL(file);
                        }
                    }} />

                    <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                            setFileName(file.name);
                            setFileType(file.type);
                            const reader = new FileReader();
                            reader.onloadend = () => setFilePreview(reader.result);
                            reader.readAsDataURL(file);
                        }
                    }} />
                </div>

                {!text && !filePreview ? (
                    <button
                        type="button"
                        className={`btn btn-circle btn-sm ${recording ? 'btn-error animate-pulse' : 'btn-ghost'}`}
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onTouchStart={startRecording}
                        onTouchEnd={stopRecording}
                    >
                        {recording ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                ) : (
                    <button type="submit" className="btn btn-sm btn-primary btn-circle"><Send size={20} /></button>
                )}
            </form>
        </div>
    );
};

export default MessageInput;
