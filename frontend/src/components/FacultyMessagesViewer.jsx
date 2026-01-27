import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStudentFacultyMessages, markMessageAsRead } from "../lib/api";
import { 
  MessageCircleIcon, 
  FileTextIcon, 
  ImageIcon, 
  VideoIcon,
  CalendarIcon,
  UserIcon,
  GraduationCapIcon,
  ExternalLinkIcon,
  CheckIcon
} from "lucide-react";
import { toast } from "react-hot-toast";

const FacultyMessagesViewer = () => {
  const queryClient = useQueryClient();
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["studentFacultyMessages"],
    queryFn: getStudentFacultyMessages,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mutation for marking message as read
  const { mutate: markAsRead, isPending: markingAsRead } = useMutation({
    mutationFn: markMessageAsRead,
    onSuccess: (data) => {
      toast.success("Message marked as read");
      // Invalidate and refetch the messages to update the UI
      queryClient.invalidateQueries({ queryKey: ["studentFacultyMessages"] });
      // Also invalidate unread count
      queryClient.invalidateQueries({ queryKey: ["unreadFacultyMessages"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to mark message as read");
    },
  });

  const handleMarkAsRead = (messageId) => {
    markAsRead(messageId);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageIcon = (messageType) => {
    switch (messageType) {
      case "image":
        return <ImageIcon className="size-4" />;
      case "file":
        return <FileTextIcon className="size-4" />;
      case "system":
        return <MessageCircleIcon className="size-4" />;
      default:
        return <MessageCircleIcon className="size-4" />;
    }
  };

  const getMessageTypeLabel = (messageType) => {
    switch (messageType) {
      case "image":
        return "Image";
      case "file":
        return "Document";
      case "system":
        return "System Message";
      default:
        return "Text Message";
    }
  };

  const handleFileDownload = (fileUrl, fileName) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleVideoCallClick = (messageContent) => {
    try {
      console.log("🎥 Video call message content:", messageContent);
      
      // Extract the video call URL from the message content
      let videoCallUrl = null;
      
      // Try different patterns to extract the URL
      if (messageContent.includes("Join the video call: ")) {
        videoCallUrl = messageContent.split("Join the video call: ")[1];
      } else if (messageContent.includes("Join me here: ")) {
        videoCallUrl = messageContent.split("Join me here: ")[1];
      } else if (messageContent.includes("http")) {
        // Extract any URL from the content
        const urlMatch = messageContent.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
          videoCallUrl = urlMatch[1];
        }
      }
      
      console.log("🎥 Extracted video call URL:", videoCallUrl);
      
      if (!videoCallUrl) {
        console.error("❌ Could not extract video call URL from message content");
        toast.error("Could not find video call URL in the message");
        return;
      }
      
      // Clean up the URL (remove any trailing whitespace or newlines)
      videoCallUrl = videoCallUrl.trim();
      
      // Validate the URL
      try {
        new URL(videoCallUrl);
      } catch (urlError) {
        console.error("❌ Invalid video call URL:", videoCallUrl);
        toast.error("Invalid video call URL");
        return;
      }
      
      console.log("🎥 Opening video call URL:", videoCallUrl);
      
      // Open the video call in a new tab
      window.open(videoCallUrl, '_blank');
      
      toast.success("Opening video call...");
      
    } catch (error) {
      console.error("❌ Error handling video call click:", error);
      toast.error("Failed to open video call");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-error/10 p-6 text-center">
        <h3 className="font-semibold text-lg mb-2 text-error">Error loading messages</h3>
        <p className="text-error-content opacity-70 mb-4">
          {error.message || "Failed to load faculty messages"}
        </p>
        <button
          onClick={() => refetch()}
          className="btn btn-error btn-outline"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { messages = [], rooms = [] } = data || {};

  if (messages.length === 0) {
    return (
      <div className="card bg-base-200 p-8 text-center">
        <MessageCircleIcon className="size-16 mx-auto mb-4 opacity-50" />
        <h3 className="font-semibold text-lg mb-2">No faculty messages yet</h3>
        <p className="text-base-content opacity-70 mb-4">
          Messages from your teachers will appear here
        </p>
        <div className="text-sm opacity-70">
          <p>• Join classroom rooms to receive messages</p>
          <p>• Teachers can send text, files, and video call links</p>
          <p>• Messages are delivered in real-time</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Messages Section */}
      <div className="space-y-6">
        {/* Refresh Button */}
        <div className="flex justify-end">
          <button
            onClick={() => refetch()}
            className="btn btn-outline btn-sm hover:btn-primary transition-all duration-300"
          >
            <span className="mr-2">🔄</span>
            Refresh
          </button>
        </div>
        
        <div className="space-y-6">
          {messages.map((message, index) => (
            <div 
              key={message._id} 
              className="bg-base-100 rounded-2xl shadow-sm border border-base-300/50 hover:shadow-md transition-all duration-300 overflow-hidden"
            >
              {/* Message Header */}
              <div className="p-6 border-b border-base-300/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center flex-shrink-0">
                    <UserIcon className="size-6 text-primary-content" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-lg text-base-content">
                      {message.sender.fullName}
                    </h4>
                    <p className="text-sm text-base-content/60 truncate">
                      {message.sender.email}
                    </p>
                    {message.roomId && (
                      <div className="flex items-center gap-1 mt-1">
                        <GraduationCapIcon className="size-3 text-primary" />
                        <span className="text-xs text-primary font-medium">{message.roomId.roomName}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-base-content/50 mb-1">
                      {formatDate(message.createdAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      {getMessageIcon(message.messageType)}
                      <span className="text-xs font-medium">{getMessageTypeLabel(message.messageType)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Message Content */}
              <div className="p-6">
                <div className="space-y-4">
                  {message.messageType === "image" && message.content.includes("📎") ? (
                    <div className="space-y-4">
                      <div className="bg-base-200/50 p-4 rounded-xl">
                        <p className="text-base-content">
                          {message.content}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-primary">
                          <ImageIcon className="size-4" />
                          <span className="text-sm font-medium">Image Attachment</span>
                        </div>
                        <button
                          onClick={() => handleFileDownload(message.fileUrl, message.fileName)}
                          className="btn btn-primary btn-sm"
                        >
                          View Image
                        </button>
                      </div>
                    </div>
                  ) : message.messageType === "file" && message.content.includes("📎") ? (
                    <div className="space-y-4">
                      <div className="bg-base-200/50 p-4 rounded-xl">
                        <p className="text-base-content">
                          {message.content}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-secondary">
                          <FileTextIcon className="size-4" />
                          <span className="text-sm font-medium">File Attachment</span>
                        </div>
                        <button
                          onClick={() => handleFileDownload(message.fileUrl, message.fileName)}
                          className="btn btn-secondary btn-sm"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  ) : message.content.includes("🎥") ? (
                    <div className="space-y-4">
                      <div className="bg-base-200/50 p-4 rounded-xl">
                        <p className="text-base-content">
                          {message.content}
                        </p>
                      </div>
                      
                      {/* Extract and display the video call URL */}
                      {(() => {
                        let videoCallUrl = null;
                        if (message.content.includes("Join the video call: ")) {
                          videoCallUrl = message.content.split("Join the video call: ")[1];
                        } else if (message.content.includes("Join me here: ")) {
                          videoCallUrl = message.content.split("Join me here: ")[1];
                        } else if (message.content.includes("http")) {
                          const urlMatch = message.content.match(/(https?:\/\/[^\s]+)/);
                          if (urlMatch) {
                            videoCallUrl = urlMatch[1];
                          }
                        }
                        
                        return videoCallUrl ? (
                          <div className="bg-accent/10 p-3 rounded-lg border border-accent/20">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-accent">
                                <VideoIcon className="size-4" />
                                <span className="text-sm font-medium">Video Call URL</span>
                              </div>
                              <button
                                onClick={() => handleVideoCallClick(message.content)}
                                className="btn btn-accent btn-sm"
                              >
                                Join Call
                              </button>
                            </div>
                            <div className="mt-2">
                              <p className="text-xs text-accent/70 break-all">
                                {videoCallUrl.trim()}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-accent">
                              <VideoIcon className="size-4" />
                              <span className="text-sm font-medium">Video Call</span>
                            </div>
                            <button
                              onClick={() => handleVideoCallClick(message.content)}
                              className="btn btn-accent btn-sm"
                            >
                              Join Call
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="bg-base-200/50 p-4 rounded-xl">
                      <p className="text-base-content whitespace-pre-line leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                  )}
                  
                  {/* Read Status */}
                  <div className="flex items-center justify-between pt-4 border-t border-base-300/30">
                    <div className="flex items-center gap-2">
                      {message.isRead ? (
                        <div className="flex items-center gap-2 text-success">
                          <CheckIcon className="size-4" />
                          <span className="text-sm font-medium">Read</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-warning">
                          <span className="size-2 rounded-full bg-warning animate-ping"></span>
                          <span className="text-sm font-medium">Unread</span>
                        </div>
                      )}
                    </div>
                    
                    {!message.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(message._id)}
                        disabled={markingAsRead}
                        className="btn btn-success btn-sm"
                      >
                        {markingAsRead ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <CheckIcon className="size-4" />
                        )}
                        Mark as Read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rooms Summary */}
      {rooms.length > 0 && (
        <div className="bg-base-200/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-secondary to-accent rounded-xl flex items-center justify-center">
              <GraduationCapIcon className="size-5 text-secondary-content" />
            </div>
            <h3 className="text-xl font-bold text-base-content">
              Your Classroom Rooms
            </h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room, index) => (
              <div 
                key={room._id} 
                className="bg-base-100 rounded-xl p-4 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-secondary to-accent rounded-lg flex items-center justify-center flex-shrink-0">
                    <GraduationCapIcon className="size-5 text-secondary-content" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-base-content truncate">
                      {room.roomName}
                    </h4>
                    <p className="text-sm text-base-content/60 truncate">
                      {room.faculty.fullName}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyMessagesViewer;
