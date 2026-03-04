import { cn, getTimeOfDay, LEVEL_TITLES, FOOD_AVATAR_EMOJI } from '@/lib/utils';

describe('cn (className merger)', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('deduplicates Tailwind classes', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('handles undefined/null gracefully', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end');
  });
});

describe('getTimeOfDay', () => {
  it('returns a non-empty string', () => {
    const result = getTimeOfDay();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns one of the expected greetings', () => {
    const valid = ['matin', 'midi', 'après-midi', 'soir', 'nuit'];
    const result = getTimeOfDay();
    expect(valid.some(v => result.includes(v))).toBe(true);
  });
});

describe('LEVEL_TITLES', () => {
  it('has entries for levels 1–20', () => {
    for (let lvl = 1; lvl <= 20; lvl++) {
      expect(LEVEL_TITLES[lvl]).toBeDefined();
      expect(typeof LEVEL_TITLES[lvl]).toBe('string');
    }
  });
});

describe('FOOD_AVATAR_EMOJI', () => {
  it('has emoji for each avatar type', () => {
    const types = ['PIZZA', 'SUSHI', 'BURGER', 'SALADE'];
    types.forEach(type => {
      expect(FOOD_AVATAR_EMOJI[type]).toBeDefined();
      expect(typeof FOOD_AVATAR_EMOJI[type]).toBe('string');
    });
  });
});
