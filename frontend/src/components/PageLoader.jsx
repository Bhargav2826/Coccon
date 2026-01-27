import React from "react";
import Logo from "./Logo";

const PageLoader = () => {
  return (
    <div className="h-screen flex items-center justify-center bg-base-100">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <Logo size="large" />
        </div>
        <div className="space-y-4">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="text-base-content opacity-70">Loading COCOON...</p>
        </div>
      </div>
    </div>
  );
};

export default PageLoader;
