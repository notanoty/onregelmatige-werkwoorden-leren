import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';
import { PageContainer, type PageWidth } from '@/components/page-container';

const NAV_BUTTON_CLASS =
  'h-auto border-2 border-foreground px-4 py-2 text-lg font-semibold transition-transform hover:scale-105';

/** Standard page layout: a {@link PageContainer} with a header row holding the
 *  page title and nav actions. A "← Home" button is appended after any custom
 *  `actions` unless `home` is set to false. */
export function PageShell({
  title,
  actions,
  home = true,
  width = 'lg',
  children,
}: {
  title: string;
  actions?: React.ReactNode;
  /** Append the trailing "← Home" button. @default true */
  home?: boolean;
  width?: PageWidth;
  children: React.ReactNode;
}) {
  return (
    <PageContainer width={width}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-4xl font-bold text-foreground">{title}</h1>
        {(actions || home) && (
          <div className="flex gap-3 flex-wrap">
            {actions}
            {home && (
              <Button asChild variant="secondary" className={NAV_BUTTON_CLASS}>
                <Link href={ROUTES.home}>← Home</Link>
              </Button>
            )}
          </div>
        )}
      </div>
      {children}
    </PageContainer>
  );
}

export { NAV_BUTTON_CLASS };
