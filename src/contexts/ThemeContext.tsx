"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "soft-pink" | "lavender-dream" | "coral-sunset" | "mint-fresh";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = "polaroid-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("soft-pink");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
    if (savedTheme && ["soft-pink", "lavender-dream", "coral-sunset", "mint-fresh"].includes(savedTheme)) {
      setThemeState(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      document.documentElement.setAttribute("data-theme", "soft-pink");
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    return {
      theme: "soft-pink" as const,
      setTheme: () => {},
    };
  }
  return context;
}

export const themes: { id: Theme; name: string; color: string }[] = [
  { id: "soft-pink", name: "Soft Pink", color: "oklch(0.85 0.15 340)" },
  { id: "lavender-dream", name: "Lavender Dream", color: "oklch(0.8 0.1 280)" },
  { id: "coral-sunset", name: "Coral Sunset", color: "oklch(0.8 0.15 30)" },
  { id: "mint-fresh", name: "Mint Fresh", color: "oklch(0.85 0.15 170)" },
];
