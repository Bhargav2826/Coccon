import React from "react";

const Logo = ({ size = "default", showText = true, className = "" }) => {
  const getSizeClasses = () => {
    switch (size) {
      case "small":
        return "w-6 h-6";
      case "medium":
        return "w-8 h-8";
      case "large":
        return "w-12 h-12";
      case "default":
      default:
        return "w-9 h-9";
    }
  };

  const getTextSize = () => {
    switch (size) {
      case "small":
        return "text-lg";
      case "medium":
        return "text-xl";
      case "large":
        return "text-2xl";
      case "default":
      default:
        return "text-3xl";
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src="/Logo_Cocoon_pdf-1-removebg-preview.png" 
        alt="COCOON Logo" 
        className={`${getSizeClasses()} object-contain`}
      />
      {showText && (
        <span className={`font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider ${getTextSize()}`}>
          COCOON
        </span>
      )}
    </div>
  );
};

export default Logo;
