import { getAllVerbs } from '@/lib/db/irregularVerbsDb';
import { ReviewMarkedWords } from '@/components/review-marked-words';

export default function ReviewPage() {
  const verbs = getAllVerbs();
  return <ReviewMarkedWords verbs={verbs} />;
}
