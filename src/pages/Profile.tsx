import { UnderConstruction } from '@/components/UnderConstruction';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function Profile() {
  usePageTitle('Profile');
  return <UnderConstruction title="Profile" />;
}
