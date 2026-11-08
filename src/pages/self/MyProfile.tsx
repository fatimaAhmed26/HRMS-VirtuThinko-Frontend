import { PlaceholderPage } from '../../components/ui/PlaceholderPage';

export default function MyProfile() {
  return <PlaceholderPage title="My profile" subtitle="You can change your phone, address and emergency contact" endpoints={['GET /api/employees/me', 'PATCH /api/employees/me', 'PATCH /api/users/me/password']} />;
}
