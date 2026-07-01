import Link from 'next/link';
import { Pin } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tilt = 'left' | 'right' | 'none';
type PinCorner = 'tl' | 'tr';

const TILT_CLASS: Record<Tilt, string> = {
  left: '-rotate-1',
  right: 'rotate-1',
  none: '',
};

const PIN_CORNER_CLASS: Record<PinCorner, string> = {
  tl: '-left-3 -top-3',
  tr: '-right-3 -top-3',
};

/** The push-pin disc. Rendered either as a decorative span (stretched cards,
 *  where the whole surface is the link) or as the link itself (interactive
 *  cards, where the content must stay clickable). */
function PinDisc({
  pin,
  pinColor,
  asLink,
  href,
  label,
}: {
  pin: PinCorner;
  pinColor: string;
  asLink: boolean;
  href: string;
  label: string;
}) {
  const visual = (
    <>
      <Pin className="size-4 -rotate-45 fill-background/30" />
      <span className="absolute left-2 top-2 size-1.5 rounded-full bg-background/70" />
    </>
  );
  const base = cn(
    'absolute z-20 flex size-9 items-center justify-center rounded-full border-2 border-foreground text-background shadow-[2px_3px_0_0_var(--foreground)]',
    pinColor,
    PIN_CORNER_CLASS[pin]
  );

  if (asLink) {
    return (
      <Link
        href={href}
        aria-label={label}
        className={cn(
          base,
          'transition-transform hover:scale-110 hover:-rotate-6 outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
        )}
      >
        {visual}
      </Link>
    );
  }
  return (
    <span aria-hidden className={cn(base, 'pointer-events-none')}>
      {visual}
    </span>
  );
}

/**
 * A pinned "paper" card with a hard offset shadow and slight tilt.
 *
 * - **stretched** (default): the whole surface is one link, so inner content is
 *   decorative/non-interactive (stretched-link pattern). The pin is decoration.
 * - **interactive**: inner content stays clickable (e.g. a live demo); the corner
 *   push-pin is the only link out to `href`.
 */
export function BentoCard({
  href,
  label,
  interactive = false,
  tilt = 'none',
  pin = 'tr',
  pinColor = 'bg-destructive',
  className,
  children,
}: {
  href: string;
  /** Accessible name for the card/pin link. */
  label: string;
  /** Keep inner content clickable and route only via the pin. @default false */
  interactive?: boolean;
  tilt?: Tilt;
  pin?: PinCorner;
  /** Tailwind background class for the pin disc. @default 'bg-destructive' */
  pinColor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'group relative flex flex-col rounded-2xl border-2 border-foreground bg-card p-6 text-card-foreground',
        'shadow-[6px_6px_0_0_var(--foreground)] transition-all duration-200',
        'hover:-translate-y-1 hover:shadow-[10px_10px_0_0_var(--foreground)]',
        'focus-within:-translate-y-1 focus-within:shadow-[10px_10px_0_0_var(--foreground)]',
        TILT_CLASS[tilt],
        className
      )}
    >
      {!interactive && (
        <Link
          href={href}
          className="absolute inset-0 z-0 rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="sr-only">{label}</span>
        </Link>
      )}

      <PinDisc pin={pin} pinColor={pinColor} asLink={interactive} href={href} label={label} />

      <div
        className={cn(
          'relative z-10 flex flex-1 flex-col',
          interactive ? 'pointer-events-auto' : 'pointer-events-none'
        )}
      >
        {children}
      </div>
    </div>
  );
}
