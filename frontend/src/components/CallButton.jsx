import { VideoIcon } from "lucide-react";

function CallButton({ handleVideoCall }) {
  return (
    <button 
      onClick={handleVideoCall} 
      className="btn btn-circle btn-sm sm:btn-md bg-white/20 hover:bg-white/30 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
      title="Start Video Call"
    >
      <VideoIcon className="size-4 sm:size-5" />
    </button>
  );
}

export default CallButton;
