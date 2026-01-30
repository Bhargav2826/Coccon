import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  getStudentRooms,
  getRoomMembers,
  getOutgoingFriendReqs,
  getUserFriends,
} from "../lib/api";
import { Link } from "react-router";
import { UsersIcon } from "lucide-react";
import useAuthUser from "../hooks/useAuthUser";

import RoomMembersCard from "../components/RoomMembersCard";
import { MemberCardSkeleton } from "../components/SkeletonLoaders";

const HomePage = () => {
  const { authUser } = useAuthUser();
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [outgoingRequestsIds, setOutgoingRequestsIds] = useState(new Set());

  // Get user's joined rooms
  const { data: joinedRooms = [] } = useQuery({
    queryKey: ["studentRooms"],
    queryFn: getStudentRooms,
  });

  // Get room members when a room is selected
  const { data: roomMembersData, isLoading: loadingRoomMembers } = useQuery({
    queryKey: ["roomMembers", selectedRoom],
    queryFn: () => getRoomMembers(selectedRoom),
    enabled: !!selectedRoom,
  });

  // Get outgoing friend requests
  const { data: outgoingFriendReqs } = useQuery({
    queryKey: ["outgoingFriendReqs"],
    queryFn: getOutgoingFriendReqs,
  });

  // Get existing friends
  const { data: existingFriends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  // Update outgoing requests IDs when data changes
  useEffect(() => {
    const outgoingIds = new Set();
    if (outgoingFriendReqs && outgoingFriendReqs.length > 0) {
      outgoingFriendReqs.forEach((req) => {
        outgoingIds.add(req.recipient._id);
      });
      setOutgoingRequestsIds(outgoingIds);
    }
  }, [outgoingFriendReqs]);

  // Create set of existing friends IDs
  const existingFriendsIds = new Set(existingFriends.map(friend => friend._id));

  // Debug logging
  console.log("🔍 Debug - existingFriends:", existingFriends);
  console.log("🔍 Debug - existingFriendsIds:", Array.from(existingFriendsIds));
  console.log("🔍 Debug - loadingFriends:", loadingFriends);

  return (
    <div className="space-y-10">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Classroom Members</h2>
          <p className="text-sm sm:text-base opacity-70 mt-1 max-w-2xl mx-auto">
            Connect with students and faculty from your classroom rooms
          </p>
        </div>
        <Link to="/notifications" className="btn btn-outline btn-sm shadow-sm hover:shadow-md transition-all">
          <UsersIcon className="mr-2 size-4" />
          Friend Requests
        </Link>
      </div>

      {/* Room Selection */}
      {joinedRooms.length > 0 ? (
        <>
          <div className="mb-6">
            <label className="label">
              <span className="label-text">Select a classroom:</span>
            </label>
            <select
              className="select select-bordered w-full max-w-xs"
              value={selectedRoom || ""}
              onChange={(e) => setSelectedRoom(e.target.value || null)}
            >
              <option value="">Choose a classroom...</option>
              {joinedRooms.map((room) => (
                <option key={room._id} value={room._id}>
                  {room.roomName}
                </option>
              ))}
            </select>
          </div>

          {/* Room Members */}
          {selectedRoom && (
            <>
              {loadingRoomMembers ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => <MemberCardSkeleton key={i} />)}
                </div>
              ) : roomMembersData?.members?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {roomMembersData.members.map((member) => (
                    <RoomMembersCard
                      key={member._id}
                      member={member}
                      roomName={roomMembersData.roomName}
                      outgoingRequestsIds={outgoingRequestsIds}
                      isCurrentUser={member._id === authUser?._id}
                      existingFriendsIds={existingFriendsIds}
                      isLoadingFriends={loadingFriends}
                    />
                  ))}
                </div>
              ) : (
                <div className="card bg-base-200 p-6 text-center">
                  <h3 className="font-semibold text-lg mb-2">No members found</h3>
                  <p className="text-base-content opacity-70">
                    This classroom doesn't have any members yet.
                  </p>
                </div>
              )}
            </>
          )}

          {!selectedRoom && (
            <div className="card bg-base-200 p-6 text-center">
              <h3 className="font-semibold text-lg mb-2">Select a classroom</h3>
              <p className="text-base-content opacity-70">
                Choose a classroom from the dropdown above to see its members.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="card bg-base-200 p-8 text-center">
          <h3 className="font-semibold text-lg mb-2">No classrooms joined</h3>
          <p className="text-base-content opacity-70 mb-4">
            You haven't joined any classroom rooms yet.
          </p>
          <Link to="/student-dashboard" className="btn btn-primary">
            Join a Classroom
          </Link>
        </div>
      )}


    </div>
  );
};

export default HomePage;
