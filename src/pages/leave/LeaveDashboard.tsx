import { PlaceholderPage } from '../../components/ui/PlaceholderPage';

export default function LeaveDashboard() {
  return <PlaceholderPage title="Leave dashboard" subtitle="Balances, upcoming leave and who is off" endpoints={['GET /api/leave/balances/me', 'GET /api/leave/requests/me']} />;
}
