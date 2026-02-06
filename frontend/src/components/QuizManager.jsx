import React, { useState, useEffect, useRef } from "react";
import { HelpCircle, Send, CheckCircle2, User, Trophy, X, BarChart3, Timer, Users, AlertCircle, ChevronRight, Award, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";

const QuizManager = ({ socket, callId, isFaculty, authUser }) => {
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [showCreator, setShowCreator] = useState(false);
    const [answers, setAnswers] = useState([]); // { userId, userName, answer, isCorrect }
    const [userSelectedAnswer, setUserSelectedAnswer] = useState(null);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);
    const timerRef = useRef(null);

    // Quiz Creator State
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState(["", ""]);
    const [correctOption, setCorrectOption] = useState(0);
    const [duration, setDuration] = useState(30);

    useEffect(() => {
        if (!socket) return;

        socket.on("quiz:start", (data) => {
            console.log("📝 New quiz received:", data);
            setActiveQuiz(data);
            setTimeLeft(data.duration);
            setUserSelectedAnswer(null);
            setHasAnswered(false);
            setAnswers([]);

            // Start local timer
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        });

        socket.on("quiz:answer", (data) => {
            console.log("✅ New answer joined:", data);
            setAnswers((prev) => {
                // Prevent duplicate answers from same user
                if (prev.find(a => a.userId === data.userId)) return prev;
                return [...prev, data];
            });
        });

        return () => {
            socket.off("quiz:start");
            socket.off("quiz:answer");
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [socket]);

    const handleSendQuiz = () => {
        if (!question.trim() || options.some(opt => !opt.trim())) {
            toast.error("Please fill in question and all options");
            return;
        }

        const quizData = {
            callId,
            id: Date.now(),
            question,
            options,
            correctOption,
            duration,
            senderName: authUser.fullName,
            senderId: authUser._id
        };

        socket.emit("quiz:start", quizData);
        setActiveQuiz(quizData);
        setTimeLeft(duration);
        setAnswers([]);
        setShowCreator(false);

        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        toast.success("Quiz is now LIVE!");
    };

    const handleSubmitAnswer = (index) => {
        if (hasAnswered || timeLeft === 0) return;

        setUserSelectedAnswer(index);
        setHasAnswered(true);

        socket.emit("quiz:answer", {
            callId,
            quizId: activeQuiz.id,
            answer: index,
            userId: authUser._id,
            userName: authUser.fullName,
            isCorrect: index === activeQuiz.correctOption
        });

        toast.success("Answer sent!");
    };

    const closeQuiz = () => {
        setActiveQuiz(null);
        setAnswers([]);
        if (timerRef.current) clearInterval(timerRef.current);
    };

    // --- RENDERING ---

    // 1. ADVANCED QUIZ CREATOR
    if (isFaculty && showCreator) {
        return (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                <div className="bg-base-100 w-full max-w-xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/10">
                    <div className="bg-gradient-to-br from-primary to-primary-focus p-8 text-primary-content">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-2xl">
                                    <HelpCircle size={32} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black tracking-tight">Launch Live Quiz</h3>
                                    <p className="text-white/70 text-sm">Challenge your students in real-time</p>
                                </div>
                            </div>
                            <button onClick={() => setShowCreator(false)} className="btn btn-ghost btn-sm btn-circle hover:bg-white/20"><X /></button>
                        </div>
                    </div>

                    <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                        <div className="form-control">
                            <label className="label uppercase tracking-widest text-[10px] font-black opacity-60 text-base-content/60">Question Content</label>
                            <textarea
                                className="textarea textarea-bordered h-28 text-lg font-bold bg-base-200 focus:primary leading-tight text-base-content"
                                placeholder="Type your question here..."
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="label uppercase tracking-widest text-[10px] font-black opacity-40">Options (Select Correct One)</label>
                                <span className="text-[10px] font-bold text-success opacity-80 flex items-center gap-1"><CheckCircle2 size={12} /> Correct Choice</span>
                            </div>
                            {options.map((opt, idx) => (
                                <div key={idx} className="flex gap-3 items-center group">
                                    <input
                                        type="radio"
                                        name="correct-option"
                                        className="radio radio-success radio-md"
                                        checked={correctOption === idx}
                                        onChange={() => setCorrectOption(idx)}
                                    />
                                    <input
                                        type="text"
                                        className={`input input-bordered flex-1 font-semibold text-base-content ${correctOption === idx ? 'border-success ring-1 ring-success' : ''}`}
                                        placeholder={`Option ${idx + 1}`}
                                        value={opt}
                                        onChange={(e) => {
                                            const newOpts = [...options];
                                            newOpts[idx] = e.target.value;
                                            setOptions(newOpts);
                                        }}
                                    />
                                    {options.length > 2 && (
                                        <button
                                            onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                                            className="btn btn-ghost btn-sm btn-circle text-error opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setOptions([...options, ""])}
                                    className="btn btn-outline btn-primary btn-sm flex-1 font-bold border-2"
                                >
                                    + Add More Options
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-base-200 p-4 rounded-2xl">
                            <div className="flex-1">
                                <p className="text-xs font-black uppercase opacity-40 tracking-widest mb-2 flex items-center gap-2">
                                    <Timer size={14} /> Time Limit: {duration}s
                                </p>
                                <input
                                    type="range" min="10" max="120" step="10"
                                    value={duration} onChange={(e) => setDuration(parseInt(e.target.value))}
                                    className="range range-primary range-xs"
                                />
                            </div>
                        </div>

                        <button onClick={handleSendQuiz} className="btn btn-primary btn-lg w-full rounded-2xl shadow-xl shadow-primary/20 gap-3 font-black uppercase">
                            <Send size={24} /> Blast to All Students
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 2. POWERFUL ACTIVE QUIZ VIEW
    if (activeQuiz) {
        const isOwner = activeQuiz.senderId === authUser._id;
        const totalAnswers = answers.length;
        const correctAnswers = answers.filter(a => a.isCorrect).length;
        const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

        return (
            <div className="fixed bottom-24 right-6 w-full max-w-md z-[55] animate-in slide-in-from-right-8 duration-500">
                <div className="bg-base-100 rounded-[2.5rem] shadow-2xl border-2 border-primary/20 overflow-hidden flex flex-col">
                    {/* Status Header */}
                    <div className={`p-5 flex justify-between items-center ${timeLeft > 10 ? 'bg-primary/10' : 'bg-error/10 animate-pulse'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`size-10 rounded-full flex items-center justify-center ${timeLeft > 10 ? 'bg-primary text-white shadow-lg' : 'bg-error text-white shadow-lg'}`}>
                                {timeLeft > 0 ? <p className="font-black text-xs">{timeLeft}</p> : <Trophy size={18} />}
                            </div>
                            <div>
                                <p className={`text-[10px] font-black uppercase tracking-widest ${timeLeft > 10 ? 'text-primary' : 'text-error'}`}>
                                    {timeLeft > 0 ? "Live Question" : "Quiz Finished"}
                                </p>
                                <h4 className="font-bold text-sm text-base-content">Classroom IQ Check</h4>
                            </div>
                        </div>
                        <button onClick={closeQuiz} className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-base-content"><X size={18} /></button>
                    </div>

                    <div className="p-6 space-y-6 overflow-y-auto no-scrollbar max-h-[60vh]">
                        <div className="relative">
                            <span className="text-5xl opacity-10 absolute -top-4 -left-2 font-serif text-base-content">"</span>
                            <h3 className="text-xl font-black leading-tight relative z-10 text-base-content">{activeQuiz.question}</h3>
                        </div>

                        <div className="space-y-3">
                            {activeQuiz.options.map((opt, idx) => {
                                const isSelected = userSelectedAnswer === idx;
                                const isCorrectChoice = idx === activeQuiz.correctOption;
                                const optCount = answers.filter(a => a.answer === idx).length;
                                const optPerc = totalAnswers > 0 ? (optCount / totalAnswers) * 100 : 0;

                                // Behavior based on role and time
                                const showStats = isFaculty || hasAnswered || timeLeft === 0;
                                const showCorrectness = (hasAnswered || timeLeft === 0);

                                return (
                                    <button
                                        key={idx}
                                        disabled={(hasAnswered || timeLeft === 0) && !isFaculty}
                                        onClick={() => handleSubmitAnswer(idx)}
                                        className={`w-full relative group p-4 rounded-2xl border-2 transition-all duration-300 text-left ${isSelected && showCorrectness
                                            ? isCorrectChoice ? 'border-success bg-success/10' : 'border-error bg-error/10'
                                            : showCorrectness && isCorrectChoice
                                                ? 'border-success/40 bg-success/5'
                                                : 'border-base-content/5 bg-base-200/50'
                                            } ${!hasAnswered && timeLeft > 0 ? 'hover:scale-[1.02] hover:border-primary active:scale-95' : ''}`}
                                    >
                                        {/* Progress Bar Background */}
                                        {showStats && (
                                            <div
                                                className={`absolute inset-0 h-full rounded-2xl opacity-10 transition-all duration-1000 ${isCorrectChoice ? 'bg-success' : 'bg-primary'}`}
                                                style={{ width: `${optPerc}%` }}
                                            />
                                        )}

                                        <div className="relative flex justify-between items-center gap-3 z-10">
                                            <div className="flex items-center gap-3">
                                                <span className={`size-6 rounded-lg flex items-center justify-center font-black text-[10px] ${isSelected ? 'bg-primary text-white' : 'bg-base-300 text-base-content'}`}>
                                                    {String.fromCharCode(65 + idx)}
                                                </span>
                                                <span className={`font-bold text-base-content ${isSelected ? 'text-primary' : ''}`}>{opt}</span>
                                            </div>
                                            {showStats && <span className="text-xs font-black text-base-content/80">{Math.round(optPerc)}%</span>}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Results for Faculty */}
                        {isFaculty && (
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div className="bg-primary/10 p-5 rounded-3xl border border-primary/20 shadow-sm">
                                    <div className="flex items-center gap-2 text-primary mb-2">
                                        <Users size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-wider">Responses</span>
                                    </div>
                                    <p className="text-3xl font-black text-primary">{totalAnswers}</p>
                                </div>
                                <div className="bg-success/10 p-5 rounded-3xl border border-success/20 shadow-sm">
                                    <div className="flex items-center gap-2 text-success mb-2">
                                        <Award size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-wider">Accuracy</span>
                                    </div>
                                    <p className="text-3xl font-black text-success">{accuracy}%</p>
                                </div>
                            </div>
                        )}

                        {/* Student Feedback */}
                        {!isFaculty && hasAnswered && (
                            <div className={`p-4 rounded-2xl flex items-center gap-3 ${userSelectedAnswer === activeQuiz.correctOption ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                                {userSelectedAnswer === activeQuiz.correctOption ? (
                                    <Award className="size-8" />
                                ) : (
                                    <AlertCircle className="size-8" />
                                )}
                                <div>
                                    <p className="font-black text-sm uppercase leading-none">
                                        {userSelectedAnswer === activeQuiz.correctOption ? "Brilliant!" : "Not Quite!"}
                                    </p>
                                    <p className="text-xs font-bold opacity-80">
                                        {userSelectedAnswer === activeQuiz.correctOption ? "You've got the logic right." : "The teacher will explain this shortly."}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Timeline */}
                    {timeLeft > 0 && (
                        <div className="h-1.5 w-full bg-base-300">
                            <div
                                className={`h-full transition-all duration-1000 ${timeLeft > 10 ? 'bg-primary' : 'bg-error animate-pulse'}`}
                                style={{ width: `${(timeLeft / activeQuiz.duration) * 100}%` }}
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // 3. MODERN LAUNCH TRIGGER
    if (isFaculty) {
        return (
            <button
                onClick={() => setShowCreator(true)}
                className="fixed bottom-6 right-6 group"
            >
                <div className="absolute -inset-2 bg-gradient-to-r from-accent to-primary rounded-[2.5rem] blur opacity-40 group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />
                <div className="relative bg-accent text-accent-content px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 font-black uppercase tracking-widest text-xs border border-white/20 transition-all hover:scale-105 active:scale-95">
                    <BarChart3 className="size-6 animate-bounce" />
                    Launch Intelligence Quiz
                </div>
            </button>
        );
    }

    return null;
};

export default QuizManager;
