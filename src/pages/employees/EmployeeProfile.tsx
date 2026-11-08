import { PlaceholderPage } from '../../components/ui/PlaceholderPage';

export default function EmployeeProfile() {
  return <PlaceholderPage title="Employee profile" subtitle="10 tabs: personal, job & contract, salary & payslips, leave, documents, upload & sign, assets, letters & certificates, emergency & dependants, history" endpoints={['GET /api/employees/:id', 'GET /api/employees/:id/history', 'GET /api/leave/balances/:employeeId', 'GET /api/contracts?employeeId=', 'GET /api/documents?employeeId=', 'GET /api/requests?employeeId=']} />;
}
