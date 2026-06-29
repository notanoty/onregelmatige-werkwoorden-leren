import { cn } from '@/lib/utils';

/**
 * Named max-width scale for page content. The widest token (`xl`) matches the
 * site chrome frame (see {@link FRAME_WIDTH}), so full-width pages line up with
 * the header and footer; narrower tokens center their content within that frame.
 *
 * Pick by content type:
 * - `sm`  hero / compact landing stacks
 * - `md`  single-column flows (settings, flashcards)
 * - `lg`  default reading width (stats, review lists)
 * - `xl`  wide content (data tables, results grids)
 */
export const PAGE_WIDTHS = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
} as const;

export type PageWidth = keyof typeof PAGE_WIDTHS;

/** Max width of the site chrome (header/footer). Kept in sync with `PAGE_WIDTHS.xl`. */
export const FRAME_WIDTH = PAGE_WIDTHS.xl;

/** Responsive horizontal gutters shared by page content and the site chrome. */
export const PAGE_GUTTER = 'px-4 sm:px-6 lg:px-8';

/**
 * The single responsive container every page renders through. Owns vertical
 * growth (`flex-1`), the brand background, responsive gutters, vertical rhythm,
 * and a centered, width-capped content column.
 */
export function PageContainer({
  width = 'lg',
  align = 'top',
  className,
  children,
}: {
  /** Max content width, from the {@link PAGE_WIDTHS} scale. @default 'lg' */
  width?: PageWidth;
  /** Vertical placement of the content column in the available space. @default 'top' */
  align?: 'top' | 'center';
  /** Extra classes for the inner content column. */
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col bg-background',
        align === 'center' ? 'justify-center' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'mx-auto flex w-full flex-col gap-6 py-8 sm:gap-8',
          PAGE_GUTTER,
          PAGE_WIDTHS[width],
          align === 'center' && 'items-center text-center',
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
