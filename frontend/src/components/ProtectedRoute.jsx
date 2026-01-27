import { useAuth } from "../contexts/AuthContext.jsx";
import PageLoader from "./PageLoader.jsx";

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isLoading, isAuthenticated, isOnboarded, authUser } = useAuth();

  // Check if user has logged out
  const hasLoggedOut = localStorage.getItem('hasLoggedOut') === 'true';

  // Show loading spinner while auth is being checked, but not if user has logged out or already authenticated
  if (isLoading && !hasLoggedOut && !isAuthenticated) {
    console.log("🛡️ ProtectedRoute: Showing PageLoader", { isLoading, isAuthenticated });
    return <PageLoader />;
  }

  // If user has logged out, don't render protected content
  if (hasLoggedOut) {
    console.log("🛡️ ProtectedRoute: User logged out, returning null");
    return null; // AuthContext will handle redirect to login
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    console.log("🛡️ ProtectedRoute: Not authenticated", { authUser });

    // SHIELD: Do not unmount if we are in a call
    if (window.location.pathname.startsWith('/call/')) {
      console.log("🛡️ ProtectedRoute: Unmount BLOCKED (Active Call Protection)");
      return children;
    }

    return null; // AuthContext will handle redirect to login
  }

  // Check if user is onboarded
  if (!isOnboarded) {
    console.log("🛡️ ProtectedRoute: Not onboarded, returning null");
    return null; // AuthContext will handle redirect to onboarding
  }

  // Check if specific role is required
  if (requiredRole && authUser?.role !== requiredRole) {
    return null; // AuthContext will handle redirect to appropriate dashboard
  }

  // All checks passed, render the protected content
  return children;
};

export default ProtectedRoute;
