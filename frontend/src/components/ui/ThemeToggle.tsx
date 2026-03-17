'use client';

import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
      className={`h-9 w-9 rounded-full flex items-center justify-center transition-all duration-200
        bg-white/5 hover:bg-white/10 border border-white/10
        text-slate-400 hover:text-white
        light:bg-black/5 light:hover:bg-black/10 light:border-black/10 light:text-slate-600 light:hover:text-slate-900
        ${className}`}
    >
      {theme === 'dark'
        ? <Sun  size={16} aria-hidden="true" />
        : <Moon size={16} aria-hidden="true" />
      }
    </button>
  );
}
