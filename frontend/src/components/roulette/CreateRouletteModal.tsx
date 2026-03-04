'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rouletteApi } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import type { RouletteMode } from '@/types';

interface CreateRouletteModalProps {
  open:    boolean;
  onClose: () => void;
}

interface SegmentInput {
  label:  string;
  weight: number;
}

export function CreateRouletteModal({ open, onClose }: CreateRouletteModalProps) {
  const queryClient = useQueryClient();

  const [name, setName]               = useState('');
  const [mode, setMode]               = useState<RouletteMode>('EQUAL');
  const [surprise, setSurprise]       = useState(false);
  const [segments, setSegments]       = useState<SegmentInput[]>([
    { label: '', weight: 1 },
    { label: '', weight: 1 },
  ]);

  const addSegment = useCallback(() => {
    if (segments.length < 20) setSegments(s => [...s, { label: '', weight: 1 }]);
  }, [segments.length]);

  const removeSegment = useCallback((i: number) => {
    if (segments.length > 2) setSegments(s => s.filter((_, idx) => idx !== i));
  }, [segments.length]);

  const updateSegment = useCallback((i: number, field: keyof SegmentInput, value: string | number) => {
    setSegments(s => s.map((seg, idx) => idx === i ? { ...seg, [field]: value } : seg));
  }, []);

  const mutation = useMutation({
    mutationFn: () => rouletteApi.create({
      name,
      mode,
      isSurpriseMode: surprise,
      segments: segments.map(s => ({ label: s.label.trim(), weight: s.weight })),
    }),
    onSuccess: () => {
      toast.success('Roulette créée !');
      queryClient.invalidateQueries({ queryKey: ['my-roulettes'] });
      onClose();
      setName('');
      setMode('EQUAL');
      setSurprise(false);
      setSegments([{ label: '', weight: 1 }, { label: '', weight: 1 }]);
    },
    onError: () => toast.error('Erreur', 'Impossible de créer la roulette.'),
  });

  const isValid = name.trim().length >= 2 && segments.every(s => s.label.trim().length > 0);

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
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
          >
            <div className="glass rounded-3xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="font-title font-bold text-white text-xl">Nouvelle roulette</h2>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-lg">✕</button>
              </div>

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 uppercase tracking-wider">Nom</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={100}
                  placeholder="Midi du vendredi…"
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-primary-500 text-sm"
                />
              </div>

              {/* Mode */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 uppercase tracking-wider">Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['EQUAL', 'WEIGHTED', 'RANDOM'] as RouletteMode[]).map(m => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`py-2 rounded-xl text-xs font-semibold transition-colors ${
                        mode === m
                          ? 'bg-primary-500 text-white'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {m === 'EQUAL' ? 'Égal' : m === 'WEIGHTED' ? 'Pondéré' : 'Aléatoire'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Surprise */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={surprise}
                  onChange={e => setSurprise(e.target.checked)}
                  className="accent-accent-500 w-4 h-4"
                />
                <span className="text-sm text-slate-300">Mode Surprise 🎁 (masque les segments)</span>
              </label>

              {/* Segments */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-400 uppercase tracking-wider">
                    Segments ({segments.length}/20)
                  </label>
                  <button
                    onClick={addSegment}
                    disabled={segments.length >= 20}
                    className="text-xs text-primary-400 hover:text-primary-300 disabled:opacity-30 transition-colors"
                  >
                    + Ajouter
                  </button>
                </div>

                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {segments.map((seg, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={seg.label}
                        onChange={e => updateSegment(i, 'label', e.target.value)}
                        placeholder={`Segment ${i + 1}`}
                        maxLength={255}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-primary-500 text-sm"
                      />
                      {mode === 'WEIGHTED' && (
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={seg.weight}
                          onChange={e => updateSegment(i, 'weight', Number(e.target.value))}
                          className="w-14 text-center bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
                        />
                      )}
                      <button
                        onClick={() => removeSegment(i)}
                        disabled={segments.length <= 2}
                        className="text-slate-600 hover:text-red-400 disabled:opacity-20 transition-colors px-1"
                        aria-label="Supprimer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={() => mutation.mutate()}
                disabled={!isValid || mutation.isPending}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold text-sm disabled:opacity-40 transition-opacity"
              >
                {mutation.isPending ? 'Création…' : 'Créer la roulette'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
