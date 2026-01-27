import { LoaderIcon } from "lucide-react";

function ChatLoader() {
  return (
    <div className="h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center space-y-6">
        <div className="relative">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-600 dark:bg-green-700 flex items-center justify-center shadow-lg">
            <LoaderIcon className="animate-spin size-8 sm:size-10 text-white" />
          </div>
          <div className="absolute inset-0 rounded-full bg-green-600/20 animate-ping"></div>
        </div>
        <div className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
            Connecting to Chat
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-md">
            Please wait while we establish your secure connection
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
          <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}

export default ChatLoader;
