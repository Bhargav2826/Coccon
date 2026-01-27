import { Link } from "react-router";
import { VideoIcon, MessageCircleIcon, GraduationCapIcon, UserPlusIcon, CheckCircleIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendFriendRequest } from "../lib/api";
import { toast } from "react-hot-toast";

const RoomMembersCard = ({ member, roomName, outgoingRequestsIds, isCurrentUser, existingFriendsIds, isLoadingFriends }) => {
  const queryClient = useQueryClient();
  const isFaculty = member.role === "faculty";
  const hasRequestBeenSent = outgoingRequestsIds.has(member._id);
  const isAlreadyFriend = existingFriendsIds.has(member._id);

  // Debug logging
  console.log(`🔍 Debug - ${member.fullName}:`, {
    memberId: member._id,
    isAlreadyFriend,
    existingFriendsIds: Array.from(existingFriendsIds)
  });

  const { mutate: sendRequestMutation, isPending } = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] });
      toast.success(`Friend request sent to ${member.fullName}!`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to send friend request");
    },
  });

  const handleSendFriendRequest = () => {
    sendRequestMutation(member._id);
  };

  return (
    <div className="card bg-base-200 hover:shadow-md transition-shadow">
      <div className="card-body p-4">
        {/* USER INFO */}
        <div className="flex items-center gap-3 mb-3">
          <div className="avatar size-12">
            <img src={member.profilePic} alt={member.fullName} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold truncate">{member.fullName}</h3>
            <div className="flex items-center gap-1 text-xs opacity-70">
              {isFaculty ? (
                <>
                  <GraduationCapIcon className="size-3" />
                  <span>Faculty</span>
                </>
              ) : (
                <span>Student</span>
              )}
            </div>
          </div>
        </div>

        {/* Room Info */}
        <div className="mb-3">
          <span className="badge badge-primary text-xs">
            {roomName}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link
            to={`/chat/${member._id}`}
            className="btn btn-outline btn-sm flex-1"
          >
            <MessageCircleIcon className="size-4 mr-1" />
            Chat
          </Link>

          <Link
            to={`/call/${member._id}`}
            className="btn btn-success btn-sm"
          >
            <VideoIcon className="size-4" />
          </Link>
        </div>

        {/* Friend Request Button - Show for all non-current users who aren't already friends */}
        {!isCurrentUser && !isAlreadyFriend && !isLoadingFriends && (
          <div className="mt-3 pt-3 border-t border-base-300">
            <button
              className={`btn w-full btn-sm ${hasRequestBeenSent ? "btn-disabled" : "btn-primary"
                }`}
              onClick={handleSendFriendRequest}
              disabled={hasRequestBeenSent || isPending}
            >
              {hasRequestBeenSent ? (
                <>
                  <CheckCircleIcon className="size-4 mr-1" />
                  Request Sent
                </>
              ) : (
                <>
                  <UserPlusIcon className="size-4 mr-1" />
                  {isFaculty ? "Connect with Teacher" : "Add Friend"}
                </>
              )}
            </button>
          </div>
        )}

        {/* Already Friends Indicator */}
        {!isCurrentUser && isAlreadyFriend && !isLoadingFriends && (
          <div className="mt-3 pt-3 border-t border-base-300">
            <div className="flex items-center justify-center gap-2 text-sm text-success">
              <CheckCircleIcon className="size-4" />
              <span>{isFaculty ? "Connected with Teacher" : "Already Friends"}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {!isCurrentUser && isLoadingFriends && (
          <div className="mt-3 pt-3 border-t border-base-300">
            <div className="flex items-center justify-center">
              <span className="loading loading-spinner loading-sm"></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomMembersCard;
