import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router";
import { logout } from "../lib/api";
import { toast } from "react-hot-toast";

const useLogout = () => {
  const queryClient = useQueryClient();
  const location = useLocation();

  const performLocalLogout = () => {
    console.log("🚪 Performing comprehensive logout cleanup...");
    
    // Clear all queries from cache
    queryClient.clear();
    console.log("✅ Query cache cleared");
    
    // Remove auth user from cache completely
    queryClient.removeQueries({ queryKey: ["authUser"] });
    console.log("✅ Auth user queries removed");
    
    // Clear any localStorage or sessionStorage
    try {
      localStorage.clear();
      sessionStorage.clear();
      console.log("✅ Local storage cleared");
    } catch (error) {
      console.log("⚠️ Error clearing storage:", error);
    }
    
    // Show success message
    toast.success("Logged out successfully");
    console.log("✅ Success toast shown");
    
    // Force navigation to login page with guaranteed approach
    console.log("📍 Current location:", location.pathname);
    console.log("🔄 Redirecting to /login...");
    
    // Use window.location.replace for guaranteed redirection
    // This bypasses React Router and forces a full page reload
    window.location.replace("/login");
  };

  const {
    mutate: logoutMutation,
    isPending,
    error,
  } = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      console.log("✅ Logout API call successful");
      performLocalLogout();
    },
    onError: (error) => {
      console.error("❌ Logout API error:", error);
      toast.error("Logout failed, but clearing local session...");
      
      // Even if API logout fails, clear local state and redirect
      console.log("🔄 Performing local logout despite API failure...");
      performLocalLogout();
    },
    onSettled: () => {
      console.log("🏁 Logout attempt completed");
    },
  });

  // Also provide a direct logout function that bypasses API call
  const forceLogout = () => {
    console.log("⚡ Force logout called - bypassing API");
    performLocalLogout();
  };

  return { logoutMutation, forceLogout, isPending, error };
};
export default useLogout;
