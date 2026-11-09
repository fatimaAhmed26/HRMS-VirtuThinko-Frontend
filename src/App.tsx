import { Route, Routes } from 'react-router-dom';
import { HomeRedirect, RequireAuth, RequirePermission } from './auth/guards';
import { AppLayout } from './components/layout/AppLayout';
import { P } from './lib/permissions';

import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Notifications from './pages/Notifications';
import HrDashboard from './pages/hr/Dashboard';
import HrRequests from './pages/hr/HrRequests';
import Announcements from './pages/hr/Announcements';
import Reports from './pages/hr/Reports';
import EmployeesList from './pages/employees/EmployeesList';
import EmployeeProfile from './pages/employees/EmployeeProfile';
import AddEmployee from './pages/employees/AddEmployee';
import AddIntern from './pages/employees/AddIntern';
import Departments from './pages/employees/Departments';
import Contracts from './pages/employees/Contracts';
import LeaveDashboard from './pages/leave/LeaveDashboard';
import RequestLeave from './pages/leave/RequestLeave';
import LeavesData from './pages/leave/LeavesData';
import CompanyCalendar from './pages/leave/CompanyCalendar';
import PublicHolidays from './pages/leave/PublicHolidays';
import LeavePolicy from './pages/leave/LeavePolicy';
import LeavePlanner from './pages/leave/LeavePlanner';
import Approvals from './pages/leave/Approvals';
import HowLeaveWorks from './pages/leave/HowLeaveWorks';
import PayrollRuns from './pages/payroll/PayrollRuns';
import PayrollRunDetail from './pages/payroll/PayrollRunDetail';
import ChangesThisMonth from './pages/payroll/ChangesThisMonth';
import Payslips from './pages/payroll/Payslips';
import PayrollHistory from './pages/payroll/PayrollHistory';
import PayrollSettings from './pages/payroll/PayrollSettings';
import CompanySettings from './pages/settings/CompanySettings';
import Organization from './pages/settings/Organization';
import Users from './pages/settings/Users';
import Roles from './pages/settings/Roles';
import AuditLog from './pages/settings/AuditLog';
import EmployeeHome from './pages/self/Home';
import MyProfile from './pages/self/MyProfile';
import MyRequests from './pages/self/MyRequests';
import MyDocuments from './pages/self/MyDocuments';
import MyContract from './pages/self/MyContract';
import MyAnnouncements from './pages/self/MyAnnouncements';
import SelfService from './pages/self/SelfService';
import Directory from './pages/self/Directory';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<HomeRedirect />} />
          <Route path="notifications" element={<Notifications />} />

          {/* ───── Employee view (everyone) ───── */}
          <Route path="home" element={<EmployeeHome />} />
          <Route path="my/self-service" element={<SelfService />} />
          <Route path="my/profile" element={<MyProfile />} />
          <Route path="my/requests" element={<MyRequests />} />
          <Route path="my/documents" element={<MyDocuments />} />
          <Route path="my/contract" element={<MyContract />} />
          <Route path="my/announcements" element={<MyAnnouncements />} />
          <Route path="my/directory" element={<Directory />} />

          {/* ───── Leave module (shared by both views) ───── */}
          <Route path="leave">
            <Route index element={<LeaveDashboard />} />
            <Route path="calendar" element={<CompanyCalendar />} />
            <Route path="holidays" element={<PublicHolidays />} />
            <Route path="policy" element={<LeavePolicy />} />
            <Route path="how-it-works" element={<HowLeaveWorks />} />
            <Route element={<RequirePermission any={[P.leaveRequest]} />}>
              <Route path="request" element={<RequestLeave />} />
              <Route path="planner" element={<LeavePlanner />} />
            </Route>
            <Route element={<RequirePermission any={[P.leaveApprove, P.leaveManage]} />}>
              <Route path="approvals" element={<Approvals />} />
            </Route>
            <Route path="data" element={<LeavesData />} />
          </Route>

          {/* ───── HR view ───── */}
          <Route element={<RequirePermission any={[P.reportView, P.employeeView]} />}>
            <Route path="dashboard" element={<HrDashboard />} />
          </Route>

          <Route element={<RequirePermission any={[P.employeeView]} />}>
            <Route path="employees" element={<EmployeesList />} />
            <Route path="employees/:id" element={<EmployeeProfile />} />
            <Route path="interns" element={<EmployeesList internsOnly />} />
          </Route>
          <Route element={<RequirePermission any={[P.employeeCreate]} />}>
            <Route path="employees/new" element={<AddEmployee />} />
            <Route path="interns/new" element={<AddIntern />} />
          </Route>
          <Route element={<RequirePermission any={[P.departmentView, P.employeeView]} />}>
            <Route path="departments" element={<Departments />} />
          </Route>
          <Route element={<RequirePermission any={[P.contractView]} />}>
            <Route path="contracts" element={<Contracts />} />
          </Route>

          <Route path="payroll" element={<RequirePermission any={[P.payrollView]} />}>
            <Route index element={<PayrollRuns />} />
            <Route path="runs/:id" element={<PayrollRunDetail />} />
            <Route path="changes" element={<ChangesThisMonth />} />
            <Route path="payslips" element={<Payslips />} />
            <Route path="history" element={<PayrollHistory />} />
            <Route path="settings" element={<PayrollSettings />} />
          </Route>

          <Route element={<RequirePermission any={[P.requestView, P.requestProcess]} />}>
            <Route path="requests" element={<HrRequests />} />
          </Route>
          <Route element={<RequirePermission any={[P.announcementManage]} />}>
            <Route path="announcements" element={<Announcements />} />
          </Route>
          <Route element={<RequirePermission any={[P.reportView]} />}>
            <Route path="reports" element={<Reports />} />
          </Route>

          <Route path="settings">
            <Route element={<RequirePermission any={[P.settingsManage]} />}>
              <Route index element={<CompanySettings />} />
              <Route path="organization" element={<Organization />} />
            </Route>
            <Route element={<RequirePermission any={[P.userView]} />}>
              <Route path="users" element={<Users />} />
            </Route>
            <Route element={<RequirePermission any={[P.roleView, P.userView]} />}>
              <Route path="roles" element={<Roles />} />
            </Route>
            <Route element={<RequirePermission any={[P.auditView]} />}>
              <Route path="audit" element={<AuditLog />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
