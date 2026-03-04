'use client';

import { useRef, useCallback } from 'react';

/**
 * Procedural sounds via Web Audio API — no external audio files needed.
 */
export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext();
    }
    // Resume if suspended (browser autoplay policy)
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  /** Single tick sound — played each time a segment edge passes the pointer */
  const playTick = useCallback((intensity = 1.0) => {
    const ctx = getCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800 + intensity * 400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.25 * intensity, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
  }, [getCtx]);

  /** Whoosh — acceleration phase sweeping sound */
  const playWhoosh = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;

    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(200, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.3);
    filter.Q.value = 3;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(ctx.currentTime);
  }, [getCtx]);

  /** Charging sweep — anticipation phase rising tone */
  const playCharging = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.45);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.2);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  }, [getCtx]);

  /** Fanfare — revelation / result phase victory jingle */
  const playFanfare = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;

    // C major arpeggio: C5 E5 G5 C6
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const duration = 0.12;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.value = freq;

      const t = ctx.currentTime + i * 0.1;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.3, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc.start(t);
      osc.stop(t + duration);
    });
  }, [getCtx]);

  /** Clunk — deceleration final brake moment */
  const playClunk = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'square';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.18);
  }, [getCtx]);

  return { playTick, playWhoosh, playCharging, playFanfare, playClunk };
}
