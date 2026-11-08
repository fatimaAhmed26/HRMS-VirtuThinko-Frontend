import { PlaceholderPage } from '../../components/ui/PlaceholderPage';

export default function Departments() {
  return <PlaceholderPage title="Departments & job titles" endpoints={['GET /api/departments', 'POST /api/departments', 'PATCH /api/departments/:id']} />;
}
