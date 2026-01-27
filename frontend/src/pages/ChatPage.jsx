import { useEffect, useState } from "react";
import { useParams } from "react-router";
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

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const ChatPage = () => {
  const { id: targetUserId } = useParams();
  const { theme } = useThemeStore();

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
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

        const client = StreamChat.getInstance(STREAM_API_KEY);

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
        toast.error("Could not connect to chat. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [tokenData, authUser, targetUserId]);

  const handleVideoCall = () => {
    if (channel) {
      const callUrl = `${window.location.origin}/call/${channel.id}`;

      channel.sendMessage({
        text: `I've started a video call. Join me here: ${callUrl}`,
      });

      toast.success("Video call link sent successfully!");
    }
  };

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
          .chat-theme-${theme} .str-chat__message-text,
          .chat-theme-${theme} .str-chat__message-text * {
            color: ${textColor} !important;
          }
          .chat-theme-${theme} .str-chat__message * {
            color: ${textColor} !important;
          }
          
          /* Input area theme colors */
          .chat-theme-${theme} .str-chat__input,
          .chat-theme-${theme} .str-chat__input-flat {
            background-color: ${theme === 'light' ? '#ffffff' : theme === 'dark' ? '#374151' : '#1f2937'} !important;
            border-top: 1px solid ${theme === 'light' ? '#e5e7eb' : theme === 'dark' ? '#4b5563' : '#374151'} !important;
          }
          
          .chat-theme-${theme} .str-chat__input-flat--textarea {
            background-color: ${theme === 'light' ? '#f9fafb' : theme === 'dark' ? '#4b5563' : '#374151'} !important;
            color: ${theme === 'light' ? '#1f2937' : '#f9fafb'} !important;
            border: 1px solid ${theme === 'light' ? '#e5e7eb' : theme === 'dark' ? '#6b7280' : '#4b5563'} !important;
          }
          
          .chat-theme-${theme} .str-chat__input-flat--file-upload {
            background-color: ${theme === 'light' ? '#f9fafb' : theme === 'dark' ? '#4b5563' : '#374151'} !important;
            color: ${theme === 'light' ? '#1f2937' : '#f9fafb'} !important;
            border: 1px solid ${theme === 'light' ? '#e5e7eb' : theme === 'dark' ? '#6b7280' : '#4b5563'} !important;
          }
          
          .chat-theme-${theme} .str-chat__input-flat--actions button {
            background-color: ${theme === 'light' ? '#f9fafb' : theme === 'dark' ? '#4b5563' : '#374151'} !important;
            color: ${theme === 'light' ? '#1f2937' : '#f9fafb'} !important;
            border: 1px solid ${theme === 'light' ? '#e5e7eb' : theme === 'dark' ? '#6b7280' : '#4b5563'} !important;
          }
          
          .chat-theme-${theme} .str-chat__input-flat--textarea::placeholder {
            color: ${theme === 'light' ? '#6b7280' : '#9ca3af'} !important;
          }
        `}
      </style>
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <div className="w-full h-full min-w-0 flex flex-col overflow-hidden">
            {/* Custom Header with Stream Chat Header + Call Button */}
            <div className={`${themeColors.headerBg} ${themeColors.headerText} px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between shadow-lg flex-shrink-0 sticky top-0 z-10`}>
              <ChannelHeader 
                className="!bg-transparent !border-none !p-0 !flex-1 !min-w-0"
              />
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-2">
                <CallButton handleVideoCall={handleVideoCall} />
              </div>
            </div>
            
            {/* Chat Window */}
            <div className="flex-1 relative overflow-hidden">
              <Window className={`h-full min-w-0 ${themeColors.chatBg} overflow-y-auto`} style={{ height: "100%" }}>
                <MessageList 
                  className="!p-1 sm:!p-4 !bg-transparent"
                />
                <MessageInput 
                  focus 
                  className={`!p-1 sm:!p-4 ${themeColors.inputBg} !border-t ${themeColors.inputBorder} input-theme-${theme}`}
                  placeholder="Type a message..."
                  sendButtonStyle={{
                    backgroundColor: 'hsl(var(--p))', // Use CSS variable for primary color
                    color: 'hsl(var(--pc))', // Use CSS variable for primary content color
                    borderRadius: '50%',
                    padding: '6px',
                    width: '32px',
                    height: '32px',
                  }}
                />
              </Window>
            </div>
          </div>
          <Thread className={`!w-full sm:!w-80 ${themeColors.messageBg} !min-w-0`} />
        </Channel>
      </Chat>
    </div>
  );
};
export default ChatPage;
