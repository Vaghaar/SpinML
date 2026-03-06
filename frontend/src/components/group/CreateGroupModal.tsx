'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { groupApi } from '@/lib/api';
import { toast } from '@/components/ui/Toast';

interface CreateGroupModalProps {
  open:    boolean;
  onClose: () => void;
}

export function CreateGroupModal({ open, onClose }: CreateGroupModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');

  const mutation = useMutation({
    mutationFn: () => groupApi.create({ name: name.trim() }),
    onSuccess: () => {
      toast.success('Groupe créé !');
      queryClient.invalidateQueries({ queryKey: ['my-groups'] });
      setName('');
      onClose();
    },
    onError: () => toast.error('Erreur', 'Impossible de créer le groupe.'),
  });

  const isValid = name.trim().length >= 2;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{    opacity: 0, scale: 0.95,  y: 10 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-sm mx-auto"
          >
            <div className="glass rounded-3xl p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h2 className="font-title font-bold text-white text-xl">Nouveau groupe</h2>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-lg">✕</button>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 uppercase tracking-wider">Nom du groupe</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && isValid && mutation.mutate()}
                  maxLength={100}
                  placeholder="Les collègues du midi…"
                  autoFocus
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-accent-500 text-sm"
                />
                <p className="text-xs text-slate-500">Un code d'invitation unique sera généré automatiquement.</p>
              </div>

              <button
                onClick={() => mutation.mutate()}
                disabled={!isValid || mutation.isPending}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-accent-500 to-accent-600 text-white font-bold text-sm disabled:opacity-40 transition-opacity"
              >
                {mutation.isPending ? 'Création…' : 'Créer le groupe'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
