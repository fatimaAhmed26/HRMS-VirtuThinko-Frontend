import { PlaceholderPage } from '../../components/ui/PlaceholderPage';

export default function RequestLeave() {
  return <PlaceholderPage title="Request leave" subtitle="Annual leave over 4 days needs 14 days' notice" endpoints={['GET /api/leave/types?country=', 'POST /api/documents (leave_attachment)', 'POST /api/leave/requests']} />;
}
