import { PlaceholderPage } from '../../components/ui/PlaceholderPage';

export default function CompanyCalendar() {
  return <PlaceholderPage title="Company calendar" subtitle="Who is off and when" endpoints={['GET /api/leave/requests?status=approved&from=&to=', 'GET /api/leave/holidays']} />;
}
