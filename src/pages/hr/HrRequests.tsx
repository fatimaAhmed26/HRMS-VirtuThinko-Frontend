import { PlaceholderPage } from '../../components/ui/PlaceholderPage';

export default function HrRequests() {
  return <PlaceholderPage title="HR requests & letters" subtitle="Salary certificates, NOCs and other requests" endpoints={['GET /api/requests', 'POST /api/requests/:id/{start|generate|approve|complete|reject}']} />;
}
