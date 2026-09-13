'use client';

import Link from 'next/link';
import { useEffect, useReducer, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ANSWER_FIELDS, ANSWER_FIELD_LABELS, LANGUAGE_LABELS, ROUTES } from '@/lib/constants';
import type {
  AnswerField,
  LanguageCode,
  TestMode,
  TestVerb,
  UserAnswer,
  VerbResult,
} from '@/lib/types';
import { cn } from '@/lib/utils';
import { PageShell, NAV_BUTTON_CLASS } from '@/components/page-shell';
import { incrementSessions, recordResult } from '@/lib/progress/progressStore';

type TestRunnerProps = {
  verbs: TestVerb[];
  mode: TestMode;
  showInfinitive: boolean;
  translationLanguage: LanguageCode;
};

const ACTION_BUTTON_CLASS =
  'h-auto border-2 border-foreground px-8 py-4 text-xl font-semibold transition-transform hover:scale-105';

/** Shared header nav for every test screen: jump to marked words or back to settings. */
const testActions = (
  <>
    <Button asChild variant="secondary" className={NAV_BUTTON_CLASS}>
      <Link href={ROUTES.review}>Marked words</Link>
    </Button>
    <Button asChild variant="secondary" className={NAV_BUTTON_CLASS}>
      <Link href={ROUTES.learn}>Back to Settings</Link>
    </Button>
  </>
);
const GRADE_BUTTON_CLASS = 'h-auto border-2 border-foreground px-6 py-4 text-lg font-semibold transition-transform hover:scale-105';
const TEXT_BUTTON_CLASS =
  'h-auto bg-transparent p-0 text-lg font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground';

// ── Pure helpers (shared) ───────────────────────────────────────────────────

function shuffleVerbs(verbs: TestVerb[]): TestVerb[] {
  const shuffled = [...verbs];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function matchesExpectedValue(userValue: string, expectedValue: string): boolean {
  const normalizedUserValue = normalize(userValue);
  if (expectedValue === '—') {
    return normalizedUserValue === '' || normalizedUserValue === '—';
  }
  return expectedValue
    .split('/')
    .map((option) => normalize(option))
    .some((option) => option === normalizedUserValue);
}

function createEmptyAnswer(): UserAnswer {
  return { infinitive: '', pastSingular: '', pastPlural: '', pastParticiple: '', auxiliary: '' };
}

function isAnswerCorrect(userAnswer: UserAnswer, verb: TestVerb): boolean {
  return (
    matchesExpectedValue(userAnswer.infinitive, verb.infinitive) &&
    matchesExpectedValue(userAnswer.pastSingular, verb.pastSingular) &&
    matchesExpectedValue(userAnswer.pastPlural, verb.pastPlural) &&
    matchesExpectedValue(userAnswer.pastParticiple, verb.pastParticiple) &&
    matchesExpectedValue(userAnswer.auxiliary, verb.auxiliary)
  );
}

function promptFor(verb: TestVerb, language: LanguageCode): string {
  return verb.translations?.[language] || verb.infinitive;
}

// ── Reducer: a queue/round state machine ────────────────────────────────────
//
// Cards flow through a `pending` queue. "Didn't know" pushes the card into
// `nextRound`, which becomes a fresh review round once the current round drains.
// "Skip" re-queues the card at the end of the current round. Every graded card
// (knew/didnt) is appended to `log` for the results table.

type GradeResult = Extract<VerbResult, 'knew' | 'didnt'>;

/** The clickable cells on the flashcard answer face (auxiliary is bundled into `pastParticiple`). */
type FlashcardField = 'translation' | 'infinitive' | 'pastSingular' | 'pastPlural' | 'pastParticiple';

interface GradedRecord {
  verb: TestVerb;
  prompt: string;
  userAnswer: UserAnswer;
  isCorrect: boolean;
  result: GradeResult;
  round: number;
  /** Flashcard mode only: which answer cells the learner clicked as "I got this wrong". */
  wrongFields: FlashcardField[];
}

interface RunnerStateCore {
  mode: TestMode;
  language: LanguageCode;
  roundNumber: number;
  /** Distinct cards in the current round (denominator of "Card X / N"). */
  roundTotal: number;
  /** Cards graded so far in this round (skips don't count). */
  doneInRound: number;
  current: TestVerb | null;
  pending: TestVerb[];
  nextRound: TestVerb[];
  phase: 'prompt' | 'revealed';
  typedAnswer: UserAnswer;
  log: GradedRecord[];
  sessionMarked: string[];
  counts: { knew: number; didnt: number; skipped: number };
  finished: boolean;
}

interface RunnerState extends RunnerStateCore {
  /** Snapshots taken right before each GRADE/SKIP, popped by BACK to fully undo them. */
  history: RunnerStateCore[];
}

/** A snapshot of everything BACK needs to restore, i.e. state minus its own history stack. */
function snapshotOf(state: RunnerState): RunnerStateCore {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { history, ...core } = state;
  return core;
}

type InitArgs = { verbs: TestVerb[]; mode: TestMode; language: LanguageCode };

function init({ verbs, mode, language }: InitArgs): RunnerState {
  const shuffled = shuffleVerbs(verbs);
  return {
    mode,
    language,
    roundNumber: 1,
    roundTotal: shuffled.length,
    doneInRound: 0,
    current: shuffled[0] ?? null,
    pending: shuffled.slice(1),
    nextRound: [],
    phase: 'prompt',
    typedAnswer: createEmptyAnswer(),
    log: [],
    sessionMarked: [],
    counts: { knew: 0, didnt: 0, skipped: 0 },
    finished: shuffled.length === 0,
    history: [],
  };
}

function advance(state: RunnerState): RunnerState {
  if (state.pending.length > 0) {
    return {
      ...state,
      current: state.pending[0],
      pending: state.pending.slice(1),
      phase: 'prompt',
      typedAnswer: createEmptyAnswer(),
    };
  }
  if (state.nextRound.length > 0) {
    const shuffled = shuffleVerbs(state.nextRound);
    return {
      ...state,
      roundNumber: state.roundNumber + 1,
      roundTotal: shuffled.length,
      doneInRound: 0,
      current: shuffled[0],
      pending: shuffled.slice(1),
      nextRound: [],
      phase: 'prompt',
      typedAnswer: createEmptyAnswer(),
      finished: false,
    };
  }
  return { ...state, current: null, phase: 'prompt', finished: true };
}

type RunnerAction =
  | { type: 'RESTART'; payload: InitArgs }
  | { type: 'REVEAL' }
  | { type: 'SET_TYPED'; field: AnswerField; value: string }
  | { type: 'GRADE'; result: GradeResult; wrongFields: FlashcardField[] }
  | { type: 'SKIP' }
  | { type: 'BACK' };

function reducer(state: RunnerState, action: RunnerAction): RunnerState {
  switch (action.type) {
    case 'RESTART':
      return init(action.payload);

    case 'REVEAL':
      return state.phase === 'prompt' ? { ...state, phase: 'revealed' } : state;

    case 'SET_TYPED':
      return {
        ...state,
        typedAnswer: { ...state.typedAnswer, [action.field]: action.value } as UserAnswer,
      };

    case 'GRADE': {
      if (!state.current) {
        return state;
      }
      const verb = state.current;
      const userAnswer = state.mode === 'typed' ? state.typedAnswer : createEmptyAnswer();
      const record: GradedRecord = {
        verb,
        prompt: promptFor(verb, state.language),
        userAnswer,
        isCorrect: state.mode === 'typed' ? isAnswerCorrect(userAnswer, verb) : action.result === 'knew',
        result: action.result,
        round: state.roundNumber,
        wrongFields: action.wrongFields,
      };
      const isMiss = action.result === 'didnt';
      return advance({
        ...state,
        history: [...state.history, snapshotOf(state)],
        log: [...state.log, record],
        counts: { ...state.counts, [action.result]: state.counts[action.result] + 1 },
        nextRound: isMiss ? [...state.nextRound, verb] : state.nextRound,
        sessionMarked:
          isMiss && !state.sessionMarked.includes(verb.infinitive)
            ? [...state.sessionMarked, verb.infinitive]
            : state.sessionMarked,
        doneInRound: state.doneInRound + 1,
      });
    }

    case 'SKIP': {
      if (!state.current) {
        return state;
      }
      const requeued = [...state.pending, state.current];
      return {
        ...state,
        history: [...state.history, snapshotOf(state)],
        counts: { ...state.counts, skipped: state.counts.skipped + 1 },
        current: requeued[0],
        pending: requeued.slice(1),
        phase: 'prompt',
        typedAnswer: createEmptyAnswer(),
      };
    }

    case 'BACK': {
      if (state.history.length === 0) {
        return state;
      }
      const previous = state.history[state.history.length - 1];
      return {
        ...previous,
        phase: 'prompt',
        typedAnswer: createEmptyAnswer(),
        history: state.history.slice(0, -1),
      };
    }

    default:
      return state;
  }
}

// ── Presentational pieces ───────────────────────────────────────────────────

function ProgressHeader({
  mode,
  language,
  roundNumber,
  cardNumber,
  roundTotal,
  remaining,
  markedThisSession,
}: {
  mode: TestMode;
  language: LanguageCode;
  roundNumber: number;
  cardNumber: number;
  roundTotal: number;
  remaining: number;
  markedThisSession: number;
}) {
  const percent = roundTotal > 0 ? Math.round(((cardNumber - 1) / roundTotal) * 100) : 0;

  return (
    <div className="flex flex-col gap-3 text-foreground">
      {roundNumber > 1 ? (
        <p className="text-lg font-bold text-destructive">
          Review round {roundNumber} — words you didn&apos;t know
        </p>
      ) : null}
      <div className="flex items-center justify-between text-lg font-semibold">
        <span>
          Card {cardNumber} / {roundTotal}
        </span>
        <span>{remaining} left</span>
      </div>
      <div
        className="h-3 w-full overflow-hidden rounded-full border-2 border-foreground bg-card"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${percent}%` }} />
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Mode: {mode === 'typed' ? 'Type answers' : 'Flashcards'} · {LANGUAGE_LABELS[language]}
        </span>
        <span>Marked this session: {markedThisSession}</span>
      </div>
    </div>
  );
}

const REVEAL_ROWS: { field: AnswerField; label: string }[] = ANSWER_FIELDS.map((field) => ({
  field,
  label: ANSWER_FIELD_LABELS[field],
}));

/** One clickable answer cell: click toggles "I got this wrong" for the field. */
function AnswerCell({
  field,
  isWrong,
  onToggle,
  emphasize,
  children,
}: {
  field: FlashcardField;
  isWrong: boolean;
  onToggle: (field: FlashcardField) => void;
  emphasize?: boolean;
  children: ReactNode;
}) {
  return (
    <TableCell className="p-0 align-top">
      <button
        type="button"
        data-field-toggle
        aria-pressed={isWrong}
        onClick={() => onToggle(field)}
        className={cn(
          'w-full whitespace-normal break-words px-2 py-2 text-left text-sm text-card-foreground transition-colors sm:px-3',
          emphasize && 'font-semibold',
          isWrong ? 'bg-destructive/15 text-destructive' : 'hover:bg-destructive/5'
        )}
      >
        {children}
      </button>
    </TableCell>
  );
}

/**
 * Back / Skip row shown on both flashcard faces (front prompt and answer
 * reveal) so the learner can navigate without hunting for buttons below the
 * card.
 */
function CardTopControls({
  canGoBack,
  onBack,
  onSkip,
}: {
  canGoBack: boolean;
  onBack: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="mb-2 flex w-full items-center justify-between">
      <Button
        type="button"
        variant="ghost"
        onClick={onBack}
        disabled={!canGoBack}
        className={cn(TEXT_BUTTON_CLASS, 'disabled:pointer-events-none disabled:opacity-40')}
      >
        ← Back
      </Button>
      <Button type="button" variant="ghost" onClick={onSkip} className={TEXT_BUTTON_CLASS}>
        Skip →
      </Button>
    </div>
  );
}

/**
 * Flashcard reveal: a full-bleed answer card that slides up to cover the prompt.
 * Shows the conjugation table (same style as the main words table) plus the
 * translation. Each cell can be clicked to mark it as answered wrong; clicking
 * "Next →" grades the card (didn't know if anything was marked wrong).
 */
function ConjugationReveal({
  verb,
  translation,
  wrongFields,
  onToggleField,
  onNext,
  canGoBack,
  onBack,
  onSkip,
}: {
  verb: TestVerb;
  translation: string;
  wrongFields: Set<FlashcardField>;
  onToggleField: (field: FlashcardField) => void;
  onNext: () => void;
  canGoBack: boolean;
  onBack: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="flex h-full w-full flex-col gap-4 bg-background p-4 text-foreground shadow-[inset_0_0_70px_rgba(120,72,30,0.18)] sm:gap-5 sm:p-6">
      <CardTopControls canGoBack={canGoBack} onBack={onBack} onSkip={onSkip} />
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Answer <span className="normal-case tracking-normal">— tap anything you got wrong</span>
      </p>
      <div className="overflow-hidden rounded-lg border-2 border-foreground">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary">
              <TableHead className="whitespace-normal px-2 py-2 align-bottom text-xs leading-tight text-primary-foreground sm:px-3 sm:text-sm">
                Translation
              </TableHead>
              <TableHead className="whitespace-normal px-2 py-2 align-bottom text-xs leading-tight text-primary-foreground sm:px-3 sm:text-sm">
                Infinitive
              </TableHead>
              <TableHead className="whitespace-normal px-2 py-2 align-bottom text-xs leading-tight text-primary-foreground sm:px-3 sm:text-sm">
                Past Singular
              </TableHead>
              <TableHead className="whitespace-normal px-2 py-2 align-bottom text-xs leading-tight text-primary-foreground sm:px-3 sm:text-sm">
                Past Plural
              </TableHead>
              <TableHead className="whitespace-normal px-2 py-2 align-bottom text-xs leading-tight text-primary-foreground sm:px-3 sm:text-sm">
                Past Participle
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-card">
              <AnswerCell field="translation" isWrong={wrongFields.has('translation')} onToggle={onToggleField}>
                {translation}
              </AnswerCell>
              <AnswerCell
                field="infinitive"
                isWrong={wrongFields.has('infinitive')}
                onToggle={onToggleField}
                emphasize
              >
                {verb.infinitive}
              </AnswerCell>
              <AnswerCell field="pastSingular" isWrong={wrongFields.has('pastSingular')} onToggle={onToggleField}>
                {verb.pastSingular}
              </AnswerCell>
              <AnswerCell field="pastPlural" isWrong={wrongFields.has('pastPlural')} onToggle={onToggleField}>
                {verb.pastPlural}
              </AnswerCell>
              <AnswerCell field="pastParticiple" isWrong={wrongFields.has('pastParticiple')} onToggle={onToggleField}>
                {verb.pastParticiple} <span className="font-semibold">({verb.auxiliary})</span>
              </AnswerCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <div className="mt-auto flex justify-center">
        <Button type="button" onClick={onNext} className={ACTION_BUTTON_CLASS}>
          Next
        </Button>
      </div>
    </div>
  );
}

/** Typed-mode reveal: the learner's answer vs. the correct one, field by field. */
function TypedComparison({ verb, userAnswer }: { verb: TestVerb; userAnswer: UserAnswer }) {
  return (
    <div className="overflow-hidden rounded-lg border-2 border-foreground">
      <Table>
        <TableHeader>
          <TableRow className="bg-primary hover:bg-primary">
            <TableHead className="px-4 py-3 text-primary-foreground">Field</TableHead>
            <TableHead className="px-4 py-3 text-primary-foreground">Your answer</TableHead>
            <TableHead className="px-4 py-3 text-primary-foreground">Correct</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {REVEAL_ROWS.map(({ field, label }) => {
            const expected = verb[field];
            const fieldCorrect = matchesExpectedValue(userAnswer[field], expected);
            return (
              <TableRow
                key={field}
                className={cn('hover:bg-card', fieldCorrect ? 'bg-success/10' : 'bg-destructive/10')}
              >
                <TableHead className="px-4 py-3 text-card-foreground">{label}</TableHead>
                <TableCell
                  className={cn(
                    'px-4 py-3 font-semibold',
                    fieldCorrect ? 'text-success' : 'text-destructive'
                  )}
                >
                  {userAnswer[field] || '—'}
                </TableCell>
                <TableCell className="px-4 py-3 font-bold text-card-foreground">{expected}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

const TYPED_FIELDS: { field: AnswerField; label: string; fullWidth: boolean }[] = [
  { field: 'infinitive', label: 'Infinitive', fullWidth: true },
  { field: 'pastSingular', label: 'Past singular', fullWidth: false },
  { field: 'pastPlural', label: 'Past plural', fullWidth: false },
  { field: 'pastParticiple', label: 'Past participle', fullWidth: true },
];

// ── Component ───────────────────────────────────────────────────────────────

export function TestRunner({ verbs, mode, showInfinitive, translationLanguage }: TestRunnerProps) {
  const [state, dispatch] = useReducer(
    reducer,
    { verbs, mode, language: translationLanguage },
    init
  );
  const {
    current,
    phase,
    finished,
    roundNumber,
    roundTotal,
    doneInRound,
    counts,
    sessionMarked,
    typedAnswer,
    log,
    history,
  } = state;
  const canGoBack = history.length > 0;

  const totalWords = verbs.length;
  const sessionCountedRef = useRef(false);

  // Count one session per completion (ref-guarded against StrictMode double-run).
  useEffect(() => {
    if (finished && totalWords > 0 && !sessionCountedRef.current) {
      sessionCountedRef.current = true;
      incrementSessions();
    }
    if (!finished) {
      sessionCountedRef.current = false;
    }
  }, [finished, totalWords]);

  // Flashcard mode: cells the learner has tapped as "I got this wrong" for the
  // current card. Cleared each time a new card is revealed.
  const [wrongFields, setWrongFields] = useState<Set<FlashcardField>>(new Set());

  const toggleWrongField = (field: FlashcardField) => {
    if (phase !== 'revealed') {
      return;
    }
    setWrongFields((previous) => {
      const next = new Set(previous);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  };

  const reveal = () => {
    if (phase !== 'prompt') {
      return;
    }
    if (mode === 'typed' && typeof document !== 'undefined') {
      (document.activeElement as HTMLElement | null)?.blur();
    }
    setWrongFields(new Set());
    dispatch({ type: 'REVEAL' });
  };

  const grade = (result: GradeResult) => {
    if (!current || phase !== 'revealed') {
      return;
    }
    const effectiveResult: GradeResult = wrongFields.size > 0 ? 'didnt' : result;
    recordResult(current.infinitive, effectiveResult);
    dispatch({ type: 'GRADE', result: effectiveResult, wrongFields: Array.from(wrongFields) });
  };

  const skip = () => {
    if (!current) {
      return;
    }
    recordResult(current.infinitive, 'skipped');
    dispatch({ type: 'SKIP' });
  };

  const back = () => {
    if (!canGoBack) {
      return;
    }
    setWrongFields(new Set());
    dispatch({ type: 'BACK' });
  };

  const restart = (subset?: TestVerb[]) => {
    dispatch({ type: 'RESTART', payload: { verbs: subset ?? verbs, mode, language: translationLanguage } });
  };

  // Keyboard shortcuts. Letter/number keys are ignored while typing in a field.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (finished || !current) {
        return;
      }
      const target = event.target as HTMLElement | null;
      const inField =
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'TEXTAREA' ||
          !!target.closest('[data-field-toggle]'));

      if (phase === 'prompt') {
        if (event.key === 'Enter' || (event.key === ' ' && !inField)) {
          event.preventDefault();
          reveal();
        } else if ((event.key === 's' || event.key === 'S') && !inField) {
          event.preventDefault();
          skip();
        } else if ((event.key === 'b' || event.key === 'B') && !inField) {
          event.preventDefault();
          back();
        }
        return;
      }

      // Revealed phase — grade. (In typed mode focus was blurred on reveal.)
      if (inField) {
        return;
      }
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'k' || event.key === 'K' || event.key === '1') {
        event.preventDefault();
        grade('knew');
      } else if (event.key === '2' || event.key === 'd' || event.key === 'D') {
        event.preventDefault();
        grade('didnt');
      } else if (event.key === 's' || event.key === 'S') {
        event.preventDefault();
        skip();
      } else if (event.key === 'b' || event.key === 'B') {
        event.preventDefault();
        back();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, finished, current, mode, wrongFields, canGoBack]);

  // ── Empty selection ──
  if (totalWords === 0) {
    return (
      <PageShell title="Testing" home={false} width="md" actions={testActions}>
        <p className="text-lg font-semibold text-foreground">
          No words are available for this test selection.
        </p>
        <Button asChild variant="secondary" className={cn(ACTION_BUTTON_CLASS, 'text-center')}>
          <Link href={ROUTES.learn}>Back to Settings</Link>
        </Button>
      </PageShell>
    );
  }

  // ── Results ──
  if (finished) {
    const graded = counts.knew + counts.didnt;
    const accuracy = graded > 0 ? Math.round((counts.knew / graded) * 100) : 0;
    const isTyped = mode === 'typed';

    return (
      <PageShell title="Results" home={false} width="xl" actions={testActions}>
        <div className="flex flex-col gap-2 text-lg font-semibold text-foreground">
          <p>Knew it: {counts.knew}</p>
          <p>Didn&apos;t know: {counts.didnt}</p>
          <p>Skipped: {counts.skipped}</p>
          <p>Accuracy: {accuracy}%</p>
          <p>Marked for review: {sessionMarked.length}</p>
        </div>

        <div className="overflow-hidden rounded-lg border-2 border-foreground">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary">
                <TableHead className="px-4 py-3 text-primary-foreground">#</TableHead>
                <TableHead className="px-4 py-3 text-primary-foreground">Shown word</TableHead>
                <TableHead className="px-4 py-3 text-primary-foreground">Infinitive</TableHead>
                <TableHead className="px-4 py-3 text-primary-foreground">Past singular</TableHead>
                <TableHead className="px-4 py-3 text-primary-foreground">Past plural</TableHead>
                <TableHead className="px-4 py-3 text-primary-foreground">Past participle</TableHead>
                <TableHead className="px-4 py-3 text-primary-foreground">Auxiliary</TableHead>
                {isTyped ? (
                  <TableHead className="px-4 py-3 text-primary-foreground">Your answer</TableHead>
                ) : null}
                <TableHead className="px-4 py-3 text-primary-foreground">Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {log.map((record, index) => {
                const wrong = (field: FlashcardField) => record.wrongFields.includes(field);
                const wrongCellClass = (field: FlashcardField) =>
                  cn('px-4 py-3 text-card-foreground', wrong(field) && 'bg-destructive/10 font-semibold text-destructive');
                return (
                <TableRow
                  key={`${record.verb.infinitive}-${index}`}
                  className="bg-card even:bg-background/40 hover:bg-card"
                >
                  <TableCell className="px-4 py-3 text-card-foreground">{index + 1}</TableCell>
                  <TableCell className={wrongCellClass('translation')}>{record.prompt}</TableCell>
                  <TableCell className={cn('font-semibold', wrongCellClass('infinitive'))}>
                    {record.verb.infinitive}
                  </TableCell>
                  <TableCell className={wrongCellClass('pastSingular')}>{record.verb.pastSingular}</TableCell>
                  <TableCell className={wrongCellClass('pastPlural')}>{record.verb.pastPlural}</TableCell>
                  <TableCell className={wrongCellClass('pastParticiple')}>{record.verb.pastParticiple}</TableCell>
                  <TableCell className={wrongCellClass('pastParticiple')}>{record.verb.auxiliary}</TableCell>
                  {isTyped ? (
                    <TableCell className="px-4 py-3 text-card-foreground">
                      <div>{record.userAnswer.infinitive || '—'}</div>
                      <div>{record.userAnswer.pastSingular || '—'}</div>
                      <div>{record.userAnswer.pastPlural || '—'}</div>
                      <div>{record.userAnswer.pastParticiple || '—'}</div>
                      <div>{record.userAnswer.auxiliary || '—'}</div>
                    </TableCell>
                  ) : null}
                  <TableCell
                    className={cn(
                      'px-4 py-3 font-semibold',
                      record.result === 'knew' ? 'text-success' : 'text-destructive'
                    )}
                  >
                    {record.result === 'knew' ? 'Knew it' : "Didn't know"}
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={() => restart()} variant="secondary" className={ACTION_BUTTON_CLASS}>
            Restart all
          </Button>
          <Button
            type="button"
            onClick={() => restart(verbs.filter((verb) => sessionMarked.includes(verb.infinitive)))}
            disabled={sessionMarked.length === 0}
            className={cn(ACTION_BUTTON_CLASS, 'bg-destructive text-destructive-foreground hover:bg-destructive/90')}
          >
            Repeat marked words ({sessionMarked.length})
          </Button>
          <Button asChild variant="secondary" className={ACTION_BUTTON_CLASS}>
            <Link href={ROUTES.review}>Review marked words</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  // ── Active card ──
  if (!current) {
    return null;
  }

  const prompt = promptFor(current, translationLanguage);
  const cardNumber = doneInRound + 1;
  const remaining = roundTotal - doneInRound;
  const isFlashcard = mode === 'flashcard';

  const skipButton = (
    <Button type="button" onClick={skip} variant="outline" className={GRADE_BUTTON_CLASS}>
      Skip ↷
    </Button>
  );
  const didntKnowButton = (
    <Button type="button" onClick={() => grade('didnt')} variant="destructive" className={GRADE_BUTTON_CLASS}>
      ✗ Didn&apos;t know it
    </Button>
  );
  // Typed mode keeps Skip below the card; flashcard mode moves it onto the
  // card itself (see CardTopControls) so only "Didn't know" stays here.
  const gradeButtons = (
    <div className="flex flex-wrap justify-center gap-3">
      {didntKnowButton}
      {!isFlashcard ? skipButton : null}
    </div>
  );

  return (
    <PageShell title="Testing" home={false} width="md" actions={testActions}>
      <ProgressHeader
        mode={mode}
        language={translationLanguage}
        roundNumber={roundNumber}
        cardNumber={cardNumber}
        roundTotal={roundTotal}
        remaining={remaining}
        markedThisSession={sessionMarked.length}
      />

      {isFlashcard ? (
        <>
          {/* The prompt word stays put; the opaque answer panel slides up over
              it to reveal and slides back down to hide. */}
          <Card className="relative flex min-h-[24rem] flex-col items-center justify-center gap-0 overflow-hidden rounded-3xl border-2 border-foreground bg-card p-5 text-center text-card-foreground sm:p-8">
            {/* Persistent controls for the front face; ConjugationReveal renders
                its own copy for the answer face (the sliding panel covers this one). */}
            <div className="absolute inset-x-0 top-0 px-5 pt-4 sm:px-8 sm:pt-6">
              <CardTopControls canGoBack={canGoBack} onBack={back} onSkip={skip} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Shown word
            </p>
            <h2 className="mt-4 text-4xl font-bold">{prompt}</h2>
            {showInfinitive ? (
              <div className="mt-5 rounded-xl border-2 border-foreground/15 bg-background/60 px-5 py-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  Infinitive
                </p>
                <p className="mt-1 text-2xl font-bold">{current.infinitive}</p>
              </div>
            ) : null}

            <AnimatePresence initial={false}>
              {phase === 'prompt' ? (
                <motion.div
                  key="reveal"
                  className="absolute inset-x-0 bottom-6 flex justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button type="button" onClick={reveal} variant="default" className={ACTION_BUTTON_CLASS}>
                    Reveal
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="answer"
                  className="absolute inset-0"
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ duration: 0.42, ease: [0.32, 0.72, 0, 1] }}
                >
                  <ConjugationReveal
                    verb={current}
                    translation={prompt}
                    wrongFields={wrongFields}
                    onToggleField={toggleWrongField}
                    onNext={() => grade('knew')}
                    canGoBack={canGoBack}
                    onBack={back}
                    onSkip={skip}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* Back/Skip live on the card itself; only "Didn't know" sits below it. */}
          {phase === 'revealed' ? gradeButtons : null}
        </>
      ) : (
        <>
          <Card className="gap-0 rounded-2xl border-2 border-foreground p-8 text-card-foreground">
            <p className="text-sm font-semibold uppercase tracking-wide">Shown word</p>
            <h2 className="mt-3 text-3xl font-bold">{prompt}</h2>
            {showInfinitive ? (
              <div className="mt-6 border-t-2 border-foreground pt-6">
                <p className="text-sm font-semibold uppercase tracking-wide">Infinitive</p>
                <p className="mt-2 text-2xl font-bold">{current.infinitive}</p>
              </div>
            ) : null}
          </Card>

          {phase === 'prompt' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {TYPED_FIELDS.map(({ field, label, fullWidth }) => (
                <div key={field} className={cn('flex flex-col gap-2', fullWidth && 'sm:col-span-2')}>
                  <Label htmlFor={`answer-${field}`} className="text-lg font-semibold text-foreground">
                    {label}
                  </Label>
                  <Input
                    id={`answer-${field}`}
                    value={typedAnswer[field]}
                    onChange={(event) => dispatch({ type: 'SET_TYPED', field, value: event.target.value })}
                    className="h-auto border-2 border-foreground bg-card px-4 py-3"
                  />
                </div>
              ))}
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="answer-auxiliary" className="text-lg font-semibold text-foreground">
                  Auxiliary verb
                </Label>
                <Select
                  value={typedAnswer.auxiliary}
                  onValueChange={(value) => dispatch({ type: 'SET_TYPED', field: 'auxiliary', value })}
                >
                  <SelectTrigger
                    id="answer-auxiliary"
                    className="h-auto w-full border-2 border-foreground bg-card px-4 py-3 text-card-foreground"
                  >
                    <SelectValue placeholder="Select auxiliary" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hebben">hebben</SelectItem>
                    <SelectItem value="zijn">zijn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

          {phase === 'revealed' ? <TypedComparison verb={current} userAnswer={typedAnswer} /> : null}

          {phase === 'prompt' ? (
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={reveal} className={ACTION_BUTTON_CLASS}>
                Reveal answer
              </Button>
              {skipButton}
            </div>
          ) : (
            gradeButtons
          )}
        </>
      )}

      <p className="text-sm text-muted-foreground">
        {phase === "prompt" ? (
          <>
            {mode === "typed" ? "Enter" : "Space"} to reveal &middot; S to skip
            {canGoBack ? <> &middot; B to go back</> : null}
          </>
        ) : (
          <>
            Enter / K &mdash; Next (knew) &middot; 2 / D &mdash; Didn&apos;t know &middot; S &mdash; Skip
            {canGoBack ? <> &middot; B &mdash; Back</> : null}
          </>
        )}
      </p>
    </PageShell>
  );
}
