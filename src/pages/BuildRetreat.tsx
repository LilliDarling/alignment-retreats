import { AppHeader } from '@/components/AppHeader';
import { BuildRetreatWizard } from '@/components/BuildRetreatWizard';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function BuildRetreat() {
  usePageTitle('Build Your Dream Retreat');
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <BuildRetreatWizard />
      </main>
    </div>
  );
}
