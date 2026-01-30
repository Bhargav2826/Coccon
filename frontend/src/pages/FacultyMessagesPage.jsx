import FacultyMessagesViewer from "../components/FacultyMessagesViewer";
import { MessageCircleIcon } from "lucide-react";
import BackButton from "../components/BackButton";

const FacultyMessagesPage = () => {
  return (
    <div className="relative">
      {/* Back Button - Responsive positioning */}
      <div className="absolute -top-2 left-0 sm:top-2 sm:left-2 z-10">
        <BackButton
          className="hover:bg-base-200/50 rounded-full p-2 transition-all duration-300 shadow-md"
          variant="outline"
          size="sm"
        />
      </div>

      <div className="pt-12 sm:pt-16">
        <div className="max-w-6xl mx-auto">
          {/* Clean Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl shadow-lg mb-4 sm:mb-6">
              <MessageCircleIcon className="size-6 sm:size-8 text-primary-content" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Faculty Messages
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-base-content/70 max-w-2xl mx-auto">
              Stay connected with your teachers through messages, files, and video calls
            </p>
          </div>

          {/* Faculty Messages Viewer */}
          <div className="mb-12">
            <FacultyMessagesViewer />
          </div>

          {/* Simplified Help Section */}
          <div className="bg-base-200/50 rounded-2xl p-8 border border-base-300/30">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-3 text-base-content">
                How to use Faculty Messages
              </h3>
              <p className="text-base-content/70">
                Get the most out of your communication with teachers
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-6 rounded-xl bg-base-100 hover:bg-base-200 transition-colors">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📝</span>
                </div>
                <h4 className="font-semibold mb-2">Text Messages</h4>
                <p className="text-sm text-base-content/70">Read announcements and updates from teachers</p>
              </div>

              <div className="text-center p-6 rounded-xl bg-base-100 hover:bg-base-200 transition-colors">
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📎</span>
                </div>
                <h4 className="font-semibold mb-2">File Attachments</h4>
                <p className="text-sm text-base-content/70">Download assignments and study materials</p>
              </div>

              <div className="text-center p-6 rounded-xl bg-base-100 hover:bg-base-200 transition-colors">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎥</span>
                </div>
                <h4 className="font-semibold mb-2">Video Calls</h4>
                <p className="text-sm text-base-content/70">Join virtual classroom sessions</p>
              </div>

              <div className="text-center p-6 rounded-xl bg-base-100 hover:bg-base-200 transition-colors">
                <div className="w-12 h-12 bg-info/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔄</span>
                </div>
                <h4 className="font-semibold mb-2">Real-time</h4>
                <p className="text-sm text-base-content/70">Messages update automatically</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyMessagesPage;
