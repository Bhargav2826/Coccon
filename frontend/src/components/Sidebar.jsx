import { Link, useLocation } from "react-router";
import { BellIcon, HomeIcon, UsersIcon, GraduationCapIcon, ShieldIcon, UserIcon, MessageSquare } from "lucide-react";
import Logo from "./Logo";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useChatStore } from "../store/useChatStore";

const Sidebar = ({ onMobileClose }) => {
  const { authUser } = useAuth();
  const { users, groups } = useChatStore();
  const location = useLocation();
  const currentPath = location.pathname;

  const totalUnreadMessages =
    users.reduce((acc, user) => acc + (user.unreadCount || 0), 0) +
    groups.reduce((acc, group) => acc + (group.unreadCount || 0), 0);

  const handleLinkClick = () => {
    // Close mobile sidebar when a link is clicked
    if (onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <aside className="w-full flex flex-col h-full bg-base-200">
      {/* Logo section - hidden on mobile since it's in the overlay header */}
      <div className="p-5 border-b border-base-300 hidden lg:block">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* Parent Dashboard Link - Only show for parent users */}
        {authUser?.role === "parent" && (
          <Link
            to="/parent-dashboard"
            onClick={handleLinkClick}
            className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case text-sm sm:text-base ${currentPath === "/parent-dashboard" ? "btn-active" : ""
              }`}
          >
            <ShieldIcon className="size-4 sm:size-5 text-base-content opacity-70" />
            <span>Parent Dashboard</span>
          </Link>
        )}

        {/* Faculty Dashboard Link - Only show for faculty users */}
        {authUser?.role === "faculty" && (
          <Link
            to="/faculty-dashboard"
            onClick={handleLinkClick}
            className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case text-sm sm:text-base ${currentPath === "/faculty-dashboard" ? "btn-active" : ""
              }`}
          >
            <GraduationCapIcon className="size-4 sm:size-5 text-base-content opacity-70" />
            <span>Faculty Dashboard</span>
          </Link>
        )}

        {/* Student Navigation Links - Only show for student users */}
        {authUser?.role === "student" && (
          <>
            {/* 1. Student Dashboard */}
            <Link
              to="/student-dashboard"
              onClick={handleLinkClick}
              className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case text-sm sm:text-base ${currentPath === "/student-dashboard" ? "btn-active" : ""
                }`}
            >
              <UserIcon className="size-4 sm:size-5 text-base-content opacity-70" />
              <span>Student Dashboard</span>
            </Link>

            {/* 2. Classroom Members */}
            <Link
              to="/"
              onClick={handleLinkClick}
              className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case text-sm sm:text-base ${currentPath === "/" ? "btn-active" : ""
                }`}
            >
              <HomeIcon className="size-4 sm:size-5 text-base-content opacity-70" />
              <span>Classroom Members</span>
            </Link>

            {/* 3. Friends */}
            <Link
              to="/friends"
              onClick={handleLinkClick}
              className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case text-sm sm:text-base ${currentPath === "/friends" ? "btn-active" : ""
                }`}
            >
              <UsersIcon className="size-4 sm:size-5 text-base-content opacity-70" />
              <span>Friends</span>
            </Link>

            {/* 4. Chat */}
            <Link
              to="/chat"
              onClick={handleLinkClick}
              className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case text-sm sm:text-base ${currentPath === "/chat" ? "btn-active" : ""
                }`}
            >
              <div className="flex-1 flex items-center gap-3">
                <MessageSquare className="size-4 sm:size-5 text-base-content opacity-70" />
                <span>Chat</span>
              </div>
              {totalUnreadMessages > 0 && (
                <span className="badge badge-primary badge-sm ml-auto animate-pulse">
                  {totalUnreadMessages}
                </span>
              )}
            </Link>
          </>
        )}

        {/* Notifications Link - Show for all users except parents */}
        {authUser?.role !== "parent" && (
          <Link
            to="/notifications"
            onClick={handleLinkClick}
            className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case text-sm sm:text-base ${currentPath === "/notifications" ? "btn-active" : ""
              }`}
          >
            <BellIcon className="size-4 sm:size-5 text-base-content opacity-70" />
            <span>Notifications</span>
          </Link>
        )}
      </nav>

      {/* USER PROFILE SECTION */}
      <div className="p-4 border-t border-base-300">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full">
              <img src={authUser?.profilePic} alt="User Avatar" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{authUser?.fullName}</p>
            <p className="text-xs text-success flex items-center gap-1">
              <span className="size-2 rounded-full bg-success inline-block" />
              Online
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
