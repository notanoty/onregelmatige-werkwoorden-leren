import {
  initializeAndSeedIrregularVerbsDb,
  listIrregularVerbsWithTranslations,
  openIrregularVerbsDb,
} from '@/lib/db/irregularVerbsDb';
import { TestRunner } from '@/components/test-runner';
import type { LanguageCode, TestMode, TestVerb } from '@/lib/types';

type TestPageProps = {
  searchParams?: Promise<{
    letters?: string;
    words?: string;
    mode?: string;
    /** Legacy param: `checkAnswers=1` maps to the typed mode. */
    checkAnswers?: string;
    showInfinitive?: string;
    translationLanguage?: string;
  }>;
};

function fetchFilteredVerbs(lettersParam?: string, wordsParam?: string): TestVerb[] {
  const db = openIrregularVerbsDb();

  try {
    initializeAndSeedIrregularVerbsDb(db);

    const verbs = listIrregularVerbsWithTranslations(db);
    const selectedLetters = new Set(
      (lettersParam ?? '')
        .split(',')
        .map((letter) => letter.trim().toLowerCase())
        .filter(Boolean)
    );
    const selectedWords = new Set(
      (wordsParam ?? '')
        .split(',')
        .map((word) => word.trim())
        .filter(Boolean)
    );

    let filtered = verbs;

    if (selectedLetters.size > 0) {
      filtered = filtered.filter((verb) =>
        selectedLetters.has(verb.infinitive.charAt(0).toLowerCase())
      );
    }

    if (selectedWords.size > 0) {
      filtered = filtered.filter((verb) => selectedWords.has(verb.infinitive));
    }

    return filtered;
  } finally {
    db.close();
  }
}

export default async function Test({ searchParams }: TestPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const translationLanguage: LanguageCode =
    resolvedSearchParams?.translationLanguage === 'ru' ? 'ru' : 'en';
  const mode: TestMode =
    resolvedSearchParams?.mode === 'typed' || resolvedSearchParams?.checkAnswers === '1'
      ? 'typed'
      : 'flashcard';
  const showInfinitive = resolvedSearchParams?.showInfinitive === '1';
  const verbs = fetchFilteredVerbs(
    resolvedSearchParams?.letters,
    resolvedSearchParams?.words
  );

  return (
    <TestRunner
      verbs={verbs}
      mode={mode}
      showInfinitive={showInfinitive}
      translationLanguage={translationLanguage}
    />
  );
}
