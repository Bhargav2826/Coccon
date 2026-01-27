import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("streamify-theme") || "night",
  setTheme: (theme) => {
    localStorage.setItem("streamify-theme", theme);
    set({ theme });
  },
  // Function to sync with database theme
  syncThemeFromDB: (dbTheme) => {
    if (dbTheme && dbTheme !== localStorage.getItem("streamify-theme")) {
      localStorage.setItem("streamify-theme", dbTheme);
      set({ theme: dbTheme });
    }
  },
}));
