import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login, getAuthUser } from "../lib/api";

const useLogin = () => {
  const queryClient = useQueryClient();
  
  const { mutate, isPending, error } = useMutation({
    mutationFn: login,
    onSuccess: async (data) => {
      // Clear logout flag on successful login
      localStorage.removeItem('hasLoggedOut');
      console.log("✅ Login successful - logout flag cleared");
      
      // Immediately fetch the updated auth user data
      try {
        const authData = await getAuthUser();
        console.log("🎯 Fetched updated auth data:", authData);
        
        // Update the query cache with the new data
        queryClient.setQueryData(["authUser"], authData);
        
        console.log("🎯 Auth data updated in cache, AuthContext should handle routing for role:", data?.user?.role);
      } catch (error) {
        console.error("❌ Error fetching updated auth data:", error);
        // Fallback to invalidation
        queryClient.invalidateQueries({ queryKey: ["authUser"] });
      }
    },
  });

  return { error, isPending, loginMutation: mutate };
};

export default useLogin;
