import { PlaceholderPage } from '../../components/ui/PlaceholderPage';

export default function Announcements() {
  return <PlaceholderPage title="Announcements" endpoints={['GET /api/announcements', 'POST /api/announcements', 'POST /api/announcements/:id/attachment']} />;
}
