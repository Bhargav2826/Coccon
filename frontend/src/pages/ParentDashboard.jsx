import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  getMyChildren,
  getChildConversations,
  analyzeChat,
  analyzeCall,
  getCallHistory,
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

const AnalysisResultCard = ({ type, data, icon: Icon, title }) => (
  <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
    <div className={`p-4 rounded-xl border flex items-start gap-4 shadow-sm ${(data.alert?.type === 'danger' || data.alert?.type === 'warning')
      ? 'bg-error/10 border-error/50 text-error-content'
      : 'bg-success/10 border-success/50 text-success-content'
      }`}>
      <div className="flex-shrink-0 mt-1">
        {(data.alert?.type === 'danger' || data.alert?.type === 'warning') ? (
          <AlertTriangleIcon className="size-6 text-error" />
        ) : (
          <CheckCircleIcon className="size-6 text-success" />
        )}
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-lg mb-1 flex items-center gap-2">
          {title} Safety: {data.alert?.type?.toUpperCase() || 'UNKNOWN'}
        </h4>
        <p className="text-sm opacity-90 leading-relaxed font-medium">
          {data.alert?.message || "No specific alert generated."}
        </p>
      </div>
    </div>

    <div className="bg-base-100 rounded-xl p-5 border border-base-content/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="size-5 text-primary" />
          <h4 className="font-bold">{title} Summary Report</h4>
        </div>
        {data.meta?.sentiment && (
          <span className={`badge badge-sm font-medium ${data.meta.sentiment === 'positive' ? 'badge-success' :
            data.meta.sentiment === 'negative' ? 'badge-error' : 'badge-ghost'
            }`}>
            Sentiment: {data.meta.sentiment}
          </span>
        )}
      </div>

      <p className={`text-sm leading-relaxed mb-4 p-4 rounded-lg border italic ${(data.alert?.type === 'danger' || data.alert?.type === 'warning')
        ? 'bg-error/5 border-error/20 text-error-content/90'
        : 'bg-base-200/50 border-base-content/5 text-base-content/80'
        }`}>
        "{data.summary}"
      </p>

      {data.specific_issues && data.specific_issues.length > 0 && (
        <div className="mb-4 p-3 bg-error/5 border border-error/20 rounded-lg">
          <h5 className="text-xs font-bold text-error mb-2 flex items-center gap-1">
            <AlertTriangleIcon className="size-3" />
            Flagged Content:
          </h5>
          <div className="flex flex-wrap gap-2">
            {data.specific_issues.map((issue, idx) => (
              <span key={issue + idx} className="badge badge-error badge-sm font-mono">
                "{issue}"
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-2 text-[10px] font-bold uppercase opacity-20 tracking-widest flex justify-end">
        AI Analysis Engine // Cocoon Protected
      </div>
    </div>
  </div>
);

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

  // AI analysis mutation
  const { mutate: analyzeChatMutation, isPending: chatAnalyzing } = useMutation({
    mutationFn: analyzeChat,
    onSuccess: (data, variables) => {
      const { childUid, targetUid } = variables;
      const key = `${childUid}-${targetUid}`;
      setAnalysisResults(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          chat: data,
          isAnalyzingChat: false
        }
      }));
      toast.success("Analysis completed!");
    },
    onMutate: (variables) => {
      const { childUid, targetUid } = variables;
      const key = `${childUid}-${targetUid}`;
      setAnalysisResults(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          isAnalyzingChat: true
        }
      }));
    },
    onError: (error, variables) => {
      const { childUid, targetUid } = variables;
      const key = `${childUid}-${targetUid}`;
      setAnalysisResults(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          isAnalyzingChat: false
        }
      }));
      toast.error(error.response?.data?.message || "Failed to analyze conversation");
    },
  });

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

  const handleAnalyzeChat = (childUid, targetUid, options = {}) => {
    const key = `${childUid}-${targetUid}-chat`;
    const pref = historyPreferences[key] || { preset: 'all', startDate: '', endDate: '' };

    const preset = options.preset !== undefined ? options.preset : pref.preset;
    let startDate = options.startDate !== undefined ? options.startDate : pref.startDate;
    let endDate = options.endDate !== undefined ? options.endDate : pref.endDate;

    if (options.preset && options.preset !== 'custom') {
      const range = getDateRangeForPreset(options.preset);
      startDate = range.startDate;
      endDate = range.endDate;
    }

    setActiveCallView(prev => ({ ...prev, [`${childUid}-${targetUid}`]: 'chat' }));
    setHistoryPreferences(prev => ({
      ...prev,
      [key]: { ...pref, preset, startDate, endDate }
    }));

    analyzeChatMutation({ childUid, targetUid, startDate, endDate });
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
    <div className="container mx-auto px-4 py-8 space-y-12 pb-24">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Parent Dashboard</h1>
          <p className="text-base-content opacity-70">
            Monitor your children's online interactions and ensure their digital safety
          </p>
        </div>
        <button
          onClick={() => setIsLinkModalOpen(true)}
          className="btn btn-primary"
          disabled={linkingChild}
        >
          <UserPlusIcon className="mr-2 size-4" />
          Link Child
        </button>
      </div>

      {/* Generation of Link Code Part */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <KeyIcon className="size-6" />
          <h2 className="text-2xl font-semibold">Link Child Account</h2>
        </div>

        <div className="card bg-base-200">
          <div className="card-body p-6">
            {!linkCode ? (
              <div className="text-center space-y-4">
                <p className="text-base-content opacity-70">
                  Generate a secure 6-digit code to link your child's account
                </p>
                <button
                  onClick={() => generateLinkCodeMutation()}
                  className="btn btn-primary"
                  disabled={generatingCode}
                >
                  {generatingCode ? <span className="loading loading-spinner loading-sm" /> : <KeyIcon className="size-4 mr-2" />}
                  Generate Link Code
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm opacity-70 mb-2">Share this code with your child</p>
                  <div className="flex items-center justify-center gap-2">
                    <code className="bg-base-300 px-4 py-2 rounded text-2xl font-mono font-bold">
                      {linkCode}
                    </code>
                    <button onClick={copyLinkCode} className="btn btn-ghost btn-sm">
                      <CopyIcon className="size-4" />
                    </button>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm opacity-70 mb-1">Code expires in</p>
                  <div className={`text-lg font-mono ${timeLeft < 60 ? 'text-error' : 'text-success'}`}>{formatTime(timeLeft)}</div>
                </div>
                <div className="text-center">
                  <button onClick={() => generateLinkCodeMutation()} className="btn btn-outline btn-sm">Regenerate Code</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Children List */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Your Children</h2>
        {loadingChildren ? (
          <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg" /></div>
        ) : children.length === 0 ? (
          <div className="card bg-base-200 p-8 text-center">
            <UsersIcon className="size-12 mx-auto mb-4 opacity-50" />
            <p className="opacity-70">No children linked yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((child) => (
              <div
                key={child._id}
                className={`card cursor-pointer transition-all ${selectedChild?._id === child._id ? "bg-primary text-primary-content" : "bg-base-200 hover:shadow-lg"}`}
                onClick={() => setSelectedChild(child)}
              >
                <div className="card-body p-4">
                  <div className="flex items-center gap-3">
                    <div className="avatar">
                      <div className="w-12 rounded-full">
                        <img src={child.profilePic} alt={child.fullName} />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold">{child.fullName}</h3>
                      <p className="text-sm opacity-70">{child.email}</p>
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
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <MessageSquareIcon className="size-6" />
              <h2 className="text-2xl font-semibold">Conversations Analysis</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {['all', 'friends', 'classroom', 'direct'].map(f => (
                <button
                  key={f}
                  onClick={() => setConversationFilter(f)}
                  className={`btn btn-xs sm:btn-sm ${conversationFilter === f ? 'btn-primary' : 'btn-outline'}`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {loadingConversations ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-base-200 animate-pulse rounded-xl" />)}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="card bg-base-200 p-8 text-center opacity-70">No conversations found.</div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredConversations.map((conversation) => {
                const convKey = `${selectedChild._id}-${conversation._id}`;
                const conversationAnalysis = analysisResults[convKey] || {};
                const isAnalyzingChat = chatAnalyzing && conversationAnalysis.isAnalyzingChat;

                return (
                  <div key={conversation._id} className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="card-body p-4 md:p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="avatar">
                            <div className="w-12 rounded-full">
                              <img src={conversation.profilePic} alt={conversation.fullName} />
                            </div>
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{conversation.fullName}</h3>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {conversation.isFriend && <span className="badge badge-primary badge-xs">Friend</span>}
                              {conversation.isRoomMember && <span className="badge badge-secondary badge-xs">Classroom</span>}
                              {conversation.hasDirectChat && <span className="badge badge-accent badge-xs">Direct</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleAnalyzeChat(selectedChild._id, conversation._id)}
                            disabled={isAnalyzingChat}
                            className={`btn btn-xs sm:btn-sm ${activeCallView[convKey] === 'chat' ? 'btn-neutral' : 'btn-outline opacity-60'}`}
                          >
                            {isAnalyzingChat ? <span className="loading loading-spinner loading-xs" /> : <ShieldIcon className="size-4 mr-1" />}
                            Chat AI
                          </button>
                          <button
                            onClick={() => {
                              setActiveCallView(prev => ({ ...prev, [convKey]: 'video' }));
                              fetchCallHistory(selectedChild._id, conversation._id, 'video', {});
                            }}
                            disabled={loadingHistories[`${convKey}-video`]}
                            className={`btn btn-xs sm:btn-sm ${activeCallView[convKey] === 'video' ? 'btn-secondary' : 'btn-outline opacity-60'}`}
                          >
                            <VideoIcon className="size-4 mr-1" /> Video Summary
                          </button>
                          <button
                            onClick={() => {
                              setActiveCallView(prev => ({ ...prev, [convKey]: 'audio' }));
                              fetchCallHistory(selectedChild._id, conversation._id, 'audio', {});
                            }}
                            disabled={loadingHistories[`${convKey}-audio`]}
                            className={`btn btn-xs sm:btn-sm ${activeCallView[convKey] === 'audio' ? 'btn-accent' : 'btn-outline opacity-60'}`}
                          >
                            <PhoneIcon className="size-4 mr-1" /> Voice Summary
                          </button>
                        </div>
                      </div>

                      <div className="relative min-h-[50px] transition-all">
                        {['video', 'audio'].some(t => loadingHistories[`${convKey}-${t}`]) && (
                          <div className="absolute inset-0 bg-base-200/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl">
                            <span className="loading loading-spinner loading-md text-primary" />
                          </div>
                        )}

                        {activeCallView[convKey] === 'chat' && (
                          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="divider text-xs opacity-50">Chat Analysis Intelligence</div>
                            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                              {['all', 'today', '7d', '30d', '90d', '180d', '365d'].map(p => (
                                <button
                                  key={p}
                                  onClick={() => handleAnalyzeChat(selectedChild._id, conversation._id, { preset: p })}
                                  className={`btn btn-xs ${historyPreferences[convKey + '-chat']?.preset === p ? 'btn-neutral' : 'btn-ghost opacity-60'}`}
                                >
                                  {p === 'all' ? 'All' : p.toUpperCase()}
                                </button>
                              ))}
                            </div>
                            {conversationAnalysis.chat ? (
                              <AnalysisResultCard type="chat" data={conversationAnalysis.chat} icon={ShieldIcon} title="Interaction Analysis" />
                            ) : (
                              <div className="text-center py-8 opacity-50 text-sm">No recent chat analysis. Click Chat AI to generate.</div>
                            )}
                          </div>
                        )}

                        {['video', 'audio'].map(type => {
                          const historyKey = `${convKey}-${type}`;
                          const calls = callHistories[historyKey];
                          if (!calls || activeCallView[convKey] !== type) return null;

                          return (
                            <div key={type} className="animate-in fade-in slide-in-from-top-2 duration-300">
                              <div className="divider text-xs opacity-50">Recent Calls Matrix</div>
                              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                                {['all', 'today', '7d', '30d'].map(p => (
                                  <button
                                    key={p}
                                    onClick={() => fetchCallHistory(selectedChild._id, conversation._id, type, { preset: p })}
                                    className={`btn btn-xs ${historyPreferences[historyKey]?.preset === p ? 'btn-neutral' : 'btn-ghost opacity-60'}`}
                                  >
                                    {p.toUpperCase()}
                                  </button>
                                ))}
                                <div className="divider divider-horizontal mx-1"></div>
                                <button
                                  onClick={() => {
                                    const currentSort = historyPreferences[historyKey]?.sort || 'desc';
                                    fetchCallHistory(selectedChild._id, conversation._id, type, { sort: currentSort === 'desc' ? 'asc' : 'desc' });
                                  }}
                                  className="btn btn-xs btn-ghost gap-1"
                                >
                                  <ArrowUpDownIcon className="size-3" /> {historyPreferences[historyKey]?.sort === 'asc' ? 'Oldest' : 'Newest'}
                                </button>
                              </div>

                              <div className="grid grid-cols-1 gap-2">
                                {calls.length === 0 ? (
                                  <div className="text-center py-8 opacity-50 text-sm italic">No recorded calls in this period.</div>
                                ) : (
                                  calls.map(call => {
                                    const callAnalysis = analysisResults[`${selectedChild._id}-${call._id}`];
                                    return (
                                      <div key={call._id} className="bg-base-300/50 p-3 rounded-xl border border-base-content/5">
                                        <div className="flex items-center justify-between">
                                          <div className="text-xs font-bold font-mono">
                                            {new Date(call.startedAt || call.createdAt).toLocaleString()}
                                          </div>
                                          <button
                                            onClick={() => setExpandedCallId(expandedCallId === call._id ? null : call._id)}
                                            className="btn btn-xs btn-ghost text-primary"
                                          >
                                            {expandedCallId === call._id ? "Hide Summary" : "View Summary"}
                                          </button>
                                        </div>
                                        {expandedCallId === call._id && (
                                          <div className={`mt-3 p-3 rounded-lg border italic text-sm ${((callAnalysis?.alert?.type || call.safetyAlert?.type) === 'danger' || (callAnalysis?.alert?.type || call.safetyAlert?.type) === 'warning')
                                            ? 'bg-error/5 border-error/20 text-error-content/90'
                                            : 'bg-base-100 border-base-content/5 text-base-content/80'
                                            }`}>
                                            "{callAnalysis?.summary || call.summary || "No safety report available."}"
                                            {(callAnalysis?.alert || call.safetyAlert) && (
                                              <div className={`mt-2 font-bold flex items-center gap-1 ${(callAnalysis?.alert?.type || call.safetyAlert?.type) === 'danger' || (callAnalysis?.alert?.type || call.safetyAlert?.type) === 'warning'
                                                  ? 'text-error'
                                                  : 'text-success'
                                                }`}>
                                                <ShieldIcon className="size-3" /> {callAnalysis?.alert?.message || call.safetyAlert?.message}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )
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
      {Object.values(loadingHistories).some(v => v === true) && (
        <div className="fixed bottom-8 right-8 z-[9999] animate-in slide-in-from-bottom-8 duration-500">
          <div className="bg-neutral text-neutral-content px-4 py-2 rounded-xl shadow-2xl flex items-center gap-3 border border-white/10 backdrop-blur-xl">
            <span className="loading loading-spinner loading-xs text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest opacity-80">Syncing Intelligence...</span>
          </div>
        </div>
      )}

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
