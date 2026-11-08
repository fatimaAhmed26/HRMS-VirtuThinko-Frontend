import { PlaceholderPage } from '../../components/ui/PlaceholderPage';

export default function PublicHolidays() {
  return <PlaceholderPage title="Public holidays" subtitle="Bahrain and Saudi Arabia" endpoints={['GET /api/leave/holidays', 'POST /api/leave/holidays', 'DELETE /api/leave/holidays/:id']} />;
}
