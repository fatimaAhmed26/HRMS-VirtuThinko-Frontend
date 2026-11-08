import { PlaceholderPage } from '../../components/ui/PlaceholderPage';

export default function LeavePlanner() {
  return <PlaceholderPage title="Leave planner" subtitle="Pick dates to plan leave" endpoints={['GET /api/leave/balances/me', 'GET /api/leave/holidays']} />;
}
