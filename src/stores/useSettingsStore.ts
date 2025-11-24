import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "dark" | "light";

interface SettingsStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: "dark",
      setTheme: (theme) => set({ theme }),
    }),
    { name: "settings-store" }
  )
);
