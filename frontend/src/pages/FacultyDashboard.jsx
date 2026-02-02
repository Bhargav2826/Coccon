import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
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
import { CardSkeleton } from "../components/SkeletonLoaders";

const FacultyDashboard = () => {
  const navigate = useNavigate();
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
      const successMessage = data.totalSent > 0
        ? `Video call started and link sent to ${data.totalSent} members!`
        : "Video call started successfully!";
      toast.success(successMessage);
      setCallUrl(data.callUrl);
      setShowVideoCallLoader(true);
    },
    onError: (error) => {
      completeVideoCall();
      toast.error(error.response?.data?.message || "Failed to start video call");
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
      toast.error("Failed to delete room");
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
      toast.error("Failed to delete rooms");
      setSelectedRooms(new Set());
      setIsDeleteMode(false);
    },
  });

  const handleVideoCallComplete = () => {
    setShowVideoCallLoader(false);
    if (isOpeningVideoCall || !currentCallUrl) return;
    setOpeningVideoCall(true);

    try {
      const url = new URL(currentCallUrl);
      const callPath = url.pathname; // Gets /call/callId
      navigate(`${callPath}?initiating=true`, { state: { initiating: true } });
    } catch (e) {
      // Fallback if URL is invalid
      window.open(currentCallUrl, '_blank');
    }

    completeVideoCall();
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!roomName.trim()) return;
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

  const handleDeleteRoom = (room) => {
    setRoomToDelete(room);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteRoom = () => {
    if (roomToDelete) deleteRoomMutation(roomToDelete._id);
  };

  const handleBulkDelete = () => {
    if (selectedRooms.size === 0) return;
    deleteRoomsMutation(Array.from(selectedRooms));
  };

  const toggleRoomSelection = (roomId) => {
    const newSelected = new Set(selectedRooms);
    if (newSelected.has(roomId)) newSelected.delete(roomId);
    else newSelected.add(roomId);
    setSelectedRooms(newSelected);
  };

  const toggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
    setSelectedRooms(new Set());
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-4 sm:flex-row sm:items-start sm:text-left sm:justify-between sm:space-y-0">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Faculty Dashboard</h1>
          <p className="text-sm sm:text-base text-base-content opacity-70 max-w-2xl mx-auto sm:mx-0">
            Manage your classroom chat rooms and monitor student interactions
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {isDeleteMode && (
            <>
              <button onClick={handleBulkDelete} disabled={selectedRooms.size === 0 || deletingRooms} className="btn btn-error w-full sm:w-auto">
                {deletingRooms ? <span className="loading loading-spinner loading-xs" /> : <TrashIcon className="size-4 mr-1" />}
                Delete Selected ({selectedRooms.size})
              </button>
              <button onClick={toggleDeleteMode} className="btn btn-ghost w-full sm:w-auto">
                <XIcon className="size-4 mr-1" /> Cancel
              </button>
            </>
          )}
          {!isDeleteMode && (
            <>
              <Link to="/friends" className="btn btn-outline w-full sm:w-auto">
                <UsersIcon className="size-4 mr-1" /> Friends & Messages
              </Link>
              <button onClick={toggleDeleteMode} className="btn btn-outline w-full sm:w-auto border-error/30 text-error hover:bg-error hover:text-error-content">
                <TrashIcon className="size-4 mr-1" /> Delete Rooms
              </button>
              <button onClick={() => setIsModalOpen(true)} className="btn btn-primary w-full sm:w-auto">
                <PlusIcon className="mr-2 size-4" /> Create New Room
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
            </div>
          )}
        </div>

        {loadingRooms ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
          </div>
        ) : roomsError ? (
          <div className="card bg-error/10 p-8 text-center text-error">
            <h3 className="font-semibold text-lg mb-2">Error loading rooms</h3>
            <button onClick={() => window.location.reload()} className="btn btn-error btn-outline mt-4">Try Again</button>
          </div>
        ) : rooms.length === 0 ? (
          <div className="card bg-base-200 p-8 text-center">
            <UsersIcon className="size-16 mx-auto mb-4 opacity-50" />
            <h3 className="font-semibold text-lg mb-2">No rooms created yet</h3>
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary mt-4">Create Your First Room</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div key={room._id} className={`card bg-base-200 hover:shadow-lg transition-all ${isDeleteMode && selectedRooms.has(room._id) ? 'ring-2 ring-error bg-error/5' : ''}`}>
                <div className="card-body p-6">
                  {isDeleteMode && (
                    <div className="flex justify-end mb-2">
                      <input type="checkbox" className="checkbox checkbox-error checkbox-sm" checked={selectedRooms.has(room._id)} onChange={() => toggleRoomSelection(room._id)} />
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-lg">{room.roomName}</h3>
                    {!isDeleteMode && (
                      <button onClick={() => handleDeleteRoom(room)} className="btn btn-ghost btn-xs text-error p-2 rounded-full">
                        <TrashIcon className="size-3" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-3 text-sm opacity-70">
                    <div className="flex items-center"><UsersIcon className="size-4 mr-2" />{room.members?.length || 0} members</div>
                    <div className="flex items-center"><CalendarIcon className="size-4 mr-2" />Created {formatDate(room.createdAt)}</div>
                  </div>
                  <div className="divider my-2"></div>
                  <div>
                    <label className="text-xs font-medium opacity-70 mb-1 block">Invite Code</label>
                    <div className="flex items-center gap-2">
                      <code className="bg-base-300 px-3 py-1 rounded text-sm font-mono">{room.inviteCode}</code>
                      <button onClick={() => copyInviteCode(room.inviteCode)} className="btn btn-ghost btn-xs"><CopyIcon className="size-3" /></button>
                    </div>
                  </div>
                  {!isDeleteMode && (
                    <div className="card-actions justify-end mt-4">
                      <button className="btn btn-primary btn-sm" onClick={() => setSelectedRoomForMessaging(room)}>
                        <MessageCircleIcon className="size-4 mr-1" /> Send Message
                      </button>
                      <button className="btn btn-success btn-sm" onClick={() => {
                        if (!canStartVideoCall()) return toast.error("A video call is already in progress.");
                        startVideoCall();
                        startVideoCallMutation({ roomId: room._id, callTitle: `${room.roomName} - Video Call` });
                      }} disabled={startingVideoCall || showVideoCallLoader || !canStartVideoCall()}>
                        {startingVideoCall ? <span className="loading loading-spinner loading-xs" /> : <VideoIcon className="size-4 mr-1" />}
                        Start Video Call
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Create New Room</h3>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <input type="text" placeholder="Room Name" className="input input-bordered w-full" value={roomName} onChange={(e) => setRoomName(e.target.value)} disabled={creatingRoom} />
              <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creatingRoom || !roomName.trim()}>
                  {creatingRoom ? <span className="loading loading-spinner loading-sm" /> : <PlusIcon className="size-4" />} Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {newRoomInviteCode && (
        <div className="modal modal-open">
          <div className="modal-box text-center">
            <CheckCircleIcon className="size-16 text-success mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-4">Room Created!</h3>
            <div className="bg-base-200 p-4 rounded-lg mb-4">
              <code className="text-lg font-mono font-bold">{newRoomInviteCode}</code>
              <button onClick={() => copyInviteCode(newRoomInviteCode)} className="btn btn-ghost btn-sm ml-2"><CopyIcon className="size-4" /></button>
            </div>
            <button className="btn btn-primary" onClick={() => setNewRoomInviteCode("")}>Got it!</button>
          </div>
        </div>
      )}

      {selectedRoomForMessaging && (
        <FacultyMessaging room={selectedRoomForMessaging} onClose={() => setSelectedRoomForMessaging(null)} />
      )}

      <VideoCallLoader isVisible={showVideoCallLoader} onComplete={handleVideoCallComplete} />

      {showDeleteConfirm && roomToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md text-center">
            <TrashIcon className="size-12 text-error mx-auto mb-4" />
            <h3 className="font-bold text-2xl mb-4 text-error">Delete Room</h3>
            <p className="mb-6">Are you sure you want to delete <strong>"{roomToDelete.roomName}"</strong>? This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-outline">Cancel</button>
              <button onClick={confirmDeleteRoom} className="btn btn-error" disabled={deletingRoom}>
                {deletingRoom ? <span className="loading loading-spinner loading-sm" /> : "Delete Room"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;
