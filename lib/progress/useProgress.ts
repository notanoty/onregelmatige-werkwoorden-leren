'use client';

import { useSyncExternalStore } from 'react';
import type { ProgressState } from '@/lib/types';
import { getServerSnapshot, getSnapshot, subscribe } from './progressStore';

/**
 * Reactive read access to the local progress store. Returns `EMPTY_STATE`
 * during SSR and the first client render, then rehydrates from localStorage —
 * the React-recommended pattern for external stores, with no hydration
 * mismatch. Mutate via the action helpers exported from `progressStore`.
 */
export function useProgressState(): ProgressState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
