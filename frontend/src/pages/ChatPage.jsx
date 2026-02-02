import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";
import { useThemeStore } from "../store/useThemeStore";

import {
  Channel,
  ChannelHeader,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import { StreamChat } from "stream-chat";
import "stream-chat-react/dist/css/v2/index.css";
import toast from "react-hot-toast";

import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";
import BackButton from "../components/BackButton";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY || "7trtqn6jnm9d";

const ChatPage = () => {
  const navigate = useNavigate();
  const { id: targetUserId } = useParams();
  const { theme } = useThemeStore();

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [targetUser, setTargetUser] = useState(null);

  const { authUser } = useAuthUser();

  // Theme-based color scheme
  const getThemeColors = () => {
    switch (theme) {
      case "light":
        return {
          background: "bg-base-100",
          headerBg: "bg-primary",
          headerText: "text-primary-content",
          chatBg: "bg-base-200",
          messageBg: "bg-base-100",
          messageBubble: "bg-primary text-primary-content",
          messageBubbleMe: "bg-secondary text-secondary-content",
          inputBg: "bg-base-100",
          inputBorder: "border-base-300",
          sendButtonBg: "bg-primary",
          sendButtonHover: "hover:bg-primary-focus"
        };
      case "dark":
        return {
          background: "bg-base-100",
          headerBg: "bg-primary",
          headerText: "text-primary-content",
          chatBg: "bg-base-200",
          messageBg: "bg-base-100",
          messageBubble: "bg-primary text-primary-content",
          messageBubbleMe: "bg-secondary text-secondary-content",
          inputBg: "bg-base-100",
          inputBorder: "border-base-300",
          sendButtonBg: "bg-primary",
          sendButtonHover: "hover:bg-primary-focus"
        };
      case "night":
      default:
        return {
          background: "bg-base-100",
          headerBg: "bg-primary",
          headerText: "text-primary-content",
          chatBg: "bg-base-200",
          messageBg: "bg-base-100",
          messageBubble: "bg-primary text-primary-content",
          messageBubbleMe: "bg-secondary text-secondary-content",
          inputBg: "bg-base-100",
          inputBorder: "border-base-300",
          sendButtonBg: "bg-primary",
          sendButtonHover: "hover:bg-primary-focus"
        };
    }
  };

  const themeColors = getThemeColors();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser, // this will run only when authUser is available
  });

  // Fetch target user details
  const { data: targetUserData } = useQuery({
    queryKey: ["targetUser", targetUserId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/users/${targetUserId}`);
        if (!response.ok) {
          console.error('Failed to fetch user:', response.status, response.statusText);
          throw new Error('Failed to fetch user');
        }
        const data = await response.json();
        console.log('Target user data:', data);
        return data;
      } catch (error) {
        console.error('Error fetching target user:', error);
        throw error;
      }
    },
    enabled: !!targetUserId,
    retry: 3,
    retryDelay: 1000,
  });

  useEffect(() => {
    if (targetUserData) {
      setTargetUser(targetUserData);
    }
  }, [targetUserData]);

  // Fallback: Get user info from channel data if API fails
  useEffect(() => {
    if (channel && !targetUser) {
      const members = channel.state.members;
      const targetMember = Object.values(members).find(member => member.user.id === targetUserId);
      if (targetMember) {
        setTargetUser({
          _id: targetMember.user.id,
          fullName: targetMember.user.name || targetMember.user.id,
          profilePic: targetMember.user.image,
        });
      }
    }
  }, [channel, targetUser, targetUserId]);

  useEffect(() => {
    const initChat = async () => {
      if (!tokenData?.token || !authUser) return;

      try {
        console.log("Initializing stream chat client...");
        console.log("🔌 Stream API Key:", STREAM_API_KEY);

        // Force new instance to avoid singleton issues with invalid keys
        const client = new StreamChat(STREAM_API_KEY);

        await client.connectUser(
          {
            id: authUser._id,
            name: authUser.fullName,
            image: authUser.profilePic,
          },
          tokenData.token
        );

        //
        const channelId = [authUser._id, targetUserId].sort().join("-");

        // you and me
        // if i start the chat => channelId: [myId, yourId]
        // if you start the chat => channelId: [yourId, myId]  => [myId,yourId]

        const currChannel = client.channel("messaging", channelId, {
          members: [authUser._id, targetUserId],
        });

        await currChannel.watch();

        setChatClient(client);
        setChannel(currChannel);
      } catch (error) {
        console.error("Error initializing chat:", error);
        setError(error.message || "Failed to connect to chat");
        toast.error("Could not connect to chat. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [tokenData, authUser, targetUserId]);

  const handleVideoCall = () => {
    if (channel) {
      const callId = channel.id;
      const callUrl = `${window.location.origin}/call/${callId}`;

      channel.sendMessage({
        text: `I've started a video call. Join me here: ${callUrl}`,
      });

      toast.success("Video call link sent successfully!");

      // Navigate initiator to the call page
      setTimeout(() => {
        navigate(`/call/${callId}?initiating=true`, { state: { initiating: true } });
      }, 500);
    }
  };

  if (error) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center ${themeColors.background} p-4`}>
        <div className="text-error mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-bold text-center">Connection Failed</h3>
          <p className="text-center opacity-70">{error}</p>
        </div>
        <button onClick={() => window.location.reload()} className="btn btn-primary">
          Retry
        </button>
      </div>
    );
  }

  if (loading || !chatClient || !channel) return <ChatLoader />;

  // Get text color based on theme
  const getTextColor = () => {
    switch (theme) {
      case 'light':
        return '#1f2937'; // Dark text for light theme
      case 'dark':
      case 'night':
        return '#f9fafb'; // Light text for dark themes
      default:
        return '#1f2937';
    }
  };

  const textColor = getTextColor();

  return (
    <div
      className={`w-full h-full min-w-0 ${themeColors.background} chat-theme-${theme} overflow-hidden`}
      style={{ minHeight: "calc(100dvh - 64px)" }}
    >
      <style>
        {`
          /* Chat Container */
          .chat-theme-${theme} .str-chat {
            background-color: transparent !important;
            height: 100%;
          }
          
          /* Message List */
          .chat-theme-${theme} .str-chat__list {
            background-color: transparent !important;
          }
          
          /* Message Bubbles */
          .chat-theme-${theme} .str-chat__message-simple__content {
            background-color: ${theme === 'light' ? '#ffffff' : theme === 'dark' ? '#374151' : '#1f2937'} !important;
            border-radius: 18px 18px 18px 0;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            color: ${textColor} !important;
            border: 1px solid ${themeColors.inputBorder.split(' ')[1] === 'base-300' ? '#d1d5db' : '#4b5563'};
          }

          .chat-theme-${theme} .str-chat__message-simple--me .str-chat__message-simple__content {
            background-color: hsl(var(--p)) !important;
            color: hsl(var(--pc)) !important;
            border-radius: 18px 18px 0 18px;
            border: none;
          }

          .chat-theme-${theme} .str-chat__message-text-inner {
             color: inherit !important;
          }
          
          /* Input Area */
          .chat-theme-${theme} .str-chat__input-flat {
            background-color: ${theme === 'light' ? '#ffffff' : theme === 'dark' ? '#374151' : '#1f2937'} !important;
            border-top: 1px solid ${theme === 'light' ? '#e5e7eb' : theme === 'dark' ? '#4b5563' : '#374151'} !important;
            padding: 1rem !important;
          }
          
          .chat-theme-${theme} .str-chat__input-flat-wrapper {
             border: 1px solid ${theme === 'light' ? '#d1d5db' : '#4b5563'} !important;
             border-radius: 24px !important;
             overflow: hidden;
             background-color: ${theme === 'light' ? '#f9fafb' : theme === 'dark' ? '#4b5563' : '#111827'} !important;
          }

          .chat-theme-${theme} .str-chat__send-button {
             background-color: transparent !important;
          }

          /* Avatar */
          .str-chat__avatar-image {
             border-radius: 50% !important;
          }
        `}
      </style>
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <div className="w-full h-full min-w-0 flex flex-col overflow-hidden relative">

            {/* Custom Modern Header */}
            <div className={`${themeColors.headerBg} ${themeColors.headerText} px-4 py-3 flex items-center justify-between shadow-md z-10 sticky top-0`}>
              <div className="flex items-center gap-3">
                <div className="avatar">
                  <div className="w-10 h-10 rounded-full ring ring-offset-2 ring-primary ring-offset-base-100">
                    <img
                      src={targetUser?.profilePic || "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"}
                      alt="User Avatar"
                      onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${targetUser?.fullName || 'User'}&background=random` }}
                    />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">{targetUser?.fullName || "Chat"}</h3>
                  <p className="text-xs opacity-80 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400"></span> Online
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <CallButton handleVideoCall={handleVideoCall} />
              </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 relative overflow-hidden bg-center bg-cover" style={{ backgroundImage: theme === 'light' ? 'url("https://www.transparenttextures.com/patterns/subtle-white-feathers.png")' : 'none' }}>
              <Window>
                <MessageList
                  className="!p-4"
                  messageActions={['react', 'reply', 'delete', 'edit', 'pin', 'flag']}
                />
                <MessageInput focus />
              </Window>
            </div>
          </div>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
};
export default ChatPage;
