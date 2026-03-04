import {
  easeInQuart,
  easeOutCubic,
  linear,
  easeSpinDeceleration,
  lerpAngle,
} from '@/lib/easing';

describe('easeInQuart', () => {
  it('returns 0 at t=0', () => {
    expect(easeInQuart(0)).toBe(0);
  });
  it('returns 1 at t=1', () => {
    expect(easeInQuart(1)).toBe(1);
  });
  it('is strictly increasing', () => {
    const values = [0, 0.25, 0.5, 0.75, 1].map(easeInQuart);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });
  it('is concave up (slow start)', () => {
    // At t=0.5, value should be less than 0.5 (accelerating)
    expect(easeInQuart(0.5)).toBeLessThan(0.5);
  });
});

describe('easeOutCubic', () => {
  it('returns 0 at t=0', () => {
    expect(easeOutCubic(0)).toBe(0);
  });
  it('returns 1 at t=1', () => {
    expect(easeOutCubic(1)).toBe(1);
  });
  it('is concave down (fast start, slow end)', () => {
    // At t=0.5, value should be greater than 0.5
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });
});

describe('linear', () => {
  it.each([0, 0.25, 0.5, 0.75, 1])('returns t at t=%f', (t) => {
    expect(linear(t)).toBe(t);
  });
});

describe('easeSpinDeceleration', () => {
  it('returns 0 at t=0', () => {
    expect(easeSpinDeceleration(0)).toBeCloseTo(0, 5);
  });
  it('returns 1 at t=1', () => {
    expect(easeSpinDeceleration(1)).toBeCloseTo(1, 5);
  });
  it('is monotonically increasing', () => {
    const steps = 20;
    let prev = -Infinity;
    for (let i = 0; i <= steps; i++) {
      const v = easeSpinDeceleration(i / steps);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
});

describe('lerpAngle', () => {
  it('returns from at t=0', () => {
    expect(lerpAngle(100, 200, 0)).toBe(100);
  });
  it('returns to at t=1', () => {
    expect(lerpAngle(100, 200, 1)).toBe(200);
  });
  it('returns midpoint at t=0.5', () => {
    expect(lerpAngle(0, 360, 0.5)).toBe(180);
  });
});
