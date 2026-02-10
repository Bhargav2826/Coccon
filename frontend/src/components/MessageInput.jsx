import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X, FileIcon, Paperclip } from "lucide-react";
import { toast } from "react-hot-toast";

const MessageInput = () => {
    const [text, setText] = useState("");
    const [filePreview, setFilePreview] = useState(null);
    const [fileType, setFileType] = useState(null);
    const [fileName, setFileName] = useState("");
    const fileInputRef = useRef(null);
    const { sendMessage } = useChatStore();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check size - 10MB limit
        if (file.size > 10 * 1024 * 1024) {
            toast.error("File size must be less than 10MB");
            return;
        }

        setFileName(file.name);
        setFileType(file.type);

        const reader = new FileReader();
        reader.onloadend = () => {
            setFilePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const removeFile = () => {
        setFilePreview(null);
        setFileType(null);
        setFileName("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!text.trim() && !filePreview) return;

        try {
            await sendMessage({
                text: text.trim(),
                file: filePreview,
                fileName: fileName,
                fileType: fileType,
            });

            // Clear form
            setText("");
            removeFile();
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    const isImage = fileType?.startsWith("image/");

    return (
        <div className="p-4 w-full">
            {filePreview && (
                <div className="mb-3 flex items-center gap-2">
                    <div className="relative group">
                        {isImage ? (
                            <img
                                src={filePreview}
                                alt="Preview"
                                className="w-20 h-20 object-cover rounded-lg border border-base-300 shadow-sm"
                            />
                        ) : (
                            <div className="w-20 h-20 flex flex-col items-center justify-center bg-base-300 rounded-lg border border-base-300 shadow-sm p-2">
                                <FileIcon className="size-8 text-primary opacity-70" />
                                <span className="text-[10px] truncate w-full text-center mt-1">{fileName}</span>
                            </div>
                        )}
                        <button
                            onClick={removeFile}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-base-content text-base-100
              flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                            type="button"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <div className="flex-1 flex gap-2">
                    <button
                        type="button"
                        className="btn btn-circle btn-sm sm:btn-md btn-ghost"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Paperclip size={20} className={filePreview ? "text-primary" : "text-base-content/40"} />
                    </button>

                    <input
                        type="text"
                        className="w-full input input-bordered rounded-lg input-sm sm:input-md"
                        placeholder="Type a message..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                    <input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />
                </div>

                <button
                    type="submit"
                    className="btn btn-sm sm:btn-md btn-primary btn-circle"
                    disabled={!text.trim() && !filePreview}
                >
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};

export default MessageInput;
