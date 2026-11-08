import { PlaceholderPage } from '../../components/ui/PlaceholderPage';

export default function AddEmployee() {
  return <PlaceholderPage title="Add employee" subtitle="Full onboarding form" endpoints={['POST /api/employees', 'GET /api/departments', 'GET /api/clients']} />;
}
