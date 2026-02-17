import { X, ExternalLink, Download } from "lucide-react";
import UserAvatar from "./UserAvatar";

const ProfilePreview = ({ isOpen, onClose, user }) => {
    if (!isOpen || !user) return null;

    const handleDownload = async () => {
        if (!user.profilePic) return;
        try {
            const response = await fetch(user.profilePic);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${user.fullName.replace(/\s+/g, '_')}_profile.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download failed:", err);
            // Fallback: Open in new tab
            window.open(user.profilePic, '_blank');
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300 p-4">
            <div className="relative w-full max-w-lg aspect-square group">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 btn btn-ghost btn-circle text-white hover:bg-white/10"
                >
                    <X size={32} />
                </button>

                {/* Main Profile Avatar */}
                <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-base-300 flex items-center justify-center">
                    <UserAvatar
                        user={user}
                        size="full"
                        showStatus={false}
                        className="w-full h-full rounded-3xl"
                    />
                </div>

                {/* Info & Actions Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent rounded-b-3xl flex items-end justify-between translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="text-white">
                        <h3 className="text-2xl font-bold tracking-tight">{user.fullName}</h3>
                        <p className="text-sm opacity-60 flex items-center gap-1 uppercase tracking-widest font-bold">
                            {user.role} • Cocoon Member
                        </p>
                    </div>

                    <div className="flex gap-2">
                        {user.profilePic && (
                            <button
                                onClick={handleDownload}
                                className="btn btn-circle btn-primary btn-sm sm:btn-md shadow-lg shadow-primary/20"
                                title="Download Photo"
                            >
                                <Download size={20} />
                            </button>
                        )}
                        <button
                            onClick={() => window.open(user.profilePic, '_blank')}
                            className="btn btn-circle bg-white/10 text-white border-white/20 hover:bg-white/20 btn-sm sm:btn-md"
                            title="Open Original"
                        >
                            <ExternalLink size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePreview;
