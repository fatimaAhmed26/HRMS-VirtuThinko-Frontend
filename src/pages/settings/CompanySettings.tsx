import { PlaceholderPage } from '../../components/ui/PlaceholderPage';

export default function CompanySettings() {
  return <PlaceholderPage title="Company settings" subtitle="Name, logo, address, working days" endpoints={['GET /api/settings', 'PATCH /api/settings', 'POST /api/settings/logo']} />;
}
