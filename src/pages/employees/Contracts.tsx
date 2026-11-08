import { PlaceholderPage } from '../../components/ui/PlaceholderPage';

export default function Contracts() {
  return <PlaceholderPage title="Contracts" subtitle="Active, Inactive and Ended contracts; outsourced deployments alert at 3 months, 2 months, 1 month and 7 days" endpoints={['GET /api/contracts?state=', 'POST /api/contracts', 'POST /api/contracts/:id/terminate']} />;
}
