import { useEffect, useState, useRef } from "react";
import { useSocketContext } from "../contexts/SocketContext";
import { useNavigate } from "react-router";
import { PhoneIcon, VideoIcon, XIcon, CheckIcon } from "lucide-react";
import UserAvatar from "./UserAvatar";

const IncomingCall = () => {
    const { socket } = useSocketContext();
    const [incomingCall, setIncomingCall] = useState(null);
    const navigate = useNavigate();
    const audioRef = useRef(null);

    const getAudio = () => {
        if (!audioRef.current) {
            audioRef.current = new Audio("https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg");
            audioRef.current.loop = true;
        }
        return audioRef.current;
    };

    useEffect(() => {
        if (!socket) return;

        const handleIncomingCall = (data) => {
            console.log("📞 Incoming Call:", data);

            // WISE SHIELD: If user is already on the specific call page, don't show the notification
            if (window.location.pathname === `/call/${data.callId}`) {
                console.log(`🛡️ Already on call page for ${data.callId}, suppressing notification.`);
                return;
            }

            setIncomingCall(data);
            try {
                const sound = getAudio();
                sound.currentTime = 0;
                sound.play().catch(e => {
                    if (e.name !== "NotAllowedError") {
                        console.log("Audio play failed:", e);
                    }
                });
            } catch (err) {
                console.log("Error playing ringtone", err);
            }
        };

        const handleCallEnded = () => {
            setIncomingCall(null);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        }

        socket.on("call:incoming", handleIncomingCall);
        socket.on("call:rejected", handleCallEnded); // Also stop if remote rejected (if we were calling, but this component is for incoming calls) - Actually, for incoming call, if caller cancels, we should handle that too.
        // Let's assume we might need a "call:cancelled" event from caller later, but for now just basic ring logic.

        return () => {
            socket.off("call:incoming", handleIncomingCall);
            socket.off("call:rejected", handleCallEnded);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        };
    }, [socket]);

    const acceptCall = () => {
        if (!incomingCall) return;

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }

        // Navigate to the call page
        // Ensure we keep the video/audio preference
        const typeParam = incomingCall.type === 'audio' ? '?type=audio' : '?type=video';
        navigate(`/call/${incomingCall.callId}${typeParam}`);
        setIncomingCall(null);
    };

    const declineCall = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        if (incomingCall?.callerInfo?.id && socket) {
            socket.emit("call:rejected", { callerId: incomingCall.callerInfo.id });
        }
        setIncomingCall(null);
    };

    if (!incomingCall) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up max-w-[calc(100vw-2rem)]">
            <div className="card w-80 max-w-full bg-base-100 shadow-2xl border border-primary/20">
                <div className="card-body p-4">
                    <div className="flex items-center gap-4">
                        <UserAvatar
                            user={incomingCall.callerInfo}
                            size="md"
                            showStatus={false}
                            className="shrink-0"
                        />
                        <div>
                            <h3 className="font-bold text-lg">
                                {incomingCall.isClassroomCall ? incomingCall.roomName : (incomingCall.callerInfo?.name || "Unknown")}
                            </h3>
                            <p className="text-sm opacity-70">
                                {incomingCall.isClassroomCall ? `Classroom Video Call from ${incomingCall.callerInfo?.name}` : `Incoming ${incomingCall.type === 'audio' ? 'Voice' : 'Video'} Call...`}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={declineCall}
                            className="btn btn-error flex-1 text-white"
                        >
                            <XIcon className="size-5" />
                            Decline
                        </button>
                        <button
                            onClick={acceptCall}
                            className="btn btn-success flex-1 text-white"
                        >
                            <CheckIcon className="size-5" />
                            Accept
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IncomingCall;
