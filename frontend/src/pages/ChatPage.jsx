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
      className={`w-full h-full min-w-0 bg-[#f8f9fa] chat-theme-${theme} overflow-hidden`}
      style={{ minHeight: "calc(100dvh - 64px)" }}
    >
      <style>
        {`
          /* Clean Chat Layout - Image-Inspired Fixes */
          .chat-theme-${theme} .str-chat {
            background-color: transparent !important;
            height: 100%;
          }
          
          /* Light White Wallpaper */
          .chat-theme-${theme} .whatsapp-bg {
            background-image: url("https://www.transparenttextures.com/patterns/food.png");
            background-repeat: repeat;
            background-color: #ffffff;
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            z-index: 0;
            opacity: 0.6;
          }

          /* Message Alignment & Avatars */
          .chat-theme-${theme} .str-chat__li {
            padding: 12px 15px !important;
            max-width: 100% !important;
          }

          /* Avatar Positioning */
          .chat-theme-${theme} .str-chat__message-simple-avatar {
            display: flex !important;
            align-self: flex-end !important;
            margin: 0 10px !important;
          }

          .chat-theme-${theme} .str-chat__avatar {
            width: 36px !important;
            height: 36px !important;
            border-radius: 50% !important;
          }

          /* Message Inner Structure Fix */
          .str-chat__message-simple {
            width: 100% !important;
            display: flex !important;
            margin-bottom: 4px !important;
          }

          /* Sent Messages (Me) - Put avatar on right */
          .chat-theme-${theme} .str-chat__message-simple--me {
            flex-direction: row-reverse !important;
          }

          /* The Content Wrapper */
          .chat-theme-${theme} .str-chat__message-simple__content {
            display: flex !important;
            flex-direction: column !important;
            max-width: 75% !important;
            background: transparent !important;
            padding: 0 !important;
            align-items: flex-start !important;
          }

          .chat-theme-${theme} .str-chat__message-simple--me .str-chat__message-simple__content {
            align-items: flex-end !important;
          }

          /* The Bubble Itself - High specificity to override Stream's transparent/wrong colors */
          .chat-theme-${theme} .str-chat__message-bubble,
          .chat-theme-${theme} .str-chat__message-simple__content-inner {
            border-radius: 12px !important;
            padding: 12px 16px !important;
            box-shadow: 0 1px 2px rgba(0,0,0,0.12) !important;
            border: none !important;
            position: relative !important;
            width: 100% !important;
            min-width: 160px !important;
          }

          /* Received Bubble Styling (Opponent) */
          .chat-theme-${theme} .str-chat__message-simple--received .str-chat__message-bubble,
          .chat-theme-${theme} .str-chat__message-simple--received .str-chat__message-simple__content-inner {
            background-color: #f1f1f1 !important;
            color: #333333 !important;
          }

          /* Sent Bubble Styling (Me) */
          .chat-theme-${theme} .str-chat__message-simple--me .str-chat__message-bubble,
          .chat-theme-${theme} .str-chat__message-simple--me .str-chat__message-simple__content-inner {
            background-color: #4a90e2 !important;
            color: #ffffff !important;
          }

          /* Inner Header (Name & Time) - Stay INSIDE bubble */
          .str-chat__message-simple__header,
          .str-chat__message-data {
            display: flex !important;
            justify-content: space-between !important;
            width: 100% !important;
            margin-bottom: 6px !important;
            font-size: 11px !important;
            gap: 12px !important;
            position: static !important;
            float: none !important;
          }

          .str-chat__message-simple__name, .str-chat__message-data--name {
            font-weight: 800 !important;
            color: inherit !important;
            max-width: 60% !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
          }

          .str-chat__message-simple__timestamp, .str-chat__message-data--time {
               margin: 0 !important;
               opacity: 0.8 !important;
               color: inherit !important;
               font-weight: 400 !important;
          }

          /* Text Styling */
          .chat-theme-${theme} .str-chat__message-text-inner {
             font-size: 14.5px !important;
             line-height: 1.5 !important;
             color: inherit !important;
          }

          /* Link/Attachment Styling */
          .str-chat__message-attachment {
             background: transparent !important;
             color: inherit !important;
             margin-top: 8px !important;
          }

          /* Input Area - Clean Style */
          .chat-theme-${theme} .str-chat__input-flat {
            background-color: #f1f3f4 !important;
            border-top: 1px solid #e0e0e0 !important;
            padding: 12px 24px !important;
            z-index: 10;
          }
          
          .chat-theme-${theme} .str-chat__input-flat-wrapper {
             border: 1px solid #d1d1d1 !important;
             border-radius: 6px !important;
             background-color: #ffffff !important;
             padding: 0 12px !important;
          }

          .chat-theme-${theme} .str-chat__input-flat--textarea {
             min-height: 40px !important;
             padding: 10px 0 !important;
             color: #333333 !important;
             background: transparent !important;
          }

          /* Green Send Button */
          .chat-theme-${theme} .str-chat__send-button {
             background-color: #2da44e !important;
             color: white !important;
             border-radius: 4px !important;
             width: auto !important;
             height: 40px !important;
             padding: 0 18px !important;
             margin-left: 12px !important;
             display: flex !important;
             align-items: center !important;
             justify-content: center !important;
             font-weight: 700 !important;
          }
          
          .chat-theme-${theme} .str-chat__send-button:hover {
            background-color: #2c974b !important;
          }

          /* Remove unwanted Stream decorations */
          .str-chat__message-bubble::after, .str-chat__message-bubble::before,
          .str-chat__message-simple__content::after, .str-chat__message-simple__content::before,
          .str-chat__message-simple__content-inner::after, .str-chat__message-simple__content-inner::before {
            display: none !important;
          }
        `}
      </style>
      <Chat client={chatClient} theme="messaging light">
        <Channel channel={channel}>
          <div className="w-full h-full min-w-0 flex flex-col overflow-hidden relative">
            <div className="whatsapp-bg"></div>

            {/* Clean Header - Image Style */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-10 sticky top-0">
              <div className="flex items-center gap-3 overflow-hidden">
                <BackButton className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0" />
                <div className="avatar flex-shrink-0">
                  <div className="w-10 h-10 rounded-full">
                    <img
                      src={targetUser?.profilePic || "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"}
                      alt="User Avatar"
                      onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${targetUser?.fullName || 'User'}&background=random` }}
                    />
                  </div>
                </div>
                <div className="overflow-hidden min-w-0">
                  <h3 className="font-bold text-gray-800 text-[16px] truncate">
                    {targetUser?.fullName || "Chat"}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <p className="text-[12px] text-gray-500 font-medium">Active Now</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <CallButton handleVideoCall={handleVideoCall} />
                <div className="dropdown dropdown-end">
                  <button tabIndex={0} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 4.001A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 4.001A2 2 0 0 0 12 15z"></path></svg>
                  </button>
                  <ul tabIndex={0} className="dropdown-content z-[20] menu p-2 shadow-xl bg-base-100 rounded-box w-48 mt-2">
                    <li><a>Contact info</a></li>
                    <li><a>Clear chat</a></li>
                    <li><a>Export chat</a></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 relative overflow-hidden z-[1]">
              <Window>
                <MessageList
                  className="!p-4 md:!p-8"
                  hideDeletedMessages={true}
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
