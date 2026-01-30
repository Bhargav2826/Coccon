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
    <div className="h-screen flex flex-col bg-base-100 overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        {showSidebar && (
          <div className="hidden md:block w-64 h-full shrink-0 border-r border-base-300 bg-base-200">
            <Sidebar />
          </div>
        )}

        {/* Mobile Sidebar Overlay */}
        {showSidebar && sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
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

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar onMenuClick={showSidebar ? toggleSidebar : undefined} />

          <main
            className={
              fullWidth
                ? "flex-1 overflow-hidden bg-base-100"
                : "flex-1 overflow-y-auto bg-base-100 p-3 sm:p-6 lg:p-8"
            }
          >
            {fullWidth ? (
              <div className="w-full h-full min-w-0">{children}</div>
            ) : (
              <div className="max-w-7xl mx-auto w-full">{children}</div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
export default Layout;
