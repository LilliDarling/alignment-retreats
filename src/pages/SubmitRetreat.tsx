import { UnderConstruction } from '@/components/UnderConstruction';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function SubmitRetreat() {
  usePageTitle('Submit Retreat Idea');
  return <UnderConstruction title="Submit Retreat" />;
}
