'use client';

import * as ToastPrimitive from '@radix-ui/react-toast';
import { cn } from '@/lib/utils';
import { create } from 'zustand';

// ─── Store de toasts ──────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info' | 'xp';

interface ToastItem {
  id:      string;
  type:    ToastType;
  title:   string;
  message?: string;
}

interface ToastStore {
  toasts: ToastItem[];
  add:    (toast: Omit<ToastItem, 'id'>) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastStore>()((set) => ({
  toasts: [],
  add: (toast) =>
    set((s) => ({
      toasts: [...s.toasts, { ...toast, id: crypto.randomUUID() }],
    })),
  remove: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// ─── Helper pour déclencher un toast ─────────────────────────────────────────

export const toast = {
  success: (title: string, message?: string) =>
    useToastStore.getState().add({ type: 'success', title, message }),
  error: (title: string, message?: string) =>
    useToastStore.getState().add({ type: 'error', title, message }),
  info: (title: string, message?: string) =>
    useToastStore.getState().add({ type: 'info', title, message }),
  xp: (amount: number, badge?: string) =>
    useToastStore.getState().add({
      type:    'xp',
      title:   `+${amount} XP`,
      message: badge ? `Badge débloqué : ${badge}` : undefined,
    }),
};

// ─── Composant Toaster ────────────────────────────────────────────────────────

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
  xp:      '⚡',
};

const COLORS: Record<ToastType, string> = {
  success: 'border-green-500  bg-green-500/10  text-green-400',
  error:   'border-red-500    bg-red-500/10    text-red-400',
  info:    'border-primary-500 bg-primary-500/10 text-primary-400',
  xp:      'border-secondary-500 bg-secondary-500/10 text-secondary-400',
};

export function Toaster() {
  const { toasts, remove } = useToastStore();

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {toasts.map((toast) => (
        <ToastPrimitive.Root
          key={toast.id}
          open
          onOpenChange={(open) => { if (!open) remove(toast.id); }}
          duration={3000}
          className={cn(
            'glass rounded-xl p-4 border flex items-start gap-3',
            'data-[state=open]:animate-bounce-in',
            'data-[state=closed]:opacity-0 data-[state=closed]:translate-x-full',
            'transition-all duration-300',
            COLORS[toast.type]
          )}
        >
          <span className="text-lg font-bold">{ICONS[toast.type]}</span>
          <div className="flex-1 min-w-0">
            <ToastPrimitive.Title className="font-title font-bold text-white text-sm">
              {toast.title}
            </ToastPrimitive.Title>
            {toast.message && (
              <ToastPrimitive.Description className="text-xs mt-0.5 opacity-80">
                {toast.message}
              </ToastPrimitive.Description>
            )}
          </div>
          <ToastPrimitive.Close
            className="text-slate-500 hover:text-white transition-colors text-sm ml-2"
            aria-label="Fermer"
          >
            ✕
          </ToastPrimitive.Close>
        </ToastPrimitive.Root>
      ))}

      <ToastPrimitive.Viewport
        className="fixed bottom-4 right-4 flex flex-col gap-2 w-80 z-[1000]"
      />
    </ToastPrimitive.Provider>
  );
}
