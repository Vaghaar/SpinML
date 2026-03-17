'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { voteApi } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
interface CreateVoteSessionModalProps {
  groupId:   string;
  open:      boolean;
  onClose:   () => void;
  onCreated: () => void;
}

export function CreateVoteSessionModal({ groupId, open, onClose, onCreated }: CreateVoteSessionModalProps) {
  const mutation = useMutation({
    mutationFn: () => voteApi.createSession({ groupId, mode: 'MAJORITY' }),
    onSuccess: () => {
      toast.success('Vote créé !', 'Les membres peuvent maintenant proposer leurs idées.');
      onCreated();
      onClose();
    },
    onError: () => toast.error('Erreur', 'Impossible de créer le vote.'),
  });

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
                <h2 className="font-title font-bold text-white text-xl">Nouveau vote</h2>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-lg">✕</button>
              </div>

              <div className="glass rounded-xl p-3 flex items-start gap-2">
                <span className="text-base">💡</span>
                <p className="text-xs text-slate-400">
                  Le vote sera créé en mode <strong className="text-slate-300">collecte de propositions</strong>.
                  Chaque membre peut ajouter ses idées avant que l'admin démarre le vote.
                </p>
              </div>

              <button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-bold text-sm disabled:opacity-40 transition-opacity"
              >
                {mutation.isPending ? 'Création…' : 'Créer le vote'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
