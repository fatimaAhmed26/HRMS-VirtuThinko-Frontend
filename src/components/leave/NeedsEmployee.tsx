import { Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/Feedback';
import { PageHeader } from '../ui/PageHeader';

// Balances, requests and planning belong to employees. Accounts without an employee record see an explanation, not an error.
export function NeedsEmployee() {
  const { user } = useAuth();
  if (user?.employeeId) return <Outlet />;
  return (
    <>
      <PageHeader title="Leave" subtitle="This account is not linked to an employee record." />
      <Card>
        <EmptyState title="Nothing to show for this account">
          Leave balances and requests belong to employees. Sign in with an account linked to an employee, or ask HR to link this one.
        </EmptyState>
      </Card>
    </>
  );
}
