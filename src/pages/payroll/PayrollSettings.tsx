import { PlaceholderPage } from '../../components/ui/PlaceholderPage';

export default function PayrollSettings() {
  return <PlaceholderPage title="Payroll settings" subtitle="Allowance and deduction types" endpoints={['GET /api/payroll/item-types', 'POST /api/payroll/item-types']} />;
}
