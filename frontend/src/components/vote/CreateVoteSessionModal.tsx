'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { voteApi } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import type { VoteMode } from '@/types';

interface CreateVoteSessionModalProps {
  groupId:   string;
  open:      boolean;
  onClose:   () => void;
  onCreated: () => void;
}

const MODES: { value: VoteMode; label: string; desc: string }[] = [
  { value: 'MAJORITY', label: 'Majorité',  desc: '1 vote par personne — le plus voté gagne' },
  { value: 'APPROVAL', label: 'Approbation', desc: 'Approuvez autant d\'options que vous voulez' },
  { value: 'POINTS',   label: 'Points',    desc: 'Distribuez des points entre les options' },
];

export function CreateVoteSessionModal({ groupId, open, onClose, onCreated }: CreateVoteSessionModalProps) {
  const [mode, setMode] = useState<VoteMode>('MAJORITY');

  const mutation = useMutation({
    mutationFn: () => voteApi.createSession({ groupId, mode }),
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

              <div className="flex flex-col gap-2">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Mode de vote</p>
                {MODES.map(m => (
                  <label key={m.value}
                    className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                      mode === m.value
                        ? 'border-primary-500/60 bg-primary-500/10'
                        : 'border-white/5 hover:border-white/15'
                    }`}>
                    <input type="radio" name="mode" value={m.value}
                      checked={mode === m.value}
                      onChange={() => setMode(m.value)}
                      className="mt-0.5 accent-primary-500" />
                    <div>
                      <p className="text-sm text-white font-semibold">{m.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{m.desc}</p>
                    </div>
                  </label>
                ))}
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
