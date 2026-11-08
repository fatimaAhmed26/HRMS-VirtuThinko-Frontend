import { PlaceholderPage } from '../../components/ui/PlaceholderPage';

export default function ChangesThisMonth() {
  return <PlaceholderPage title="Changes this month" subtitle="New joiners, leavers, unpaid leave and new allowances" endpoints={['GET /api/payroll/items', 'GET /api/reports/...']} />;
}
