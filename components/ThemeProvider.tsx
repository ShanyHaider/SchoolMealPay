"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "dark",
}: {
  children: ReactNode;
  defaultTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(
    defaultTheme === "system" ? "dark" : defaultTheme,
  );

  // Load saved theme from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored) setThemeState(stored);
  }, []);

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement; // ← <html>, not a wrapper div
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const resolve = () => {
      const resolved =
        theme === "system" ?
          mediaQuery.matches ?
            "dark"
            : "light"
          : theme;
      setResolvedTheme(resolved);
      root.classList.remove("light", "dark");
      root.classList.add(resolved);
      root.setAttribute("data-theme", resolved);
    };

    resolve();
    if (theme === "system") mediaQuery.addEventListener("change", resolve);
    return () => mediaQuery.removeEventListener("change", resolve);
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("theme", t);
  };

  // No wrapper div — just renders children directly
  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export function ThemeToggleButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  if (!mounted) return <div className="h-11 w-11" />;

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle structural interface skin theme"
      className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isDark ? "sun" : "moon"}
          initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 45, scale: 0.8 }}
          transition={{ duration: 0.15 }}
          className="flex items-center justify-center"
        >
          {isDark ?
            <Sun size={19} className="text-amber-500" />
            : <Moon size={19} />}
        </motion.div>
      </AnimatePresence>
    </button>
  );
}
