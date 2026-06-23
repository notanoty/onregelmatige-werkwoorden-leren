import { WordsTable } from '@/app/words/WordsTable';
import {
  initializeAndSeedIrregularVerbsDb,
  listIrregularVerbsWithTranslations,
  openIrregularVerbsDb,
} from '@/lib/db/irregularVerbsDb';

interface Verb {
  infinitive: string;
  pastSingular: string;
  pastPlural: string;
  pastParticiple: string;
  auxiliary: 'hebben' | 'zijn' | 'hebben/zijn';
  translations?: {
    en?: string;
    ru?: string;
  };
}

async function fetchVerbs(): Promise<Verb[]> {
  const db = openIrregularVerbsDb();

  try {
    initializeAndSeedIrregularVerbsDb(db);
    return listIrregularVerbsWithTranslations(db);
  } finally {
    db.close();
  }
}

export default async function Words() {
  const verbs = await fetchVerbs();
  return <WordsTable verbs={verbs} />;
}

