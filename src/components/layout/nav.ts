import {
  BarChart3, Briefcase, CalendarDays, Contact, FileSignature, FileText, FolderOpen, Grid2x2, Home, LayoutDashboard, Megaphone, Settings, User, Users, Wallet,
  type LucideIcon,
} from 'lucide-react';
import { P, type Permission } from '../../lib/permissions';

export interface NavLink {
  label: string;
  to: string;
  perms?: Permission[]; // shown if the user has ANY of these; no perms = everyone
}

export interface NavSection {
  group?: string; // small heading shown above this item (e.g. "MY WORK")
  label: string;
  icon: LucideIcon;
  to?: string; // single link with no sub-pages
  perms?: Permission[];
  links?: NavLink[];
}

// HR view - follows the site map in VirtuThinko-HR-Portal-Design.pdf (8 main items, sub-pages open
// only for the section you're in). Add employee / Add intern are opened from the dashboard, not the menu.
export const HR_NAV: NavSection[] = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  {
    label: 'Employee management', icon: Users, perms: [P.employeeView],
    links: [
      { label: 'All employees', to: '/employees' },
      { label: 'Interns', to: '/interns' },
      { label: 'Contracts', to: '/contracts', perms: [P.contractView] },
      { label: 'Departments', to: '/departments', perms: [P.departmentView] },
    ],
  },
  {
    label: 'Leave', icon: CalendarDays,
    links: [
      { label: 'Dashboard', to: '/leave' },
      { label: 'Request leave', to: '/leave/request', perms: [P.leaveRequest] },
      { label: 'Leaves data', to: '/leave/data', perms: [P.leaveManage] },
      { label: 'Company calendar', to: '/leave/calendar' },
      { label: 'Public holidays', to: '/leave/holidays' },
      { label: 'Leave policy', to: '/leave/policy' },
      { label: 'Leave planner', to: '/leave/planner' },
      { label: 'Approvals', to: '/leave/approvals', perms: [P.leaveApprove, P.leaveManage] },
      { label: 'How leave works', to: '/leave/how-it-works' },
    ],
  },
  {
    label: 'Payroll', icon: Wallet, perms: [P.payrollView],
    links: [
      { label: 'Payroll run', to: '/payroll' },
      { label: 'Changes this month', to: '/payroll/changes' },
      { label: 'Payslips', to: '/payroll/payslips' },
      { label: 'History', to: '/payroll/history' },
      { label: 'Settings', to: '/payroll/settings', perms: [P.payrollEdit] },
    ],
  },
  { label: 'HR requests', icon: FileText, to: '/requests', perms: [P.requestView, P.requestProcess] },
  { label: 'Announcements', icon: Megaphone, to: '/announcements', perms: [P.announcementManage] },
  { label: 'Reports', icon: BarChart3, to: '/reports', perms: [P.reportView] },
  {
    label: 'Settings', icon: Settings, perms: [P.settingsManage, P.userView, P.roleView, P.auditView],
    links: [
      { label: 'Company', to: '/settings', perms: [P.settingsManage] },
      { label: 'Organization & clients', to: '/settings/organization', perms: [P.settingsManage] },
      { label: 'Users', to: '/settings/users', perms: [P.userView] },
      { label: 'Roles & permissions', to: '/settings/roles', perms: [P.roleView] },
      { label: 'Audit log', to: '/settings/audit', perms: [P.auditView] },
    ],
  },
];

// Employee view (self-service) - same order as the design (Employee · Home, p.65).
// No payroll here: employees do not see payslips or salary.
export const EMPLOYEE_NAV: NavSection[] = [
  { group: 'My work', label: 'Home', icon: Home, to: '/home' },
  { label: 'Self-service', icon: Grid2x2, to: '/my/self-service' },
  { label: 'My profile', icon: User, to: '/my/profile' },
  { label: 'Requests & certificates', icon: FileText, to: '/my/requests' },
  { label: 'My documents', icon: FolderOpen, to: '/my/documents' },
  { label: 'My contract', icon: FileSignature, to: '/my/contract' },
  {
    label: 'Leave', icon: CalendarDays,
    links: [
      { label: 'Dashboard', to: '/leave' },
      { label: 'Request leave', to: '/leave/request', perms: [P.leaveRequest] },
      { label: 'Company calendar', to: '/leave/calendar' },
      { label: 'Public holidays', to: '/leave/holidays' },
      { label: 'Leave policy', to: '/leave/policy' },
      { label: 'Team approvals', to: '/leave/approvals', perms: [P.leaveApprove] },
      { label: 'How leave works', to: '/leave/how-it-works' },
    ],
  },
  { group: 'Company', label: 'Directory', icon: Contact, to: '/my/directory' },
  { label: 'Announcements', icon: Megaphone, to: '/my/announcements' },
  { label: 'My team', icon: Briefcase, to: '/employees', perms: [P.employeeView] }, // managers
];
