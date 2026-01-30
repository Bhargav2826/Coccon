import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { MenuIcon, XIcon } from "lucide-react";

const Layout = ({ children, showSidebar = false, fullWidth = false }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-base-100">
      <div className="flex">
        {/* Desktop Sidebar */}
        {showSidebar && (
          <div className="hidden lg:block sticky top-0 h-screen shrink-0">
            <Sidebar />
          </div>
        )}

        {/* Mobile Sidebar Overlay */}
        {showSidebar && sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={toggleSidebar} />
            <div className="fixed inset-y-0 left-0 w-64 bg-base-200 border-r border-base-300 z-50">
              <div className="flex items-center justify-between p-4 border-b border-base-300">
                <h2 className="text-lg font-semibold">Menu</h2>
                <button
                  onClick={toggleSidebar}
                  className="btn btn-ghost btn-sm btn-circle"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
              <Sidebar onMobileClose={toggleSidebar} />
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <Navbar onMenuClick={showSidebar ? toggleSidebar : undefined} />

          <main
            className={
              fullWidth
                ? "flex-1 overflow-hidden bg-base-100"
                : "flex-1 overflow-y-auto bg-base-100 p-4 sm:p-6 lg:p-8"
            }
          >
            {fullWidth ? (
              <div className="w-full h-full min-w-0">{children}</div>
            ) : (
              <div className="max-w-7xl mx-auto">{children}</div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
export default Layout;
