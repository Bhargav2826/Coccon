import { Link, useLocation } from "react-router";
import { BellIcon, LogOutIcon, MenuIcon, CameraIcon } from "lucide-react";
import { useState } from "react";
import ThemeSelector from "./ThemeSelector";
import useNotificationCount from "../hooks/useNotificationCount";
import Logo from "./Logo";
import { useAuth } from "../contexts/AuthContext.jsx";
import AvatarEditor from "./AvatarEditor";
import ProfilePreview from "./ProfilePreview";
import UserAvatar from "./UserAvatar";

const Navbar = ({ onMenuClick }) => {
  const { authUser, logout, updateProfilePic, isUpdatingProfile } = useAuth();
  const location = useLocation();
  const isChatPage = location.pathname?.startsWith("/chat");
  const { count } = useNotificationCount();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleLogout = () => {
    console.log("🔘 Logout button clicked");
    logout();
  };

  const handleSaveAvatar = async (base64) => {
    await updateProfilePic(base64);
  };

  return (
    <nav className="bg-base-200 border-b border-base-300 sticky top-0 z-30 h-16 flex items-center">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between w-full">
          {/* Left side - Menu button and logo */}
          <div className="flex items-center gap-4">
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="btn btn-ghost btn-sm btn-circle md:hidden"
                aria-label="Open menu"
              >
                <MenuIcon className="h-5 w-5" />
              </button>
            )}

            <Link to="/" className="flex items-center gap-2 sm:gap-2.5">
              <Logo showText={false} size="sm" />
              <span className="text-lg sm:text-xl lg:text-2xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
                COCOON
              </span>
            </Link>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
            <Link to={"/notifications"}>
              <button className="btn btn-ghost btn-circle btn-sm sm:btn-md">
                <div className="indicator">
                  <BellIcon className="h-5 w-5 sm:h-6 sm:w-6 text-base-content opacity-70" />
                  {count > 0 && (
                    <span className="badge badge-xs badge-primary indicator-item">{count}</span>
                  )}
                </div>
              </button>
            </Link>

            <ThemeSelector />

            <div className="flex items-center gap-1">
              <div
                className="group relative"
                title="View Profile"
              >
                <UserAvatar
                  user={authUser}
                  size="md"
                  onClick={() => setIsPreviewOpen(true)}
                  showStatus={false}
                />

                {/* Upload Trigger */}
                <button
                  onClick={() => setIsEditorOpen(true)}
                  className="absolute -bottom-1 -right-1 size-5 bg-primary rounded-full flex items-center justify-center text-white border-2 border-base-100 shadow-lg hover:scale-110 transition-transform z-20"
                  title="Change Photo"
                >
                  <CameraIcon size={10} />
                </button>
              </div>
            </div>

            <button
              className="btn btn-ghost btn-circle btn-sm sm:btn-md"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOutIcon className="h-5 w-5 sm:h-6 sm:w-6 text-base-content opacity-70" />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Modals */}
      <AvatarEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveAvatar}
        currentAvatar={authUser?.profilePic}
        isUploading={isUpdatingProfile}
        userHistory={authUser?.avatarHistory}
        currentVisibility={authUser?.profileVisibility}
      />

      <ProfilePreview
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        user={authUser}
      />
    </nav>
  );
};
export default Navbar;
