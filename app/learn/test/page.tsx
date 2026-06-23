import {
  initializeAndSeedIrregularVerbsDb,
  listIrregularVerbsWithTranslations,
  openIrregularVerbsDb,
} from '@/lib/db/irregularVerbsDb';
import { TestRunner, type TestVerb } from './TestRunner';

type LanguageCode = 'en' | 'ru';
type TestPageProps = {
  searchParams?: Promise<{
    letters?: string;
    words?: string;
    checkAnswers?: string;
    showInfinitive?: string;
    translationLanguage?: string;
  }>;
};

async function fetchFilteredVerbs(lettersParam?: string, wordsParam?: string): Promise<TestVerb[]> {
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
  const translationLanguage: LanguageCode = resolvedSearchParams?.translationLanguage === 'ru' ? 'ru' : 'en';
  const checkAnswers = resolvedSearchParams?.checkAnswers === '1';
  const showInfinitive = resolvedSearchParams?.showInfinitive === '1';
  const verbs = await fetchFilteredVerbs(
    resolvedSearchParams?.letters,
    resolvedSearchParams?.words
  );

  return (
    <TestRunner
      verbs={verbs}
      checkAnswers={checkAnswers}
      showInfinitive={showInfinitive}
      translationLanguage={translationLanguage}
    />
  );
}

