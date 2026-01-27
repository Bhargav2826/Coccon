import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";
import { getFacultyRooms, createRoom, startFacultyVideoCall, deleteRoom, deleteRooms } from "../lib/api";
import { toast } from "react-hot-toast";
import {
  PlusIcon,
  UsersIcon,
  CopyIcon,
  CalendarIcon,
  CheckCircleIcon,
  MessageCircleIcon,
  VideoIcon,
  TrashIcon,
  CheckIcon,
  XIcon
} from "lucide-react";
import FacultyMessaging from "../components/FacultyMessaging";
import VideoCallLoader from "../components/VideoCallLoader";
import useVideoCallStore from "../store/useVideoCallStore";

const FacultyDashboard = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [newRoomInviteCode, setNewRoomInviteCode] = useState("");
  const [selectedRoomForMessaging, setSelectedRoomForMessaging] = useState(null);
  const [showVideoCallLoader, setShowVideoCallLoader] = useState(false);

  // Delete functionality states
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);



  // Global video call store
  const {
    currentCallUrl,
    isOpeningVideoCall,
    startVideoCall,
    setCallUrl,
    completeVideoCall,
    setOpeningVideoCall,
    canStartVideoCall
  } = useVideoCallStore();

  // Fetch faculty rooms
  const { data: roomsData, isLoading: loadingRooms, error: roomsError } = useQuery({
    queryKey: ["facultyRooms"],
    queryFn: getFacultyRooms,
  });

  // Ensure rooms is always an array
  const rooms = Array.isArray(roomsData) ? roomsData : [];

  // Debug logging
  console.log("FacultyDashboard - roomsData:", roomsData);
  console.log("FacultyDashboard - rooms:", rooms);

  // Create room mutation
  const { mutate: createRoomMutation, isPending: creatingRoom } = useMutation({
    mutationFn: createRoom,
    onSuccess: (data) => {
      toast.success("Room created successfully!");
      setNewRoomInviteCode(data.room.inviteCode);
      setRoomName("");
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["facultyRooms"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create room");
    },
  });

  // Start video call mutation
  const { mutate: startVideoCallMutation, isPending: startingVideoCall } = useMutation({
    mutationFn: startFacultyVideoCall,
    onSuccess: (data) => {
      console.log("✅ Video call started successfully:", data);

      const successMessage = data.totalSent > 0
        ? `Video call started and link sent to ${data.totalSent} members!`
        : "Video call started successfully!";

      toast.success(successMessage);

      // Show detailed results if there were failures
      if (data.totalFailed > 0) {
        console.log("⚠️ Some video call links failed to send:", data.results);
        toast.error(`${data.totalFailed} members didn't receive the video call link. Check the console for details.`);
      }

      // Store the call URL and show the video call loader
      setCallUrl(data.callUrl);
      setShowVideoCallLoader(true);
    },
    onError: (error) => {
      console.error("❌ Failed to start video call:", error);
      completeVideoCall();

      let errorMessage = "Failed to start video call";

      if (error.response?.status === 404) {
        errorMessage = "Room not found. Please refresh the page and try again.";
      } else if (error.response?.status === 403) {
        errorMessage = "You don't have permission to start video calls for this room.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (error.message?.includes("network")) {
        errorMessage = "Network error. Please check your connection and try again.";
      }

      toast.error(errorMessage);
    },
  });

  // Delete single room mutation
  const { mutate: deleteRoomMutation, isPending: deletingRoom } = useMutation({
    mutationFn: deleteRoom,
    onSuccess: () => {
      toast.success("Room deleted successfully!");
      setRoomToDelete(null);
      setShowDeleteConfirm(false);
      queryClient.invalidateQueries({ queryKey: ["facultyRooms"] });
    },
    onError: (error) => {
      if (error.response?.status === 404) {
        toast.error("Delete room functionality is not yet implemented on the backend.");
      } else {
        toast.error(error.response?.data?.message || "Failed to delete room");
      }
      setRoomToDelete(null);
      setShowDeleteConfirm(false);
    },
  });

  // Delete multiple rooms mutation
  const { mutate: deleteRoomsMutation, isPending: deletingRooms } = useMutation({
    mutationFn: deleteRooms,
    onSuccess: () => {
      const deletedCount = selectedRooms.size;
      toast.success(`${deletedCount} room${deletedCount > 1 ? 's' : ''} deleted successfully!`);
      setSelectedRooms(new Set());
      setIsDeleteMode(false);
      queryClient.invalidateQueries({ queryKey: ["facultyRooms"] });
    },
    onError: (error) => {
      if (error.response?.status === 404) {
        toast.error("Bulk delete functionality is not yet implemented on the backend.");
      } else {
        toast.error(error.response?.data?.message || "Failed to delete rooms");
      }
      setSelectedRooms(new Set());
      setIsDeleteMode(false);
    },
  });


  const handleVideoCallComplete = () => {
    setShowVideoCallLoader(false);

    // Prevent multiple tabs from being opened
    if (isOpeningVideoCall || !currentCallUrl) {
      return;
    }

    setOpeningVideoCall(true);

    console.log("🎥 Opening video call URL:", currentCallUrl);

    const newWindow = window.open(currentCallUrl, '_blank');

    // Check if the window was blocked
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      toast.error("Pop-up blocked! Please allow pop-ups and click the video call link manually.");
      // Copy the URL to clipboard as fallback
      navigator.clipboard.writeText(currentCallUrl);
      toast.success("Video call URL copied to clipboard!");
    } else {
      toast.success("Video call opened successfully!");
    }

    completeVideoCall();
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!roomName.trim()) {
      toast.error("Room name is required");
      return;
    }
    createRoomMutation({ roomName: roomName.trim() });
  };

  const copyInviteCode = (inviteCode) => {
    navigator.clipboard.writeText(inviteCode);
    toast.success("Invite code copied to clipboard!");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Delete helper functions
  const handleDeleteRoom = (room) => {
    setRoomToDelete(room);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteRoom = () => {
    if (roomToDelete) {
      deleteRoomMutation(roomToDelete._id);
    }
  };

  const handleBulkDelete = () => {
    if (selectedRooms.size === 0) {
      toast.error("Please select rooms to delete");
      return;
    }
    deleteRoomsMutation(Array.from(selectedRooms));
  };

  const toggleRoomSelection = (roomId) => {
    const newSelected = new Set(selectedRooms);
    if (newSelected.has(roomId)) {
      newSelected.delete(roomId);
    } else {
      newSelected.add(roomId);
    }
    setSelectedRooms(newSelected);
  };

  const toggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
    setSelectedRooms(new Set());
  };


  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-4 sm:flex-row sm:items-start sm:text-left sm:justify-between sm:space-y-0">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Faculty Dashboard</h1>
            <p className="text-base-content opacity-70 max-w-2xl mx-auto sm:mx-0">
              Manage your classroom chat rooms and monitor student interactions
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {isDeleteMode && (
              <>
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedRooms.size === 0 || deletingRooms}
                  className="btn btn-error w-full sm:w-auto shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  {deletingRooms ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <TrashIcon className="size-4 mr-1" />
                  )}
                  Delete Selected ({selectedRooms.size})
                </button>
                <button
                  onClick={toggleDeleteMode}
                  className="btn btn-ghost w-full sm:w-auto hover:bg-base-300 transition-all duration-200"
                >
                  <XIcon className="size-4 mr-1" />
                  Cancel
                </button>
              </>
            )}
            {!isDeleteMode && (
              <>
                <Link
                  to="/friends"
                  className="btn btn-outline w-full sm:w-auto shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  <UsersIcon className="size-4 mr-1" />
                  Friends & Messages
                </Link>
                <button
                  onClick={toggleDeleteMode}
                  className="btn btn-outline w-full sm:w-auto border-error/30 text-error hover:bg-error hover:text-error-content hover:border-error shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  <TrashIcon className="size-4 mr-1" />
                  Delete Rooms
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="btn btn-primary w-full sm:w-auto shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  disabled={creatingRoom}
                >
                  <PlusIcon className="mr-2 size-4" />
                  Create New Room
                </button>
              </>
            )}
          </div>
        </div>

        {/* Rooms List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Your Classroom Rooms</h2>
            {isDeleteMode && (
              <div className="flex items-center gap-2 bg-error/10 border border-error/20 rounded-lg px-3 py-2">
                <div className="w-2 h-2 bg-error rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-error">Delete Mode Active</span>
                <span className="text-xs text-error/70">({selectedRooms.size} selected)</span>
              </div>
            )}
          </div>

          {loadingRooms ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : roomsError ? (
            <div className="card bg-error/10 p-8 text-center">
              <h3 className="font-semibold text-lg mb-2 text-error">Error loading rooms</h3>
              <p className="text-error-content opacity-70 mb-4">
                {roomsError.message || "Failed to load your classroom rooms"}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="btn btn-error btn-outline"
              >
                Try Again
              </button>
            </div>
          ) : rooms.length === 0 ? (
            <div className="card bg-base-200 p-8 text-center">
              <UsersIcon className="size-16 mx-auto mb-4 opacity-50" />
              <h3 className="font-semibold text-lg mb-2">No rooms created yet</h3>
              <p className="text-base-content opacity-70 mb-4">
                Create your first classroom room to start managing student interactions
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary"
              >
                <PlusIcon className="mr-2 size-4" />
                Create Your First Room
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => (
                <div key={room._id} className={`card bg-base-200 hover:shadow-lg transition-all duration-300 ${isDeleteMode && selectedRooms.has(room._id)
                    ? 'ring-2 ring-error shadow-lg bg-error/5 border border-error/20'
                    : 'hover:shadow-lg'
                  }`}>
                  <div className="card-body p-6">
                    {/* Delete Mode Checkbox */}
                    {isDeleteMode && (
                      <div className="flex justify-end mb-2">
                        <div className="form-control">
                          <label className="label cursor-pointer gap-2">
                            <span className="label-text text-sm font-medium text-error">Select for deletion</span>
                            <input
                              type="checkbox"
                              className="checkbox checkbox-error checkbox-sm border-2 hover:border-error/60 transition-all duration-200"
                              checked={selectedRooms.has(room._id)}
                              onChange={() => toggleRoomSelection(room._id)}
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-semibold text-lg">{room.roomName}</h3>
                      <div className="flex items-center gap-2">
                        <div className="badge badge-primary">Active</div>
                        {!isDeleteMode && (
                          <button
                            onClick={() => handleDeleteRoom(room)}
                            className="btn btn-ghost btn-xs text-error hover:bg-error/10 hover:text-error border border-error/20 hover:border-error/40 rounded-full p-2 transition-all duration-200 hover:scale-110 shadow-sm hover:shadow-md"
                            title="Delete room"
                          >
                            <TrashIcon className="size-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center text-sm opacity-70">
                        <UsersIcon className="size-4 mr-2" />
                        {room.members?.length || 0} members
                      </div>

                      <div className="flex items-center text-sm opacity-70">
                        <CalendarIcon className="size-4 mr-2" />
                        Created {formatDate(room.createdAt)}
                      </div>

                      <div className="divider my-2"></div>

                      <div>
                        <label className="text-xs font-medium opacity-70 mb-1 block">
                          Invite Code
                        </label>
                        <div className="flex items-center gap-2">
                          <code className="bg-base-300 px-3 py-1 rounded text-sm font-mono">
                            {room.inviteCode}
                          </code>
                          <button
                            onClick={() => copyInviteCode(room.inviteCode)}
                            className="btn btn-ghost btn-xs"
                            title="Copy invite code"
                          >
                            <CopyIcon className="size-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {!isDeleteMode && (
                      <div className="card-actions justify-center sm:justify-end mt-4">
                        <button
                          className="btn btn-primary btn-sm w-full sm:w-auto"
                          onClick={() => {
                            console.log('🔍 FacultyDashboard - Setting room for messaging:', room);
                            console.log('🔍 FacultyDashboard - Room ID:', room._id);
                            setSelectedRoomForMessaging(room);
                          }}
                        >
                          <MessageCircleIcon className="size-4 mr-1" />
                          Send Message
                        </button>
                        <button
                          className="btn btn-success btn-sm w-full sm:w-auto"
                          onClick={() => {
                            console.log("🎥 FacultyDashboard - Start Video Call button clicked");

                            // Prevent multiple video calls from being started
                            if (!canStartVideoCall()) {
                              console.log("🎥 FacultyDashboard - Video call already in progress globally, ignoring click");
                              toast.error("A video call is already in progress. Please wait for it to complete.");
                              return;
                            }

                            if (startingVideoCall || showVideoCallLoader) {
                              console.log("🎥 FacultyDashboard - Video call already in progress locally, ignoring click");
                              return;
                            }

                            console.log("�� FacultyDashboard - Starting video call for room:", room._id);

                            // Set global video call state
                            startVideoCall();

                            // Start video call directly for this room
                            const callData = {
                              roomId: room._id,
                              callTitle: `${room.roomName} - Video Call`,
                              targetUserId: null // Send to all members
                            };

                            startVideoCallMutation(callData);
                          }}
                          disabled={startingVideoCall || showVideoCallLoader || !canStartVideoCall()}
                        >
                          {startingVideoCall ? (
                            <>
                              <span className="loading loading-spinner loading-xs mr-1" />
                              Starting...
                            </>
                          ) : (
                            <>
                              <VideoIcon className="size-4 mr-1" />
                              Start Video Call
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Room Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Create New Classroom Room</h3>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Room Name</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Math 101 - Period 3"
                  className="input input-bordered w-full"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  disabled={creatingRoom}
                />
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setIsModalOpen(false);
                    setRoomName("");
                  }}
                  disabled={creatingRoom}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creatingRoom || !roomName.trim()}
                >
                  {creatingRoom ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    <PlusIcon className="size-4" />
                  )}
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal for New Room */}
      {newRoomInviteCode && (
        <div className="modal modal-open">
          <div className="modal-box">
            <div className="text-center">
              <CheckCircleIcon className="size-16 text-success mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-4">Room Created Successfully!</h3>

              <div className="bg-base-200 p-4 rounded-lg mb-4">
                <label className="text-sm font-medium opacity-70 mb-2 block">
                  Share this invite code with your students:
                </label>
                <div className="flex items-center justify-center gap-2">
                  <code className="bg-base-300 px-4 py-2 rounded text-lg font-mono font-bold">
                    {newRoomInviteCode}
                  </code>
                  <button
                    onClick={() => copyInviteCode(newRoomInviteCode)}
                    className="btn btn-ghost btn-sm"
                    title="Copy invite code"
                  >
                    <CopyIcon className="size-4" />
                  </button>
                </div>
              </div>

              <p className="text-sm opacity-70 mb-4">
                Students and parents can use this code to join your classroom room.
              </p>

              <button
                className="btn btn-primary"
                onClick={() => setNewRoomInviteCode("")}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Faculty Messaging Modal */}
      {selectedRoomForMessaging && (
        <FacultyMessaging
          room={selectedRoomForMessaging}
          onClose={() => setSelectedRoomForMessaging(null)}
        />
      )}

      {/* Video Call Loader */}
      <VideoCallLoader
        isVisible={showVideoCallLoader}
        onComplete={handleVideoCallComplete}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && roomToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md bg-gradient-to-br from-base-100 to-base-200 shadow-2xl border border-error/20">
            <div className="text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-error/20 rounded-full blur-lg animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-error to-error/80 p-4 rounded-full shadow-lg">
                  <TrashIcon className="size-12 text-error-content" />
                </div>
              </div>

              <h3 className="font-bold text-2xl mb-4 text-error">Delete Room</h3>

              <div className="bg-base-200/50 rounded-xl p-4 mb-6 border border-base-300/50">
                <p className="text-base-content/80 mb-2">
                  Are you sure you want to delete
                </p>
                <p className="font-semibold text-lg text-base-content">
                  "{roomToDelete.roomName}"?
                </p>
              </div>

              <div className="bg-error/10 border border-error/20 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-error/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-error text-sm">⚠️</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-error mb-1">This action cannot be undone</p>
                    <p className="text-xs text-error/70">
                      All messages and data associated with this room will be permanently deleted.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setRoomToDelete(null);
                  }}
                  className="btn btn-ghost btn-outline border-base-300 hover:border-base-400 hover:bg-base-200 transition-all duration-200"
                  disabled={deletingRoom}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteRoom}
                  className="btn btn-error shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  disabled={deletingRoom}
                >
                  {deletingRoom ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    <TrashIcon className="size-4 mr-1" />
                  )}
                  Delete Room
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default FacultyDashboard;
