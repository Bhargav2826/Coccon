import React, { useEffect, useState, useRef } from "react";
import { Languages, Globe } from "lucide-react";

const LANGUAGES = [
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
    const [targetLanguage, setTargetLanguage] = useState(() => localStorage.getItem("subtitleLanguage") || "Hindi");
    const scrollRef = useRef(null);

    const handleLanguageChange = (lang) => {
        setTargetLanguage(lang);
        localStorage.setItem("subtitleLanguage", lang);
        if (socket) {
            socket.emit("subtitle:language-change", { language: lang });
        }
    };

    useEffect(() => {
        if (!socket) return;

        // Emit initial language preference
        socket.emit("subtitle:language-change", { language: targetLanguage });

        socket.on("call:subtitle", (data) => {
            // data: { userId, text, translatedText, isFinal, targetLanguage }
            // Only update if no targetLanguage specified (broadcast) OR it matches our target
            if (data.targetLanguage && data.targetLanguage !== targetLanguage) return;

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
    }, [socket, targetLanguage]);

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
                        <li className="bg-base-200/50 rounded-xl mb-3">
                            <label className="label cursor-pointer justify-between py-2 px-3 hover:bg-base-200 rounded-xl transition-colors">
                                <span className="text-xs font-bold text-base-content">Auto-Translation</span>
                                <input type="checkbox" className="toggle toggle-secondary toggle-sm" checked={useTranslation} onChange={(e) => setUseTranslation(e.target.checked)} />
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
                                💡 Tip: Select the language you are most comfortable reading!
                            </p>
                        </div>
                    </ul>
                </div>
            </div>

            {/* Subtitles Area */}
            {showSubtitles && subtitles.length > 0 && (
                <div className="w-full max-w-4xl space-y-2 flex flex-col items-center">
                    {subtitles.map((sub, idx) => (
                        <div
                            key={sub.id || idx}
                            className="transition-all duration-300 transform scale-100 opacity-100 animate-in fade-in slide-in-from-bottom-2"
                        >
                            <div className="bg-black/70 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 shadow-2xl text-center">
                                {/* Original Text */}
                                <p className={`text-white/90 text-lg font-medium tracking-wide ${useTranslation && sub.translatedText ? 'text-sm opacity-60' : 'text-xl font-bold'}`}>
                                    {sub.text}
                                </p>

                                {/* Translated Text */}
                                {useTranslation && sub.translatedText && (
                                    <p className="text-yellow-400 text-xl font-bold mt-1 leading-relaxed drop-shadow-lg">
                                        {sub.translatedText}
                                    </p>
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
