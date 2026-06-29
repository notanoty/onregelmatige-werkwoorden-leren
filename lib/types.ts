export type LanguageCode = 'en' | 'ru';

export type AuxiliaryVerb = 'hebben' | 'zijn' | 'hebben/zijn';
export type SelectableAuxiliaryVerb = 'hebben' | 'zijn';

export interface Verb {
  infinitive: string;
  pastSingular: string;
  pastPlural: string;
  pastParticiple: string;
  auxiliary: AuxiliaryVerb;
  translations?: Partial<Record<LanguageCode, string>>;
}

/** The test screen works with the same verb shape as everywhere else. */
export type TestVerb = Verb;

export interface UserAnswer {
  infinitive: string;
  pastSingular: string;
  pastPlural: string;
  pastParticiple: string;
  auxiliary: SelectableAuxiliaryVerb | '';
}

export type AnswerField = keyof UserAnswer;

export interface AnswerRecord {
  verb: TestVerb;
  prompt: string;
  userAnswer: UserAnswer;
  isCorrect: boolean;
}

/** How the learner works through the cards. */
export type TestMode = 'flashcard' | 'typed';

/** A single self-graded outcome for one card. */
export type VerbResult = 'knew' | 'didnt' | 'skipped';

/** Aggregate, account-free progress for one verb (keyed by infinitive). */
export interface VerbProgress {
  knew: number;
  didnt: number;
  skipped: number;
  /** Currently in the "review later" list. */
  marked: boolean;
  lastResult: VerbResult | null;
  /** Epoch ms of the most recent action. */
  lastSeenAt: number;
}

/** The whole locally-persisted progress document. */
export interface ProgressState {
  version: 1;
  verbs: Record<string, VerbProgress>;
  sessions: number;
}
