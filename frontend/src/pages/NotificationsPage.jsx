import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { acceptFriendRequest, getFriendRequests, rejectFriendRequest } from "../lib/api";
import { BellIcon, ClockIcon, MessageSquareIcon, UserCheckIcon } from "lucide-react";
import NoNotificationsFound from "../components/NoNotificationsFound";

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
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-4xl space-y-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">Notifications</h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <>
            {incomingRequests.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <UserCheckIcon className="h-5 w-5 text-primary" />
                  Friend Requests
                  <span className="badge badge-primary ml-2">{incomingRequests.length}</span>
                </h2>

                <div className="space-y-3">
                  {incomingRequests.map((request) => (
                    <div
                      key={request._id}
                      className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="card-body p-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="avatar w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-base-300">
                              <img
                                src={request.sender?.profilePic || "/avatar.png"}
                                alt={request.sender?.fullName || "User"}
                              />
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm sm:text-base">
                                {request.sender?.fullName || "Unknown User"}
                              </h3>
                              {request.sender && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  <span className="badge badge-secondary badge-xs sm:badge-sm">
                                    Native: {request.sender.nativeLanguage || "N/A"}
                                  </span>
                                  <span className="badge badge-outline badge-xs sm:badge-sm">
                                    Learning: {request.sender.learningLanguage || "N/A"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2 w-full sm:w-auto">
                            <button
                              className="btn btn-primary btn-sm flex-1 sm:flex-none"
                              onClick={() => acceptRequestMutation(request._id)}
                              disabled={isAccepting || isRejecting}
                            >
                              Accept
                            </button>
                            <button
                              className="btn btn-ghost btn-sm btn-outline border-base-content/20 flex-1 sm:flex-none"
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
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <BellIcon className="h-5 w-5 text-success" />
                  New Connections
                </h2>

                <div className="space-y-3">
                  {acceptedRequests.map((notification) => (
                    <div key={notification._id} className="card bg-base-200 shadow-sm">
                      <div className="card-body p-4">
                        <div className="flex items-start gap-3">
                          <div className="avatar mt-1 size-8 sm:size-10 rounded-full">
                            <img
                              src={notification.recipient?.profilePic || "/avatar.png"}
                              alt={notification.recipient?.fullName || "User"}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base">{notification.recipient?.fullName || "Unknown User"}</h3>
                            <p className="text-xs sm:text-sm my-1">
                              {notification.recipient?.fullName || "Unknown User"} accepted your friend request
                            </p>
                            <p className="text-xs flex items-center opacity-70">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              Recently
                            </p>
                          </div>
                          <div className="badge badge-success badge-sm">
                            <MessageSquareIcon className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">New Friend</span>
                            <span className="sm:hidden">Friend</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {incomingRequests.length === 0 && acceptedRequests.length === 0 && (
              <NoNotificationsFound />
            )}
          </>
        )}
      </div>
    </div>
  );
};
export default NotificationsPage;
