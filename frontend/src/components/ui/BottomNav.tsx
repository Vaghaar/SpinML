'use client';

import { usePathname, useRouter } from 'next/navigation';

const NAV_ITEMS = [
  { label: 'Accueil',   icon: '🏠', path: '/dashboard' },
  { label: 'Groupes',   icon: '👥', path: '/dashboard?tab=groups' },
  { label: 'Profil',    icon: '👤', path: '/profile'   },
];

interface BottomNavProps {
  active: 'dashboard' | 'groups' | 'profile';
  onTabChange?: (tab: string) => void;
}

export function BottomNav({ active, onTabChange }: BottomNavProps) {
  const router   = useRouter();
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden">
      <div
        className="border-t border-primary-900/40 px-2 py-1"
        style={{ background: 'rgba(13,6,20,0.97)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center justify-around max-w-sm mx-auto">
          {NAV_ITEMS.map(item => {
            const isActive =
              (item.label === 'Accueil'  && active === 'dashboard') ||
              (item.label === 'Groupes'  && active === 'groups')    ||
              (item.label === 'Profil'   && active === 'profile');

            return (
              <button
                key={item.label}
                onClick={() => {
                  if (item.label === 'Groupes' && onTabChange) {
                    onTabChange('groups');
                  } else if (item.label === 'Accueil' && onTabChange) {
                    onTabChange('home');
                  } else {
                    router.push(item.label === 'Groupes' ? '/dashboard' : item.path);
                    if (item.label === 'Groupes' && onTabChange) onTabChange('groups');
                  }
                  if (item.label !== 'Groupes') router.push(item.path.split('?')[0]);
                }}
                className={`flex flex-col items-center gap-0.5 px-5 py-2 rounded-2xl transition-all ${
                  isActive ? 'text-primary-300' : 'text-slate-600 hover:text-slate-400'
                }`}
              >
                {isActive && (
                  <span className="absolute inset-0 bg-primary-500/12 rounded-2xl" />
                )}
                <span className="text-xl">{item.icon}</span>
                <span className={`text-[10px] font-black ${isActive ? 'text-primary-300' : 'text-slate-600'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
