import { WordsTable } from '@/components/words-table';
import { getAllVerbs } from '@/lib/db/irregularVerbsDb';

export default async function Words() {
  const verbs = getAllVerbs();

  return <WordsTable verbs={verbs} />;
}
