import type { Language } from '../types';
export const tx = (language: Language, zh: string, en: string) =>
  language === 'zh' ? zh : en;
