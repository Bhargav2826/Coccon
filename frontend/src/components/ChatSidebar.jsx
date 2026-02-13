import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useSocketContext } from "../contexts/SocketContext";
import { Users, User, Plus, Pin, BellOff, MessageSquare, Search, X } from "lucide-react";
import { toast } from "react-hot-toast";

const ChatSidebar = () => {
    const { getUsers, users, groups, getGroups, selectedUser, setSelectedUser, selectedGroup, setSelectedGroup, isUsersLoading, createGroup } = useChatStore();
    const { onlineUsers } = useSocketContext();
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("chats"); // chats, groups
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [selectedMembers, setSelectedMembers] = useState([]);

    useEffect(() => {
        getUsers();
        getGroups();
    }, [getUsers, getGroups]);

    const filteredUsers = users.filter((u) => u.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredGroups = groups.filter((g) => g.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleCreateGroup = async () => {
        if (!newGroupName || selectedMembers.length === 0) return toast.error("Please provide name and members");
        await createGroup({ name: newGroupName, members: selectedMembers });
        setShowCreateGroup(false);
        setNewGroupName("");
        setSelectedMembers([]);
    };

    const toggleMember = (id) => {
        setSelectedMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
    };

    const totalUnreadChats = users.reduce((acc, u) => acc + (u.unreadCount || 0), 0);
    const totalUnreadGroups = groups.reduce((acc, g) => acc + (g.unreadCount || 0), 0);

    return (
        <aside className="h-full w-20 lg:w-80 border-r border-base-300 flex flex-col transition-all duration-200 bg-base-100">
            <div className="p-4 border-b border-base-300">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold hidden lg:block text-primary">Messages</h2>
                    <button onClick={() => setShowCreateGroup(true)} className="btn btn-ghost btn-circle btn-sm"><Plus size={20} /></button>
                </div>

                <div className="relative hidden lg:block mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 opacity-50" />
                    <input
                        type="text"
                        placeholder="Search chats..."
                        className="input input-sm w-full pl-10 bg-base-200 focus:outline-none focus:border-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex bg-base-200 rounded-lg p-1">
                    <button
                        onClick={() => setActiveTab("chats")}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === "chats" ? "bg-base-100 shadow-md text-primary" : "opacity-60 hover:opacity-100"}`}
                    >
                        <User size={14} />
                        <span className="hidden lg:inline">Chats</span>
                        {totalUnreadChats > 0 && (
                            <span className="badge badge-primary badge-sm px-1.5 min-w-[1.25rem] h-5 rounded-full">{totalUnreadChats}</span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("groups")}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === "groups" ? "bg-base-100 shadow-md text-primary" : "opacity-60 hover:opacity-100"}`}
                    >
                        <Users size={14} />
                        <span className="hidden lg:inline">Groups</span>
                        {totalUnreadGroups > 0 && (
                            <span className="badge badge-primary badge-sm px-1.5 min-w-[1.25rem] h-5 rounded-full">{totalUnreadGroups}</span>
                        )}
                    </button>
                </div>
            </div>

            <div className="overflow-y-auto flex-1 py-2">
                {activeTab === "chats" ? (
                    filteredUsers.map((user) => (
                        <button
                            key={user._id}
                            onClick={() => setSelectedUser(user)}
                            className={`w-full p-3 flex items-center gap-3 hover:bg-base-200 transition-all border-l-4 ${selectedUser?._id === user._id ? "bg-base-200 border-primary" : "border-transparent"}`}
                        >
                            <div className="relative">
                                <img src={user.profilePic || "/avatar.png"} className="size-12 rounded-full object-cover border-2 border-base-300" />
                                {onlineUsers.includes(user._id) && <span className="absolute bottom-0 right-0 size-3 bg-green-500 border-2 border-base-100 rounded-full" />}
                            </div>
                            <div className="hidden lg:flex flex-col flex-1 text-left min-w-0">
                                <div className="flex justify-between items-center gap-2">
                                    <span className={`font-semibold truncate ${user.unreadCount > 0 ? "text-base-content" : "text-base-content/80"}`}>{user.fullName}</span>
                                    {user.unreadCount > 0 && (
                                        <span className="flex items-center justify-center min-w-[20px] h-[20px] px-1 bg-primary text-primary-content text-[10px] font-bold rounded-full shadow-sm">
                                            {user.unreadCount}
                                        </span>
                                    )}
                                </div>
                                <div className={`text-xs truncate ${user.unreadCount > 0 ? "font-semibold text-primary" : "text-base-content/60"}`}>
                                    {user.lastMessage?.text || (user.lastMessage?.image ? "🖼️ Image" : "No messages yet")}
                                </div>
                            </div>
                        </button>
                    ))
                ) : (
                    filteredGroups.map((group) => (
                        <button
                            key={group._id}
                            onClick={() => setSelectedGroup(group)}
                            className={`w-full p-3 flex items-center gap-3 hover:bg-base-200 transition-all border-l-4 ${selectedGroup?._id === group._id ? "bg-base-200 border-primary" : "border-transparent"}`}
                        >
                            <div className="relative">
                                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-base-300">
                                    {group.groupPic ? <img src={group.groupPic} className="size-12 rounded-full" /> : <Users className="text-primary size-6" />}
                                </div>
                            </div>
                            <div className="hidden lg:flex flex-col flex-1 text-left min-w-0">
                                <div className="flex justify-between items-center gap-2">
                                    <span className={`font-semibold truncate ${group.unreadCount > 0 ? "text-base-content" : "text-base-content/80"}`}>{group.name}</span>
                                    {group.unreadCount > 0 && (
                                        <span className="flex items-center justify-center min-w-[20px] h-[20px] px-1 bg-primary text-primary-content text-[10px] font-bold rounded-full shadow-sm">
                                            {group.unreadCount}
                                        </span>
                                    )}
                                </div>
                                <div className={`text-xs truncate ${group.unreadCount > 0 ? "font-semibold text-primary" : "text-base-content/60"}`}>
                                    {group.lastMessage?.text || "No messages yet"}
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>

            {/* Create Group Modal */}
            {showCreateGroup && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-base-100 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">New Group</h3>
                            <button onClick={() => setShowCreateGroup(false)}><X className="size-6" /></button>
                        </div>
                        <input
                            placeholder="Group Name"
                            className="input input-bordered w-full mb-4"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                        />
                        <div className="mb-4">
                            <p className="text-sm font-semibold mb-2">Members</p>
                            <div className="max-h-48 overflow-y-auto border border-base-300 rounded-lg p-2">
                                {users.map(u => (
                                    <label key={u._id} className="flex items-center gap-3 p-2 hover:bg-base-200 rounded cursor-pointer">
                                        <input type="checkbox" checked={selectedMembers.includes(u._id)} onChange={() => toggleMember(u._id)} className="checkbox checkbox-sm" />
                                        <img src={u.profilePic || "/avatar.png"} className="size-8 rounded-full" />
                                        <span className="text-sm">{u.fullName}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <button onClick={handleCreateGroup} className="btn btn-primary w-full">Create Group</button>
                    </div>
                </div>
            )}
        </aside>
    );
};
export default ChatSidebar;
