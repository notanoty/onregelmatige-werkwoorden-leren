'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import type { LanguageCode, TestMode, Verb } from '@/lib/types';
import { cn } from '@/lib/utils';

const MODE_OPTIONS: ReadonlyArray<{ value: TestMode; label: string; hint: string }> = [
  { value: 'flashcard', label: 'Flashcards', hint: 'Reveal the answer, then grade yourself' },
  { value: 'typed', label: 'Type answers', hint: 'Type the conjugations and check them' },
];

interface LearnSettingsProps {
  verbs: Verb[];
}

export function LearnSettings({ verbs }: LearnSettingsProps) {
  const router = useRouter();
  const [selectedLetters, setSelectedLetters] = useState<Set<string>>(
    new Set(Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i)))
  );
  const [selectedVerbs, setSelectedVerbs] = useState<Set<string>>(
    () => new Set(verbs.map((verb) => verb.infinitive))
  );
  const [mode, setMode] = useState<TestMode>('flashcard');
  const [showInfinitive, setShowInfinitive] = useState(false);
  const [translationLanguage, setTranslationLanguage] = useState<LanguageCode>('en');

  // Get unique first letters from verbs
  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    verbs.forEach((verb) => {
      letters.add(verb.infinitive.charAt(0).toLowerCase());
    });
    return Array.from(letters).sort();
  }, [verbs]);

  // Filter verbs based on selected letters
  const filteredVerbs = useMemo(() => {
    return verbs
      .filter((verb) => selectedLetters.has(verb.infinitive.charAt(0).toLowerCase()))
      .sort((a, b) => a.infinitive.localeCompare(b.infinitive));
  }, [verbs, selectedLetters]);

  const selectedFilteredVerbs = useMemo(() => {
    return filteredVerbs.filter((verb) => selectedVerbs.has(verb.infinitive));
  }, [filteredVerbs, selectedVerbs]);

  const allLettersSelected = selectedLetters.size === availableLetters.length;
  const allVisibleVerbsSelected =
    filteredVerbs.length > 0 &&
    filteredVerbs.every((verb) => selectedVerbs.has(verb.infinitive));

  const toggleLetter = (letter: string) => {
    setSelectedLetters((previous) => {
      const next = new Set(previous);
      if (next.has(letter)) {
        next.delete(letter);
      } else {
        next.add(letter);
      }
      return next;
    });
  };

  const toggleAllLetters = () => {
    setSelectedLetters(allLettersSelected ? new Set() : new Set(availableLetters));
  };

  const toggleVerb = (infinitive: string) => {
    setSelectedVerbs((previous) => {
      const next = new Set(previous);
      if (next.has(infinitive)) {
        next.delete(infinitive);
      } else {
        next.add(infinitive);
      }
      return next;
    });
  };

  const toggleAllVisibleVerbs = () => {
    setSelectedVerbs((previous) => {
      const next = new Set(previous);
      if (allVisibleVerbsSelected) {
        filteredVerbs.forEach((verb) => next.delete(verb.infinitive));
      } else {
        filteredVerbs.forEach((verb) => next.add(verb.infinitive));
      }
      return next;
    });
  };

  const handleStartTest = () => {
    const params = new URLSearchParams({
      letters: Array.from(selectedLetters).sort().join(','),
      words: selectedFilteredVerbs.map((verb) => verb.infinitive).join(','),
      mode,
      showInfinitive: showInfinitive ? '1' : '0',
      translationLanguage,
    });

    router.push(`${ROUTES.test}?${params.toString()}`);
  };

  return (
    <PageShell
      title="Settings"
      width="md"
      actions={
        <Button asChild variant="secondary" className={NAV_BUTTON_CLASS}>
          <Link href={ROUTES.review}>Marked words</Link>
        </Button>
      }
    >
        {/* Filter by Letters */}
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold text-foreground">Filter by Starting Letter</h2>
          <Button
            type="button"
            onClick={toggleAllLetters}
            variant={allLettersSelected ? 'default' : 'secondary'}
            className="h-auto w-fit border-2 border-foreground px-4 py-2 font-semibold transition-transform hover:scale-105"
          >
            {allLettersSelected ? 'Deselect All' : 'Select All'}
          </Button>
          <div className="grid grid-cols-6 gap-2">
            {availableLetters.map((letter) => (
              <Button
                key={letter}
                type="button"
                onClick={() => toggleLetter(letter)}
                variant={selectedLetters.has(letter) ? 'default' : 'secondary'}
                className="h-auto border-2 border-foreground px-3 py-2 font-semibold transition-transform hover:scale-105"
              >
                {letter.toUpperCase()}
              </Button>
            ))}
          </div>
        </section>

        {/* Word Preview */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-2xl font-semibold text-foreground">Words in this test</h2>
            <Button
              type="button"
              onClick={toggleAllVisibleVerbs}
              disabled={filteredVerbs.length === 0}
              variant={allVisibleVerbsSelected ? 'default' : 'secondary'}
              className="h-auto border-2 border-foreground px-4 py-2 font-semibold transition-transform hover:scale-105"
            >
              {allVisibleVerbsSelected ? 'Deselect All Visible' : 'Select All Visible'}
            </Button>
          </div>

          <p className="text-lg font-semibold text-foreground">
            Selected: <span className="font-bold">{selectedFilteredVerbs.length}</span> /{' '}
            {filteredVerbs.length} visible ({verbs.length} total)
          </p>

          {filteredVerbs.length === 0 ? (
            <p className="text-lg text-foreground">No words match the current letter filter.</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto rounded-lg border-2 border-foreground bg-card p-4">
              {filteredVerbs.map((verb) => {
                const isSelected = selectedVerbs.has(verb.infinitive);
                const translation = verb.translations?.[translationLanguage];
                const id = `verb-${verb.infinitive}`;

                return (
                  <div
                    key={verb.infinitive}
                    className="flex items-center gap-3 rounded-lg px-2 py-1"
                  >
                    <Checkbox
                      id={id}
                      checked={isSelected}
                      onCheckedChange={() => toggleVerb(verb.infinitive)}
                      className="size-5"
                    />
                    <Label htmlFor={id} className="flex items-center gap-2 font-semibold text-card-foreground">
                      {verb.infinitive}
                      {translation ? (
                        <span className="text-sm font-normal text-muted-foreground">{translation}</span>
                      ) : null}
                    </Label>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Learning mode */}
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold text-foreground">Learning mode</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {MODE_OPTIONS.map((option) => {
              const isActive = mode === option.value;
              return (
                <Button
                  key={option.value}
                  type="button"
                  onClick={() => setMode(option.value)}
                  variant={isActive ? 'default' : 'secondary'}
                  className="h-auto flex-col items-start gap-1 border-2 border-foreground px-4 py-3 text-left transition-transform hover:scale-[1.02]"
                >
                  <span className="text-lg font-semibold">{option.label}</span>
                  <span
                    className={cn(
                      'text-sm font-normal',
                      isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                    )}
                  >
                    {option.hint}
                  </span>
                </Button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="show-infinitive"
              checked={showInfinitive}
              onCheckedChange={(value) => setShowInfinitive(value === true)}
              className="size-6"
            />
            <Label htmlFor="show-infinitive" className="text-lg font-semibold text-foreground">
              Show infinitive on the card
            </Label>
          </div>
        </section>

        {/* Translation Language */}
        <section className="flex flex-col gap-3">
          <h2 className="text-2xl font-semibold text-foreground">Translation language for the test</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <Label htmlFor="translation-language" className="text-lg font-semibold text-foreground">
              Translation language
            </Label>
            <Select
              value={translationLanguage}
              onValueChange={(value) => setTranslationLanguage(value as LanguageCode)}
            >
              <SelectTrigger
                id="translation-language"
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
        </section>

        {/* Start Button */}
        <Button
          type="button"
          onClick={handleStartTest}
          disabled={selectedFilteredVerbs.length === 0}
          variant="secondary"
          className="h-auto border-2 border-foreground px-8 py-4 text-xl font-semibold transition-transform hover:scale-105"
        >
          Start Testing
        </Button>
    </PageShell>
  );
}
