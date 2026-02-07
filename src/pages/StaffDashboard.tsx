import { UnderConstruction } from '@/components/UnderConstruction';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function StaffDashboard() {
  usePageTitle('Staff Dashboard');
  return <UnderConstruction title="Staff Dashboard" />;
}
