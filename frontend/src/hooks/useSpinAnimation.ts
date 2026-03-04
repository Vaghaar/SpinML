'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  easeInQuart,
  easeOutCubic,
  easeSpinDeceleration,
  PHASE_DURATIONS_MS,
  ANTICIPATION_RECOIL_DEG,
} from '@/lib/easing';
import { useSound } from '@/hooks/useSound';

export type SpinPhase =
  | 'idle'
  | 'anticipation'
  | 'acceleration'
  | 'deceleration'
  | 'revelation'
  | 'result';

export interface SpinAnimationState {
  phase: SpinPhase;
  currentAngle: number;   // degrees, current visual angle
  targetAngle: number;    // degrees, server-provided final angle
  isSpinning: boolean;
}

interface UseSpinAnimationReturn extends SpinAnimationState {
  startSpin: (serverAngleDeg: number) => void;
  reset: () => void;
}

const FULL_ROTATIONS_EXTRA = 5; // extra full turns before the server angle
const TICK_THRESHOLD_DEG   = 15; // play tick every N degrees crossed

export function useSpinAnimation(): UseSpinAnimationReturn {
  const [phase, setPhase]               = useState<SpinPhase>('idle');
  const [currentAngle, setCurrentAngle] = useState(0);
  const [targetAngle, setTargetAngle]   = useState(0);

  const rafRef         = useRef<number>(0);
  const startTimeRef   = useRef<number>(0);
  const startAngleRef  = useRef<number>(0);
  const lastTickRef    = useRef<number>(0);
  const phaseRef       = useRef<SpinPhase>('idle');

  const { playTick, playWhoosh, playCharging, playFanfare, playClunk } = useSound();

  // Keep phaseRef in sync for use inside rAF callbacks
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const cancelRaf = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }, []);

  /**
   * Run a single animation phase.
   * @param durationMs   — wall-clock duration of this phase
   * @param fromAngle    — start angle (degrees)
   * @param toAngle      — end angle (degrees)
   * @param easingFn     — easing function [0,1] → [0,1]
   * @param nextPhase    — phase to enter after completion
   * @param onTick       — called each frame with (angle, progress)
   * @param onDone       — called when phase is complete
   */
  const runPhase = useCallback((
    durationMs: number,
    fromAngle: number,
    toAngle: number,
    easingFn: (t: number) => number,
    onTick: (angle: number, progress: number) => void,
    onDone: () => void,
  ) => {
    startTimeRef.current  = performance.now();
    startAngleRef.current = fromAngle;

    const animate = (now: number) => {
      const elapsed  = now - startTimeRef.current;
      const rawT     = Math.min(elapsed / durationMs, 1);
      const easedT   = easingFn(rawT);
      const angle    = fromAngle + (toAngle - fromAngle) * easedT;

      setCurrentAngle(angle);
      onTick(angle, rawT);

      if (rawT < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentAngle(toAngle);
        onDone();
      }
    };

    cancelRaf();
    rafRef.current = requestAnimationFrame(animate);
  }, [cancelRaf]);

  const startSpin = useCallback((serverAngleDeg: number) => {
    if (phaseRef.current !== 'idle' && phaseRef.current !== 'result') return;

    const baseAngle    = currentAngle % 360;
    // Total angle the wheel must travel = extra full rotations + the server target
    const totalTravel  = FULL_ROTATIONS_EXTRA * 360 + serverAngleDeg;
    const finalAngle   = baseAngle + totalTravel;

    setTargetAngle(finalAngle);
    lastTickRef.current = baseAngle;

    // ── PHASE 1: Anticipation (slight recoil) ──────────────────────────────
    setPhase('anticipation');
    phaseRef.current = 'anticipation';
    playCharging();

    const recoilAngle = baseAngle - ANTICIPATION_RECOIL_DEG;
    runPhase(
      PHASE_DURATIONS_MS.anticipation,
      baseAngle,
      recoilAngle,
      easeInQuart,
      () => {},
      () => {
        // ── PHASE 2: Acceleration ──────────────────────────────────────────
        setPhase('acceleration');
        phaseRef.current = 'acceleration';
        playWhoosh();

        // Accelerate to cover 20% of total distance
        const accelEnd = recoilAngle + totalTravel * 0.20;
        runPhase(
          PHASE_DURATIONS_MS.acceleration,
          recoilAngle,
          accelEnd,
          easeInQuart,
          (angle) => {
            // Tick on segment crossings
            if (Math.abs(angle - lastTickRef.current) >= TICK_THRESHOLD_DEG) {
              playTick(0.6);
              lastTickRef.current = angle;
            }
          },
          () => {
            // ── PHASE 3: Deceleration ────────────────────────────────────
            setPhase('deceleration');
            phaseRef.current = 'deceleration';

            const deccelEnd    = finalAngle - 3; // stop 3° before for revelation
            const deccelTravel = deccelEnd - accelEnd;
            // Duration scales with remaining distance (2–4 s)
            const deccelDuration = Math.max(2000, Math.min(4000, deccelTravel * 4));

            runPhase(
              deccelDuration,
              accelEnd,
              deccelEnd,
              easeSpinDeceleration,
              (angle, progress) => {
                const speed = 1 - progress;
                // Tick frequency and intensity decreases as wheel slows
                const threshold = TICK_THRESHOLD_DEG * (0.5 + progress * 2);
                if (Math.abs(angle - lastTickRef.current) >= threshold) {
                  playTick(speed);
                  lastTickRef.current = angle;
                }
              },
              () => {
                // ── PHASE 4: Revelation ────────────────────────────────
                setPhase('revelation');
                phaseRef.current = 'revelation';
                playClunk();

                runPhase(
                  PHASE_DURATIONS_MS.revelation,
                  deccelEnd,
                  finalAngle,
                  easeOutCubic,
                  () => {},
                  () => {
                    // ── PHASE 5: Result ──────────────────────────────
                    setPhase('result');
                    phaseRef.current = 'result';
                    playFanfare();
                    // Haptic feedback (mobile)
                    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                  },
                );
              },
            );
          },
        );
      },
    );
  }, [currentAngle, runPhase, playCharging, playWhoosh, playTick, playClunk, playFanfare]);

  const reset = useCallback(() => {
    cancelRaf();
    setPhase('idle');
    phaseRef.current = 'idle';
    setCurrentAngle(0);
    setTargetAngle(0);
    lastTickRef.current = 0;
  }, [cancelRaf]);

  // Cleanup on unmount
  useEffect(() => () => cancelRaf(), [cancelRaf]);

  return {
    phase,
    currentAngle,
    targetAngle,
    isSpinning: phase !== 'idle' && phase !== 'result',
    startSpin,
    reset,
  };
}
