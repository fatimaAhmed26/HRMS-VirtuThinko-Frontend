import { PlaceholderPage } from '../../components/ui/PlaceholderPage';

export default function MyAnnouncements() {
  return <PlaceholderPage title="Announcements" endpoints={['GET /api/announcements/me']} />;
}
