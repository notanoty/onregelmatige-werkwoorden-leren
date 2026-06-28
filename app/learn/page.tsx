import { LearnSettings } from '@/components/learn-settings';
import { getAllVerbs } from '@/lib/db/irregularVerbsDb';

export default async function Learn() {
  const verbs = getAllVerbs();

  return <LearnSettings verbs={verbs} />;
}
