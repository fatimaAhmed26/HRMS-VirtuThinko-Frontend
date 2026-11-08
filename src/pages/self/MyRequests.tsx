import { PlaceholderPage } from '../../components/ui/PlaceholderPage';

export default function MyRequests() {
  return <PlaceholderPage title="Requests & certificates" endpoints={['GET /api/requests/types', 'POST /api/requests', 'GET /api/requests/me']} />;
}
