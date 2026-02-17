import { useMemo } from "react";
import Lottie from "lottie-react";
import { Shield, Lock, Star, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useSocketContext } from "../contexts/SocketContext";
import { useEffect, useState } from "react";

const UserAvatar = ({ user, size = "md", className = "", onClick, showStatus = true }) => {
    const { authUser } = useAuth();
    const { onlineUsers } = useSocketContext();

    const isOnline = onlineUsers.includes(user?._id);
    const isMe = authUser?._id === user?._id;

    // Size mapping
    const sizeClasses = {
        xs: "size-6",
        sm: "size-8",
        md: "size-10",
        lg: "size-16",
        xl: "size-24",
        "2xl": "size-32",
        "full": "w-full h-full"
    };

    const avatarSize = sizeClasses[size] || sizeClasses.md;

    // Visibility Check
    const canSeeProfile = useMemo(() => {
        if (isMe) return true;
        if (user?.profileVisibility === 'nobody') return false;
        if (user?.profileVisibility === 'friends') {
            // Check if user is in authUser.friends
            return authUser?.friends?.includes(user?._id);
        }
        return true;
    }, [user, authUser, isMe]);

    // Role Frame / Badge Logic
    const roleBadge = useMemo(() => {
        if (user?.role === 'faculty') return { icon: <Shield size={12} />, color: 'bg-yellow-500', frame: 'ring-yellow-500' };
        if (user?.role === 'parent') return { icon: <Lock size={12} />, color: 'bg-slate-400', frame: 'ring-slate-400' };
        if (user?.academicSubjects?.length > 5) return { icon: <Star size={12} />, color: 'bg-blue-400', frame: 'ring-blue-400' }; // Top Student example
        return null;
    }, [user]);

    // Recent Update Glow (last 24h)
    const isRecentlyUpdated = useMemo(() => {
        if (!user?.lastProfileUpdate) return false;
        const lastUpdate = new Date(user.lastProfileUpdate);
        const now = new Date();
        return (now - lastUpdate) < (24 * 60 * 60 * 1000);
    }, [user]);

    const [lottieData, setLottieData] = useState(null);

    useEffect(() => {
        if (user?.lottieAvatar) {
            if (typeof user.lottieAvatar === 'string' && user.lottieAvatar.startsWith('http')) {
                fetch(user.lottieAvatar)
                    .then(res => res.json())
                    .then(data => setLottieData(data))
                    .catch(err => console.error("Lottie fetch error:", err));
            } else if (typeof user.lottieAvatar === 'string') {
                try {
                    setLottieData(JSON.parse(user.lottieAvatar));
                } catch (e) {
                    console.error("Lottie parse error:", e);
                }
            } else {
                setLottieData(user.lottieAvatar);
            }
        } else {
            setLottieData(null);
        }
    }, [user?.lottieAvatar]);

    const renderAvatarContent = () => {
        if (!canSeeProfile) {
            return (
                <div className="w-full h-full bg-base-300 flex items-center justify-center text-base-content/30">
                    <EyeOff size={size === 'lg' ? 32 : 16} />
                </div>
            );
        }

        // 1. Lottie Avatar
        if (lottieData) {
            return (
                <div className="w-full h-full bg-base-200 flex items-center justify-center overflow-hidden">
                    <Lottie
                        animationData={lottieData}
                        loop={true}
                        style={{ width: '130%', height: '130%' }}
                    />
                </div>
            );
        }

        // 2. Emoji Avatar
        if (user?.emojiAvatar?.emoji) {
            return (
                <div
                    className="w-full h-full flex items-center justify-center text-4xl sm:text-5xl"
                    style={{ background: user.emojiAvatar.gradient || 'linear-gradient(45deg, #f3ec78, #af4261)' }}
                >
                    <span className="drop-shadow-lg">{user.emojiAvatar.emoji}</span>
                </div>
            );
        }

        // 3. Image Profile Pic
        const profilePic = user?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "User")}&background=random`;
        return (
            <img
                src={profilePic}
                alt={user?.fullName}
                className="w-full h-full object-cover"
                loading="lazy"
            />
        );
    };

    return (
        <div
            className={`relative group ${className}`}
            onClick={onClick}
        >
            {/* Recent Update Glow */}
            {isRecentlyUpdated && !isMe && (
                <div className="absolute -inset-1.5 bg-primary/20 rounded-full blur-md animate-pulse z-0" />
            )}

            {/* Main Avatar Container */}
            <div className={`
                ${avatarSize} rounded-full overflow-hidden z-10 relative border-2 border-base-100 shadow-sm transition-all
                ${roleBadge?.frame ? `ring-2 ring-offset-1 ring-offset-base-100 ${roleBadge.frame}` : ''}
                ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}
            `}>
                {renderAvatarContent()}
            </div>

            {/* Role Badge Icon */}
            {roleBadge && (
                <div className={`absolute -top-1 -right-1 ${roleBadge.color} text-white rounded-full p-0.5 border-2 border-base-100 shadow-sm z-20`}>
                    {roleBadge.icon}
                </div>
            )}

            {/* Online Status Dot */}
            {showStatus && isOnline && (
                <div className="absolute bottom-0 right-0 size-3 bg-green-500 border-2 border-base-100 rounded-full z-20 shadow-sm" />
            )}
        </div>
    );
};

export default UserAvatar;
