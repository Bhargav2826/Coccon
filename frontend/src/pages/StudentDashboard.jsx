import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";
import { useLinkCode, getLinkedAccounts, joinRoom, getStudentRooms } from "../lib/api";
import { toast } from "react-hot-toast";
import {
  UsersIcon,
  KeyIcon,
  ShieldIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  UserIcon,
  UserIcon,
  GraduationCapIcon,
  VideoIcon
} from "lucide-react";
import { DashboardCardSkeleton } from "../components/SkeletonLoaders";

const StudentDashboard = () => {
  const queryClient = useQueryClient();
  const [linkCode, setLinkCode] = useState("");
  const [roomInviteCode, setRoomInviteCode] = useState("");

  // Fetch linked accounts (parents)
  const { data: linkedAccounts = [], isLoading: loadingLinkedAccounts } = useQuery({
    queryKey: ["linkedAccounts"],
    queryFn: getLinkedAccounts,
  });

  // Fetch student's joined rooms
  const { data: joinedRooms = [], isLoading: loadingJoinedRooms, error: roomsError } = useQuery({
    queryKey: ["studentRooms"],
    queryFn: getStudentRooms,
  });



  // Debug logging
  console.log("StudentDashboard - joinedRooms:", joinedRooms);
  console.log("StudentDashboard - loadingJoinedRooms:", loadingJoinedRooms);
  console.log("StudentDashboard - roomsError:", roomsError);

  // Use link code mutation
  const { mutate: linkCodeMutation, isPending: linkingAccount } = useMutation({
    mutationFn: useLinkCode,
    onSuccess: (data) => {
      toast.success(`Successfully linked to ${data.parent.fullName}!`);
      setLinkCode("");
      queryClient.invalidateQueries({ queryKey: ["linkedAccounts"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to link account");
    },
  });

  // Join room mutation
  const { mutate: joinRoomMutation, isPending: joiningRoom } = useMutation({
    mutationFn: joinRoom,
    onSuccess: (data) => {
      toast.success(`Successfully joined room: ${data.room.roomName}!`);
      setRoomInviteCode("");
      queryClient.invalidateQueries({ queryKey: ["studentRooms"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to join room");
    },
  });

  const handleLinkParent = (e) => {
    e.preventDefault();
    if (!linkCode.trim()) {
      toast.error("Please enter a link code");
      return;
    }
    linkCodeMutation(linkCode.trim());
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!roomInviteCode.trim()) {
      toast.error("Please enter an invite code");
      return;
    }
    joinRoomMutation(roomInviteCode.trim());
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Student Dashboard</h1>
          <p className="text-sm sm:text-base text-base-content opacity-70 mt-2">
            Manage your account and link with your parent for safe online communication
          </p>
        </div>
        <Link
          to="/friends"
          className="btn btn-outline shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          <UsersIcon className="size-4 mr-1" />
          Friends & Messages
        </Link>
      </div>

      {/* Link Parent Account Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <KeyIcon className="size-6" />
          <h2 className="text-2xl font-semibold">Link Parent Account</h2>
        </div>

        <div className="card bg-base-200">
          <div className="card-body p-6">
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-base-content opacity-70 mb-4">
                  Enter the 6-digit code provided by your parent to link your accounts
                </p>
              </div>

              <form onSubmit={handleLinkParent} className="space-y-4">
                <div>
                  <label className="label">
                    <span className="label-text">Link Code</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    className="input input-bordered w-full text-center text-lg font-mono"
                    value={linkCode}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow digits and limit to 6 characters
                      const digitsOnly = value.replace(/\D/g, '');
                      setLinkCode(digitsOnly.slice(0, 6));
                    }}
                    disabled={linkingAccount}
                    maxLength={6}
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                  <label className="label">
                    <span className="label-text-alt">
                      Enter the 6-digit code from your parent
                    </span>
                  </label>
                </div>

                <div className="text-center">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={linkingAccount || linkCode.length !== 6}
                  >
                    {linkingAccount ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      <KeyIcon className="size-4" />
                    )}
                    Link Parent Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Join Classroom Room Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <GraduationCapIcon className="size-6" />
          <h2 className="text-2xl font-semibold">Join Classroom Room</h2>
        </div>

        <div className="card bg-base-200">
          <div className="card-body p-6">
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-base-content opacity-70 mb-4">
                  Enter the 6-character invite code provided by your teacher to join their classroom room
                </p>
              </div>

              <form onSubmit={handleJoinRoom} className="space-y-4">
                <div>
                  <label className="label">
                    <span className="label-text">Room Invite Code</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter 6-character code (e.g., ABC123)"
                    className="input input-bordered w-full text-center text-lg font-mono"
                    value={roomInviteCode}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow uppercase letters and numbers, limit to 6 characters
                      const alphanumericOnly = value.replace(/[^A-Z0-9]/g, '').toUpperCase();
                      setRoomInviteCode(alphanumericOnly.slice(0, 6));
                    }}
                    disabled={joiningRoom}
                    maxLength={6}
                    pattern="[A-Z0-9]*"
                  />
                  <label className="label">
                    <span className="label-text-alt">
                      Enter the 6-character code from your teacher
                    </span>
                  </label>
                </div>

                <div className="text-center">
                  <button
                    type="submit"
                    className="btn btn-secondary"
                    disabled={joiningRoom || roomInviteCode.length !== 6}
                  >
                    {joiningRoom ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      <GraduationCapIcon className="size-4" />
                    )}
                    Join Classroom Room
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>



      {/* Joined Rooms Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <GraduationCapIcon className="size-6" />
          <h2 className="text-2xl font-semibold">Your Classroom Rooms</h2>
        </div>

        {loadingJoinedRooms ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <DashboardCardSkeleton key={i} />)}
          </div>
        ) : roomsError ? (
          <div className="card bg-error/10 p-8 text-center">
            <h3 className="font-semibold text-lg mb-2 text-error">Error loading rooms</h3>
            <p className="text-error-content opacity-70 mb-4">
              {roomsError.message || "Failed to load your joined rooms"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-error btn-outline"
            >
              Try Again
            </button>
          </div>
        ) : joinedRooms.length === 0 ? (
          <div className="card bg-base-200 p-8 text-center">
            <GraduationCapIcon className="size-16 mx-auto mb-4 opacity-50" />
            <h3 className="font-semibold text-lg mb-2">No classroom rooms joined yet</h3>
            <p className="text-base-content opacity-70 mb-4">
              Join a classroom room using the invite code from your teacher
            </p>
            <div className="text-sm opacity-70">
              <p>• Ask your teacher for the 6-character invite code</p>
              <p>• Enter the code above to join the classroom</p>
              <p>• Participate in safe, monitored classroom discussions</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {joinedRooms.map((room) => (
              <div key={room._id} className="card bg-base-200">
                <div className="card-body p-6">
                  <div className="flex items-center gap-3">
                    <div className="avatar">
                      <div className="w-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <GraduationCapIcon className="size-6 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{room.roomName}</h3>
                      <p className="text-sm opacity-70">Teacher: {room.faculty.fullName}</p>
                      {room.activeCall ? (
                        <Link
                          to={`/call/${room.activeCall.callId}`}
                          className="btn btn-success btn-xs mt-2 w-full animate-pulse shadow-md hover:shadow-lg transition-all"
                        >
                          <VideoIcon className="size-3 mr-1" />
                          Join Live Class
                        </Link>
                      ) : (
                        <div className="flex items-center gap-1 mt-1">
                          <CheckCircleIcon className="size-4 text-success" />
                          <span className="text-xs text-success">Joined</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Linked Parents Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <ShieldIcon className="size-6" />
          <h2 className="text-2xl font-semibold">Your Linked Parents</h2>
        </div>

        {loadingLinkedAccounts ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <DashboardCardSkeleton key={i} />)}
          </div>
        ) : linkedAccounts.length === 0 ? (
          <div className="card bg-base-200 p-8 text-center">
            <UserIcon className="size-16 mx-auto mb-4 opacity-50" />
            <h3 className="font-semibold text-lg mb-2">No parents linked yet</h3>
            <p className="text-base-content opacity-70 mb-4">
              Link your parent's account to enable safe communication monitoring
            </p>
            <div className="text-sm opacity-70">
              <p>• Your parent will be able to monitor your conversations</p>
              <p>• AI analysis will help ensure your online safety</p>
              <p>• Only your parent can access your conversation insights</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {linkedAccounts.map((parent) => (
              <div key={parent._id} className="card bg-base-200">
                <div className="card-body p-6">
                  <div className="flex items-center gap-3">
                    <div className="avatar">
                      <div className="w-12 rounded-full">
                        <img src={parent.profilePic} alt={parent.fullName} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{parent.fullName}</h3>
                      <p className="text-sm opacity-70">{parent.email}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <CheckCircleIcon className="size-4 text-success" />
                        <span className="text-xs text-success">Linked</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Safety Information */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <ShieldIcon className="size-6" />
          <h2 className="text-2xl font-semibold">Online Safety</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card bg-base-200">
            <div className="card-body p-6">
              <div className="flex items-center gap-3 mb-3">
                <ShieldIcon className="size-6 text-primary" />
                <h3 className="font-semibold">AI Protection</h3>
              </div>
              <p className="text-sm opacity-70">
                Our AI system analyzes your conversations to detect potential safety concerns
                and provides insights to your parent while respecting your privacy.
              </p>
            </div>
          </div>

          <div className="card bg-base-200">
            <div className="card-body p-6">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircleIcon className="size-6 text-success" />
                <h3 className="font-semibold">Safe Communication</h3>
              </div>
              <p className="text-sm opacity-70">
                Your parent can monitor your conversations to ensure you're safe online
                while maintaining appropriate boundaries and privacy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
