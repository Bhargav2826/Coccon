import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { acceptFriendRequest, getFriendRequests, rejectFriendRequest } from "../lib/api";
import { BellIcon, ClockIcon, MessageSquareIcon, UserCheckIcon } from "lucide-react";
import NoNotificationsFound from "../components/NoNotificationsFound";
import { ListSkeleton } from "../components/SkeletonLoaders";
import UserAvatar from "../components/UserAvatar";

const NotificationsPage = () => {
  const queryClient = useQueryClient();

  const { data: friendRequests, isLoading } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
  });

  const { mutate: acceptRequestMutation, isPending: isAccepting } = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["notificationCount"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const { mutate: rejectRequestMutation, isPending: isRejecting } = useMutation({
    mutationFn: rejectFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["notificationCount"] });
    },
  });

  const incomingRequests = friendRequests?.incomingReqs || [];
  const acceptedRequests = friendRequests?.acceptedReqs || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 p-1 sm:p-0">
      <h1 className="text-xl sm:text-3xl font-bold tracking-tight px-2 sm:px-0">Notifications</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <ListSkeleton key={i} />)}
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-10">
          {incomingRequests.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 px-2 sm:px-0 opacity-80">
                <UserCheckIcon className="h-5 w-5 text-primary" />
                Friend Requests
                <span className="badge badge-primary badge-sm sm:badge-md ml-auto sm:ml-2">{incomingRequests.length}</span>
              </h2>

              <div className="space-y-3">
                {incomingRequests.map((request) => (
                  <div
                    key={request._id}
                    className="card bg-base-200/50 backdrop-blur-sm shadow-sm border border-base-content/5 hover:border-primary/20 transition-all"
                  >
                    <div className="card-body p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <UserAvatar user={request.sender} size="md" showStatus={false} />
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-sm sm:text-base truncate">
                              {request.sender?.fullName || "Unknown User"}
                            </h3>
                            {request.sender && (
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                <span className="badge badge-secondary badge-xs py-2">
                                  {request.sender.nativeLanguage || "N/A"}
                                </span>
                                <span className="badge badge-outline badge-xs py-2 opacity-60">
                                  {request.sender.learningLanguage || "N/A"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                          <button
                            className="btn btn-primary btn-sm flex-1 sm:px-6 rounded-full"
                            onClick={() => acceptRequestMutation(request._id)}
                            disabled={isAccepting || isRejecting}
                          >
                            Accept
                          </button>
                          <button
                            className="btn btn-ghost btn-sm btn-outline border-base-content/10 flex-1 sm:px-6 rounded-full"
                            onClick={() => rejectRequestMutation(request._id)}
                            disabled={isAccepting || isRejecting}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ACCEPTED REQS NOTIFICATONS */}
          {acceptedRequests.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 px-2 sm:px-0 opacity-80">
                <BellIcon className="h-5 w-5 text-success" />
                New Connections
              </h2>

              <div className="space-y-3">
                {acceptedRequests.map((notification) => (
                  <div key={notification._id} className="card bg-base-200/30 border border-base-content/5 shadow-sm">
                    <div className="card-body p-3 sm:p-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={notification.recipient} size="sm" showStatus={false} />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-xs sm:text-sm">{notification.recipient?.fullName || "Unknown User"}</h3>
                          <p className="text-[11px] sm:text-xs opacity-70 truncate">
                            Accepted your friend request
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <div className="badge badge-success badge-xs py-2 px-2 font-bold">
                            New Friend
                          </div>
                          <p className="text-[10px] opacity-40">Recently</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {incomingRequests.length === 0 && acceptedRequests.length === 0 && (
            <div className="py-20">
              <NoNotificationsFound />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default NotificationsPage;
