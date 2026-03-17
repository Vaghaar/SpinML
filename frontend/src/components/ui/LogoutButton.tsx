'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface LogoutButtonProps {
  onClick: () => void;
  className?: string;
  label?: string;
}

export function LogoutButton({ onClick, className, label = 'Déconnexion' }: LogoutButtonProps) {
  const [leaving, setLeaving] = useState(false);

  const handleClick = () => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(() => onClick(), 1050);
  };

  return (
    <button
      onClick={handleClick}
      disabled={leaving}
      className={cn(
        'relative flex items-center gap-2',
        'text-sm font-bold px-4 py-2 rounded-full transition-all',
        'text-slate-400 hover:text-slate-200 hover:bg-white/8',
        leaving && 'pointer-events-none',
        className,
      )}
    >
      <style>{`
        /* Figure marche vers la porte puis disparaît */
        @keyframes lbo-walk {
          0%   { transform: translateX(0);    opacity: 1; }
          75%  { transform: translateX(20px); opacity: 1; }
          90%  { transform: translateX(25px); opacity: 0; }
          100% { transform: translateX(25px); opacity: 0; }
        }
        /* Jambes qui alternent */
        @keyframes lbo-legs {
          0%   { d: path("M5 12 L3.5 17.5 M5 12 L6.5 17.5"); }
          33%  { d: path("M5 12 L2.5 17 M5 12 L7.5 17.5"); }
          66%  { d: path("M5 12 L7.5 17.5 M5 12 L2.5 17"); }
          100% { d: path("M5 12 L3.5 17.5 M5 12 L6.5 17.5"); }
        }
        /* Bras qui alternent en opposition */
        @keyframes lbo-arms {
          0%   { d: path("M5 8.5 L2.5 11 M5 8.5 L7.5 11"); }
          33%  { d: path("M5 8.5 L2 10 M5 8.5 L8 11.5"); }
          66%  { d: path("M5 8.5 L2 11.5 M5 8.5 L8 10"); }
          100% { d: path("M5 8.5 L2.5 11 M5 8.5 L7.5 11"); }
        }
        /* Panneau de porte s'ouvre depuis le montant gauche (gond) */
        @keyframes lbo-door-panel {
          0%   { transform: scaleX(1);    }
          35%  { transform: scaleX(0.05); }
          100% { transform: scaleX(0.05); }
        }
        /* Poignée suit le panneau */
        @keyframes lbo-knob {
          0%   { transform: translateX(0);    }
          35%  { transform: translateX(-13px); }
          100% { transform: translateX(-13px); }
        }
      `}</style>

      <span>{label}</span>

      {/* Scène : bonhomme + porte */}
      <svg
        viewBox="0 0 46 20"
        width="46"
        height="20"
        fill="none"
        aria-hidden="true"
        style={{ flexShrink: 0, overflow: 'visible' }}
      >
        {/* Montant de porte (fixe) */}
        <rect x="28" y="1" width="16" height="18" rx="0.5"
          stroke="currentColor" strokeWidth="1.2" opacity="0.45" />

        {/* Panneau de porte – s'écrase depuis le gond gauche pour simuler l'ouverture */}
        <rect x="28" y="1" width="16" height="18"
          fill="currentColor" opacity="0.13"
          style={{
            transformBox: 'fill-box',
            transformOrigin: 'left center',
            animation: leaving ? 'lbo-door-panel 0.38s ease-in forwards' : 'none',
          }}
        />

        {/* Poignée (suit le panneau) */}
        <circle cx="42" cy="10" r="1.1"
          fill="currentColor" opacity="0.65"
          style={{
            animation: leaving ? 'lbo-knob 0.38s ease-in forwards' : 'none',
          }}
        />

        {/* ── Bonhomme ── */}
        <g style={{ animation: leaving ? 'lbo-walk 1.05s ease-in-out forwards' : 'none' }}>
          {/* Tête */}
          <circle cx="5" cy="4" r="2.1" fill="currentColor" />
          {/* Corps */}
          <line x1="5" y1="6.1" x2="5" y2="12"
            stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          {/* Bras (path animé) */}
          <path
            d="M5 8.5 L2.5 11 M5 8.5 L7.5 11"
            stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
            style={{ animation: leaving ? 'lbo-arms 0.36s linear infinite' : 'none' }}
          />
          {/* Jambes (path animé) */}
          <path
            d="M5 12 L3.5 17.5 M5 12 L6.5 17.5"
            stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
            style={{ animation: leaving ? 'lbo-legs 0.36s linear infinite' : 'none' }}
          />
        </g>
      </svg>
    </button>
  );
}
