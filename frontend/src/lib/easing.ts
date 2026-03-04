/**
 * Easing functions for the 5-phase spin animation.
 * All functions map t ∈ [0, 1] → value ∈ [0, 1].
 */

/** Slow in (anticipation recoil) */
export function easeInQuart(t: number): number {
  return t * t * t * t;
}

/** Fast out (deceleration to final angle) */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** Linear */
export function linear(t: number): number {
  return t;
}

/**
 * Custom spin easing for the full deceleration phase:
 * combines an initial plateau then a smooth cubic-out brake.
 */
export function easeSpinDeceleration(t: number): number {
  // First 20% — nearly full speed
  if (t < 0.2) return easeInQuart(t / 0.2) * 0.15;
  // Remaining 80% — smooth cubic brake
  const t2 = (t - 0.2) / 0.8;
  return 0.15 + easeOutCubic(t2) * 0.85;
}

/**
 * Interpolate between two angles along the shortest path.
 * Returns angle in degrees.
 */
export function lerpAngle(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

/**
 * Given a total target rotation (degrees) split across 5 phases,
 * return the current angle for elapsed time.
 *
 * Phases (durations configurable externally):
 *   0 — idle          (no movement)
 *   1 — anticipation  (0.5 s, slight recoil −20°)
 *   2 — acceleration  (1.0 s, 0 → full speed)
 *   3 — deceleration  (2–4 s, depends on serverAngle)
 *   4 — revelation    (0.5 s, slow last degrees + bounce)
 *   5 — result        (persist final angle)
 */
export const PHASE_DURATIONS_MS = {
  anticipation: 500,
  acceleration: 1000,
  revelation:   500,
} as const;

export const ANTICIPATION_RECOIL_DEG = 20;
