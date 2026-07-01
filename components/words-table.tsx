'use client';

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageShell } from '@/components/page-shell';
import { LANGUAGE_LABELS, LANGUAGE_OPTIONS } from '@/lib/constants';
import type { LanguageCode, Verb } from '@/lib/types';

interface WordsTableProps {
  verbs: Verb[];
}

/** Full /words page: brand chrome (title + Home link) wrapping the browser. */
export function WordsTable({ verbs }: WordsTableProps) {
  return (
    <PageShell title="All Irregular Words" width="xl">
      <WordsBrowser verbs={verbs} />
    </PageShell>
  );
}

/** Filter controls + table only — no page chrome, so it can be embedded
 *  (e.g. in the landing page) as well as inside {@link WordsTable}. */
export function WordsBrowser({ verbs }: WordsTableProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en');

  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    verbs.forEach((verb) => {
      letters.add(verb.infinitive.charAt(0).toLowerCase());
    });
    return Array.from(letters).sort();
  }, [verbs]);

  const [selectedLetters, setSelectedLetters] = useState<Set<string>>(
    () => new Set(availableLetters)
  );

  const allLettersSelected = selectedLetters.size === availableLetters.length;

  const visibleVerbs = useMemo(() => {
    return verbs.filter((verb) =>
      selectedLetters.has(verb.infinitive.charAt(0).toLowerCase())
    );
  }, [verbs, selectedLetters]);

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

  return (
    <>
        <div className="flex items-center gap-3 flex-wrap">
          <Label htmlFor="translation-language" className="text-lg font-semibold text-foreground">
            Translation language
          </Label>
          <Select
            value={selectedLanguage}
            onValueChange={(value) => setSelectedLanguage(value as LanguageCode)}
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
          <p className="text-lg font-semibold text-foreground">
            Words shown: {visibleVerbs.length} / {verbs.length} | Translation:{' '}
            {LANGUAGE_LABELS[selectedLanguage]}
          </p>
        </div>

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
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10">
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

        {visibleVerbs.length > 0 ? (
          <div className="overflow-hidden rounded-lg border-2 border-foreground">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary">
                  <TableHead className="px-4 py-3 text-primary-foreground">Infinitive</TableHead>
                  <TableHead className="px-4 py-3 text-primary-foreground">Translation</TableHead>
                  <TableHead className="px-4 py-3 text-primary-foreground">Past Singular</TableHead>
                  <TableHead className="px-4 py-3 text-primary-foreground">Past Plural</TableHead>
                  <TableHead className="px-4 py-3 text-primary-foreground">Past Participle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleVerbs.map((verb) => (
                  <TableRow key={verb.infinitive} className="bg-card even:bg-background/40">
                    <TableCell className="px-4 py-3 font-semibold text-card-foreground">
                      {verb.infinitive}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-card-foreground">
                      {verb.translations?.[selectedLanguage] || '—'}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-card-foreground">{verb.pastSingular}</TableCell>
                    <TableCell className="px-4 py-3 text-card-foreground">{verb.pastPlural}</TableCell>
                    <TableCell className="px-4 py-3 text-card-foreground">
                      {verb.pastParticiple} <span className="font-semibold">({verb.auxiliary})</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-8 text-center text-foreground">
            <p className="text-lg">No words found.</p>
          </div>
        )}
    </>
  );
}
