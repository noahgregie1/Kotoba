export const DURATION = 180_000;
export const RULE_VERSION = 'animals-v1';
export const MAX_LENGTH = 48;
export type Mode = 'Learner' | 'Fluent';
export type Judgment = {
  valid: boolean | null;
  conceptId: string;
  canonical: string;
  reading: string;
  translation: string;
  reason: string;
  confidence: number;
};
export type Word = Pick<Judgment, 'conceptId' | 'canonical' | 'reading' | 'translation'>;
export type Round = { id: string; start: number; mode: Mode; gaveUpAt: number | null; words: Word[] };
export function onTime(start: number, received: number, gaveUpAt: number | null = null) {
  return received >= start && received < Math.min(start + DURATION, gaveUpAt ?? Infinity);
}
export function normalize(word: string) {
  return word.normalize('NFKC').trim().replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 96));
}
export function undecided(reason: string): Judgment {
  return { valid: null, conceptId: '', canonical: '', reading: '', translation: '', reason, confidence: 0 };
}
