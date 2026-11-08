import { PlaceholderPage } from '../../components/ui/PlaceholderPage';

export default function Payslips() {
  return <PlaceholderPage title="Payslips & adjustments" subtitle="Two tabs: payslips, and allowances & deductions" endpoints={['GET /api/payroll/payslips/:id/pdf', 'GET /api/payroll/items', 'POST /api/payroll/items/:id/approve']} />;
}
