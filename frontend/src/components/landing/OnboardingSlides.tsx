'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { cn }     from '@/lib/utils';

const SLIDES = [
  {
    icon:  '🎡',
    title: 'Créez votre roulette',
    desc:  'Ajoutez vos plats favoris, restaurants du coin ou cuisines du monde. Pondérez selon vos envies.',
    color: 'from-primary-500/20 to-primary-500/5',
  },
  {
    icon:  '👥',
    title: 'Invitez votre équipe',
    desc:  'Partagez un lien ou un QR code. Tout le monde voit la roue tourner en même temps.',
    color: 'from-accent-600/20 to-accent-600/5',
  },
  {
    icon:  '🎉',
    title: 'Spinnez et mangez !',
    desc:  'Un clic, et le destin décide. Fini le "je sais pas, toi t\'as une idée ?" du midi.',
    color: 'from-secondary-500/20 to-secondary-500/5',
  },
] as const;

interface OnboardingSlidesProps {
  onComplete: () => void;
}

export function OnboardingSlides({ onComplete }: OnboardingSlidesProps) {
  const [current, setCurrent] = useState(0);
  const isLast = current === SLIDES.length - 1;

  const next = useCallback(() => {
    if (isLast) onComplete();
    else setCurrent((c) => c + 1);
  }, [isLast, onComplete]);

  const prev = useCallback(() => {
    setCurrent((c) => Math.max(0, c - 1));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-bg/95 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm">
        {/* Indicateurs de progression */}
        <div className="flex justify-center gap-2 mb-8">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === current
                  ? 'w-8 bg-primary-500'
                  : 'w-2 bg-slate-600 hover:bg-slate-400'
              )}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Slide */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={cn(
              'glass rounded-3xl p-8 text-center bg-gradient-to-br',
              SLIDES[current].color
            )}
          >
            <div className="text-7xl mb-6 animate-bounce-in">
              {SLIDES[current].icon}
            </div>
            <h2 className="font-title text-2xl font-bold text-white mb-3">
              {SLIDES[current].title}
            </h2>
            <p className="font-body text-slate-300 leading-relaxed">
              {SLIDES[current].desc}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 gap-3">
          <button
            onClick={onComplete}
            className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
          >
            Passer
          </button>

          <div className="flex gap-2">
            {current > 0 && (
              <Button variant="ghost" size="md" onClick={prev}>
                ←
              </Button>
            )}
            <Button
              variant={isLast ? 'primary' : 'outline'}
              size="md"
              onClick={next}
              className="min-w-[120px]"
            >
              {isLast ? 'Commencer !' : 'Suivant →'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
