import { PlaceholderPage } from '../../components/ui/PlaceholderPage';

export default function AddIntern() {
  return <PlaceholderPage title="Add intern" subtitle="Short form for interns - no portal login is created" endpoints={['POST /api/employees (employmentType: Intern)', 'POST /api/contracts (contractType: internship)']} />;
}
