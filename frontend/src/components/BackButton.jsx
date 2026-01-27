import { ArrowLeftIcon } from "lucide-react";
import { useNavigate } from "react-router";

const BackButton = ({ 
  to, 
  onClick, 
  className = "", 
  showText = true, 
  variant = "default" 
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  const baseClasses = "btn btn-ghost btn-sm sm:btn-md gap-2 transition-all duration-300";
  const variantClasses = {
    default: "text-base-content hover:text-primary",
    primary: "text-primary hover:text-primary/80",
    secondary: "text-secondary hover:text-secondary/80",
    outline: "btn-outline border-base-300 hover:border-primary",
  };

  return (
    <button
      onClick={handleClick}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      title="Go back"
    >
      <ArrowLeftIcon className="size-4 sm:size-5" />
      {showText && <span className="hidden sm:inline">Back</span>}
    </button>
  );
};

export default BackButton;
