'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface LogoutButtonProps {
  onClick: () => void;
  className?: string;
  label?: string;
}

export function LogoutButton({ onClick, className, label = 'Déconnexion' }: LogoutButtonProps) {
  const [falling, setFalling] = useState(false);

  const handleClick = () => {
    setFalling(true);
    setTimeout(() => {
      onClick();
    }, 800);
  };

  return (
    <button
      onClick={handleClick}
      disabled={falling}
      className={cn(
        'logout-btn relative overflow-hidden flex items-center gap-2',
        'text-xs font-bold px-3 py-1.5 rounded-full transition-all',
        'text-slate-500 hover:text-slate-300 hover:bg-white/5',
        falling && 'pointer-events-none',
        className,
      )}
    >
      <span className="relative z-10">{label}</span>

      {/* Door SVG */}
      <span className="relative w-4 h-4 shrink-0">
        <svg viewBox="0 0 16 16" className="w-4 h-4 absolute inset-0" fill="none">
          {/* Doorframe */}
          <rect x="4" y="2" width="8" height="12" rx="0.5" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.5"/>
          {/* Door panel */}
          <rect x="4" y="2" width="8" height="12" rx="0.5" fill="currentColor" opacity="0.12"/>
          {/* Knob */}
          <circle cx="11" cy="8.5" r="0.8" fill="currentColor" opacity="0.7"/>
        </svg>

        {/* Walking figure */}
        <span
          className={cn(
            'figure absolute right-0.5 bottom-0.5 text-[8px] leading-none transition-all duration-700',
            falling
              ? 'translate-x-4 opacity-0 -rotate-90'
              : 'translate-x-0 opacity-100 rotate-0',
          )}
          style={{ transitionTimingFunction: falling ? 'cubic-bezier(0.7,0.1,1,1)' : 'ease' }}
        >
          🚶
        </span>
      </span>
    </button>
  );
}
