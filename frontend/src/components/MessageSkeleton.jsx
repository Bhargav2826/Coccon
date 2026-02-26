const MessageSkeleton = () => {
    // Create an array of 6 skeleton messages
    const skeletonMessages = [
        { id: 1, type: "start", width: "w-3/4" },
        { id: 2, type: "end", width: "w-1/2" },
        { id: 3, type: "start", width: "w-2/3" },
        { id: 4, type: "start", width: "w-1/2" },
        { id: 5, type: "end", width: "w-3/4" },
        { id: 6, type: "start", width: "w-1/4" },
    ];

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {skeletonMessages.map((msg) => (
                <div key={msg.id} className={`chat ${msg.type === "start" ? "chat-start" : "chat-end"} animate-pulse`}>
                    <div className="chat-image avatar">
                        <div className="size-10 rounded-full bg-base-300" />
                    </div>
                    <div className="chat-header mb-1">
                        <div className="h-3 w-16 bg-base-300 rounded" />
                    </div>
                    <div className={`chat-bubble bg-transparent p-0 ${msg.type === "end" ? "items-end" : "items-start"}`}>
                        <div className={`h-12 ${msg.width} bg-base-300 rounded-2xl relative overflow-hidden`}>
                            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                        </div>
                    </div>
                    <div className="chat-footer opacity-50">
                        <div className="h-2 w-8 bg-base-300 rounded mt-1" />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MessageSkeleton;
