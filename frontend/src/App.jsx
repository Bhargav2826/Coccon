import { Route, Routes } from "react-router";
import { useEffect } from "react";
import { useNavigate } from "react-router";

import HomePage from "./pages/HomePage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import CallPage from "./pages/CallPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import FriendsPage from "./pages/FriendsPage.jsx";
import FacultyDashboard from "./pages/FacultyDashboard.jsx";
import ParentDashboard from "./pages/ParentDashboard.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import ChatPage from "./pages/ChatPage.jsx";
// import StreamVideoTest from "./components/StreamVideoTest.jsx";

import { Toaster } from "react-hot-toast";
import IncomingCall from "./components/IncomingCall.jsx";

import PageLoader from "./components/PageLoader.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./contexts/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import { useTheme } from "./hooks/useTheme.js";
import { useChatStore } from "./store/useChatStore";
import { useSocketContext } from "./contexts/SocketContext";

const App = () => {
  const { isLoading, isAuthenticated, authUser } = useAuth();
  const { theme, loadThemeFromDB } = useTheme();
  const { getUsers, subscribeToMessages, unsubscribeFromMessages } = useChatStore();
  const { socket } = useSocketContext();
  const navigate = useNavigate();

  // Global Chat Initialization
  useEffect(() => {
    if (isAuthenticated && authUser && socket) {
      getUsers();
      subscribeToMessages(socket);
    }

    // We don't necessarily want to unsubscribe on every re-render, 
    // but we should if the component unmounts or auth changes.
    // However, since this is App.jsx, it unmounts only on refresh/close.
  }, [isAuthenticated, authUser, socket, getUsers, subscribeToMessages]);

  useEffect(() => {
    return () => {
      if (socket) unsubscribeFromMessages(socket);
    };
  }, [socket, unsubscribeFromMessages]);

  // Check if user has logged out
  const hasLoggedOut = localStorage.getItem('hasLoggedOut') === 'true';

  // Load theme from database when user is authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      loadThemeFromDB();
    }
  }, [isAuthenticated, isLoading, loadThemeFromDB]);

  // Handle intended path from 404 page
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const intendedPath = sessionStorage.getItem('intendedPath');
      if (intendedPath && intendedPath !== '/') {
        console.log('Redirecting to intended path:', intendedPath);
        sessionStorage.removeItem('intendedPath');
        navigate(intendedPath);
      }
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading spinner while auth is being checked, but not if user has logged out
  if (isLoading && !hasLoggedOut) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-base-100" data-theme={theme}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout showSidebar={true}>
                <HomePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/friends"
          element={
            <ProtectedRoute>
              <Layout showSidebar={true}>
                <FriendsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Layout showSidebar={true}>
                <ChatPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty-dashboard"
          element={
            <ProtectedRoute requiredRole="faculty">
              <Layout showSidebar={true}>
                <FacultyDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/parent-dashboard"
          element={
            <ProtectedRoute requiredRole="parent">
              <Layout showSidebar={true}>
                <ParentDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute requiredRole="student">
              <Layout showSidebar={true}>
                <StudentDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />


        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Layout showSidebar={true}>
                <NotificationsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/call/:id"
          element={
            <ProtectedRoute>
              <CallPage />
            </ProtectedRoute>
          }
        />


        {/* <Route
          path="/stream-video-test"
          element={
            <ProtectedRoute>
              <Layout showSidebar={true}>
                <StreamVideoTest />
              </Layout>
            </ProtectedRoute>
          }
        /> */}

        {/* Catch all route - redirect to login */}
        <Route path="*" element={<LoginPage />} />
      </Routes>

      <Toaster />
      <IncomingCall />
    </div>
  );
};

export default App;
