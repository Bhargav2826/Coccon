import { useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuth } from "../contexts/AuthContext";
import { X, User, Image, Ban, Pin, BellOff, Bell, Smile, ShieldAlert } from "lucide-react";
import { toast } from "react-hot-toast";

const ChatSettings = ({ onClose }) => {
    const { authUser, refreshAuth } = useAuth();
    const { selectedUser } = useChatStore();
    const [statusText, setStatusText] = useState(authUser?.status?.text || "");
    const [statusEmoji, setStatusEmoji] = useState(authUser?.status?.emoji || "");
    const [wallpaperUrl, setWallpaperUrl] = useState(authUser?.chatWallpapers?.[selectedUser?._id] || "");
    const [isUpdating, setIsUpdating] = useState(false);

    const handleStatusUpdate = async () => {
        setIsUpdating(true);
        try {
            const { updateStatus: updateStatApi } = await import("../lib/api");
            await updateStatApi({ text: statusText, emoji: statusEmoji });
            await refreshAuth();
            toast.success("Status updated!");
        } catch (error) {
            toast.error("Failed to update status");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleWallpaperUpdate = async () => {
        if (!selectedUser) return;
        setIsUpdating(true);
        try {
            const { updateWallpaper: updateWallApi } = await import("../lib/api");
            await updateWallApi(selectedUser._id, wallpaperUrl);
            await refreshAuth();
            toast.success("Wallpaper saved");
        } catch (error) {
            toast.error("Failed to set wallpaper");
        } finally {
            setIsUpdating(false);
        }
    };

    const handlePreference = async (type) => {
        if (!selectedUser) return;
        try {
            const { pinChat, muteChat, blockUser } = await import("../lib/api");
            if (type === 'pin') await pinChat(selectedUser._id);
            if (type === 'mute') await muteChat(selectedUser._id);
            if (type === 'block') await blockUser(selectedUser._id);

            await refreshAuth();
            toast.success("Setting updated");
        } catch (error) {
            toast.error("Update failed");
        }
    };

    return (
        <div className="fixed inset-0 bg-base-300/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-300">
            <div className="bg-base-100 w-full max-w-md rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden border border-base-300 animate-in zoom-in-95 duration-300">
                {/* Modal Header */}
                <div className="p-8 pb-4 flex justify-between items-start">
                    <div>
                        <h4 className="text-[10px] font-black tracking-[0.3em] uppercase opacity-40 mb-1">Settings</h4>
                        <h2 className="text-2xl font-bold">Chat with <span className="text-primary">{selectedUser?.fullName?.split(' ')[0] || "User"}</span></h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="btn btn-circle btn-sm btn-ghost bg-base-200 hover:rotate-90 transition-all duration-300"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-8 pt-0 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
                    {/* User Profile Status */}
                    <section className="space-y-3">
                        <p className="text-xs font-bold opacity-50 uppercase flex items-center gap-2">
                            <Smile size={14} className="text-primary" /> Your Status
                        </p>
                        <div className="flex gap-2 p-1.5 bg-base-200 rounded-2xl border border-base-300">
                            <input
                                className="input input-sm border-none bg-transparent flex-1 focus:outline-none"
                                placeholder="Status message..."
                                value={statusText}
                                onChange={(e) => setStatusText(e.target.value)}
                            />
                            <input
                                className="w-10 text-center bg-base-100 rounded-xl text-lg focus:outline-none border border-base-300"
                                placeholder="😊"
                                value={statusEmoji}
                                onChange={(e) => setStatusEmoji(e.target.value)}
                            />
                            <button onClick={handleStatusUpdate} className="btn btn-sm btn-primary rounded-xl px-4">Save</button>
                        </div>
                    </section>

                    {/* Wallpaper Section */}
                    <section className="space-y-3">
                        <p className="text-xs font-bold opacity-50 uppercase flex items-center gap-2">
                            <Image size={14} className="text-secondary" /> Chat Wallpaper (URL)
                        </p>
                        <div className="flex gap-2 p-1.5 bg-base-200 rounded-2xl border border-base-300">
                            <input
                                className="input input-sm border-none bg-transparent flex-1 focus:outline-none"
                                placeholder="https://image-url.com"
                                value={wallpaperUrl}
                                onChange={(e) => setWallpaperUrl(e.target.value)}
                            />
                            <button onClick={handleWallpaperUpdate} className="btn btn-sm btn-secondary rounded-xl px-4">Set</button>
                        </div>
                    </section>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 gap-2.5 pt-4 border-t border-base-300">
                        <button
                            onClick={() => handlePreference('pin')}
                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${authUser?.pinnedChats?.includes(selectedUser?._id) ? 'bg-primary/10 border-primary text-primary' : 'bg-base-200 border-base-300 hover:border-primary'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-xl ${authUser?.pinnedChats?.includes(selectedUser?._id) ? 'bg-primary text-white' : 'bg-base-100'}`}>
                                    <Pin size={18} fill={authUser?.pinnedChats?.includes(selectedUser?._id) ? "white" : "none"} />
                                </div>
                                <span className="font-bold">Pin Chat</span>
                            </div>
                            <div className={`size-2 rounded-full ${authUser?.pinnedChats?.includes(selectedUser?._id) ? 'bg-primary' : 'bg-base-300'}`} />
                        </button>

                        <button
                            onClick={() => handlePreference('mute')}
                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${authUser?.mutedChats?.includes(selectedUser?._id) ? 'bg-info/10 border-info text-info' : 'bg-base-200 border-base-300 hover:border-info'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-xl ${authUser?.mutedChats?.includes(selectedUser?._id) ? 'bg-info text-white' : 'bg-base-100'}`}>
                                    {authUser?.mutedChats?.includes(selectedUser?._id) ? <BellOff size={18} /> : <Bell size={18} />}
                                </div>
                                <span className="font-bold">Mute Notifications</span>
                            </div>
                            <div className={`size-2 rounded-full ${authUser?.mutedChats?.includes(selectedUser?._id) ? 'bg-info' : 'bg-base-300'}`} />
                        </button>

                        <button
                            onClick={() => handlePreference('block')}
                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${authUser?.blockedUsers?.includes(selectedUser?._id) ? 'bg-error/10 border-error text-error shadow-[0_5px_15px_-5px_rgba(255,0,0,0.3)]' : 'bg-base-200 border-base-300 hover:border-error'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-xl ${authUser?.blockedUsers?.includes(selectedUser?._id) ? 'bg-error text-white' : 'bg-base-100'}`}>
                                    <ShieldAlert size={18} fill={authUser?.blockedUsers?.includes(selectedUser?._id) ? "white" : "none"} />
                                </div>
                                <span className="font-bold">Block User</span>
                            </div>
                            <div className={`size-2 rounded-full ${authUser?.blockedUsers?.includes(selectedUser?._id) ? 'bg-error' : 'bg-base-300'}`} />
                        </button>
                    </div>
                </div>

                {/* Footer / Close Area */}
                <div className="p-8 py-6 bg-base-200/50 flex justify-center">
                    <button onClick={onClose} className="btn btn-ghost btn-sm text-xs opacity-50 hover:opacity-100 transition-opacity">
                        Dismiss Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatSettings;
