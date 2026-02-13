import { useState, useEffect } from "react";
import { getChatCallLogs } from "../lib/api";
import { X, Phone, Video, Calendar, Clock, FileText, AlignLeft } from "lucide-react";

const CallHistoryModal = ({ user, onClose }) => {
    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedCallId, setExpandedCallId] = useState(null);

    useEffect(() => {
        const fetchCalls = async () => {
            try {
                const res = await getChatCallLogs(user._id);
                setCalls(res);
            } catch (error) {
                console.error("Failed to fetch call logs", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchCalls();
        }
    }, [user]);

    const toggleExpand = (callId) => {
        setExpandedCallId(expandedCallId === callId ? null : callId);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit', hour12: true
        });
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit', hour12: true
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-base-100 w-full max-w-2xl rounded-2xl shadow-2xl max-h-[80vh] flex flex-col">
                <div className="p-4 border-b border-base-300 flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Clock size={24} className="text-primary" />
                        Call History with {user.fullName}
                    </h3>
                    <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm">
                        <X size={20} />
                    </button>
                </div>

                <div className="overflow-y-auto p-4 flex-1">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <span className="loading loading-spinner loading-lg text-primary"></span>
                        </div>
                    ) : calls.length === 0 ? (
                        <div className="text-center p-8 text-base-content/60">
                            <Phone size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No call history found.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {calls.map((call) => (
                                <div key={call._id} className="bg-base-200 rounded-xl overflow-hidden border border-base-300">
                                    <div
                                        className="p-4 cursor-pointer hover:bg-base-300/50 transition-colors flex items-center justify-between"
                                        onClick={() => toggleExpand(call._id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`size-10 rounded-full flex items-center justify-center ${call.type === 'video' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                                {call.type === 'video' ? <Video size={20} /> : <Phone size={20} />}
                                            </div>
                                            <div>
                                                <div className="font-semibold flex items-center gap-2">
                                                    {call.type === 'video' ? 'Video Call' : 'Voice Call'}
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${call.status === 'ended' ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-700'}`}>
                                                        {call.status}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-base-content/60 flex items-center gap-2 mt-0.5">
                                                    <Calendar size={12} />
                                                    {formatDate(call.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-xs font-medium opacity-60">
                                            Click to details
                                        </div>
                                    </div>

                                    {expandedCallId === call._id && (
                                        <div className="p-4 border-t border-base-300 bg-base-100/50">
                                            {/* Summary Section */}
                                            {call.summary && (
                                                <div className="mb-4">
                                                    <h4 className="text-sm font-bold flex items-center gap-2 mb-2 text-primary">
                                                        <FileText size={16} /> Summary
                                                    </h4>
                                                    <div className="bg-base-100 p-3 rounded-lg text-sm leading-relaxed border border-base-200">
                                                        {call.summary}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Transcript Section */}
                                            {call.transcripts && call.transcripts.length > 0 ? (
                                                <div>
                                                    <h4 className="text-sm font-bold flex items-center gap-2 mb-2 text-primary">
                                                        <AlignLeft size={16} /> Transcript
                                                    </h4>
                                                    <div className="bg-base-100 p-3 rounded-lg text-sm max-h-60 overflow-y-auto border border-base-200 space-y-2">
                                                        {call.transcripts.map((t, idx) => {
                                                            const isMe = t.sender === user?._id ? false : true;
                                                            return (
                                                                <div key={idx} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                                                                    <div className={`p-2 rounded-lg max-w-[80%] ${isMe ? 'bg-primary/10 text-primary-content rounded-br-none' : 'bg-base-200 rounded-bl-none'}`}>
                                                                        <p className="text-xs opacity-50 mb-1">{formatTime(t.timestamp)}</p>
                                                                        <p>{t.text}</p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-base-content/50 italic">No transcript available for this call.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CallHistoryModal;
