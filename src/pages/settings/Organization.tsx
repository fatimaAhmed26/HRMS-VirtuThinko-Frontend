import { PlaceholderPage } from '../../components/ui/PlaceholderPage';

export default function Organization() {
  return <PlaceholderPage title="Organization & client companies" subtitle="Client companies set the annual leave days for outsourced staff" endpoints={['GET /api/clients', 'POST /api/clients', 'PATCH /api/clients/:id']} />;
}
