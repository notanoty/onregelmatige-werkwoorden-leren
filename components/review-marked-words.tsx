'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageShell, NAV_BUTTON_CLASS } from '@/components/page-shell';
import { LANGUAGE_OPTIONS, ROUTES } from '@/lib/constants';
import type { LanguageCode, Verb } from '@/lib/types';
import { getMarkedInfinitives, setMarked } from '@/lib/progress/progressStore';
import { useProgressState } from '@/lib/progress/useProgress';

interface ReviewMarkedWordsProps {
  verbs: Verb[];
}

export function ReviewMarkedWords({ verbs }: ReviewMarkedWordsProps) {
  const router = useRouter();
  const progress = useProgressState();
  const [translationLanguage, setTranslationLanguage] = useState<LanguageCode>('en');

  const markedVerbs = useMemo(() => {
    const marked = new Set(getMarkedInfinitives(progress));
    return verbs
      .filter((verb) => marked.has(verb.infinitive))
      .sort((a, b) => a.infinitive.localeCompare(b.infinitive));
  }, [verbs, progress]);

  const startReview = () => {
    const params = new URLSearchParams({
      words: markedVerbs.map((verb) => verb.infinitive).join(','),
      mode: 'flashcard',
      showInfinitive: '0',
      translationLanguage,
    });
    router.push(`${ROUTES.test}?${params.toString()}`);
  };

  const clearAll = () => {
    markedVerbs.forEach((verb) => setMarked(verb.infinitive, false));
  };

  return (
    <PageShell title="Marked words">
      <p className="text-lg font-semibold text-foreground">
        Words you marked as &ldquo;didn&apos;t know&rdquo; are saved here on this device. Start a
        focused flashcard session, or remove a word once it sticks.
      </p>

      {markedVerbs.length === 0 ? (
        <div className="flex flex-col gap-4 rounded-lg border-2 border-foreground bg-card p-6 text-card-foreground">
          <p className="text-lg font-semibold">No marked words yet.</p>
          <p>
            During a test, mark a card as &ldquo;Didn&apos;t know it&rdquo; and it will be saved here
            for later review.
          </p>
          <Button asChild variant="secondary" className={NAV_BUTTON_CLASS}>
            <Link href={ROUTES.learn}>Go to Settings</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Label htmlFor="review-language" className="text-lg font-semibold text-foreground">
              Translation language
            </Label>
            <Select
              value={translationLanguage}
              onValueChange={(value) => setTranslationLanguage(value as LanguageCode)}
            >
              <SelectTrigger
                id="review-language"
                className="h-auto border-2 border-foreground bg-card px-4 py-2 font-semibold text-card-foreground"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((option) => (
                  <SelectItem key={option.code} value={option.code}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={startReview}
              className="h-auto border-2 border-foreground px-8 py-4 text-xl font-semibold transition-transform hover:scale-105"
            >
              Start review session ({markedVerbs.length})
            </Button>
            <Button
              type="button"
              onClick={clearAll}
              variant="destructive"
              className="h-auto border-2 border-foreground px-6 py-4 text-lg font-semibold transition-transform hover:scale-105"
            >
              Clear all
            </Button>
          </div>

          <ul className="flex flex-col gap-2 rounded-lg border-2 border-foreground bg-card p-4">
            {markedVerbs.map((verb) => {
              const stat = progress.verbs[verb.infinitive];
              const translation = verb.translations?.[translationLanguage];
              return (
                <li
                  key={verb.infinitive}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-2"
                >
                  <span className="flex flex-wrap items-baseline gap-2 text-card-foreground">
                    <span className="font-semibold">{verb.infinitive}</span>
                    {translation ? (
                      <span className="text-sm text-muted-foreground">{translation}</span>
                    ) : null}
                    {stat && stat.didnt > 0 ? (
                      <span className="text-sm text-destructive">missed {stat.didnt}×</span>
                    ) : null}
                  </span>
                  <Button
                    type="button"
                    onClick={() => setMarked(verb.infinitive, false)}
                    variant="outline"
                    size="sm"
                    className="border-2 border-foreground font-semibold"
                  >
                    Remove
                  </Button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </PageShell>
  );
}
