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

    if (!showSubtitles || subtitles.length === 0) {
        return (
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40">
                <button
                    onClick={() => setShowSubtitles(true)}
                    className="btn btn-circle btn-sm bg-black/40 border-white/10 text-white/50 hover:text-white"
                >
                    <Languages size={16} />
                </button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-24 left-0 right-0 z-40 flex flex-col items-center pointer-events-none px-4">
            {/* Settings Toggle */}
            <div className="mb-4 pointer-events-auto">
                <div className="dropdown dropdown-top dropdown-center">
                    <button tabIndex={0} className="btn btn-xs rounded-full bg-black/60 border-white/10 text-white/70 gap-2 hover:bg-black/80">
                        <Languages size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                            {useTranslation ? `${targetLanguage} Mode` : "Subtitles Only"}
                        </span>
                    </button>
                    <ul tabIndex={0} className="dropdown-content z-[20] menu p-2 shadow-2xl bg-base-100 rounded-xl w-56 mb-2 border border-base-content/10">
                        <li className="menu-title text-[10px] uppercase font-black opacity-50">Subtitle Settings</li>
                        <li>
                            <label className="label cursor-pointer justify-between py-1">
                                <span className="text-xs font-bold">Display</span>
                                <input type="checkbox" className="toggle toggle-primary toggle-xs" checked={showSubtitles} onChange={(e) => setShowSubtitles(e.target.checked)} />
                            </label>
                        </li>
                        <li>
                            <label className="label cursor-pointer justify-between py-1">
                                <span className="text-xs font-bold">Translate</span>
                                <input type="checkbox" className="toggle toggle-secondary toggle-xs" checked={useTranslation} onChange={(e) => setUseTranslation(e.target.checked)} />
                            </label>
                        </li>
                        <div className="divider my-1 opacity-10"></div>
                        <li className="menu-title text-[10px] uppercase font-black opacity-50">Target Language</li>
                        <div className="grid grid-cols-2 gap-1 p-1">
                            {LANGUAGES.map(lang => (
                                <button
                                    key={lang.value}
                                    onClick={() => handleLanguageChange(lang.value)}
                                    className={`btn btn-xs normal-case font-medium ${targetLanguage === lang.value ? 'btn-primary' : 'btn-ghost'}`}
                                >
                                    {lang.label}
                                </button>
                            ))}
                        </div>
                    </ul>
                </div>
            </div>

            {/* Subtitles Container */}
            <div className="w-full max-w-4xl space-y-2 flex flex-col items-center">
                {subtitles.map((sub, idx) => (
                    <div
                        key={sub.id || idx}
                        className={`transition-all duration-300 transform scale-100 opacity-100 animate-in fade-in slide-in-from-bottom-2`}
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
        </div>
    );
};

export default Subtitles;
