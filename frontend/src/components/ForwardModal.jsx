import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { X, Search, User, Users, Forward } from "lucide-react";
import UserAvatar from "./UserAvatar";

const ForwardModal = ({ isOpen, onClose, messageId }) => {
    const { users, groups, forwardMessage } = useChatStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("users");

    if (!isOpen) return null;

    const filteredUsers = users.filter((u) => u.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredGroups = groups.filter((g) => g.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleForward = async (targetType, targetId) => {
        await forwardMessage(messageId, targetType, targetId);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-base-100 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-base-300 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-base-300 flex items-center justify-between bg-base-200/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary">
                            <Forward size={20} />
                        </div>
                        <h2 className="text-xl font-bold">Forward To</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="btn btn-ghost btn-sm btn-circle hover:bg-base-300"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Search & Tabs */}
                <div className="p-4 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 opacity-50 transition-opacity group-focus-within:opacity-100" />
                        <input
                            type="text"
                            placeholder="Search people or groups..."
                            className="input input-sm w-full pl-10 bg-base-200 focus:outline-none focus:border-primary transition-all rounded-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex bg-base-200 rounded-xl p-1 shadow-inner">
                        <button
                            onClick={() => setActiveTab("users")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === "users" ? "bg-base-100 shadow-md text-primary" : "opacity-60 hover:opacity-100"}`}
                        >
                            <User size={14} />
                            <span>People</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("groups")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === "groups" ? "bg-base-100 shadow-md text-primary" : "opacity-60 hover:opacity-100"}`}
                        >
                            <Users size={14} />
                            <span>Groups</span>
                        </button>
                    </div>
                </div>

                {/* List Content */}
                <div className="max-h-[350px] overflow-y-auto px-2 pb-4 space-y-1">
                    {activeTab === "users" ? (
                        filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                                <button
                                    key={user._id}
                                    onClick={() => handleForward("user", user._id)}
                                    className="w-full p-3 flex items-center gap-3 hover:bg-base-200 active:bg-base-300 rounded-2xl transition-all text-left group"
                                >
                                    <UserAvatar user={user} size="md" showStatus={false} />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold truncate group-hover:text-primary transition-colors">{user.fullName}</p>
                                        <p className="text-[10px] opacity-60 uppercase tracking-wider font-bold">{user.role}</p>
                                    </div>
                                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Forward size={14} className="translate-x-0.5" />
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="py-10 text-center opacity-50">No people found</div>
                        )
                    ) : (
                        filteredGroups.length > 0 ? (
                            filteredGroups.map((group) => (
                                <button
                                    key={group._id}
                                    onClick={() => handleForward("group", group._id)}
                                    className="w-full p-3 flex items-center gap-3 hover:bg-base-200 active:bg-base-300 rounded-2xl transition-all text-left group"
                                >
                                    <UserAvatar user={{ fullName: group.name, profilePic: group.groupPic }} size="md" showStatus={false} />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold truncate group-hover:text-primary transition-colors">{group.name}</p>
                                        <p className="text-[10px] opacity-60 uppercase font-bold tracking-wider">{group.members?.length} Members</p>
                                    </div>
                                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Forward size={14} className="translate-x-0.5" />
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="py-10 text-center opacity-50">No groups found</div>
                        )
                    )}
                </div>
            </div>

            {/* Backdrop click to close */}
            <div className="absolute inset-0 -z-10" onClick={onClose} />
        </div>
    );
};

export default ForwardModal;
