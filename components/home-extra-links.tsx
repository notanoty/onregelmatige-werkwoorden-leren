'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';
import { getMarkedInfinitives } from '@/lib/progress/progressStore';
import { useProgressState } from '@/lib/progress/useProgress';

const LINK_CLASS =
  'h-auto border-2 border-foreground px-8 py-3 text-lg font-semibold transition-transform hover:scale-105';

export function HomeExtraLinks() {
  const progress = useProgressState();
  const markedCount = getMarkedInfinitives(progress).length;

  return (
    <>
      <Button asChild variant="secondary" className={LINK_CLASS}>
        <Link href={ROUTES.review}>
          Review Marked Words{markedCount > 0 ? ` (${markedCount})` : ''}
        </Link>
      </Button>
      <Button asChild variant="secondary" className={LINK_CLASS}>
        <Link href={ROUTES.stats}>Your Stats</Link>
      </Button>
    </>
  );
}
