/**
 * Account-free learning progress, persisted to localStorage.
 *
 * One versioned key holds an aggregate-per-verb document (no unbounded event
 * log, so it stays small). The module exposes a tiny external-store API
 * (`subscribe` / `getSnapshot` / `getServerSnapshot`) so React components can
 * read it reactively via `useSyncExternalStore`, plus pure action and selector
 * helpers. Every browser API access is guarded so the module is safe to import
 * from server components.
 */
import type { ProgressState, VerbProgress, VerbResult } from '@/lib/types';

const STORAGE_KEY = 'onregelmatige-werkwoorden:progress:v1';

/** Shared, frozen empty document. Same reference every call — required so that
 *  `getServerSnapshot` is stable for `useSyncExternalStore`. */
const EMPTY_STATE: ProgressState = Object.freeze({
  version: 1,
  verbs: {},
  sessions: 0,
});

let cache: ProgressState | null = null;
const listeners = new Set<() => void>();

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function createEmptyVerb(): VerbProgress {
  return { knew: 0, didnt: 0, skipped: 0, marked: false, lastResult: null, lastSeenAt: 0 };
}

/** Defensively coerce a parsed value into a valid ProgressState. */
function normalizeState(parsed: unknown): ProgressState {
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    (parsed as ProgressState).version !== 1 ||
    typeof (parsed as ProgressState).verbs !== 'object'
  ) {
    return EMPTY_STATE;
  }

  const candidate = parsed as ProgressState;
  return {
    version: 1,
    verbs: candidate.verbs ?? {},
    sessions: typeof candidate.sessions === 'number' ? candidate.sessions : 0,
  };
}

function read(): ProgressState {
  if (!isBrowser()) {
    return EMPTY_STATE;
  }
  if (cache) {
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? normalizeState(JSON.parse(raw)) : EMPTY_STATE;
  } catch {
    cache = EMPTY_STATE;
  }
  return cache;
}

function write(next: ProgressState): void {
  cache = next;
  if (isBrowser()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore quota / privacy-mode write failures — in-memory cache still works.
    }
  }
  listeners.forEach((listener) => listener());
}

function handleStorageEvent(event: StorageEvent): void {
  if (event.key !== null && event.key !== STORAGE_KEY) {
    return;
  }
  // Another tab changed the data — drop the cache and re-read, then notify.
  cache = null;
  read();
  listeners.forEach((listener) => listener());
}

// ── External store API (for useSyncExternalStore) ───────────────────────────

export function subscribe(listener: () => void): () => void {
  if (listeners.size === 0 && isBrowser()) {
    window.addEventListener('storage', handleStorageEvent);
  }
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && isBrowser()) {
      window.removeEventListener('storage', handleStorageEvent);
    }
  };
}

export function getSnapshot(): ProgressState {
  return read();
}

export function getServerSnapshot(): ProgressState {
  return EMPTY_STATE;
}

// ── Actions ─────────────────────────────────────────────────────────────────

/** Record one card outcome. A `didnt` result also flags the verb for review. */
export function recordResult(infinitive: string, result: VerbResult): void {
  const state = read();
  const previous = state.verbs[infinitive] ?? createEmptyVerb();
  const next: VerbProgress = {
    knew: previous.knew + (result === 'knew' ? 1 : 0),
    didnt: previous.didnt + (result === 'didnt' ? 1 : 0),
    skipped: previous.skipped + (result === 'skipped' ? 1 : 0),
    marked: result === 'didnt' ? true : previous.marked,
    lastResult: result,
    lastSeenAt: Date.now(),
  };

  write({ ...state, verbs: { ...state.verbs, [infinitive]: next } });
}

/** Add or remove a verb from the "review later" list. */
export function setMarked(infinitive: string, marked: boolean): void {
  const state = read();
  const previous = state.verbs[infinitive] ?? createEmptyVerb();
  write({
    ...state,
    verbs: { ...state.verbs, [infinitive]: { ...previous, marked } },
  });
}

export function incrementSessions(): void {
  const state = read();
  write({ ...state, sessions: state.sessions + 1 });
}

export function resetAll(): void {
  write({ version: 1, verbs: {}, sessions: 0 });
}

// ── Selectors (pure; derive everything the UI needs) ────────────────────────

export function getMarkedInfinitives(state: ProgressState): string[] {
  return Object.entries(state.verbs)
    .filter(([, progress]) => progress.marked)
    .map(([infinitive]) => infinitive);
}

export interface AggregateStats {
  totalReviews: number;
  knew: number;
  didnt: number;
  skipped: number;
  /** knew / (knew + didnt), in 0..1. */
  accuracy: number;
  distinctSeen: number;
  markedCount: number;
  /** Words last answered correctly and never missed. */
  mastered: number;
  /** Words currently marked or missed at least once. */
  struggling: number;
  sessions: number;
}

export function getAggregateStats(state: ProgressState): AggregateStats {
  const entries = Object.values(state.verbs);

  let knew = 0;
  let didnt = 0;
  let skipped = 0;
  let mastered = 0;
  let struggling = 0;
  let markedCount = 0;

  for (const progress of entries) {
    knew += progress.knew;
    didnt += progress.didnt;
    skipped += progress.skipped;
    if (progress.marked) {
      markedCount += 1;
    }
    if (progress.marked || progress.didnt > 0) {
      struggling += 1;
    }
    if (progress.knew > 0 && progress.didnt === 0 && progress.lastResult === 'knew') {
      mastered += 1;
    }
  }

  const graded = knew + didnt;

  return {
    totalReviews: knew + didnt + skipped,
    knew,
    didnt,
    skipped,
    accuracy: graded > 0 ? knew / graded : 0,
    distinctSeen: entries.length,
    markedCount,
    mastered,
    struggling,
    sessions: state.sessions,
  };
}

export interface MissedVerb {
  infinitive: string;
  knew: number;
  didnt: number;
  marked: boolean;
  lastResult: VerbResult | null;
}

export function getMostMissed(state: ProgressState, limit = 10): MissedVerb[] {
  return Object.entries(state.verbs)
    .filter(([, progress]) => progress.didnt > 0)
    .map(([infinitive, progress]) => ({
      infinitive,
      knew: progress.knew,
      didnt: progress.didnt,
      marked: progress.marked,
      lastResult: progress.lastResult,
    }))
    .sort((a, b) => b.didnt - a.didnt || a.infinitive.localeCompare(b.infinitive))
    .slice(0, limit);
}
