import type { AnswerField, LanguageCode } from '@/lib/types';

export const LANGUAGE_OPTIONS: ReadonlyArray<{ code: LanguageCode; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Russian' },
];

export const LANGUAGE_LABELS = Object.fromEntries(
  LANGUAGE_OPTIONS.map((option) => [option.code, option.label])
) as Record<LanguageCode, string>;

export const ANSWER_FIELDS: readonly AnswerField[] = [
  'infinitive',
  'pastSingular',
  'pastPlural',
  'pastParticiple',
  'auxiliary',
];

export const ANSWER_FIELD_LABELS: Record<AnswerField, string> = {
  infinitive: 'Infinitive',
  pastSingular: 'Past singular',
  pastPlural: 'Past plural',
  pastParticiple: 'Past participle',
  auxiliary: 'Auxiliary verb',
};

export const ROUTES = {
  home: '/',
  learn: '/learn',
  test: '/learn/test',
  words: '/words',
  review: '/learn/review',
  stats: '/stats',
} as const;
