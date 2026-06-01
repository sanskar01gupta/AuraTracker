'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  const toggleTheme = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-full bg-muted-bg/50 border border-card-border" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="w-9 h-9 flex items-center justify-center rounded-full glass hover:bg-muted-bg/70 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent"
      aria-label="Toggle theme"
    >
      {darkMode ? (
        <Sun className="w-4 h-4 text-amber-400 animate-scale-in" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700 animate-scale-in" />
      )}
    </button>
  );
}
