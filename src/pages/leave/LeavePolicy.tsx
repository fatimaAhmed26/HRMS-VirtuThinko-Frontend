import { PlaceholderPage } from '../../components/ui/PlaceholderPage';

export default function LeavePolicy() {
  return <PlaceholderPage title="Leave policy" subtitle="Leave types and rules per country" endpoints={['GET /api/leave/types?country=BH', 'GET /api/leave/types?country=SA', 'PATCH /api/leave/types/:id']} />;
}
