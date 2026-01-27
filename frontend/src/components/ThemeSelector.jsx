import { PaletteIcon } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { THEMES } from "../constants";

const ThemeSelector = () => {
  const { theme, changeTheme, isUpdatingTheme } = useTheme();

  return (
    <div className="dropdown dropdown-end">
      {/* DROPDOWN TRIGGER */}
      <button 
        tabIndex={0} 
        className="btn btn-ghost btn-circle btn-sm sm:btn-md hover:bg-base-300/50"
        disabled={isUpdatingTheme}
      >
        {isUpdatingTheme ? (
          <div className="loading loading-spinner loading-sm"></div>
        ) : (
          <PaletteIcon className="size-4 sm:size-5" />
        )}
      </button>

      <div
        tabIndex={0}
        className="dropdown-content mt-2 p-1 shadow-2xl bg-base-200 backdrop-blur-lg rounded-2xl
        w-48 sm:w-56 border border-base-content/10 max-h-80 overflow-y-auto z-50
        dropdown-end sm:dropdown-end"
      >
        <div className="space-y-1">
          {THEMES.map((themeOption) => (
            <button
              key={themeOption.name}
              className={`
              w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl flex items-center gap-2 sm:gap-3 transition-colors
              ${
                theme === themeOption.name
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-base-content/5"
              }
            `}
              onClick={() => changeTheme(themeOption.name)}
              disabled={isUpdatingTheme}
            >
              {isUpdatingTheme && theme === themeOption.name ? (
                <div className="loading loading-spinner loading-xs"></div>
              ) : (
                <PaletteIcon className="size-3 sm:size-4" />
              )}
              <span className="text-xs sm:text-sm font-medium truncate">{themeOption.label}</span>
              {/* THEME PREVIEW COLORS */}
              <div className="ml-auto flex gap-1">
                {themeOption.colors.map((color, i) => (
                  <span
                    key={i}
                    className="size-1.5 sm:size-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
export default ThemeSelector;
