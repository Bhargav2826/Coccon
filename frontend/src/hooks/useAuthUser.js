import { useQuery } from "@tanstack/react-query";
import { getAuthUser } from "../lib/api";

const useAuthUser = () => {
  const authUser = useQuery({
    queryKey: ["authUser"],
    queryFn: getAuthUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // If the query fails with 401, we're definitely not authenticated
  const isAuthenticated = authUser.data?.user && !authUser.isError;

  return {
    isLoading: authUser.isLoading,
    authUser: authUser.data?.user,
    isAuthenticated: Boolean(isAuthenticated),
    error: authUser.error
  };
};
export default useAuthUser;
