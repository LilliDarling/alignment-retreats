import { UnderConstruction } from '@/components/UnderConstruction';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function Dashboard() {
  usePageTitle('Dashboard');
  return <UnderConstruction title="Dashboard" />;
}
