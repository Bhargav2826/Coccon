import { create } from 'zustand';

const useVideoCallStore = create((set, get) => ({
  // Global video call state
  isVideoCallInProgress: false,
  currentCallUrl: null,
  isOpeningVideoCall: false,
  
  // Actions
  startVideoCall: () => {
    set({ isVideoCallInProgress: true });
  },
  
  setCallUrl: (url) => {
    set({ currentCallUrl: url });
  },
  
  completeVideoCall: () => {
    set({ 
      isVideoCallInProgress: false, 
      currentCallUrl: null,
      isOpeningVideoCall: false 
    });
  },
  
  setOpeningVideoCall: (isOpening) => {
    set({ isOpeningVideoCall: isOpening });
  },
  
  // Check if video call can be started
  canStartVideoCall: () => {
    const { isVideoCallInProgress, isOpeningVideoCall } = get();
    return !isVideoCallInProgress && !isOpeningVideoCall;
  }
}));

export default useVideoCallStore;
