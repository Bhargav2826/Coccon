import { useChatStore } from "../store/useChatStore";
import ChatSidebar from "../components/ChatSidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const ChatPage = () => {
    const { selectedUser, selectedGroup } = useChatStore();

    return (
        <div className="h-screen bg-base-100 flex flex-col">
            <div className="flex-1 flex items-center justify-center p-0 sm:p-4 overflow-hidden">
                <div className="bg-base-200 rounded-none sm:rounded-lg shadow-xl w-full max-w-6xl h-full sm:h-[calc(100vh-10rem)] border border-base-300 overflow-hidden">
                    <div className="flex h-full rounded-none sm:rounded-lg overflow-hidden">
                        {/* Sidebar: hidden on mobile when a chat is selected */}
                        <div className={`${(selectedUser || selectedGroup) ? "hidden md:block" : "w-full"} md:w-80 h-full border-r border-base-300 shrink-0`}>
                            <ChatSidebar />
                        </div>

                        {/* Content: hidden on mobile when NO chat is selected */}
                        <div className={`flex-1 flex flex-col h-full ${(selectedUser || selectedGroup) ? "flex" : "hidden md:flex"}`}>
                            {!selectedUser && !selectedGroup ? <NoChatSelected /> : <ChatContainer />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default ChatPage;
