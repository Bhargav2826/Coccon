import { useChatStore } from "../store/useChatStore";
import ChatSidebar from "../components/ChatSidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const ChatPage = () => {
    const { selectedUser } = useChatStore();

    return (
        <div className="h-[calc(100vh-8rem)] bg-base-100">
            <div className="flex items-center justify-center px-4">
                <div className="bg-base-200 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-10rem)]">
                    <div className="flex h-full rounded-lg overflow-hidden">
                        <ChatSidebar />

                        {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default ChatPage;
