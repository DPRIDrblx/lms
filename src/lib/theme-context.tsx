"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";
export type UiMode = "fun" | "clean";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  uiMode: UiMode;
  setUiMode: (mode: UiMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [uiMode, setUiModeState] = useState<UiMode>("fun");

  useEffect(() => {
    const storedTheme = localStorage.getItem("nia-theme") as Theme | null;
    if (storedTheme) {
      setTheme(storedTheme);
    }
    
    const storedUiMode = localStorage.getItem("nia-ui-mode") as UiMode | null;
    if (storedUiMode) {
      setUiModeState(storedUiMode);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("nia-theme", theme);
  }, [theme]);

  const setUiMode = (mode: UiMode) => {
    setUiModeState(mode);
    localStorage.setItem("nia-ui-mode", mode);
  };

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, uiMode, setUiMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
