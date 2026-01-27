import { useQuery } from "@tanstack/react-query";
import { getFriendRequestsCount } from "../lib/api";

const useNotificationCount = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["notificationCount"],
    queryFn: getFriendRequestsCount,
    refetchInterval: 5000, // Poll for new notifications every 5 seconds
  });

  return { isLoading, count: data?.count || 0 };
};
export default useNotificationCount;
