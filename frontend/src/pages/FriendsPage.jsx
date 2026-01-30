import { useQuery } from "@tanstack/react-query";
import { getUserFriends } from "../lib/api";
import { Link } from "react-router";
import { UsersIcon } from "lucide-react";
import FriendCard from "../components/FriendCard";
import NoFriendsFound from "../components/NoFriendsFound";
import BackButton from "../components/BackButton";
import { MemberCardSkeleton } from "../components/SkeletonLoaders";

const FriendsPage = () => {
  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  return (
    <div className="relative">
      {/* Back Button - Responsive positioning */}
      <div className="absolute -top-2 left-0 sm:top-2 sm:left-2 z-10">
        <BackButton
          className="hover:bg-base-200/50 rounded-full p-2 transition-all duration-300 shadow-md"
          variant="outline"
          size="sm"
        />
      </div>

      <div className="space-y-10 pt-12 sm:pt-16">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Your Friends</h2>
            <p className="text-sm sm:text-base opacity-70 mt-1 max-w-2xl mx-auto">
              Connect with your accepted friends for chat and video calls
            </p>
          </div>
          <Link to="/notifications" className="btn btn-outline btn-sm shadow-sm hover:shadow-md transition-all">
            <UsersIcon className="mr-2 size-4" />
            Friend Requests
          </Link>
        </div>

        {loadingFriends ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <MemberCardSkeleton key={i} />)}
          </div>
        ) : friends.length === 0 ? (
          <NoFriendsFound />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {friends.map((friend) => (
              <FriendCard key={friend._id} friend={friend} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsPage;
