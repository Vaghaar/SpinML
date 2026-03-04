import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes intelligemment (sans conflits). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Retourne l'heure du jour : 'morning' | 'noon' | 'evening' */
export function getTimeOfDay(): 'morning' | 'noon' | 'evening' {
  const h = new Date().getHours();
  if (h >= 6  && h < 11) return 'morning';
  if (h >= 11 && h < 15) return 'noon';
  return 'evening';
}

/** Formate un nombre avec suffixe K/M */
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

/** Interpole entre deux couleurs hex */
export function lerpColor(a: string, b: string, t: number): string {
  const parse = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bv = Math.round(ab + (bb - ab) * t);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${bv.toString(16).padStart(2,'0')}`;
}

/** Tronque un texte avec ellipsis */
export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

/** Délai async */
export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/** Clamp une valeur entre min et max */
export const clamp = (val: number, min: number, max: number) =>
  Math.min(Math.max(val, min), max);

/** Food avatar → emoji */
export const FOOD_AVATAR_EMOJI: Record<string, string> = {
  PIZZA:  '🍕',
  SUSHI:  '🍣',
  BURGER: '🍔',
  SALADE: '🥗',
};

/** Niveau → titre */
export const LEVEL_TITLES: Record<number, string> = {
  1:  'Novice',        2:  'Affamé',       3:  'Curieux',
  4:  'Explorateur',   5:  'Gourmand',      6:  'Connaisseur',
  7:  'Épicurien',     8:  'Critique',      9:  'Expert',
  10: 'Maître',        11: 'Grand Maître',  12: 'Chef',
  13: 'Chef Étoilé',   14: 'Gourmet',       15: 'Sommelier',
  16: 'Gastronome',    17: 'Trendsetter',   18: 'Légende',
  19: 'Icône',         20: 'Foodie Légendaire',
};
