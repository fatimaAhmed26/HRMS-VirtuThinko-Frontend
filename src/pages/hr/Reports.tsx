import { PlaceholderPage } from '../../components/ui/PlaceholderPage';

export default function Reports() {
  return <PlaceholderPage title="Reports" subtitle="View, or export to Excel / PDF" endpoints={['GET /api/reports', 'GET /api/reports/:name?format=json|xlsx|pdf']} />;
}
