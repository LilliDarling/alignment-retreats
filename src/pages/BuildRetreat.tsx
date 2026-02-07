import { UnderConstruction } from '@/components/UnderConstruction';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function BuildRetreat() {
  usePageTitle('Build Your Dream Retreat');
  return <UnderConstruction title="Build Your Dream Retreat" />;
}
