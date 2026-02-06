import React, { useState, useEffect } from "react";
import { HelpCircle, Send, CheckCircle2, User, Trophy, X, BarChart3 } from "lucide-react";
import { toast } from "react-hot-toast";

const QuizManager = ({ socket, callId, isFaculty, authUser }) => {
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [showCreator, setShowCreator] = useState(false);
    const [answers, setAnswers] = useState([]); // { userId, userName, answer }
    const [userSelectedAnswer, setUserSelectedAnswer] = useState(null);
    const [hasAnswered, setHasAnswered] = useState(false);

    // Quiz Creator State
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState(["", ""]);
    const [correctOption, setCorrectOption] = useState(0);

    useEffect(() => {
        if (!socket) return;

        socket.on("quiz:start", (data) => {
            console.log("📝 New quiz received:", data);
            setActiveQuiz(data);
            setUserSelectedAnswer(null);
            setHasAnswered(false);
            setAnswers([]);
        });

        socket.on("quiz:answer", (data) => {
            console.log("✅ New answer joined:", data);
            setAnswers((prev) => [...prev, data]);
        });

        return () => {
            socket.off("quiz:start");
            socket.off("quiz:answer");
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
            senderName: authUser.fullName
        };

        socket.emit("quiz:start", quizData);
        setActiveQuiz(quizData);
        setAnswers([]);
        setShowCreator(false);
        toast.success("Quiz pushed to all students!");
    };

    const handleSubmitAnswer = (index) => {
        if (hasAnswered) return;

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

        toast.success("Answer submitted!");
    };

    const closeQuiz = () => {
        setActiveQuiz(null);
        setAnswers([]);
    };

    // --- RENDERING ---

    // 1. QUIZ CREATOR (Faculty Only)
    if (isFaculty && showCreator) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                <div className="bg-base-100 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="bg-primary p-6 flex justify-between items-center text-primary-content">
                        <div className="flex items-center gap-3">
                            <HelpCircle size={24} />
                            <h3 className="text-xl font-bold">Create Instant Quiz</h3>
                        </div>
                        <button onClick={() => setShowCreator(false)} className="btn btn-ghost btn-sm btn-circle"><X /></button>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="form-control">
                            <label className="label text-xs font-bold uppercase opacity-50">Question</label>
                            <textarea
                                className="textarea textarea-bordered h-24 text-lg font-medium"
                                placeholder="What is the square root of 64?"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="label text-xs font-bold uppercase opacity-50">Options</label>
                            {options.map((opt, idx) => (
                                <div key={idx} className="flex gap-2 items-center">
                                    <input
                                        type="radio"
                                        name="correct-option"
                                        className="radio radio-success"
                                        checked={correctOption === idx}
                                        onChange={() => setCorrectOption(idx)}
                                    />
                                    <input
                                        type="text"
                                        className="input input-bordered flex-1"
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
                                            className="btn btn-ghost btn-sm text-error"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                onClick={() => setOptions([...options, ""])}
                                className="btn btn-ghost btn-sm text-primary"
                            >
                                + Add Option
                            </button>
                        </div>

                        <button onClick={handleSendQuiz} className="btn btn-primary w-full gap-2">
                            <Send size={18} /> Push Quiz to Students
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 2. ACTIVE QUIZ (Student View or Faculty Result View)
    if (activeQuiz) {
        return (
            <div className="fixed bottom-24 right-6 w-full max-w-sm z-[55] animate-in slide-in-from-right-4 duration-300">
                <div className="bg-base-100 rounded-2xl shadow-2xl border-2 border-primary/20 overflow-hidden">
                    <div className="bg-primary/10 p-4 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-primary">
                            <HelpCircle size={18} />
                            <span className="font-bold text-sm">Live Class Quiz</span>
                        </div>
                        <button onClick={closeQuiz} className="btn btn-ghost btn-xs btn-circle"><X size={14} /></button>
                    </div>

                    <div className="p-5">
                        <h4 className="font-bold text-lg mb-4 leading-snug">{activeQuiz.question}</h4>

                        <div className="space-y-2">
                            {activeQuiz.options.map((opt, idx) => {
                                const isSelected = userSelectedAnswer === idx;
                                const isCorrect = idx === activeQuiz.correctOption;
                                const totalAnswers = answers.length;
                                const optAnswers = answers.filter(a => a.answer === idx).length;
                                const percentage = totalAnswers > 0 ? (optAnswers / totalAnswers) * 100 : 0;

                                return (
                                    <button
                                        key={idx}
                                        disabled={hasAnswered && !isFaculty}
                                        onClick={() => handleSubmitAnswer(idx)}
                                        className={`w-full relative group p-3 rounded-xl border-2 text-left transition-all ${isFaculty
                                                ? 'border-base-content/10 bg-base-200/50 cursor-default'
                                                : isSelected
                                                    ? isCorrect ? 'border-success bg-success/10' : 'border-error bg-error/10'
                                                    : hasAnswered
                                                        ? isCorrect ? 'border-success/50 bg-success/5' : 'border-base-content/5 opacity-50'
                                                        : 'border-base-content/10 hover:border-primary hover:bg-primary/5 active:scale-[0.98]'
                                            }`}
                                    >
                                        {/* Progress bar background for results */}
                                        {(isFaculty || hasAnswered) && (
                                            <div
                                                className={`absolute inset-0 h-full rounded-lg transition-all duration-1000 ${isCorrect ? 'bg-success/10' : 'bg-base-content/5'}`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        )}

                                        <div className="relative flex justify-between items-center gap-3">
                                            <span className={`font-medium ${isSelected ? 'text-primary' : ''}`}>{opt}</span>

                                            {isFaculty || hasAnswered ? (
                                                <span className="text-xs font-bold opacity-60">{Math.round(percentage)}%</span>
                                            ) : (
                                                <div className="w-5 h-5 rounded-full border-2 border-base-content/20 flex items-center justify-center group-hover:border-primary">
                                                    <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-primary' : ''}`} />
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Status Footer */}
                        <div className="mt-4 pt-3 border-t border-base-content/5">
                            {isFaculty ? (
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider opacity-60">
                                    <div className="flex items-center gap-1"><User size={12} /> {answers.length} Responses</div>
                                    <div className="text-success flex items-center gap-1"><CheckCircle2 size={12} /> Live Stats</div>
                                </div>
                            ) : hasAnswered ? (
                                <div className="flex items-center gap-2 text-sm font-bold">
                                    {userSelectedAnswer === activeQuiz.correctOption ? (
                                        <div className="text-success flex items-center gap-1"><Trophy size={16} /> Correct! Well done.</div>
                                    ) : (
                                        <div className="text-error flex items-center gap-1">Incorrect. Try focusing more!</div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-xs font-medium opacity-50 animate-pulse">Select an answer to participate...</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 3. LAUNCH BUTTON (Faculty Only)
    if (isFaculty) {
        return (
            <button
                onClick={() => setShowCreator(true)}
                className="fixed bottom-6 right-6 bg-accent text-accent-content px-6 py-3 rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all z-50 flex items-center gap-3 font-bold border-2 border-white/20"
            >
                <div className="bg-white/20 p-1.5 rounded-lg">
                    <BarChart3 size={20} />
                </div>
                Launch Quiz
            </button>
        );
    }

    return null;
};

export default QuizManager;
