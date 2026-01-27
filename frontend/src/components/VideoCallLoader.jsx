import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { VideoIcon, Loader2Icon } from 'lucide-react';

const VideoCallLoader = ({ isVisible, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    "Initializing video call...",
    "Setting up Stream connection...",
    "Preparing call interface...",
    "Opening video call..."
  ];

  // Prevent body scrolling when loader is visible
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          if (onComplete) {
            setTimeout(onComplete, 500);
          }
          return prev;
        }
      });
    }, 800);

    return () => clearInterval(interval);
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  const loaderContent = (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[99999] pointer-events-auto">
      <div className="bg-white rounded-lg p-6 sm:p-8 max-w-md w-full mx-4 text-center shadow-2xl max-h-[calc(100dvh-2rem)] overflow-auto">
        <div className="flex items-center justify-center mb-4">
          <VideoIcon className="size-12 text-blue-500 mr-3" />
          <Loader2Icon className="size-8 text-blue-500 animate-spin" />
        </div>
        
        <h3 className="text-lg font-semibold mb-4">Starting Video Call</h3>
        
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div 
              key={index}
              className={`flex items-center text-sm ${
                index <= currentStep ? 'text-gray-700' : 'text-gray-400'
              }`}
            >
              <div className={`w-2 h-2 rounded-full mr-3 ${
                index < currentStep ? 'bg-green-500' : 
                index === currentStep ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
              }`} />
              {step}
            </div>
          ))}
        </div>
        
        <div className="mt-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Use portal to render at document body level
  return createPortal(loaderContent, document.body);
};

export default VideoCallLoader;
