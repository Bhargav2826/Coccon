import { useQuery } from "@tanstack/react-query";
import { getStudentFacultyMessages } from "../lib/api";

export const useUnreadFacultyMessages = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["unreadFacultyMessages"],
    queryFn: getStudentFacultyMessages,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const unreadCount = data?.messages?.filter(message => {
    // Check if message is unread (isRead is false or undefined)
    return !message.isRead;
  }).length || 0;

  return {
    unreadCount,
    isLoading,
    error,
    hasUnread: unreadCount > 0
  };
};
