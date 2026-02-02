
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

// Helper component to handle local audio streaming
const AudioStreamer = ({ callId }) => {
  const { isMicrophoneEnabled, microphoneTrack } = useLocalParticipant();
  const { socket } = useSocketContext();

  const mediaRecorderRef = useRef(null);
  const isRequestingRef = useRef(false);
  const checkIntervalRef = useRef(null);

  useEffect(() => {
    if (!socket || !callId) return;

    const tryStartStreaming = async () => {
      // Don't start if already streaming or in middle of a request
      if (isRequestingRef.current || (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive')) {
        return;
      }

      if (!isMicrophoneEnabled || !microphoneTrack?.track?.mediaStreamTrack) {
        return;
      }

      console.log("🎙️ AudioStreamer: Mic ACTIVE. Setting up recorder...");
      isRequestingRef.current = true;

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

        const handleTranscriptionActive = () => {
          if (mediaRecorder.state === "inactive") {
            mediaRecorder.start(250);
            isRequestingRef.current = false;
            console.log("🚀 AudioStreamer: STREAMING STARTED (Backend Ack)");
          }
        };

        socket.on("transcription-active", handleTranscriptionActive);

        console.log("📡 AudioStreamer: Requesting Deepgram join for:", callId);
        socket.emit("join-call-room", { callId, mimetype: mediaRecorder.mimeType });

      } catch (e) {
        isRequestingRef.current = false;
        console.error("❌ AudioStreamer Recorder Error:", e);
      }
    };

    tryStartStreaming();
    checkIntervalRef.current = setInterval(tryStartStreaming, 2000);

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
  }, [socket, callId, isMicrophoneEnabled, !!microphoneTrack?.track]);

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
  const fetchingRef = useRef(false);
  const startEmittedRef = useRef(false);

  const isAudioOnly = useRef(new URLSearchParams(window.location.search).get('type') === 'audio').current;

  useEffect(() => {
    console.log("🔄 CallPage: Root Effect", { authLoading, hasAuthUser: !!authUser, hasToken: !!token });

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
          const userIds = callId.split('-');
          let recipientId = userIds.find(id => id !== authUser._id);

          // For faculty calls, the recipient might not be in the callId string
          // In those cases, we still want to create the record
          if (!recipientId && callId.startsWith('faculty-')) {
            console.log("🏫 CallPage: Initiating faculty room call");
            recipientId = null; // No single recipient
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
    };
  }, [socket, location.state, navigate]);

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
        data-lk-theme="default"
        style={{ height: "100dvh" }}
        onDisconnected={() => {
          console.log("󰵚 LiveKit: Disconnected.");
          if (socket && callId) {
            socket.emit("call:ended", { callId });
          }
          toast.success("Call ended");
          navigate('/');
        }}
      >
        <VideoConference />
        <RoomAudioRenderer />
        <AudioStreamer callId={callId} />
      </LiveKitRoom>
    </div>
  );
};

export default CallPage;
