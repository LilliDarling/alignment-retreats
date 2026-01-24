import { AppHeader } from '@/components/AppHeader';
import { BuildRetreatWizard } from '@/components/BuildRetreatWizard';

export default function BuildRetreat() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <BuildRetreatWizard />
      </main>
    </div>
  );
}
