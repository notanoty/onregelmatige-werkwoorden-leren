'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Eye, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Verb } from '@/lib/types';

/**
 * A small, self-contained flashcard demo for the landing page: shows a past
 * participle, reveals the full conjugation with a slide-up panel, and cycles
 * through a seed list. Deliberately decoupled from the quiz `TestRunner`, which
 * is bound to its grading state machine.
 */
export function LandingFlashcard({ verbs }: { verbs: Verb[] }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  if (verbs.length === 0) return null;

  const verb = verbs[index % verbs.length];

  const next = () => {
    setRevealed(false);
    setIndex((i) => (i + 1) % verbs.length);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative min-h-[16rem] overflow-hidden rounded-xl border-2 border-foreground bg-background/50">
        {/* Prompt face */}
        <div className="flex min-h-[16rem] flex-col items-center justify-center gap-2 p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Past participle
          </p>
          <p className="text-4xl font-bold text-foreground">{verb.pastParticiple}</p>
          <p className="text-sm text-muted-foreground">
            ({verb.auxiliary}) · know the other forms?
          </p>
        </div>

        {/* Answer panel slides up to cover the prompt */}
        <AnimatePresence initial={false}>
          {revealed && (
            <motion.div
              key="answer"
              className="absolute inset-0 flex flex-col gap-3 bg-card p-4"
              initial={{ y: '100%' }}
              animate={{ y: 0, transition: { type: 'spring', stiffness: 220, damping: 30 } }}
              exit={{ y: '100%', transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {verb.infinitive}
              </p>
              <div className="overflow-hidden rounded-lg border-2 border-foreground">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary hover:bg-primary">
                      <TableHead className="px-3 py-2 text-primary-foreground">Infinitive</TableHead>
                      <TableHead className="px-3 py-2 text-primary-foreground">Past sg.</TableHead>
                      <TableHead className="px-3 py-2 text-primary-foreground">Past pl.</TableHead>
                      <TableHead className="px-3 py-2 text-primary-foreground">Participle</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-card">
                      <TableCell className="px-3 py-2 font-semibold text-card-foreground">
                        {verb.infinitive}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-card-foreground">{verb.pastSingular}</TableCell>
                      <TableCell className="px-3 py-2 text-card-foreground">{verb.pastPlural}</TableCell>
                      <TableCell className="px-3 py-2 text-card-foreground">
                        {verb.pastParticiple} <span className="font-semibold">({verb.auxiliary})</span>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={() => setRevealed((r) => !r)}
          variant="secondary"
          className="h-auto border-2 border-foreground px-4 py-2 font-semibold transition-transform hover:scale-105"
        >
          <Eye className="size-4" />
          {revealed ? 'Hide answer' : 'Reveal answer'}
        </Button>
        <Button
          type="button"
          onClick={next}
          variant="secondary"
          className="h-auto border-2 border-foreground px-4 py-2 font-semibold transition-transform hover:scale-105"
        >
          <RotateCcw className="size-4" />
          Next word
        </Button>
      </div>
    </div>
  );
}
