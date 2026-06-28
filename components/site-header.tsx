'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/lib/constants';
import { FRAME_WIDTH, PAGE_GUTTER } from '@/components/page-container';
import { cn } from '@/lib/utils';

const NAV_LINKS: ReadonlyArray<{ label: string; href: string }> = [
  { label: 'Words', href: ROUTES.words },
  { label: 'Cards', href: ROUTES.learn },
  { label: 'Type', href: `${ROUTES.test}?mode=typed` },
  { label: 'Stats', href: ROUTES.stats },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b-2 border-foreground bg-background">
      <div className={cn('mx-auto flex w-full items-center justify-between gap-4 py-3', FRAME_WIDTH, PAGE_GUTTER)}>
        <Link
          href={ROUTES.home}
          className="border-2 border-foreground px-3 py-1 font-mono text-sm font-bold tracking-widest text-foreground uppercase transition-transform hover:scale-105"
        >
          logo
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {NAV_LINKS.map((link) => {
            const linkPath = link.href.split('?')[0];
            const isActive = pathname === linkPath;
            return (
              <Link
                key={link.label}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'rounded-lg border-2 px-3 py-1.5 text-base font-semibold transition-transform hover:scale-105',
                  isActive
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-transparent text-foreground hover:border-foreground'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
