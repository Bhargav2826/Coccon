import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  getMyChildren,
  getChildConversations,
  analyzeCall,
  analyzeChat,
  getCallHistory,
  getChatHistory,
  getChatSessions,
  getChildCalls,
  linkChildToParent,
  generateLinkCode
} from "../lib/api";
import { toast } from "react-hot-toast";
import {
  UsersIcon,
  MessageSquareIcon,
  BrainIcon,
  PlusIcon,
  UserPlusIcon,
  ShieldIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  KeyIcon,
  CopyIcon,
  GraduationCapIcon,
  PhoneIcon,
  VideoIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ArrowUpDownIcon,
  FilterIcon
} from "lucide-react";
import {
  DashboardCardSkeleton,
  CardSkeleton,
  AnalysisSkeleton
} from "../components/SkeletonLoaders";
import UserAvatar from "../components/UserAvatar";

const AnalysisResultCard = ({ data, icon: Icon, title, dateLabel }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const alertType = data.alert?.type || data.safetyAlert?.type;
  const alertMessage = data.alert?.message || data.safetyAlert?.message;

  return (
    <div className="bg-base-300/30 p-4 rounded-2xl border border-base-content/5 mt-4 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            {Icon && <Icon className="size-4 text-primary" />}
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider opacity-50">
              {title}
            </div>
            <div className="text-sm font-semibold truncate max-w-[200px] sm:max-w-none">
              {dateLabel || "Summary Report"}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3">
          {(data.meta?.sentiment || data.sentiment) && (
            <span className="badge badge-ghost badge-sm font-medium opacity-80">
              {data.meta?.sentiment || data.sentiment}
            </span>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn btn-xs btn-ghost text-primary hover:bg-primary/10"
          >
            {isExpanded ? "Hide Details" : "View Details"}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className={`p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 ${(alertType === 'danger' || alertType === 'warning')
          ? 'bg-error/5 border-error/10 text-error-content'
          : 'bg-success/5 border-success/10 text-base-content/90'
          }`}>
          <div className="relative">
            <span className="text-2xl opacity-20 absolute -top-2 -left-2 italic font-serif">"</span>
            <p className="italic text-sm sm:text-base leading-relaxed pl-4 pr-2">
              {data.summary || "No summary available."}
            </p>
            <span className="text-2xl opacity-20 absolute -bottom-4 -right-2 italic font-serif">"</span>
          </div>

          <div className="mt-6 pt-4 border-t border-base-content/5">
            <div className={`flex items-center gap-2 p-3 rounded-xl font-bold text-sm ${(alertType === 'danger' || alertType === 'warning')
              ? 'bg-error/10 text-error'
              : 'bg-success/5 text-success'
              }`}>
              {alertType === 'danger' || alertType === 'warning' ? (
                <ShieldIcon className="size-4 animate-pulse" />
              ) : (
                <ShieldCheckIcon className="size-4" />
              )}
              {alertMessage || "Safe content detected."}
            </div>
          </div>

          {(data.specific_issues || data.specificIssues)?.length > 0 && (
            <div className="mt-6">
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-3 px-1">Flagged Content Details</div>
              <div className="grid grid-cols-1 gap-2">
                {(data.specific_issues || data.specificIssues).map((issue, idx) => (
                  <div key={idx} className="bg-error/10 border border-error/20 text-error p-3 rounded-xl flex items-start gap-3 shadow-sm text-sm">
                    <AlertTriangleIcon className="size-4 mt-0.5 shrink-0" />
                    <span className="font-medium leading-snug">{issue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ParentDashboard = () => {
  const queryClient = useQueryClient();
  const [selectedChild, setSelectedChild] = useState(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [childEmail, setChildEmail] = useState("");
  const [linkCode, setLinkCode] = useState(null);
  const [linkCodeExpires, setLinkCodeExpires] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [conversationFilter, setConversationFilter] = useState("all"); // all, friends, classroom, direct
  const [callHistories, setCallHistories] = useState({}); // {key: [calls]}
  const [loadingHistories, setLoadingHistories] = useState({}); // {key: boolean}
  const [analysisResults, setAnalysisResults] = useState({}); // key: analysisData
  const [expandedCallId, setExpandedCallId] = useState(null);
  const [historyPreferences, setHistoryPreferences] = useState({}); // {key: {limit: 10, sort: 'desc', startDate: '', endDate: ''}}
  const [activeCallView, setActiveCallView] = useState({}); // {convKey: 'video' | 'audio'}
  const [showTranscripts, setShowTranscripts] = useState({}); // {callId: boolean}

  // Fetch parent's children
  const { data: children = [], isLoading: loadingChildren } = useQuery({
    queryKey: ["myChildren"],
    queryFn: getMyChildren,
  });

  // Fetch child's conversations when a child is selected
  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ["childConversations", selectedChild?._id],
    queryFn: () => getChildConversations(selectedChild._id),
    enabled: !!selectedChild,
  });

  // Filter conversations based on selected filter
  const filteredConversations = conversations.filter(conversation => {
    switch (conversationFilter) {
      case "friends":
        return conversation.isFriend;
      case "classroom":
        return conversation.isRoomMember;
      case "direct":
        return conversation.hasDirectChat;
      default:
        return true; // "all"
    }
  });

  // Link child mutation
  const { mutate: linkChildMutation, isPending: linkingChild } = useMutation({
    mutationFn: linkChildToParent,
    onSuccess: () => {
      toast.success("Child linked successfully!");
      setChildEmail("");
      setIsLinkModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["myChildren"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to link child");
    },
  });

  // Join code mutation
  const { mutate: generateLinkCodeMutation, isPending: generatingCode } = useMutation({
    mutationFn: generateLinkCode,
    onSuccess: (data) => {
      setLinkCode(data.linkCode);
      setLinkCodeExpires(new Date(data.expiresAt));
      toast.success("Link code generated successfully!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to generate link code");
    },
  });

  const handleLinkChild = (e) => {
    e.preventDefault();
    if (!childEmail.trim()) {
      toast.error("Please enter a valid email address");
      return;
    }
    linkChildMutation(childEmail.trim());
  };


  const { mutate: analyzeCallMutation } = useMutation({
    mutationFn: analyzeCall,
    onSuccess: (data, variables) => {
      const { childUid, targetUid, callType, callId } = variables;
      if (callId) {
        const key = `${childUid}-${callId}`;
        setAnalysisResults(prev => ({ ...prev, [key]: { ...data, isAnalyzing: false } }));
      } else {
        const key = `${childUid}-${targetUid}`;
        const typeKey = callType || 'video';
        setAnalysisResults(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            [typeKey]: data,
            [typeKey === 'video' ? 'isAnalyzingVideo' : 'isAnalyzingAudio']: false
          }
        }));
      }
      toast.success(`Analysis completed!`);
    },
    onMutate: (variables) => {
      const { childUid, targetUid, callType, callId } = variables;
      if (callId) {
        const key = `${childUid}-${callId}`;
        setAnalysisResults(prev => ({ ...prev, [key]: { ...prev[key], isAnalyzing: true } }));
      } else {
        const key = `${childUid}-${targetUid}`;
        const typeKey = callType || 'video';
        setAnalysisResults(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            [typeKey === 'video' ? 'isAnalyzingVideo' : 'isAnalyzingAudio']: true
          }
        }));
      }
    },
    onError: (error, variables) => {
      const { childUid, targetUid, callType, callId } = variables;
      if (callId) {
        const key = `${childUid}-${callId}`;
        setAnalysisResults(prev => ({ ...prev, [key]: { ...prev[key], isAnalyzing: false } }));
      } else {
        const key = `${childUid}-${targetUid}`;
        const typeKey = callType || 'video';
        setAnalysisResults(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            [typeKey === 'video' ? 'isAnalyzingVideo' : 'isAnalyzingAudio']: false
          }
        }));
      }
      toast.error(error.response?.data?.message || "Failed to analyze calls");
    },
  });

  const { mutate: analyzeChatMutation } = useMutation({
    mutationFn: analyzeChat,
    onSuccess: (data, variables) => {
      const { childUid, targetUid, callId } = variables;
      if (callId) {
        const key = `${childUid}-${callId}`;
        setAnalysisResults(prev => ({ ...prev, [key]: { ...data, isAnalyzing: false } }));
      } else {
        const key = `${childUid}-${targetUid}`;
        setAnalysisResults(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            chat: data,
            isAnalyzingChat: false
          }
        }));
      }
      toast.success(`Chat analysis completed!`);
    },
    onMutate: (variables) => {
      const { childUid, targetUid, callId } = variables;
      if (callId) {
        const key = `${childUid}-${callId}`;
        setAnalysisResults(prev => ({ ...prev, [key]: { ...prev[key], isAnalyzing: true } }));
      } else {
        const key = `${childUid}-${targetUid}`;
        setAnalysisResults(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            isAnalyzingChat: true
          }
        }));
      }
    },
    onError: (error, variables) => {
      const { childUid, targetUid, callId } = variables;
      if (callId) {
        const key = `${childUid}-${callId}`;
        setAnalysisResults(prev => ({ ...prev, [key]: { ...prev[key], isAnalyzing: false } }));
      } else {
        const key = `${childUid}-${targetUid}`;
        setAnalysisResults(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            isAnalyzingChat: false
          }
        }));
      }
      toast.error(error.response?.data?.message || "Failed to analyze chat");
    },
  });

  // Helper for date presets
  const getDateRangeForPreset = (preset) => {
    if (!preset || preset === 'all') return { startDate: '', endDate: '' };
    const now = new Date();
    const start = new Date();

    if (preset === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (preset === '7d') {
      start.setDate(now.getDate() - 7);
    } else if (preset === '30d') {
      start.setDate(now.getDate() - 30);
    } else if (preset === '90d') {
      start.setDate(now.getDate() - 90);
    } else if (preset === '180d') {
      start.setDate(now.getDate() - 180);
    } else if (preset === '365d') {
      start.setDate(now.getDate() - 365);
    }

    const toYMD = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return { startDate: toYMD(start), endDate: toYMD(now) };
  };


  const fetchCallHistory = async (childUid, targetUid, callType, options = {}) => {
    const key = `${childUid}-${targetUid}-${callType}`;
    const pref = historyPreferences[key] || { limit: 10, sort: 'desc', preset: 'all', startDate: '', endDate: '' };

    const { limit = pref.limit, sort = pref.sort, startDate: optStart = pref.startDate, endDate: optEnd = pref.endDate, preset = pref.preset } = options;

    let finalLimit = limit;
    let finalSort = sort;
    let finalPreset = preset;
    let finalStart = optStart;
    let finalEnd = optEnd;

    if (options.preset && options.preset !== 'custom') {
      const range = getDateRangeForPreset(options.preset);
      finalStart = range.startDate;
      finalEnd = range.endDate;
      finalPreset = options.preset;
    }

    setLoadingHistories(prev => ({ ...prev, [key]: true }));
    try {
      const data = await getCallHistory(childUid, targetUid, callType, finalLimit, finalSort, finalStart, finalEnd);
      setCallHistories(prev => ({ ...prev, [key]: data }));
      setHistoryPreferences(prev => ({
        ...prev,
        [key]: { limit: finalLimit, sort: finalSort, preset: finalPreset, startDate: finalStart, endDate: finalEnd }
      }));
    } catch (err) {
      toast.error("Failed to fetch call history");
    } finally {
      setLoadingHistories(prev => ({ ...prev, [key]: false }));
    }
  };

  const fetchChatHistory = async (childUid, targetUid) => {
    const key = `${childUid}-${targetUid}-chat`;

    setLoadingHistories(prev => ({ ...prev, [key]: true }));
    try {
      const data = await getChatSessions(childUid, targetUid);
      setCallHistories(prev => ({ ...prev, [key]: data }));
    } catch (err) {
      toast.error("Failed to fetch chat sessions");
    } finally {
      setLoadingHistories(prev => ({ ...prev, [key]: false }));
    }
  };

  // Countdown timer effect
  useEffect(() => {
    if (!linkCodeExpires) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const expires = new Date(linkCodeExpires).getTime();
      const difference = expires - now;

      if (difference <= 0) {
        setTimeLeft(0);
        setLinkCode(null);
        setLinkCodeExpires(null);
        clearInterval(timer);
      } else {
        setTimeLeft(Math.floor(difference / 1000));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [linkCodeExpires]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const copyLinkCode = () => {
    if (linkCode) {
      navigator.clipboard.writeText(linkCode);
      toast.success("Link code copied to clipboard!");
    }
  };

  return (
    <div className="space-y-8 sm:space-y-12 pb-24">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 overflow-hidden">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Parent Dashboard</h1>
          <p className="text-sm sm:text-base text-base-content/70 max-w-2xl">
            Monitor your children's online interactions and ensure their digital safety with AI-powered insights.
          </p>
        </div>
        <button
          onClick={() => setIsLinkModalOpen(true)}
          className="btn btn-primary shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all w-full md:w-auto"
          disabled={linkingChild}
        >
          <UserPlusIcon className="mr-2 size-4" />
          Link Child Account
        </button>
      </div>

      {/* Link Child Account Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-base-200 rounded-xl">
            <KeyIcon className="size-5 sm:size-6 text-primary" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">Account Pairing</h2>
        </div>

        <div className="card bg-gradient-to-br from-base-200 to-base-300/50 border border-base-content/5 shadow-inner">
          <div className="card-body p-6 sm:p-8">
            {!linkCode ? (
              <div className="text-center space-y-6">
                <div className="max-w-md mx-auto">
                  <p className="text-sm sm:text-base opacity-70 leading-relaxed">
                    Generate a secure link code to pair with your child's account. This code allows you to monitor their activity in real-time.
                  </p>
                </div>
                <button
                  onClick={() => generateLinkCodeMutation()}
                  className="btn btn-primary btn-md sm:btn-lg px-8 shadow-lg hover:shadow-xl transition-all"
                  disabled={generatingCode}
                >
                  {generatingCode ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    <KeyIcon className="size-5 mr-1" />
                  )}
                  Generate Secure Code
                </button>
              </div>
            ) : (
              <div className="space-y-6 animate-in zoom-in-95 duration-300">
                <div className="text-center">
                  <p className="text-xs sm:text-sm font-bold uppercase tracking-widest opacity-50 mb-4">Your Pairing Code</p>
                  <div className="inline-flex items-center justify-center p-1 bg-base-100 rounded-2xl border border-base-content/10 shadow-lg w-full sm:w-auto">
                    <code className="px-6 py-3 text-2xl sm:text-4xl font-mono font-black tracking-[0.2em] text-primary">
                      {linkCode}
                    </code>
                    <button
                      onClick={copyLinkCode}
                      className="btn btn-primary btn-square h-auto min-h-0 py-3 px-4 rounded-xl ml-1"
                      title="Copy code"
                    >
                      <CopyIcon className="size-5" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-base-100 rounded-full border border-base-content/5 shadow-sm">
                    <ClockIcon className={`size-4 ${timeLeft < 60 ? 'text-error animate-pulse' : 'text-success'}`} />
                    <span className="text-sm font-mono font-bold">Expires in:</span>
                    <span className={`text-sm font-mono font-bold ${timeLeft < 60 ? 'text-error' : 'text-success'}`}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                  <button
                    onClick={() => generateLinkCodeMutation()}
                    className="btn btn-outline btn-sm rounded-full"
                    disabled={generatingCode}
                  >
                    Regenerate Code
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Children List */}
      <div className="space-y-6">
        <h2 className="text-xl sm:text-2xl font-semibold">Your Children</h2>
        {loadingChildren ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <DashboardCardSkeleton key={i} />)}
          </div>
        ) : children.length === 0 ? (
          <div className="card bg-base-200 p-8 text-center">
            <UsersIcon className="size-12 mx-auto mb-4 opacity-50" />
            <p className="opacity-70">No children linked yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((child) => (
              <div
                key={child._id}
                className={`card cursor-pointer transition-all border-2 ${selectedChild?._id === child._id ? "bg-primary text-primary-content border-primary" : "bg-base-200 hover:shadow-lg border-transparent"}`}
                onClick={() => setSelectedChild(child)}
              >
                <div className="card-body p-3 sm:p-4">
                  <div className="flex items-center gap-3">
                    <div className="avatar">
                      <UserAvatar user={child} size="md" showStatus={false} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{child.fullName}</h3>
                      <p className="text-xs opacity-70 truncate">{child.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Conversations Analysis */}
      {selectedChild && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-base-content/10 pb-4">
            <div className="flex items-center gap-2">
              <MessageSquareIcon className="size-5 sm:size-6 text-primary" />
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">Conversations Analysis</h2>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {['all', 'friends', 'classroom', 'direct'].map(f => (
                <button
                  key={f}
                  onClick={() => setConversationFilter(f)}
                  className={`btn btn-[10px] sm:btn-xs lg:btn-sm flex-1 sm:flex-none h-8 sm:h-auto px-2 sm:px-4 ${conversationFilter === f ? 'btn-primary shadow-md' : 'btn-outline border-base-content/10'}`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {loadingConversations ? (
            <div className="grid grid-cols-1 gap-6">
              {[1, 2].map(i => (
                <div key={i} className="card bg-base-200 animate-pulse">
                  <div className="card-body p-4 sm:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-base-300" />
                        <div className="space-y-2">
                          <div className="h-5 bg-base-300 rounded w-48" />
                          <div className="h-4 bg-base-300 rounded w-32" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {[1, 2, 3].map(j => <div key={j} className="h-8 bg-base-300 rounded w-24" />)}
                      </div>
                    </div>
                    <div className="h-24 bg-base-300/30 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="card bg-base-200 p-8 text-center opacity-70 border-2 border-dashed border-base-content/10">
              No conversations found for this filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredConversations.map((conversation) => {
                const convKey = `${selectedChild._id}-${conversation._id}`;
                const conversationAnalysis = analysisResults[convKey] || {};

                return (
                  <div key={conversation._id} className="card bg-base-200 shadow-sm hover:shadow-xl transition-all duration-300 border border-base-content/5">
                    <div className="card-body p-4 sm:p-6">
                      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 mb-6">
                        <div className="flex items-center gap-4">
                          <div className="avatar">
                            <UserAvatar user={conversation} size="lg" showStatus={false} />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg sm:text-xl">{conversation.fullName}</h3>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {conversation.isFriend && <span className="badge badge-primary badge-sm font-medium">Friend</span>}
                              {conversation.isRoomMember && <span className="badge badge-secondary badge-sm font-medium">Classroom</span>}
                              {conversation.hasDirectChat && <span className="badge badge-accent badge-sm font-medium">Direct</span>}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full xl:w-auto">
                          <button
                            onClick={() => {
                              setActiveCallView(prev => ({ ...prev, [convKey]: 'chat' }));
                              fetchChatHistory(selectedChild._id, conversation._id);
                            }}
                            disabled={loadingHistories[`${convKey}-chat`]}
                            className={`btn btn-sm ${activeCallView[convKey] === 'chat' ? 'btn-primary shadow-lg translate-y-[-1px]' : 'btn-ghost bg-base-300/50 hover:bg-base-300'}`}
                          >
                            <MessageSquareIcon className="size-4 mr-1.5" /> Chat
                          </button>
                          <button
                            onClick={() => {
                              setActiveCallView(prev => ({ ...prev, [convKey]: 'video' }));
                              fetchCallHistory(selectedChild._id, conversation._id, 'video', {});
                            }}
                            disabled={loadingHistories[`${convKey}-video`]}
                            className={`btn btn-sm ${activeCallView[convKey] === 'video' ? 'btn-secondary shadow-lg translate-y-[-1px]' : 'btn-ghost bg-base-300/50 hover:bg-base-300'}`}
                          >
                            <VideoIcon className="size-4 mr-1.5" /> Video
                          </button>
                          <button
                            onClick={() => {
                              setActiveCallView(prev => ({ ...prev, [convKey]: 'audio' }));
                              fetchCallHistory(selectedChild._id, conversation._id, 'audio', {});
                            }}
                            disabled={loadingHistories[`${convKey}-audio`]}
                            className={`btn btn-sm ${activeCallView[convKey] === 'audio' ? 'btn-accent shadow-lg translate-y-[-1px]' : 'btn-ghost bg-base-300/50 hover:bg-base-300'}`}
                          >
                            <PhoneIcon className="size-4 mr-1.5" /> Voice
                          </button>
                        </div>
                      </div>

                      <div className="relative min-h-[50px] transition-all">
                        {['chat', 'video', 'audio'].some(t => loadingHistories[`${convKey}-${t}`]) && (
                          <div className="absolute inset-0 bg-base-200/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl">
                            <span className="loading loading-spinner loading-md text-primary" />
                          </div>
                        )}


                        {['chat', 'video', 'audio'].map(type => {
                          const historyKey = `${convKey}-${type}`;
                          const calls = callHistories[historyKey];
                          if (!calls || activeCallView[convKey] !== type) return null;

                          return (
                            <div key={type} className="animate-in fade-in slide-in-from-top-2 duration-300">
                              <div className="divider text-xs opacity-50">{type === 'chat' ? 'Message Feed' : 'Recent Calls Matrix'}</div>
                              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                                {['all', 'today', '7d', '30d'].map(p => (
                                  <button
                                    key={p}
                                    onClick={() => type === 'chat'
                                      ? fetchChatHistory(selectedChild._id, conversation._id, { preset: p })
                                      : fetchCallHistory(selectedChild._id, conversation._id, type, { preset: p })}
                                    className={`btn btn-xs ${historyPreferences[historyKey]?.preset === p ? 'btn-neutral' : 'btn-ghost opacity-60'}`}
                                  >
                                    {p.toUpperCase()}
                                  </button>
                                ))}
                                <div className="divider divider-horizontal mx-1"></div>
                                <button
                                  onClick={() => type === 'chat'
                                    ? analyzeChatMutation({ childUid: selectedChild._id, targetUid: conversation._id })
                                    : analyzeCallMutation({ childUid: selectedChild._id, targetUid: conversation._id, callType: type })}
                                  disabled={type === 'chat'
                                    ? conversationAnalysis.isAnalyzingChat
                                    : conversationAnalysis[type === 'video' ? 'isAnalyzingVideo' : 'isAnalyzingAudio']}
                                  className="btn btn-xs btn-neutral gap-1"
                                >
                                  {(type === 'chat' ? conversationAnalysis.isAnalyzingChat : conversationAnalysis[type === 'video' ? 'isAnalyzingVideo' : 'isAnalyzingAudio']) ? (
                                    <span className="loading loading-spinner loading-xs" />
                                  ) : (
                                    <ShieldIcon className="size-3" />
                                  )}
                                  Generate {type === 'chat' ? 'Chat' : (type.charAt(0).toUpperCase() + type.slice(1))} Report
                                </button>
                                <div className="divider divider-horizontal mx-1"></div>
                                <button
                                  onClick={() => {
                                    const currentSort = historyPreferences[historyKey]?.sort || 'desc';
                                    const nextSort = currentSort === 'desc' ? 'asc' : 'desc';
                                    if (type === 'chat') {
                                      fetchChatHistory(selectedChild._id, conversation._id, { sort: nextSort });
                                    } else {
                                      fetchCallHistory(selectedChild._id, conversation._id, type, { sort: nextSort });
                                    }
                                  }}
                                  className="btn btn-xs btn-ghost gap-1"
                                >
                                  <ArrowUpDownIcon className="size-3" /> {historyPreferences[historyKey]?.sort === 'asc' ? 'Oldest' : 'Newest'}
                                </button>
                              </div>

                              {conversationAnalysis[type] ? (
                                <div className="mb-6">
                                  <AnalysisResultCard
                                    data={conversationAnalysis[type]}
                                    icon={type === 'chat' ? MessageSquareIcon : (type === 'video' ? VideoIcon : PhoneIcon)}
                                    title={`${type.charAt(0).toUpperCase() + type.slice(1)} Recent`}
                                  />
                                </div>
                              ) : (type === 'chat' ? conversationAnalysis.isAnalyzingChat : conversationAnalysis[type === 'video' ? 'isAnalyzingVideo' : 'isAnalyzingAudio']) ? (
                                <div className="mb-6">
                                  <AnalysisSkeleton />
                                </div>
                              ) : null}

                              <div className="grid grid-cols-1 gap-2">
                                {calls.length === 0 ? (
                                  <div className="text-center py-8 opacity-50 text-sm italic">{type === 'chat' ? 'No chat activity in this period.' : 'No recorded calls in this period.'}</div>
                                ) : (
                                  calls.map(call => {
                                    const callAnalysis = analysisResults[`${selectedChild._id}-${call._id}`] || analysisResults[`${selectedChild._id}-${conversation._id}`];
                                    const hasAnalysis = !!(callAnalysis?.summary || call.summary);

                                    return (
                                      <div key={call._id} className="bg-base-300/30 p-4 rounded-2xl border border-base-content/5 hover:border-primary/20 transition-all duration-300">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                          <div className="flex items-center gap-3">
                                            <div className="p-2 bg-base-100 rounded-lg">
                                              {type === 'video' ? <VideoIcon className="size-4 text-secondary" /> :
                                                type === 'chat' ? <MessageSquareIcon className="size-4 text-primary" /> :
                                                  <PhoneIcon className="size-4 text-accent" />}
                                            </div>
                                            <div className="flex flex-col gap-1">
                                              <div className="text-sm font-bold">
                                                {new Date(call.startedAt || call.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                              </div>
                                              <div className="text-[10px] font-mono opacity-50 uppercase tracking-wider">
                                                {type === 'chat' ? 'Daily Chat Log' : new Date(call.startedAt || call.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                              </div>
                                              {call.callLabel && (
                                                <div className={`text-[10px] font-bold uppercase tracking-tight mt-1 ${call.category === 'Classroom Call' ? 'text-primary' : 'text-accent'}`}>
                                                  {call.callLabel}
                                                </div>
                                              )}
                                            </div>
                                            {(callAnalysis?.meta?.sentiment || call.sentiment) && (
                                              <span className="badge badge-ghost badge-sm opacity-70 ml-1">
                                                {callAnalysis?.meta?.sentiment || call.sentiment}
                                              </span>
                                            )}
                                          </div>

                                          <div className="flex items-center gap-2 w-full sm:w-auto">
                                            <button
                                              onClick={async () => {
                                                if (!showTranscripts[call._id] && type === 'chat') {
                                                  // Fetch chat messages for this specific day
                                                  try {
                                                    const msgs = await getChatHistory(selectedChild._id, conversation._id, 100, 'asc', call.dateId, call.dateId);
                                                    // Mutate the call object in state to include these messages as 'transcripts' for display
                                                    setCallHistories(prev => {
                                                      const key = `${selectedChild._id}-${conversation._id}-chat`;
                                                      const updatedCalls = prev[key].map(c => {
                                                        if (c._id === call._id) {
                                                          return { ...c, messages: msgs };
                                                        }
                                                        return c;
                                                      });
                                                      return { ...prev, [key]: updatedCalls };
                                                    });
                                                  } catch (e) {
                                                    toast.error("Failed to load messages");
                                                  }
                                                }
                                                setShowTranscripts(prev => ({ ...prev, [call._id]: !prev[call._id] }))
                                              }}
                                              className="btn btn-xs sm:btn-sm btn-ghost flex-1 sm:flex-none text-primary/70 hover:bg-primary/5"
                                            >
                                              {showTranscripts[call._id] ? (type === 'chat' ? "Hide Messages" : "Hide Transcript") : (type === 'chat' ? "View Messages" : "View Transcript")}
                                            </button>
                                            <button
                                              onClick={() => setExpandedCallId(expandedCallId === call._id ? null : call._id)}
                                              className={`btn btn-xs sm:btn-sm flex-1 sm:flex-none ${expandedCallId === call._id ? 'btn-neutral' : 'btn-ghost text-primary hover:bg-primary/5'}`}
                                            >
                                              {expandedCallId === call._id ? "Hide Summary" : "View Summary"}
                                            </button>
                                          </div>
                                        </div>

                                        {expandedCallId === call._id && (
                                          <div className={`mt-4 p-4 sm:p-5 rounded-2xl border-2 animate-in slide-in-from-top-2 duration-300 ${((callAnalysis?.alert?.type || call.safetyAlert?.type) === 'danger' || (callAnalysis?.alert?.type || call.safetyAlert?.type) === 'warning')
                                            ? 'bg-error/5 border-error/10 text-error-content'
                                            : 'bg-success/5 border-success/10 text-base-content/90'
                                            }`}>
                                            {callAnalysis?.isAnalyzing || (callAnalysis?.isAnalyzingChat && type === 'chat') ? (
                                              <div className="py-4 text-center">
                                                <div className="inline-flex items-center gap-3 px-4 py-2 bg-base-200 rounded-full">
                                                  <span className="loading loading-spinner loading-xs text-primary" />
                                                  <span className="text-xs font-bold uppercase tracking-widest opacity-70">AI Analyzing...</span>
                                                </div>
                                              </div>
                                            ) : (
                                              <>
                                                {!hasAnalysis ? (
                                                  <div className="text-center py-6 bg-base-200/50 rounded-2xl border border-dashed border-base-content/10">
                                                    <BrainIcon className="size-8 mx-auto mb-3 opacity-20" />
                                                    <p className="text-xs opacity-60 italic mb-4">No AI summary available for this session.</p>
                                                    <button
                                                      onClick={() => type === 'chat'
                                                        ? analyzeChatMutation({ childUid: selectedChild._id, targetUid: conversation._id, date: call.dateId, callId: call._id })
                                                        : analyzeCallMutation({
                                                          childUid: selectedChild._id,
                                                          targetUid: conversation._id,
                                                          callType: type,
                                                          callId: call._id
                                                        })}
                                                      className="btn btn-sm btn-neutral gap-2 px-6"
                                                    >
                                                      <BrainIcon className="size-4" /> Generate Analysis
                                                    </button>
                                                  </div>
                                                ) : (
                                                  <div className="space-y-4">
                                                    <div className="relative">
                                                      <span className="text-2xl opacity-20 absolute -top-1 -left-1 italic font-serif">"</span>
                                                      <p className="italic text-sm sm:text-base leading-relaxed pl-4 pr-2">
                                                        {callAnalysis?.summary || call.summary}
                                                      </p>
                                                    </div>

                                                    <div className="pt-4 border-t border-base-content/5">
                                                      <div className={`flex items-center gap-2 p-3 rounded-xl font-bold text-xs sm:text-sm ${(callAnalysis?.alert?.type || call.safetyAlert?.type) === 'danger' || (callAnalysis?.alert?.type || call.safetyAlert?.type) === 'warning'
                                                        ? 'bg-error/10 text-error'
                                                        : 'bg-success/5 text-success'
                                                        }`}>
                                                        <ShieldIcon className="size-4" />
                                                        {callAnalysis?.alert?.message || call.safetyAlert?.message || "Safety status fully verified."}
                                                      </div>
                                                    </div>

                                                    {(callAnalysis?.specific_issues || call.specificIssues)?.length > 0 && (
                                                      <div className="space-y-2 mt-4">
                                                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 px-1">Specific Red Flags</div>
                                                        {(callAnalysis?.specific_issues || call.specificIssues).map((issue, idx) => (
                                                          <div key={idx} className="bg-error/10 border border-error/10 text-error p-3 rounded-xl flex items-start gap-3 text-sm">
                                                            <AlertTriangleIcon className="size-4 mt-0.5 shrink-0" />
                                                            <span className="font-medium">{issue}</span>
                                                          </div>
                                                        ))}
                                                      </div>
                                                    )}
                                                  </div>
                                                )}
                                              </>
                                            )}
                                          </div>
                                        )}

                                        {showTranscripts[call._id] && (
                                          <div className="mt-4 p-4 rounded-2xl border border-base-content/5 bg-base-100 text-xs sm:text-sm font-mono space-y-3 max-h-72 overflow-y-auto shadow-inner animate-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center justify-between border-b border-base-content/5 pb-2 mb-2 sticky top-0 bg-base-100 z-10">
                                              <span className="text-[10px] font-bold uppercase tracking-wider opacity-50">{type === 'chat' ? 'Message Log' : 'Call Transcript'}</span>
                                              <span className="badge badge-outline badge-xs opacity-40 capitalize">{type}</span>
                                            </div>
                                            {type === 'chat' ? (
                                              !call.messages ? (
                                                <div className="flex justify-center p-4"><span className="loading loading-spinner loading-xs" /></div>
                                              ) : call.messages.length === 0 ? (
                                                <div className="text-center py-4 opacity-40 italic">No messages found.</div>
                                              ) : (
                                                call.messages.map((msg) => (
                                                  <div key={msg._id} className="flex flex-col gap-1 border-b border-base-content/5 pb-2 last:border-0">
                                                    <div className="flex items-center justify-between">
                                                      <div className="flex items-center gap-2">
                                                        <span className="font-bold text-primary opacity-80">{msg.sender?.fullName || "User"}</span>
                                                        {msg.sender?.role && <span className="badge badge-outline badge-xs opacity-50 capitalize">{msg.sender.role}</span>}
                                                      </div>
                                                      <span className="text-[9px] opacity-40">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                                                    </div>
                                                    <div>
                                                      {msg.poll && msg.poll.question && (
                                                        <div className="text-xs font-semibold italic flex items-center gap-1 mt-0.5">
                                                          📊 [Poll: {msg.poll.question}]
                                                          {msg.isDeleted && <span className="text-error font-bold ml-1"> (🚫 Deleted by {msg.sender?.fullName || 'User'})</span>}
                                                        </div>
                                                      )}
                                                      {msg.voiceUrl && (
                                                        <div className="text-xs text-accent italic font-medium flex items-center gap-1 mt-0.5">
                                                          <span className="opacity-80">🎤 [Voice Message]</span>
                                                          {msg.isDeleted && <span className="text-error font-bold ml-1"> (🚫 Deleted by {msg.sender?.fullName || 'User'})</span>}
                                                        </div>
                                                      )}
                                                      {(msg.image || (msg.fileType === 'image' && msg.fileUrl)) && (
                                                        <div className="mt-1.5">
                                                          <div className="text-xs italic opacity-70 mb-1 flex items-center gap-1">
                                                            📷 [Photo]
                                                            {msg.isDeleted && <span className="text-error font-bold ml-1"> (🚫 Deleted by {msg.sender?.fullName || 'User'})</span>}
                                                          </div>
                                                          <img src={msg.image || msg.fileUrl} alt="Attachment" className="max-w-[150px] max-h-[150px] rounded-lg object-cover border border-base-content/10 shadow-sm" />
                                                        </div>
                                                      )}
                                                      {msg.fileUrl && !(msg.image || msg.fileType === 'image') && !msg.voiceUrl && (
                                                        <div className="text-xs opacity-70 italic mt-0.5 flex items-center gap-1">
                                                          📎 [File: {msg.fileName || 'Attachment'}]
                                                          {msg.isDeleted && <span className="text-error font-bold ml-1"> (🚫 Deleted by {msg.sender?.fullName || 'User'})</span>}
                                                        </div>
                                                      )}
                                                      {msg.text && (
                                                        <p className="leading-relaxed font-sans mt-0.5 text-sm text-base-content/80">
                                                          {msg.text !== "This message was deleted" && <span>{msg.text}</span>}
                                                          {(msg.isDeleted || msg.text === "This message was deleted") && (
                                                            <span className="text-error font-bold ml-1 italic text-[11px]">
                                                              (🚫 This message was deleted by {msg.sender?.fullName || 'user'})
                                                            </span>
                                                          )}
                                                        </p>
                                                      )}
                                                    </div>
                                                  </div>
                                                ))
                                              )
                                            ) : (
                                              (!call.transcripts || call.transcripts.length === 0) ? (
                                                <div className="text-center py-4 opacity-40 italic">No transcript data recorded for this call session.</div>
                                              ) : (
                                                call.transcripts.map((t, tid) => (
                                                  <div key={tid} className="flex flex-col gap-1 border-b border-base-content/5 pb-2 last:border-0">
                                                    <div className="flex items-center justify-between">
                                                      <div className="flex items-center gap-2">
                                                        <span className="font-bold text-primary opacity-80">{t.sender?.fullName || "Participant"}</span>
                                                        {t.sender?.role && (
                                                          <span className="badge badge-outline badge-xs opacity-50 capitalize">{t.sender.role}</span>
                                                        )}
                                                      </div>
                                                      <span className="text-[9px] opacity-40">{new Date(t.timestamp).toLocaleTimeString()}</span>
                                                    </div>
                                                    <p className="text-base-content/80 leading-relaxed font-sans">{t.text}</p>
                                                  </div>
                                                ))
                                              )
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Persistence Indicator */}
      {
        Object.values(loadingHistories).some(v => v === true) && (
          <div className="fixed bottom-8 right-8 z-[9999] animate-in slide-in-from-bottom-8 duration-500">
            <div className="bg-neutral text-neutral-content px-4 py-2 rounded-xl shadow-2xl flex items-center gap-3 border border-white/10 backdrop-blur-xl">
              <span className="loading loading-spinner loading-xs text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest opacity-80">Syncing Intelligence...</span>
            </div>
          </div>
        )
      }

      {/* Link Child Modal */}
      {isLinkModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Link Child Account</h3>
            <form onSubmit={handleLinkChild} className="space-y-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Child's Email Address</span></label>
                <input
                  type="email"
                  className="input input-bordered w-full"
                  value={childEmail}
                  onChange={(e) => setChildEmail(e.target.value)}
                  placeholder="child@example.com"
                />
              </div>
              <div className="modal-action">
                <button type="button" onClick={() => setIsLinkModalOpen(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={linkingChild}>
                  {linkingChild ? <span className="loading loading-spinner loading-xs" /> : "Link Child"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;
