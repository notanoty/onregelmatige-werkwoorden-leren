import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HomeExtraLinks } from '@/components/home-extra-links';
import { PageContainer } from '@/components/page-container';
import { ROUTES } from '@/lib/constants';

export default function Home() {
  return (
    <PageContainer width="sm" align="center">
      <h1 className="text-4xl font-bold text-foreground">Onregelmatige Werkwoorden Dev</h1>
      <div className="flex flex-col gap-4 w-full">
        <Button
          asChild
          variant="secondary"
          className="h-auto border-2 border-foreground px-8 py-3 text-lg font-semibold transition-transform hover:scale-105"
        >
          <Link href={ROUTES.learn}>Learn Irregular Words</Link>
        </Button>
        <Button
          asChild
          variant="secondary"
          className="h-auto border-2 border-foreground px-8 py-3 text-lg font-semibold transition-transform hover:scale-105"
        >
          <Link href={ROUTES.words}>View All Words</Link>
        </Button>
        <HomeExtraLinks />
      </div>
    </PageContainer>
  );
}
