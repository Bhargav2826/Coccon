import React, { useEffect, useState, useRef } from "react";
import { Languages, Globe, Volume2, VolumeX } from "lucide-react";
import { axiosInstance } from "../lib/axios";

const LANGUAGES = [
    { label: "English", value: "English" },
    { label: "Hindi", value: "Hindi" },
    { label: "Marathi", value: "Marathi" },
    { label: "Gujarati", value: "Gujarati" },
    { label: "Tamil", value: "Tamil" },
    { label: "Telugu", value: "Telugu" },
    { label: "Kannada", value: "Kannada" },
    { label: "Bengali", value: "Bengali" },
    { label: "Malayalam", value: "Malayalam" },
    { label: "Punjabi", value: "Punjabi" },
];

const Subtitles = ({ socket, authUser }) => {
    const [subtitles, setSubtitles] = useState([]); // { text, translatedText, userId, id }
    const [showSubtitles, setShowSubtitles] = useState(true);
    const [useTranslation, setUseTranslation] = useState(true);
    const [useVoice, setUseVoice] = useState(false);
    const [targetLanguage, setTargetLanguage] = useState(() => localStorage.getItem("subtitleLanguage") || "Hindi");
    const scrollRef = useRef(null);
    const audioQueue = useRef([]);
    const isPlaying = useRef(false);

    const handleLanguageChange = (lang) => {
        setTargetLanguage(lang);
        localStorage.setItem("subtitleLanguage", lang);
        if (socket) {
            socket.emit("subtitle:language-change", { language: lang });
        }
    };

    const playVoice = async (text, lang) => {
        if (!text || !useVoice) return;

        try {
            const response = await axiosInstance.post("/elevenlabs/tts",
                { text, targetLanguage: lang },
                { responseType: 'blob' }
            );

            const audioUrl = URL.createObjectURL(response.data);
            const audio = new Audio(audioUrl);

            // Add to queue to avoid overlapping
            audioQueue.current.push(audio);
            processQueue();
        } catch (error) {
            if (error.response?.data instanceof Blob) {
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const errorData = JSON.parse(reader.result);
                        console.error("❌ ElevenLabs Backend Error Details:", errorData);
                    } catch (e) {
                        console.error("❌ Raw Error Message:", reader.result);
                    }
                };
                reader.readAsText(error.response.data);
            } else {
                console.error("Failed to play voice translation:", error);
            }
        }
    };

    const processQueue = async () => {
        if (isPlaying.current || audioQueue.current.length === 0) return;

        isPlaying.current = true;
        const audio = audioQueue.current.shift();

        audio.onended = () => {
            isPlaying.current = false;
            processQueue();
        };

        try {
            await audio.play();
        } catch (e) {
            console.error("Playback error:", e);
            isPlaying.current = false;
            processQueue();
        }
    };

    useEffect(() => {
        if (!socket) return;

        // Emit initial language preference
        socket.emit("subtitle:language-change", { language: targetLanguage });

        socket.on("call:subtitle", (data) => {
            // data: { userId, text, translatedText, isFinal, targetLanguage }
            console.log("📝 Received Subtitle Event:", {
                fromUser: data.userId,
                text: data.text?.substring(0, 20),
                isFinal: data.isFinal,
                useVoice: useVoice
            });

            // If it's our own subtitle, we don't need voice/filtering
            const isOwn = data.userId === authUser?._id;

            // Only update if no targetLanguage specified (broadcast) OR it matches our target
            if (!isOwn && data.targetLanguage && data.targetLanguage !== targetLanguage) {
                console.log("⏭️ Skipping subtitle (language mismatch)");
                return;
            }

            setSubtitles((prev) => {
                // Find if we're updating an existing non-final subtitle from same user
                const existingIdx = prev.findIndex(s => s.userId === data.userId && !s.isFinal);

                const newSubtitle = {
                    ...data,
                    id: data.id || Date.now(),
                };

                if (existingIdx > -1) {
                    const updated = [...prev];
                    updated[existingIdx] = newSubtitle;
                    return updated;
                }

                // Keep only last 3 subtitles to avoid clutter
                const next = [...prev, newSubtitle].slice(-3);
                return next;
            });

            // If final and NOT our own, play voice if enabled
            if (data.isFinal && !isOwn && useVoice) {
                // Use translatedText if server already provided it, else use raw text (backend will translate)
                const textToSpeak = data.translatedText || data.text;
                console.log("🎙️ Attempting to play voice for:", textToSpeak?.substring(0, 30));
                if (textToSpeak) {
                    playVoice(textToSpeak, targetLanguage);
                }
            } else if (data.isFinal) {
                console.log("⏭️ Skipping voice play:", { isFinal: data.isFinal, isOwn, useVoice });
            }

            // Clear non-final subtitles after a timeout if they don't finalize
            if (!data.isFinal) {
                setTimeout(() => {
                    setSubtitles(prev => prev.filter(s => s.id !== (data.id || Date.now()) || s.isFinal));
                }, 5000);
            }
        });

        return () => {
            socket.off("call:subtitle");
        };
    }, [socket, targetLanguage, useVoice, authUser?._id]);

    // Clean up old subtitles
    useEffect(() => {
        const timer = setInterval(() => {
            setSubtitles(prev => prev.filter(s => {
                // Keep final ones for 6 seconds, non-final for 3
                const age = Date.now() - (s.id || Date.now());
                return s.isFinal ? age < 6000 : age < 3000;
            }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="fixed bottom-24 left-0 right-0 z-40 flex flex-col items-center pointer-events-none px-4">

            {/* WISE POSITIONING: Centered between Camera and Share Screen buttons in LiveKit bar */}
            <div className="fixed bottom-[18px] left-1/2 -translate-x-1/2 ml-[-42px] pointer-events-auto z-[100]">
                <div className="dropdown dropdown-top dropdown-center">
                    <button
                        tabIndex={0}
                        className="btn btn-md btn-circle bg-blue-600 hover:bg-blue-700 border-2 border-white/20 shadow-xl text-white flex flex-col items-center justify-center p-0 h-14 w-14 transition-all active:scale-95 group"
                        title="Translation Settings"
                    >
                        <Languages size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[8px] font-black uppercase tracking-tighter mt-0.5 leading-none">{targetLanguage}</span>
                    </button>

                    <ul tabIndex={0} className="dropdown-content z-[110] menu p-4 shadow-2xl bg-base-100 rounded-2xl w-72 mb-4 border border-base-content/10 animate-in slide-in-from-bottom-5 duration-300">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="size-10 rounded-xl bg-blue-600/10 flex items-center justify-center">
                                <Globe className="text-blue-600" size={20} />
                            </div>
                            <div>
                                <h3 className="font-black text-sm uppercase tracking-wider text-base-content">Live Translate</h3>
                                <p className="text-[10px] opacity-60 text-base-content/70">Opponent speaks → you see {targetLanguage}</p>
                            </div>
                        </div>

                        <li className="bg-base-200/50 rounded-xl mb-1">
                            <label className="label cursor-pointer justify-between py-2 px-3 hover:bg-base-200 rounded-xl transition-colors">
                                <span className="text-xs font-bold text-base-content">Show Subtitles</span>
                                <input type="checkbox" className="toggle toggle-primary toggle-sm" checked={showSubtitles} onChange={(e) => setShowSubtitles(e.target.checked)} />
                            </label>
                        </li>
                        <li className="bg-base-200/50 rounded-xl mb-1">
                            <label className="label cursor-pointer justify-between py-2 px-3 hover:bg-base-200 rounded-xl transition-colors">
                                <span className="text-xs font-bold text-base-content">Auto-Translation</span>
                                <input type="checkbox" className="toggle toggle-secondary toggle-sm" checked={useTranslation} onChange={(e) => setUseTranslation(e.target.checked)} />
                            </label>
                        </li>
                        <li className={`${useVoice ? 'bg-blue-600/10 border-blue-600/20' : 'bg-base-200/50 border-transparent'} border rounded-xl mb-3 transition-all`}>
                            <label className="label cursor-pointer justify-between py-2 px-3 hover:bg-base-200 rounded-xl transition-colors">
                                <div className="flex items-center gap-2">
                                    {useVoice ? <Volume2 size={14} className="text-blue-600" /> : <VolumeX size={14} className="opacity-40" />}
                                    <span className={`text-xs font-bold ${useVoice ? 'text-blue-600' : 'text-base-content'}`}>Live Voice (11Labs)</span>
                                </div>
                                <input type="checkbox" className="toggle toggle-info toggle-sm" checked={useVoice} onChange={(e) => setUseVoice(e.target.checked)} />
                            </label>
                        </li>

                        <div className="divider my-1 opacity-10"></div>

                        <p className="text-[10px] uppercase font-black opacity-40 mb-2 px-1 text-base-content">Preferred Language</p>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                            {LANGUAGES.map(lang => (
                                <button
                                    key={lang.value}
                                    onClick={() => handleLanguageChange(lang.value)}
                                    className={`btn btn-sm h-10 normal-case rounded-xl transition-all font-bold ${targetLanguage === lang.value ? 'btn-primary shadow-lg shadow-primary/30 scale-[1.02]' : 'btn-ghost bg-base-200 text-base-content hover:bg-base-300'}`}
                                >
                                    <span className="truncate">{lang.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="mt-4 p-2 bg-blue-600/5 rounded-xl border border-blue-600/10">
                            <p className="text-[10px] leading-tight opacity-70 italic text-base-content/80">
                                💡 Tip: "Live Voice" converts the opponent's speech into your language in real-time!
                            </p>
                        </div>
                    </ul>
                </div>
            </div>

            {/* Subtitles Area */}
            {showSubtitles && subtitles.length > 0 && (
                <div className="w-full max-w-4xl space-y-4 flex flex-col items-center">
                    {subtitles.map((sub, idx) => (
                        <div
                            key={sub.id || idx}
                            className="transition-all duration-500 transform scale-100 opacity-100 animate-in fade-in slide-in-from-bottom-4 flex flex-col items-center gap-3 w-full"
                        >
                            {/* 📚 Smart Notes / Vocabulary Simplifier */}
                            {sub.isFinal && sub.annotations && sub.annotations.length > 0 && (
                                <div className="flex flex-wrap justify-center gap-2 mb-1 animate-in zoom-in-90 duration-500">
                                    {sub.annotations.map((note, nIdx) => (
                                        <div
                                            key={nIdx}
                                            className="group relative bg-blue-600/20 backdrop-blur-xl border border-blue-400/30 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg hover:bg-blue-600/30 transition-all cursor-help pointer-events-auto"
                                        >
                                            <span className="size-2 bg-blue-400 rounded-full animate-pulse"></span>
                                            <span className="text-[10px] font-black uppercase tracking-tight text-blue-100">{note.word}</span>

                                            {/* Definition Tooltip */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-3 bg-base-100 rounded-2xl shadow-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[120]">
                                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Simple Definition</p>
                                                <p className="text-xs font-medium text-base-content leading-relaxed">{note.definition}</p>
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-base-100"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Main Subtitle Box */}
                            <div className={`w-fit max-w-[90%] bg-gradient-to-b from-black/80 to-black/90 backdrop-blur-2xl px-8 py-4 rounded-[2rem] border-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center ring-1 ring-white/5 relative overflow-hidden group transition-all duration-700 ${sub.sentiment === 'positive' ? 'border-emerald-500/40 shadow-emerald-500/20' :
                                    sub.sentiment === 'negative' ? 'border-rose-500/40 shadow-rose-500/20' :
                                        'border-white/15'
                                }`}>
                                {/* Ambient Glow */}
                                <div className={`absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 ${sub.sentiment === 'positive' ? 'bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10' :
                                        sub.sentiment === 'negative' ? 'bg-gradient-to-r from-rose-500/10 via-transparent to-rose-500/10' :
                                            'bg-gradient-to-r from-blue-500/10 via-transparent to-purple-500/10'
                                    }`}></div>

                                {/* Original Text (Smaller, for context) */}
                                {useTranslation && sub.translatedText && (
                                    <p className="text-white/40 text-[10px] font-black tracking-widest uppercase mb-1.5 line-clamp-1 opacity-60">
                                        {sub.text}
                                    </p>
                                )}

                                {/* Main Text (Localized or English) */}
                                <p className={`relative z-10 font-bold leading-tight tracking-tight drop-shadow-md ${useTranslation && sub.translatedText
                                    ? 'text-yellow-400 text-xl sm:text-2xl'
                                    : 'text-white text-xl sm:text-2xl'}`}>
                                    {useTranslation && sub.translatedText ? sub.translatedText : sub.text}
                                </p>

                                {/* Progress Indicator for non-final */}
                                {!sub.isFinal && (
                                    <div className={`absolute bottom-0 left-0 h-0.5 animate-pulse w-full ${sub.sentiment === 'positive' ? 'bg-emerald-500/50' :
                                            sub.sentiment === 'negative' ? 'bg-rose-500/50' :
                                                'bg-blue-500/50'
                                        }`}></div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Subtitles;
