import { PlaceholderPage } from '../../components/ui/PlaceholderPage';

export default function PayrollRunDetail() {
  return <PlaceholderPage title="Payroll run details" endpoints={['GET /api/payroll/runs/:id', 'POST /api/payroll/runs/:id/{submit|approve|return|process|pay}', 'GET /api/payroll/runs/:id/bank-file']} />;
}
