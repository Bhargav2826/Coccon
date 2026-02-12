import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useSocketContext } from "../contexts/SocketContext";
import { Users } from "lucide-react";

const ChatSidebar = () => {
    const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
    const { onlineUsers } = useSocketContext();
    const [showOnlineOnly, setShowOnlineOnly] = useState(false);

    useEffect(() => {
        getUsers();
    }, [getUsers]);

    const filteredUsers = showOnlineOnly
        ? users.filter((user) => onlineUsers.includes(user._id))
        : users;

    if (isUsersLoading) return (
        <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
            <div className="border-b border-base-300 w-full p-5">
                <div className="flex items-center gap-2">
                    <Users className="size-6" />
                    <span className="font-medium hidden lg:block">Contacts</span>
                </div>
            </div>
            <div className="overflow-y-auto w-full py-3">
                {[...Array(8)].map((_, idx) => (
                    <div key={idx} className="w-full p-3 flex items-center gap-3">
                        <div className="relative mx-auto lg:mx-0">
                            <div className="size-12 rounded-full bg-base-300 animate-pulse" />
                        </div>
                        <div className="hidden lg:block text-left min-w-0 flex-1">
                            <div className="h-4 w-32 bg-base-300 animate-pulse rounded mb-2" />
                            <div className="h-3 w-16 bg-base-300 animate-pulse rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </aside>
    );

    return (
        <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
            <div className="border-b border-base-300 w-full p-5">
                <div className="flex items-center gap-2">
                    <Users className="size-6" />
                    <span className="font-medium hidden lg:block">Contacts</span>
                </div>
                {/* Online filter toggle */}
                <div className="mt-3 hidden lg:flex items-center gap-2">
                    <label className="cursor-pointer flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={showOnlineOnly}
                            onChange={(e) => setShowOnlineOnly(e.target.checked)}
                            className="checkbox checkbox-sm"
                        />
                        <span className="text-sm">Show online only</span>
                    </label>
                    <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
                </div>
            </div>

            <div className="overflow-y-auto w-full py-3">
                {filteredUsers.map((user) => (
                    <button
                        key={user._id}
                        onClick={() => setSelectedUser(user)}
                        className={`
              w-full p-3 flex items-center gap-3
              hover:bg-base-300 transition-colors
              ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
            `}
                    >
                        <div className="relative mx-auto lg:mx-0">
                            <img
                                src={user.profilePic || "/avatar.png"}
                                alt={user.name}
                                className="size-12 object-cover rounded-full"
                            />
                            {onlineUsers.includes(user._id) && (
                                <span
                                    className="absolute bottom-0 right-0 size-3 bg-green-500 
                                    border-2 border-zinc-900 rounded-full"
                                />
                            )}
                            {user.unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-primary text-primary-content text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-md animate-pulse">
                                    {user.unreadCount}
                                </span>
                            )}
                        </div>

                        {/* User info - only visible on larger screens */}
                        <div className="hidden lg:flex flex-col flex-1 text-left min-w-0">
                            <div className="flex items-center justify-between gap-1">
                                <div className={`font-medium truncate ${user.unreadCount > 0 ? "text-primary" : ""}`}>{user.fullName}</div>
                                {user.unreadCount > 0 && (
                                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                                        New
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center justify-between gap-1">
                                <div className={`text-xs truncate flex-1 ${user.unreadCount > 0 ? "text-base-content font-bold" : "text-zinc-400"}`}>
                                    {user.lastMessage ? (
                                        user.lastMessage.text || (user.lastMessage.image ? "🖼️ Image" : "📁 Attachment")
                                    ) : (
                                        onlineUsers.includes(user._id) ? "Online" : "Offline"
                                    )}
                                </div>
                                {user.lastMessage && (
                                    <div className="text-[10px] text-zinc-500 whitespace-nowrap">
                                        {new Date(user.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </button>
                ))}

                {filteredUsers.length === 0 && (
                    <div className="text-center text-zinc-500 py-4">No online users</div>
                )}
            </div>
        </aside>
    );
};
export default ChatSidebar;
