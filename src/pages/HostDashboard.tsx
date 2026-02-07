import { UnderConstruction } from '@/components/UnderConstruction';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function HostDashboard() {
  usePageTitle('Host Dashboard');
  return <UnderConstruction title="Host Dashboard" />;
}
