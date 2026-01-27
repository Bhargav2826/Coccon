
import { useEffect, useState } from "react";
import { useSocketContext } from "../contexts/SocketContext";
import { useNavigate } from "react-router";
import { PhoneIcon, VideoIcon, XIcon, CheckIcon } from "lucide-react";

// Standard phone ringtone sound
const RINGTONE_URL = "https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/pause.mp3"; // Placeholder sound, user can replace
// Ideally use: "https://upload.wikimedia.org/wikipedia/commons/e/e5/Telephone_Ring_Tone.ogg" but simplified for now to ensure it plays safely.
// Actually lets use a simple reliable one.
const CALL_SOUND = new Audio("https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg");
CALL_SOUND.loop = true;

const IncomingCall = () => {
    const { socket } = useSocketContext();
    const [incomingCall, setIncomingCall] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!socket) return;

        const handleIncomingCall = (data) => {
            console.log("📞 Incoming Call:", data);
            setIncomingCall(data);
            try {
                CALL_SOUND.currentTime = 0;
                CALL_SOUND.play().catch(e => console.log("Audio play failed:", e));
            } catch (err) {
                console.log("Error playing ringtone", err);
            }
        };

        const handleCallEnded = () => {
            setIncomingCall(null);
            CALL_SOUND.pause();
            CALL_SOUND.currentTime = 0;
        }

        socket.on("call:incoming", handleIncomingCall);
        socket.on("call:rejected", handleCallEnded); // Also stop if remote rejected (if we were calling, but this component is for incoming calls) - Actually, for incoming call, if caller cancels, we should handle that too.
        // Let's assume we might need a "call:cancelled" event from caller later, but for now just basic ring logic.

        return () => {
            socket.off("call:incoming", handleIncomingCall);
            socket.off("call:rejected", handleCallEnded);
            CALL_SOUND.pause();
            CALL_SOUND.currentTime = 0;
        };
    }, [socket]);

    const acceptCall = () => {
        if (!incomingCall) return;

        CALL_SOUND.pause();
        CALL_SOUND.currentTime = 0;

        // Navigate to the call page
        // Ensure we keep the video/audio preference
        const typeParam = incomingCall.type === 'audio' ? '?type=audio' : '?type=video';
        navigate(`/call/${incomingCall.callId}${typeParam}`);
        setIncomingCall(null);
    };

    const declineCall = () => {
        CALL_SOUND.pause();
        CALL_SOUND.currentTime = 0;
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
                        <div className="avatar placeholder">
                            <div className="bg-neutral text-neutral-content rounded-full w-12">
                                <span className="text-xl">{incomingCall.callerInfo?.name?.charAt(0) || "?"}</span>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">{incomingCall.callerInfo?.name || "Unknown"}</h3>
                            <p className="text-sm opacity-70">
                                Incoming {incomingCall.type === 'audio' ? 'Voice' : 'Video'} Call...
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
