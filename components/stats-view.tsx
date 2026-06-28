'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageShell, NAV_BUTTON_CLASS } from '@/components/page-shell';
import { ROUTES } from '@/lib/constants';
import { getAggregateStats, getMostMissed, resetAll } from '@/lib/progress/progressStore';
import { useProgressState } from '@/lib/progress/useProgress';

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="gap-1 rounded-xl border-2 border-foreground p-5 text-card-foreground">
      <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-3xl font-bold">{value}</span>
    </Card>
  );
}

export function StatsView() {
  const progress = useProgressState();
  const stats = getAggregateStats(progress);
  const mostMissed = getMostMissed(progress, 10);
  const hasData = stats.totalReviews > 0 || stats.distinctSeen > 0;

  const reset = () => {
    if (typeof window !== 'undefined' && !window.confirm('Reset all local stats? This cannot be undone.')) {
      return;
    }
    resetAll();
  };

  const actions = (
    <Button asChild variant="secondary" className={NAV_BUTTON_CLASS}>
      <Link href={ROUTES.learn}>Settings</Link>
    </Button>
  );

  if (!hasData) {
    return (
      <PageShell title="Your stats" actions={actions} width="lg">
        <div className="flex flex-col gap-4 rounded-lg border-2 border-foreground bg-card p-6 text-card-foreground">
          <p className="text-lg font-semibold">No activity yet.</p>
          <p>Finish a learning session and your progress will show up here — all stored on this device.</p>
          <Button asChild variant="secondary" className={NAV_BUTTON_CLASS}>
            <Link href={ROUTES.learn}>Start learning</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Your stats" actions={actions} width="lg">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile label="Total reviews" value={stats.totalReviews} />
        <StatTile label="Accuracy" value={`${Math.round(stats.accuracy * 100)}%`} />
        <StatTile label="Sessions" value={stats.sessions} />
        <StatTile label="Knew it" value={stats.knew} />
        <StatTile label="Didn't know" value={stats.didnt} />
        <StatTile label="Skipped" value={stats.skipped} />
        <StatTile label="Words seen" value={stats.distinctSeen} />
        <StatTile label="Mastered" value={stats.mastered} />
        <StatTile label="Marked for review" value={stats.markedCount} />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-semibold text-foreground">Most missed words</h2>
        {mostMissed.length === 0 ? (
          <p className="text-lg text-foreground">No missed words — nice work!</p>
        ) : (
          <div className="overflow-hidden rounded-lg border-2 border-foreground">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary">
                  <TableHead className="px-4 py-3 text-primary-foreground">Word</TableHead>
                  <TableHead className="px-4 py-3 text-primary-foreground">Missed</TableHead>
                  <TableHead className="px-4 py-3 text-primary-foreground">Knew</TableHead>
                  <TableHead className="px-4 py-3 text-primary-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mostMissed.map((verb) => (
                  <TableRow
                    key={verb.infinitive}
                    className="bg-card even:bg-background/40 hover:bg-card"
                  >
                    <TableCell className="px-4 py-3 font-semibold text-card-foreground">
                      {verb.infinitive}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-destructive">{verb.didnt}</TableCell>
                    <TableCell className="px-4 py-3 text-success">{verb.knew}</TableCell>
                    <TableCell className="px-4 py-3 text-card-foreground">
                      {verb.marked ? 'Marked' : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="secondary" className={NAV_BUTTON_CLASS}>
          <Link href={ROUTES.review}>Review marked words</Link>
        </Button>
        <Button
          type="button"
          onClick={reset}
          variant="destructive"
          className="h-auto border-2 border-foreground px-4 py-2 text-lg font-semibold transition-transform hover:scale-105"
        >
          Reset stats
        </Button>
      </div>
    </PageShell>
  );
}
