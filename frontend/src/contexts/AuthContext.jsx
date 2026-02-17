import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuthUser } from "../lib/api";
import { toast } from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Check if user has explicitly logged out
  const hasLoggedOut = localStorage.getItem('hasLoggedOut') === 'true';

  // Auth user query
  const {
    data: authData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["authUser"],
    queryFn: getAuthUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: !isLoggingOut && !hasLoggedOut, // Don't run auth query when logging out or has logged out
  });

  const authUser = authData?.user;
  const isAuthenticated = Boolean(authUser && !error && !isLoggingOut && !hasLoggedOut);
  const isOnboarded = authUser?.isOnboarded;

  // Helper function to get the appropriate dashboard path based on user role
  const getDashboardPath = () => {
    if (!authUser?.role) return "/";

    switch (authUser.role) {
      case "faculty":
        return "/faculty-dashboard";
      case "parent":
        return "/parent-dashboard";
      case "student":
        return "/student-dashboard";
      default:
        return "/";
    }
  };

  // Check if current route requires authentication
  const isProtectedRoute = (pathname) => {
    const publicRoutes = ["/login", "/signup", "/onboarding"];
    return !publicRoutes.includes(pathname);
  };

  // Check if current route requires specific role
  const requiresRole = (pathname, requiredRole) => {
    const roleRoutes = {
      "/faculty-dashboard": "faculty",
      "/parent-dashboard": "parent",
      "/student-dashboard": "student",
      "/faculty-messages": "student", // Only students can access faculty messages
    };

    return roleRoutes[pathname] === requiredRole;
  };

  // Clear logout flag when user successfully logs in
  const clearLogoutFlag = () => {
    localStorage.removeItem('hasLoggedOut');
  };

  // Check if user has logged out
  const checkHasLoggedOut = () => {
    return localStorage.getItem('hasLoggedOut') === 'true';
  };

  // Handle authentication redirects
  useEffect(() => {
    if (isLoading) return; // Still loading, wait

    const pathname = location.pathname;
    const isPublicRoute = !isProtectedRoute(pathname);

    console.log("🔄 Auth redirect check:", {
      pathname,
      isAuthenticated,
      isOnboarded,
      isPublicRoute,
      isLoading,
      isInitialized,
      hasLoggedOut,
      authUser: authUser ? {
        role: authUser.role,
        isOnboarded: authUser.isOnboarded,
        id: authUser._id
      } : null
    });

    // If user has logged out and is not on login/signup page, redirect to login
    if (hasLoggedOut && pathname !== "/login" && pathname !== "/signup") {
      console.log("🔒 Redirecting to login - user has logged out");
      navigate("/login", { replace: true });
      return;
    }

    // If user has logged out and is on login/signup page, allow them to stay
    if (hasLoggedOut && (pathname === "/login" || pathname === "/signup")) {
      console.log("✅ User has logged out and is on login page - allowing access");
      return;
    }

    // If not authenticated and trying to access protected route
    if (!isAuthenticated && !isPublicRoute) {
      // SHIELD: Never redirect if we are in a call. 
      // This protects against session flickers during testing.
      if (pathname.startsWith('/call/')) {
        console.log("🛡️ AuthContext: Redirect BLOCKED (Active Call Protection)");
        return;
      }

      console.log("🔒 Redirecting to login - not authenticated");
      navigate("/login", { replace: true });
      return;
    }

    // If authenticated but not onboarded
    if (isAuthenticated && !isOnboarded && pathname !== "/onboarding") {
      console.log("📝 Redirecting to onboarding - not onboarded");
      console.log("📝 User role:", authUser?.role, "Current path:", pathname);
      // Add small delay to ensure state is fully updated
      setTimeout(() => {
        navigate("/onboarding", { replace: true });
      }, 100);
      return;
    }

    // If authenticated but not onboarded and on login/signup page, redirect to onboarding
    if (isAuthenticated && !isOnboarded && (pathname === "/login" || pathname === "/signup")) {
      console.log("📝 Redirecting to onboarding - user is authenticated but not onboarded");
      console.log("📝 User role:", authUser?.role, "Current path:", pathname);
      // Add small delay to ensure state is fully updated
      setTimeout(() => {
        navigate("/onboarding", { replace: true });
      }, 100);
      return;
    }

    // If authenticated and onboarded, redirect from login/signup pages
    if (isAuthenticated && isOnboarded && (pathname === "/login" || pathname === "/signup")) {
      console.log("🏠 Redirecting to dashboard - user is authenticated and onboarded");
      console.log("🏠 User role:", authUser?.role, "Dashboard path:", getDashboardPath());
      clearLogoutFlag();
      // Add small delay to ensure state is fully updated
      setTimeout(() => {
        navigate(getDashboardPath(), { replace: true });
      }, 100);
      return;
    }

    // If authenticated and onboarded, check role-specific routes
    if (isAuthenticated && isOnboarded) {
      const userRole = authUser?.role;

      // Check if user is trying to access a route they don't have permission for
      if (pathname === "/faculty-dashboard" && userRole !== "faculty") {
        console.log("🚫 Redirecting - faculty access required");
        navigate(getDashboardPath(), { replace: true });
        return;
      }

      if (pathname === "/parent-dashboard" && userRole !== "parent") {
        console.log("🚫 Redirecting - parent access required");
        navigate(getDashboardPath(), { replace: true });
        return;
      }

      if (pathname === "/student-dashboard" && userRole !== "student") {
        console.log("🚫 Redirecting - student access required");
        navigate(getDashboardPath(), { replace: true });
        return;
      }

      if (pathname === "/faculty-messages" && userRole !== "student") {
        console.log("🚫 Redirecting - student access required for faculty messages");
        navigate(getDashboardPath(), { replace: true });
        return;
      }
    }

    // Only set initialized if we're not in a redirect state
    if (!isLoading && isInitialized === false) {
      console.log("✅ Auth state initialized");
      setIsInitialized(true);
    }
  }, [isAuthenticated, isOnboarded, isLoading, location.pathname, navigate, authUser, isInitialized, hasLoggedOut]);

  // Handle authentication errors
  useEffect(() => {
    if (error && !isLoading) {
      console.error("🔴 Auth error:", error);

      // Clear any stale auth data
      queryClient.setQueryData(["authUser"], null);

      // Show error message for specific errors
      if (error.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
      } else if (error.response?.status === 403) {
        toast.error("Access denied. You don't have permission for this action.");
      } else if (error.message?.includes("network")) {
        toast.error("Network error. Please check your connection.");
      }
    }
  }, [error, isLoading, queryClient]);

  // Logout function
  const logout = async () => {
    try {
      console.log("🔘 Starting logout process...");

      // Set logging out state to prevent auth queries
      setIsLoggingOut(true);

      // Set localStorage flag to prevent auth queries after logout
      localStorage.setItem('hasLoggedOut', 'true');

      // Clear auth data immediately
      queryClient.setQueryData(["authUser"], null);
      queryClient.clear();

      // Clear any stored tokens/cookies (handled by backend)
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
        console.log("✅ Backend logout successful");
      } catch (backendError) {
        console.error("⚠️ Backend logout failed:", backendError);
        // Continue with logout even if backend fails
      }

      // Set authentication state to false immediately
      setIsInitialized(false);

      console.log("🔘 Redirecting to login...");

      // Redirect to login with replace to prevent back navigation
      navigate("/login", { replace: true });

      // Show success message
      toast.success("Logged out successfully");

      // Reset logging out state after a short delay
      setTimeout(() => {
        setIsLoggingOut(false);
        console.log("✅ Logout process completed");
      }, 1000);

    } catch (error) {
      console.error("❌ Logout error:", error);

      // Set localStorage flag even if there's an error
      localStorage.setItem('hasLoggedOut', 'true');

      // Clear auth data even if there's an error
      queryClient.setQueryData(["authUser"], null);
      queryClient.clear();
      setIsInitialized(false);

      // Still redirect even if logout API fails
      navigate("/login", { replace: true });
      toast.success("Logged out successfully");

      // Reset logging out state
      setTimeout(() => {
        setIsLoggingOut(false);
        console.log("✅ Logout process completed (error recovery)");
      }, 1000);
    }
  };

  const updateProfilePic = async (params) => {
    try {
      setIsUpdatingProfile(true);
      // If params is a string, it's just the profilePicBase64 (backward compatibility)
      const body = typeof params === 'string' ? { profilePic: params } : params;

      const response = await fetch("/api/users/profile-pic", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile picture");
      }

      // Update local cache
      queryClient.setQueryData(["authUser"], (oldData) => ({
        ...oldData,
        user: data.user,
      }));

      return data.user.profilePic;
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(error.message || "Failed to update profile picture");
      throw error;
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Refresh auth data
  const refreshAuth = () => {
    refetch();
  };

  const value = {
    // State
    authUser,
    isAuthenticated,
    isOnboarded,
    isUpdatingProfile,
    isLoading: isLoading || !isInitialized || isLoggingOut, // Removed hasLoggedOut from loading calculation
    error,

    // Actions
    logout,
    updateProfilePic,
    refreshAuth,
    clearLogoutFlag,
    checkHasLoggedOut,

    // Utilities
    getDashboardPath,
    isProtectedRoute,
    requiresRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
