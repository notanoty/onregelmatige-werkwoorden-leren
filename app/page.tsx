import Link from 'next/link';
import { BookOpen, Keyboard, Layers, Play } from 'lucide-react';
import { BentoCard } from '@/components/bento-card';
import { LandingFlashcard } from '@/components/landing-flashcard';
import { WordsBrowser } from '@/components/words-table';
import { PageContainer } from '@/components/page-container';
import { NAV_BUTTON_CLASS } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { getAllVerbs } from '@/lib/db/irregularVerbsDb';

const ACTION_BUTTON_CLASS = cn(NAV_BUTTON_CLASS, 'w-full justify-start gap-3 py-4');

export default function Home() {
  const verbs = getAllVerbs();
  const sample = verbs.slice(0, 8);

  return (
    <PageContainer width="xl" className="gap-10 sm:gap-12">
      {/* Hero */}
      <header className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-bold text-foreground sm:text-5xl">
          Onregelmatige Werkwoorden
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Master Dutch irregular verbs. Flip through flashcards, type out the forms, or browse
          the full list — pick how you want to practice below.
        </p>
      </header>

      {/* Flashcard card + action buttons */}
      <section className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <BentoCard
          href={`${ROUTES.test}?mode=flashcard`}
          label="Start a flashcard session"
          interactive
          tilt="left"
          pin="tr"
        >
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Layers className="size-6 text-foreground" />
                <h2 className="text-2xl font-bold text-foreground">Flashcards</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                See a form, recall the rest, flip to check. Start the full deck, or jump straight
                into a typing test.
              </p>
            </div>

            <LandingFlashcard verbs={sample} />
          </div>
        </BentoCard>

        {/* Action buttons */}
        <div className="flex flex-col justify-center gap-4">
          <Button asChild className={ACTION_BUTTON_CLASS}>
            <Link href={ROUTES.learn}>
              <Play className="size-5" />
              Start
            </Link>
          </Button>
          <Button asChild variant="secondary" className={ACTION_BUTTON_CLASS}>
            <Link href={`${ROUTES.test}?mode=flashcard`}>
              <Layers className="size-5" />
              Start flashcards
            </Link>
          </Button>
          <Button asChild variant="secondary" className={ACTION_BUTTON_CLASS}>
            <Link href={`${ROUTES.test}?mode=typed`}>
              <Keyboard className="size-5" />
              Typing test
            </Link>
          </Button>
          <Button asChild variant="secondary" className={ACTION_BUTTON_CLASS}>
            <Link href={ROUTES.words}>
              <BookOpen className="size-5" />
              Browse words
            </Link>
          </Button>
        </div>
      </section>

      {/* Full words table */}
      <section className="mt-8 flex flex-col gap-4 sm:mt-14">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold text-foreground">All irregular words</h2>
          <p className="text-muted-foreground">
            The full reference — filter by starting letter and switch the translation language.
          </p>
        </div>
        <WordsBrowser verbs={verbs} />
      </section>
    </PageContainer>
  );
}
