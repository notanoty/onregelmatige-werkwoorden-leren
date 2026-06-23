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
    checkAnswers?: string;
    translationLanguage?: string;
  }>;
};

async function fetchFilteredVerbs(lettersParam?: string): Promise<TestVerb[]> {
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

    if (selectedLetters.size === 0) {
      return verbs;
    }

    return verbs.filter((verb) => selectedLetters.has(verb.infinitive.charAt(0).toLowerCase()));
  } finally {
    db.close();
  }
}

export default async function Test({ searchParams }: TestPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const translationLanguage: LanguageCode = resolvedSearchParams?.translationLanguage === 'ru' ? 'ru' : 'en';
  const checkAnswers = resolvedSearchParams?.checkAnswers === '1';
  const verbs = await fetchFilteredVerbs(resolvedSearchParams?.letters);

  return (
    <TestRunner
      verbs={verbs}
      checkAnswers={checkAnswers}
      translationLanguage={translationLanguage}
    />
  );
}

