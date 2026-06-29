import { FRAME_WIDTH, PAGE_GUTTER } from '@/components/page-container';
import { cn } from '@/lib/utils';

const GITHUB_URL = 'https://github.com/notanoty/onregelmatige-werkwoorden-leren';

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t-2 border-foreground bg-background">
      <div
        className={cn(
          'mx-auto flex w-full flex-col items-center justify-between gap-2 py-4 text-sm text-foreground sm:flex-row',
          FRAME_WIDTH,
          PAGE_GUTTER
        )}
      >
        <p>© {year} Onregelmatige Werkwoorden</p>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline-offset-4 hover:underline"
        >
          GitHub
        </a>
      </div>
    </footer>
  );
}
