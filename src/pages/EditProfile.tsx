import { UnderConstruction } from '@/components/UnderConstruction';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function EditProfile() {
  usePageTitle('Edit Profile');
  return <UnderConstruction title="Edit Profile" />;
}
