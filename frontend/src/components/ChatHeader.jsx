import { X, Search, Phone, Video, MoreVertical, Settings, Clock } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useSocketContext } from "../contexts/SocketContext";
import { useState } from "react";
import ChatSettings from "./ChatSettings";
import { formatLastSeen } from "../utils/dateUtils";
import { Link } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import CallHistoryModal from "./CallHistoryModal";


const ChatHeader = () => {
    const { selectedUser, selectedGroup, setSelectedUser, setSelectedGroup, searchMessages, searchQuery } = useChatStore();
    const { onlineUsers } = useSocketContext();
    const { authUser } = useAuthUser();
    const [showSearch, setShowSearch] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    if (!selectedUser && !selectedGroup) return null;

    const title = selectedUser ? selectedUser.fullName : selectedGroup.name;
    const profilePic = selectedUser ? selectedUser.profilePic : selectedGroup.groupPic;
    const isOnline = selectedUser ? onlineUsers.includes(selectedUser._id) : false;

    // Generate a consistent call ID for 1-on-1 calls
    const getCallId = () => {
        if (!authUser || !selectedUser) return null;
        const ids = [authUser._id, selectedUser._id].sort();
        return `${ids[0]}-${ids[1]}`;
    };

    const callId = getCallId();

    return (
        <div className="p-2.5 border-b border-base-300 bg-base-100/50 backdrop-blur-md sticky top-0 z-30">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="avatar">
                        <div className="size-10 rounded-full relative">
                            <img src={profilePic || "/avatar.png"} alt={title} />
                            {isOnline && (
                                <span className="absolute bottom-0 right-0 size-3 bg-green-500 border-2 border-base-100 rounded-full" />
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-medium">{title}</h3>
                            {selectedUser?.status?.emoji && <span>{selectedUser.status.emoji}</span>}
                        </div>
                        <p className="text-[10px] text-base-content/70">
                            {selectedUser ? (
                                isOnline ? (selectedUser.status?.text || "Online") :
                                    formatLastSeen(selectedUser.lastSeen)
                            ) : (
                                `${selectedGroup.members?.length} members`
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {showSearch ? (
                        <div className="flex items-center bg-base-200 rounded-full px-3 py-1 animate-in fade-in slide-in-from-right-2">
                            <Search size={14} className="opacity-50" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search messages..."
                                className="bg-transparent border-none outline-none text-xs ml-2 w-32"
                                value={searchQuery}
                                onChange={(e) => searchMessages(e.target.value)}
                            />
                            <button onClick={() => { setShowSearch(false); searchMessages(""); }}><X size={14} /></button>
                        </div>
                    ) : (
                        <button onClick={() => setShowSearch(true)} className="btn btn-ghost btn-circle btn-sm"><Search size={18} /></button>
                    )}

                    {!selectedGroup && callId && (
                        <>
                            <Link
                                to={{
                                    pathname: `/call/${callId}`,
                                    search: '?type=audio&initiating=true'
                                }}
                                state={{ initiating: true }}
                                className="btn btn-ghost btn-circle btn-sm"
                                title="Voice Call"
                            >
                                <Phone size={18} />
                            </Link>
                            <Link
                                to={{
                                    pathname: `/call/${callId}`,
                                    search: '?type=video&initiating=true'
                                }}
                                state={{ initiating: true }}
                                className="btn btn-ghost btn-circle btn-sm"
                                title="Video Call"
                            >
                                <Video size={18} />
                            </Link>
                            <button
                                onClick={() => setShowHistory(true)}
                                className="btn btn-ghost btn-circle btn-sm"
                                title="Call History"
                            >
                                <Clock size={18} />
                            </button>
                        </>
                    )}

                    {!selectedGroup && (
                        <button onClick={() => setShowSettings(true)} className="btn btn-ghost btn-circle btn-sm"><Settings size={18} /></button>
                    )}
                    <button onClick={() => selectedGroup ? setSelectedGroup(null) : setSelectedUser(null)} className="btn btn-ghost btn-circle btn-sm">
                        <X size={20} />
                    </button>
                </div>
            </div>
            {showSettings && <ChatSettings onClose={() => setShowSettings(false)} />}
            {showHistory && selectedUser && <CallHistoryModal user={selectedUser} onClose={() => setShowHistory(false)} />}
        </div>
    );
};
export default ChatHeader;
