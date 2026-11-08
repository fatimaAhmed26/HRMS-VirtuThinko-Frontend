import { PlaceholderPage } from '../../components/ui/PlaceholderPage';

export default function MyContract() {
  return <PlaceholderPage title="My contract" subtitle="Salary is not shown here" endpoints={['GET /api/contracts/me']} />;
}
