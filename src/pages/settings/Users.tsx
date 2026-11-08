import { PlaceholderPage } from '../../components/ui/PlaceholderPage';

export default function Users() {
  return <PlaceholderPage title="Users" subtitle="Portal accounts, roles and entity scope (BH / SA / ALL)" endpoints={['GET /api/users', 'POST /api/users', 'PUT /api/users/:id/roles', 'PATCH /api/users/:id']} />;
}
