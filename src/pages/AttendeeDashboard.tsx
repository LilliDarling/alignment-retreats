import { UnderConstruction } from '@/components/UnderConstruction';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function AttendeeDashboard() {
  usePageTitle('My Retreats');
  return <UnderConstruction title="My Retreats" />;
}
