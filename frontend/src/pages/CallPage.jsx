
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { getLiveKitToken } from "../lib/api";
import { useSocketContext } from "../contexts/SocketContext";
import toast from "react-hot-toast";

import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  useLocalParticipant,
} from "@livekit/components-react";
import "@livekit/components-styles";
import PageLoader from "../components/PageLoader";
import BackButton from "../components/BackButton";
import Whiteboard from "../components/Whiteboard";
import QuizManager from "../components/QuizManager";
import Subtitles from "../components/Subtitles";
import { PencilLine, BarChart3 } from "lucide-react";

// Helper component to handle local audio streaming
const AudioStreamer = ({ callId }) => {
  const { isMicrophoneEnabled, microphoneTrack } = useLocalParticipant();
  const { socket } = useSocketContext();

  const mediaRecorderRef = useRef(null);
  const isRequestingRef = useRef(false);
  const checkIntervalRef = useRef(null);
  const lastTrackIdRef = useRef(null);

  useEffect(() => {
    if (!socket || !callId) return;

    const trackId = microphoneTrack?.track?.mediaStreamTrack?.id;

    // SHIELD: Only restart if we have a valid socket and the track has actually changed
    // This prevents flapping on every small state update
    const tryStartStreaming = async () => {
      if (!isMicrophoneEnabled || !microphoneTrack?.track?.mediaStreamTrack) {
        // Cleanup if mic disabled
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          console.log("🛑 AudioStreamer: Mic disabled, stopping recorder.");
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current = null;
        }
        return;
      }

      // Don't start if already requesting or recording with SAME track
      if (isRequestingRef.current || (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive' && lastTrackIdRef.current === trackId)) {
        return;
      }

      console.log("🎙️ AudioStreamer: Mic ACTIVE. Setting up recorder...");
      isRequestingRef.current = true;
      lastTrackIdRef.current = trackId;

      const mediaStreamTrack = microphoneTrack.track.mediaStreamTrack;
      const stream = new MediaStream([mediaStreamTrack]);
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";

      try {
        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.addEventListener('dataavailable', (event) => {
          if (event.data.size > 0 && socket.connected) {
            socket.emit("audio-stream", event.data);
          }
        });

        // Use .once to avoid listener pileup if acknowledgment is slow
        socket.once("transcription-active", () => {
          if (mediaRecorder.state === "inactive") {
            mediaRecorder.start(250);
            isRequestingRef.current = false;
            console.log("🚀 AudioStreamer: STREAMING STARTED (Backend Ack)");
          }
        });

        console.log("📡 AudioStreamer: Requesting Deepgram join for:", callId);
        socket.emit("join-call-room", { callId, mimetype: mediaRecorder.mimeType });

      } catch (e) {
        isRequestingRef.current = false;
        console.error("❌ AudioStreamer Recorder Error:", e);
      }
    };

    tryStartStreaming();
    checkIntervalRef.current = setInterval(tryStartStreaming, 3000); // 3 seconds is safer for polling

    return () => {
      console.log("🛑 AudioStreamer: Cleaning up effect...");
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
      socket?.off("transcription-active");
      isRequestingRef.current = false;
    };
  }, [socket, callId, isMicrophoneEnabled, microphoneTrack?.track?.mediaStreamTrack?.id]);

  return null;
};

// Mount Sentinel to track component lifecycle
const LifecycleSentinel = ({ name }) => {
  useEffect(() => {
    console.log(`🏗️ ${name} component mounted`);
    return () => console.log(`🏚️ ${name} component UNMOUNTED`);
  }, [name]);
  return null;
};

const CallPage = () => {
  const { id: callId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { authUser, isLoading: authLoading } = useAuthUser();
  const { socket } = useSocketContext();

  const [token, setToken] = useState("");
  const [liveKitUrl, setLiveKitUrl] = useState("");
  const [isError, setIsError] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const fetchingRef = useRef(false);
  const startEmittedRef = useRef(false);
  const disconnectTimerRef = useRef(null);

  const isAudioOnly = useRef(new URLSearchParams(window.location.search).get('type') === 'audio').current;

  useEffect(() => {
    if (!authUser || authLoading || token || fetchingRef.current) return;

    const fetchToken = async () => {
      fetchingRef.current = true;
      try {
        const username = authUser.fullName || authUser._id;
        console.log("🌐 CallPage: Fetching LiveKit Token for", username);
        const res = await getLiveKitToken(callId, username);
        setToken(res.token);
        setLiveKitUrl(res.url);

        const queryParams = new URLSearchParams(window.location.search);
        const isInitiating = location.state?.initiating || queryParams.get('initiating') === 'true';

        if (isInitiating && socket && !startEmittedRef.current) {
          let recipientId = null;

          if (callId.startsWith('faculty-')) {
            recipientId = null;
          } else {
            const userIds = callId.split('-');
            recipientId = userIds.find(id => id !== authUser?._id);
          }

          if (recipientId !== undefined) {
            console.log("📞 CallPage: Emitting call:start event", recipientId ? `to ${recipientId}` : "for room");
            startEmittedRef.current = true;
            socket.emit("call:start", {
              recipientId,
              callId,
              type: isAudioOnly ? 'audio' : 'video',
              callerInfo: {
                id: authUser._id,
                name: authUser.fullName,
                profilePic: authUser.profilePic
              }
            });
          }
        }

      } catch (error) {
        console.error("❌ CallPage: Failed to get LiveKit token:", error);
        toast.error("Failed to join call");
        setIsError(true);
      } finally {
        fetchingRef.current = false;
      }
    };

    fetchToken();
  }, [authUser, authLoading, callId, location.state, socket, isAudioOnly, token]);

  useEffect(() => {
    if (!socket || !location.state?.initiating) return;

    const handleRejected = () => {
      toast.error("Call declined");
      setTimeout(() => navigate('/'), 1000);
    };

    socket.on("call:rejected", handleRejected);

    return () => {
      socket.off("call:rejected", handleRejected);
      if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
    };
  }, [socket, location.state, navigate]);

  // Listen for global events for ALL participants (both host and joiners)
  useEffect(() => {
    if (!socket) return;

    const handleRemoteDraw = () => {
      if (authUser?.role !== 'faculty') {
        setShowWhiteboard(true);
      }
    };

    const handleForceEnd = () => {
      toast("The host has ended the call", { icon: "🛑" });
      navigate('/');
    };

    socket.on("whiteboard:draw", handleRemoteDraw);
    socket.on("call:force_end", handleForceEnd);

    return () => {
      socket.off("whiteboard:draw", handleRemoteDraw);
      socket.off("call:force_end", handleForceEnd);
    };
  }, [socket, authUser, navigate]);

  if ((authLoading && !authUser) || (!token && !isError)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PageLoader />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-bold text-error">Call Error</h2>
        <button className="btn" onClick={() => navigate('/')}>Go Home</button>
      </div>
    )
  }

  const handleDisconnected = () => {
    console.log("󰵚 LiveKit: Disconnected callback triggered.");

    // SHIELD: Give LiveKit 2 seconds to try auto-reconnecting before we force exit
    // Often transient network issues cause a momentary disconnect that self-heals
    if (disconnectTimerRef.current) return;

    disconnectTimerRef.current = setTimeout(() => {
      const queryParams = new URLSearchParams(window.location.search);
      const isInitiating = location.state?.initiating || queryParams.get('initiating') === 'true';

      if (socket && callId && isInitiating) {
        socket.emit("call:ended", { callId });
      }
      toast.success("Call ended");
      navigate('/');
    }, 2000);
  };

  return (
    <div className="w-full bg-neutral-900 min-h-[100dvh]" data-lk-theme="default">
      <LifecycleSentinel name="CallPage" />
      <div className="absolute top-4 left-4 z-50">
        <BackButton />
      </div>

      <LiveKitRoom
        video={!isAudioOnly}
        audio={true}
        token={token}
        serverUrl={liveKitUrl}
        key={token}
        connectOptions={{
          autoSubscribe: true,
          adaptiveStream: true,
          dynacast: true,
        }}
        data-lk-theme="default"
        style={{ height: "100dvh" }}
        onDisconnected={handleDisconnected}
        onConnected={() => {
          console.log("✅ LiveKit: Connected successfully");
          if (disconnectTimerRef.current) {
            clearTimeout(disconnectTimerRef.current);
            disconnectTimerRef.current = null;
          }
        }}
      >
        <VideoConference />
        <RoomAudioRenderer />
        <AudioStreamer callId={callId} />

        {showWhiteboard && (
          <Whiteboard
            socket={socket}
            callId={callId}
            isFaculty={authUser?.role === 'faculty'}
            onClose={() => setShowWhiteboard(false)}
          />
        )}

        <QuizManager
          socket={socket}
          callId={callId}
          isFaculty={authUser?.role === 'faculty'}
          authUser={authUser}
        />

        <Subtitles socket={socket} authUser={authUser} />

        {authUser?.role === 'faculty' && (
          <div className="fixed top-20 left-4 z-40 flex flex-col gap-2">
            <button
              onClick={() => setShowWhiteboard(!showWhiteboard)}
              className={`btn btn-circle ${showWhiteboard ? 'btn-primary' : 'bg-base-200'} shadow-lg border-2 border-white/20`}
              title={showWhiteboard ? "Close Whiteboard" : "Open Whiteboard"}
            >
              <PencilLine size={20} />
            </button>
          </div>
        )}
      </LiveKitRoom>
    </div>
  );
};

export default CallPage;
