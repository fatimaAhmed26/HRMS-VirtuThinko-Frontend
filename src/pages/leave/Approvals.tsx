import { PlaceholderPage } from '../../components/ui/PlaceholderPage';

export default function Approvals() {
  return <PlaceholderPage title="Leave approvals" subtitle="Manager first, then HR" endpoints={['GET /api/leave/requests/pending', 'POST /api/leave/requests/:id/approve', 'POST /api/leave/requests/:id/reject']} />;
}
