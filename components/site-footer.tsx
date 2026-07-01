import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { FRAME_WIDTH, PAGE_GUTTER } from '@/components/page-container';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

const GITHUB_URL = 'https://github.com/notanoty/onregelmatige-werkwoorden-leren';

const FOOTER_LINKS: ReadonlyArray<{ label: string; href: string }> = [
  { label: 'Flashcards', href: ROUTES.learn },
  { label: 'Typing test', href: `${ROUTES.test}?mode=typed` },
  { label: 'All words', href: ROUTES.words },
  { label: 'Your stats', href: ROUTES.stats },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t-2 border-foreground bg-background">
      <div
        className={cn(
          'mx-auto flex w-full flex-col gap-8 py-10',
          FRAME_WIDTH,
          PAGE_GUTTER
        )}
      >
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand */}
          <div className="flex max-w-sm flex-col gap-3">
            <span className="w-fit border-2 border-foreground bg-card px-3 py-1 font-mono text-sm font-bold uppercase tracking-widest text-foreground">
              Werkwoorden
            </span>
            <p className="text-sm text-muted-foreground">
              Master Dutch irregular verbs — flip through flashcards, type out the forms, and
              browse the full reference list.
            </p>
          </div>

          {/* Quick links */}
          <nav className="flex flex-col gap-2.5">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Practice
            </span>
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="w-fit text-sm font-medium text-foreground underline-offset-4 hover:underline"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col items-center justify-between gap-2 border-t-2 border-foreground/10 pt-5 text-sm text-muted-foreground sm:flex-row">
          <p>© {year} Onregelmatige Werkwoorden</p>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-foreground underline-offset-4 hover:underline"
          >
            GitHub
            <ArrowUpRight className="size-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
