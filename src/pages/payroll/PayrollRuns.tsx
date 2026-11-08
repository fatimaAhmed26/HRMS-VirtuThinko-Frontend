import { PlaceholderPage } from '../../components/ui/PlaceholderPage';

export default function PayrollRuns() {
  return <PlaceholderPage title="Payroll run" subtitle="Bahrain and KSA runs: Draft → Under review → Approved → Processed → Paid" endpoints={['GET /api/payroll/runs?entity=', 'POST /api/payroll/runs']} />;
}
