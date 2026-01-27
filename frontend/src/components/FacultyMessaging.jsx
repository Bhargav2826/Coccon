import React, { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { 
  sendRoomMessage, 
  sendRoomFile, 
  sendVideoCallLink,
  startFacultyVideoCall,
  getRoomMembers 
} from "../lib/api";
import { toast } from "react-hot-toast";
import { 
  SendIcon, 
  FileIcon, 
  ImageIcon, 
  VideoIcon, 
  UsersIcon, 
  UserIcon,
  UploadIcon,
  XIcon,
  MessageCircleIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  PlayIcon
} from "lucide-react";
import useVideoCallStore from "../store/useVideoCallStore";

const FacultyMessaging = ({ room, onClose }) => {
  // Debug logging for room object
  console.log('🔍 FacultyMessaging - room object:', room);
  console.log('🔍 FacultyMessaging - room._id:', room?._id);
  console.log('🔍 FacultyMessaging - room type:', typeof room);
  
  // Global video call store
  const { 
    isVideoCallInProgress, 
    canStartVideoCall,
    startVideoCall,
    completeVideoCall 
  } = useVideoCallStore();
  
  const [messageType, setMessageType] = useState("text");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState("all"); // "all" or "specific"
  const [selectedUser, setSelectedUser] = useState("");
  const [file, setFile] = useState(null);
  const [callUrl, setCallUrl] = useState("");
  const [callTitle, setCallTitle] = useState("");
  const [errors, setErrors] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef(null);

  // Validation functions
  const validateTextMessage = () => {
    const newErrors = {};
    if (!message.trim()) {
      newErrors.message = "Message is required";
    } else if (message.trim().length > 1000) {
      newErrors.message = "Message must be less than 1000 characters";
    }
    return newErrors;
  };

  const validateFile = () => {
    const newErrors = {};
    if (!file) {
      newErrors.file = "Please select a file";
    } else {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.file.size > maxSize) {
        newErrors.file = "File size must be less than 10MB";
      }
    }
    return newErrors;
  };

  const validateFileOnUpload = (selectedFile) => {
    const newErrors = {};
    if (!selectedFile) {
      newErrors.file = "Please select a file";
    } else {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (selectedFile.size > maxSize) {
        newErrors.file = "File size must be less than 10MB";
      }
    }
    return newErrors;
  };

  const validateVideoCall = () => {
    const newErrors = {};
    if (!callUrl.trim()) {
      newErrors.callUrl = "Video call URL is required";
    } else if (!isValidUrl(callUrl.trim())) {
      newErrors.callUrl = "Please enter a valid URL";
    }
    return newErrors;
  };

  const validateTargetSelection = () => {
    const newErrors = {};
    if (targetType === "specific" && !selectedUser) {
      newErrors.targetUser = "Please select a user";
    }
    return newErrors;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const clearErrors = () => {
    setErrors({});
    setValidationErrors({});
    setSuccessMessage("");
  };

  // Fetch room members
  const { data: membersData, isLoading: loadingMembers, error: membersError } = useQuery({
    queryKey: ["roomMembers", room._id],
    queryFn: () => getRoomMembers(room._id),
    enabled: !!room._id,
    retry: 2,
    onError: (error) => {
      console.error('❌ Room members query error:', error);
      toast.error("Failed to load room members. Please try again.");
    }
  });

  console.log('🔍 Room members query state:', {
    roomId: room._id,
    loadingMembers,
    membersError,
    membersData,
    membersCount: membersData?.members?.length || 0
  });

  const members = membersData?.members || [];

  // Send message mutation
  const { mutate: sendMessageMutation, isPending: sendingMessage } = useMutation({
    mutationFn: sendRoomMessage,
    onSuccess: (data) => {
      const successMsg = `Message sent successfully! (${data.totalSent} recipients)`;
      toast.success(successMsg);
      setSuccessMessage(successMsg);
      setMessage("");
      clearErrors();
      if (data.totalFailed > 0) {
        toast.error(`${data.totalFailed} messages failed to send. Check console for details.`);
        console.log("Failed message details:", data.results?.filter(r => r.status === "failed"));
      }
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Failed to send message. Please try again.";
      
      // Check if it's a Stream Chat configuration error
      if (errorMessage.includes("Stream Chat") || errorMessage.includes("not properly configured")) {
        toast.error("Stream Chat is not configured. Messages will be saved but not sent in real-time.");
      } else {
        toast.error(errorMessage);
      }
      
      setErrors({ message: errorMessage });
    },
  });

  // Send file mutation
  const { mutate: sendFileMutation, isPending: sendingFile } = useMutation({
    mutationFn: sendRoomFile,
    onSuccess: (data) => {
      console.log('✅ File upload mutation success:', data);
      const successMsg = `File sent successfully! (${data.totalSent} recipients)`;
      toast.success(successMsg);
      setSuccessMessage(successMsg);
      setFile(null);
      clearErrors();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (data.totalFailed > 0) {
        toast.error(`${data.totalFailed} files failed to send. Check console for details.`);
        console.log("Failed file details:", data.results?.filter(r => r.status === "failed"));
      }
      console.log('✅ File upload mutation completed successfully');
    },
    onError: (error) => {
      console.error('❌ File upload mutation error:', error);
      const errorMessage = error.message || 
                          error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Failed to send file. Please try again.";
      toast.error(errorMessage);
      setErrors({ file: errorMessage });
      // Clear validation errors to prevent confusion
      setValidationErrors(prev => ({ ...prev, file: undefined }));
      console.log('❌ File upload mutation failed with error:', errorMessage);
      
      // Clear the file input on error
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setFile(null);
    },
  });

  // Send video call mutation
  const { mutate: sendVideoCallMutation, isPending: sendingVideoCall } = useMutation({
    mutationFn: sendVideoCallLink,
    onSuccess: (data) => {
      const successMsg = `Video call link sent successfully! (${data.totalSent} recipients)`;
      toast.success(successMsg);
      setSuccessMessage(successMsg);
      setCallUrl("");
      setCallTitle("");
      clearErrors();
      if (data.totalFailed > 0) {
        toast.error(`${data.totalFailed} video call links failed to send. Check console for details.`);
        console.log("Failed video call details:", data.results?.filter(r => r.status === "failed"));
      }
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Failed to send video call link. Please try again.";
      toast.error(errorMessage);
      setErrors({ callUrl: errorMessage });
    },
  });

  // Start faculty video call mutation
  const { mutate: startVideoCallMutation, isPending: startingVideoCall } = useMutation({
    mutationFn: startFacultyVideoCall,
    onSuccess: (data) => {
      const successMsg = `Video call started and link sent successfully! (${data.totalSent} recipients)`;
      toast.success(successMsg);
      setSuccessMessage(successMsg);
      setCallTitle("");
      clearErrors();
      
      // Close the modal after successful video call start
      setTimeout(() => {
        onClose();
      }, 1500);
      
      if (data.totalFailed > 0) {
        toast.error(`${data.totalFailed} video call links failed to send. Check console for details.`);
        console.log("Failed video call details:", data.results?.filter(r => r.status === "failed"));
      }
    },
    onError: (error) => {
      completeVideoCall(); // Reset global state on error
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Failed to start video call. Please try again.";
      toast.error(errorMessage);
      setErrors({ callTitle: errorMessage });
    },
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    clearErrors();
    
    // Validate target selection
    const targetErrors = validateTargetSelection();
    if (Object.keys(targetErrors).length > 0) {
      setValidationErrors(targetErrors);
      toast.error("Please fix the validation errors");
      return;
    }

    // Validate message
    const messageErrors = validateTextMessage();
    if (Object.keys(messageErrors).length > 0) {
      setValidationErrors(messageErrors);
      toast.error("Please fix the validation errors");
      return;
    }

    const messageData = {
      roomId: room._id,
      message: message.trim(),
      messageType: messageType,
      targetUserId: targetType === "specific" ? selectedUser : null
    };

    sendMessageMutation(messageData);
  };

  const handleFileUpload = (e) => {
    console.log('🔍 handleFileUpload called');
    console.log('🔍 Event target files:', e.target.files);
    
    const selectedFile = e.target.files[0];
    console.log('🔍 Selected file:', selectedFile);
    
    if (selectedFile) {
      console.log('🔍 File details:', {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      });
      
      // Clear previous errors
      setValidationErrors(prev => ({ ...prev, file: undefined }));
      
      // Validate the selected file directly
      const fileErrors = validateFileOnUpload(selectedFile);
      console.log('🔍 File validation errors:', fileErrors);
      
      if (Object.keys(fileErrors).length > 0) {
        console.log('❌ File validation failed:', fileErrors);
        setValidationErrors(prev => ({ ...prev, file: fileErrors.file }));
        toast.error(fileErrors.file);
        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      // File is valid, set it in state
      console.log('✅ File is valid, setting in state');
      setFile({
        file: selectedFile,
        name: selectedFile.name,
        type: selectedFile.type.startsWith('image/') ? 'image' : 'file'
      });
      
      // Clear any existing file errors since file is now valid
      setValidationErrors(prev => ({ ...prev, file: undefined }));
    } else {
      console.log('❌ No file selected');
    }
  };

  const handleSendFile = (e) => {
    e.preventDefault();
    console.log('🔍 handleSendFile called');
    console.log('🔍 handleSendFile - room object:', room);
    console.log('🔍 handleSendFile - room._id:', room?._id);
    
    // Ensure we have a valid room ID
    if (!room || !room._id) {
      console.error('❌ No valid room ID found');
      toast.error('Room information is missing. Please try again.');
      return;
    }
    
    clearErrors();
    
    // Validate target selection
    const targetErrors = validateTargetSelection();
    if (Object.keys(targetErrors).length > 0) {
      setValidationErrors(targetErrors);
      toast.error("Please fix the validation errors");
      return;
    }

    // Validate file
    const fileErrors = validateFile();
    if (Object.keys(fileErrors).length > 0) {
      setValidationErrors(fileErrors);
      toast.error("Please fix the validation errors");
      return;
    }

    console.log('🔍 Creating FormData with file:', {
      fileName: file.file.name,
      fileSize: file.file.size,
      fileType: file.file.type,
      roomId: room._id,
      targetUserId: targetType === "specific" ? selectedUser : null
    });

    const formData = new FormData();
    formData.append('file', file.file);
    
    // Ensure room ID is properly converted to string
    const roomId = room._id?.toString();
    if (!roomId) {
      console.error('❌ Room ID is invalid');
      toast.error('Invalid room information. Please try again.');
      return;
    }
    
    formData.append('roomId', roomId);
    if (targetType === "specific" && selectedUser) {
      formData.append('targetUserId', selectedUser.toString());
    }

    console.log('🔍 Calling sendFileMutation');
    sendFileMutation(formData);
  };

  const handleSendVideoCall = (e) => {
    e.preventDefault();
    clearErrors();
    
    // Validate target selection
    const targetErrors = validateTargetSelection();
    if (Object.keys(targetErrors).length > 0) {
      setValidationErrors(targetErrors);
      toast.error("Please fix the validation errors");
      return;
    }

    // Validate video call URL
    const videoCallErrors = validateVideoCall();
    if (Object.keys(videoCallErrors).length > 0) {
      setValidationErrors(videoCallErrors);
      toast.error("Please fix the validation errors");
      return;
    }

    const callData = {
      roomId: room._id,
      callUrl: callUrl.trim(),
      callTitle: callTitle.trim() || "Video Call",
      targetUserId: targetType === "specific" ? selectedUser : null
    };

    sendVideoCallMutation(callData);
  };

  const handleStartVideoCall = (e) => {
    e.preventDefault();
    console.log("🎥 FacultyMessaging - Start Video Call button clicked");
    
    // Check if a video call is already in progress (global check)
    if (!canStartVideoCall()) {
      console.log("🎥 FacultyMessaging - Video call already in progress globally, ignoring click");
      toast.error("A video call is already in progress. Please wait for it to complete.");
      return;
    }
    
    if (startingVideoCall) {
      console.log("🎥 FacultyMessaging - Video call already in progress locally, ignoring click");
      return;
    }
    
    clearErrors();
    
    // Validate target selection
    const targetErrors = validateTargetSelection();
    if (Object.keys(targetErrors).length > 0) {
      setValidationErrors(targetErrors);
      toast.error("Please fix the validation errors");
      return;
    }

    console.log("🎥 FacultyMessaging - Starting video call for room:", room._id);
    
    // Set global video call state
    startVideoCall();

    const callData = {
      roomId: room._id,
      callTitle: callTitle.trim() || "Faculty Video Call",
      targetUserId: targetType === "specific" ? selectedUser : null
    };

    startVideoCallMutation(callData);
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isSending = sendingMessage || sendingFile || sendingVideoCall || startingVideoCall;

  // Debug log for loading state
  useEffect(() => {
    console.log('🔄 Loading state changed:', {
      sendingMessage,
      sendingFile,
      sendingVideoCall,
      startingVideoCall,
      isSending
    });
  }, [sendingMessage, sendingFile, sendingVideoCall, startingVideoCall, isSending]);

  // Auto-clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Clear validation errors when message type changes
  useEffect(() => {
    clearErrors();
  }, [messageType]);

  return (
    <div className="modal modal-open">
      <div className="modal-box w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="font-bold text-lg sm:text-xl">Send Message to {room.roomName}</h3>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
            disabled={isSending}
          >
            <XIcon className="size-4 sm:size-5" />
          </button>
        </div>

        {/* Message Type Selector */}
        <div className="tabs tabs-boxed mb-4 sm:mb-6 overflow-x-auto">
          <button
            className={`tab flex-shrink-0 ${messageType === "text" ? "tab-active" : ""}`}
            onClick={() => setMessageType("text")}
            disabled={isSending}
          >
            <MessageCircleIcon className="size-3 sm:size-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Text Message</span>
            <span className="sm:hidden">Text</span>
          </button>
          <button
            className={`tab flex-shrink-0 ${messageType === "file" ? "tab-active" : ""}`}
            onClick={() => setMessageType("file")}
            disabled={isSending}
          >
            <FileIcon className="size-3 sm:size-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">File/Image</span>
            <span className="sm:hidden">File</span>
          </button>
          <button
            className={`tab flex-shrink-0 ${messageType === "video" ? "tab-active" : ""}`}
            onClick={() => setMessageType("video")}
            disabled={isSending}
          >
            <VideoIcon className="size-3 sm:size-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Video Call Link</span>
            <span className="sm:hidden">Link</span>
          </button>
          <button
            className={`tab flex-shrink-0 ${messageType === "start-video" ? "tab-active" : ""}`}
            onClick={() => setMessageType("start-video")}
            disabled={isSending}
          >
            <PlayIcon className="size-3 sm:size-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Start Video Call</span>
            <span className="sm:hidden">Start</span>
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="alert alert-success mb-4">
            <CheckCircleIcon className="size-5" />
            <div>
              <h3 className="font-bold">Success!</h3>
              <p>{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {(() => {
          const hasErrors = Object.keys(errors).length > 0;
          const hasValidationErrors = Object.entries(validationErrors).some(([key, error]) => {
            // Only count file validation errors when on file tab
            if (key === 'file' && messageType !== 'file') {
              return false;
            }
            // Only count message validation errors when on text tab
            if (key === 'message' && messageType !== 'text') {
              return false;
            }
            // Only count callUrl validation errors when on video tab
            if (key === 'callUrl' && messageType !== 'video') {
              return false;
            }
            return true;
          });
          
          if (!hasErrors && !hasValidationErrors) {
            return null;
          }
          
          return (
            <div className="alert alert-error mb-4">
              <AlertCircleIcon className="size-5" />
              <div>
                <h3 className="font-bold">Please fix the following errors:</h3>
                <ul className="list-disc list-inside mt-1">
                  {Object.values(errors).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {Object.entries(validationErrors).map(([key, error], index) => {
                    // Only show file validation errors when on file tab
                    if (key === 'file' && messageType !== 'file') {
                      return null;
                    }
                    // Only show message validation errors when on text tab
                    if (key === 'message' && messageType !== 'text') {
                      return null;
                    }
                    // Only show callUrl validation errors when on video tab
                    if (key === 'callUrl' && messageType !== 'video') {
                      return null;
                    }
                    return <li key={index}>{error}</li>;
                  }).filter(Boolean)}
                </ul>
              </div>
            </div>
          );
        })()}

        {/* Target Selection */}
        <div className="form-control mb-6">
          <label className="label">
            <span className="label-text font-medium">Send to:</span>
          </label>
          <div className="flex gap-4">
            <label className="label cursor-pointer">
              <input
                type="radio"
                name="targetType"
                className="radio radio-primary mr-2"
                checked={targetType === "all"}
                onChange={() => setTargetType("all")}
                disabled={isSending}
              />
              <span className="label-text flex items-center">
                <UsersIcon className="size-4 mr-1" />
                All Room Members ({members.length})
              </span>
            </label>
            <label className="label cursor-pointer">
              <input
                type="radio"
                name="targetType"
                className="radio radio-primary mr-2"
                checked={targetType === "specific"}
                onChange={() => setTargetType("specific")}
                disabled={isSending}
              />
              <span className="label-text flex items-center">
                <UserIcon className="size-4 mr-1" />
                Specific User
              </span>
            </label>
          </div>
          {validationErrors.targetUser && (
            <label className="label">
              <span className="label-text-alt text-error flex items-center gap-1">
                <AlertCircleIcon className="size-3" />
                {validationErrors.targetUser}
              </span>
            </label>
          )}
        </div>

        {/* Specific User Selection */}
        {targetType === "specific" && (
          <div className="form-control mb-6">
            <label className="label">
              <span className="label-text font-medium">Select User:</span>
            </label>
            <select
              className={`select select-bordered w-full ${validationErrors.targetUser ? 'select-error' : ''}`}
              value={selectedUser}
              onChange={(e) => {
                setSelectedUser(e.target.value);
                if (validationErrors.targetUser) {
                  setValidationErrors(prev => ({ ...prev, targetUser: undefined }));
                }
              }}
              disabled={isSending || loadingMembers}
            >
              <option value="">Choose a user...</option>
              {members.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.fullName} {member.isFaculty ? "(Faculty)" : ""}
                </option>
              ))}
            </select>
            {loadingMembers && (
              <label className="label">
                <span className="label-text-alt">Loading members...</span>
              </label>
            )}
            {membersError && (
              <label className="label">
                <span className="label-text-alt text-error">Failed to load members</span>
              </label>
            )}
          </div>
        )}

        {/* Text Message Form */}
        {messageType === "text" && (
          <form onSubmit={handleSendMessage} className="space-y-3 sm:space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Message:</span>
              </label>
              <textarea
                className={`textarea textarea-bordered h-24 ${validationErrors.message ? 'textarea-error' : ''}`}
                placeholder="Enter your message..."
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (validationErrors.message) {
                    setValidationErrors(prev => ({ ...prev, message: undefined }));
                  }
                }}
                disabled={isSending}
              />
              {validationErrors.message && (
                <label className="label">
                  <span className="label-text-alt text-error flex items-center gap-1">
                    <AlertCircleIcon className="size-3" />
                    {validationErrors.message}
                  </span>
                </label>
              )}
              <label className="label">
                <span className="label-text-alt">
                  {message.length}/1000 characters
                </span>
              </label>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onClose}
                disabled={isSending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSending || !message.trim()}
              >
                {sendingMessage ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <SendIcon className="size-4" />
                )}
                Send Message
              </button>
            </div>
          </form>
        )}

        {/* File Upload Form */}
        {messageType === "file" && (
          <form onSubmit={handleSendFile} className="space-y-3 sm:space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Select File:</span>
              </label>
                             <input
                 ref={fileInputRef}
                 type="file"
                 className={`file-input file-input-bordered w-full ${validationErrors.file ? 'file-input-error' : ''}`}
                 onChange={handleFileUpload}
                 disabled={isSending}
               />
              {validationErrors.file && (
                <label className="label">
                  <span className="label-text-alt text-error flex items-center gap-1">
                    <AlertCircleIcon className="size-3" />
                    {validationErrors.file}
                  </span>
                </label>
              )}
                             <label className="label">
                 <span className="label-text-alt">
                   All file types supported (Max 10MB)
                 </span>
               </label>
            </div>

            {file && (
              <div className="bg-base-200 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {file.type === 'image' ? (
                      <ImageIcon className="size-5 text-primary" />
                    ) : (
                      <FileIcon className="size-5 text-primary" />
                    )}
                    <span className="font-medium">{file.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="btn btn-ghost btn-sm"
                    disabled={isSending}
                  >
                    <XIcon className="size-4" />
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onClose}
                disabled={isSending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSending || !file}
              >
                {sendingFile ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <UploadIcon className="size-4" />
                )}
                Send File
              </button>
            </div>
          </form>
        )}

        {/* Video Call Form */}
        {messageType === "video" && (
          <form onSubmit={handleSendVideoCall} className="space-y-3 sm:space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Video Call Title (Optional):</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                placeholder="e.g., Math Class - Chapter 5 Review"
                value={callTitle}
                onChange={(e) => setCallTitle(e.target.value)}
                disabled={isSending}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Video Call URL:</span>
              </label>
              <input
                type="url"
                className={`input input-bordered ${validationErrors.callUrl ? 'input-error' : ''}`}
                placeholder="https://meet.google.com/xxx-xxxx-xxx or your video call link"
                value={callUrl}
                onChange={(e) => {
                  setCallUrl(e.target.value);
                  if (validationErrors.callUrl) {
                    setValidationErrors(prev => ({ ...prev, callUrl: undefined }));
                  }
                }}
                disabled={isSending}
                required
              />
              {validationErrors.callUrl && (
                <label className="label">
                  <span className="label-text-alt text-error flex items-center gap-1">
                    <AlertCircleIcon className="size-3" />
                    {validationErrors.callUrl}
                  </span>
                </label>
              )}
              <label className="label">
                <span className="label-text-alt">
                  Enter the video call link you want to share
                </span>
              </label>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onClose}
                disabled={isSending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSending || !callUrl.trim()}
              >
                {sendingVideoCall ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <VideoIcon className="size-4" />
                )}
                Send Video Call Link
              </button>
            </div>
          </form>
        )}

        {/* Start Video Call Form */}
        {messageType === "start-video" && (
          <form onSubmit={handleStartVideoCall} className="space-y-3 sm:space-y-4">
            <div className="alert alert-info">
              <VideoIcon className="size-5" />
              <div>
                <h3 className="font-bold">Start Video Call</h3>
                <p>This will automatically generate a video call link and send it to selected classroom members. The video call will open in a new tab.</p>
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Video Call Title (Optional):</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                placeholder="e.g., Math Class - Chapter 5 Review"
                value={callTitle}
                onChange={(e) => setCallTitle(e.target.value)}
                disabled={isSending}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onClose}
                disabled={isSending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-success"
                disabled={isSending}
              >
                {startingVideoCall ? (
                  <>
                    <span className="loading loading-spinner loading-sm mr-1" />
                    Starting Video Call...
                  </>
                ) : (
                  <>
                    <PlayIcon className="size-4 mr-1" />
                    Start Video Call & Send Link
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FacultyMessaging;
