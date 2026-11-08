// Shapes of the data the backend returns. Dates arrive as ISO strings, and
// money (Prisma Decimal) arrives as a string such as "966.667".

export type Entity = 'BH' | 'SA';
export type Money = string;

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ───── auth / users ─────
export interface AuthUser {
  id: number;
  username: string;
  email: string;
  employeeId: number | null;
  roles: string[];
  permissions: string[];
}

export interface UserAccount {
  id: number;
  username: string;
  email: string;
  status: 'active' | 'inactive';
  entityScope: 'ALL' | Entity;
  lastLoginAt: string | null;
  employee?: { id: number; firstName: string; lastName: string; employeeCode: string } | null;
  roles: { id: number; name: string }[];
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
  permissions?: string[];
}

// ───── organisation ─────
export interface Department {
  id: number;
  name: string;
  managerId: number | null;
}

export interface ClientCompany {
  id: number;
  name: string;
  nameAr: string | null;
  annualLeaveDays: number;
  active: boolean;
  activeStaff?: number;
}

export const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Fixed-term', 'Contractor', 'Intern', 'Outsourced', 'Other'] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

// ───── employees ─────
export interface EmployeeListItem {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  jobTitle: string | null;
  status: 'active' | 'inactive';
  hireDate: string | null;
  photoUrl: string | null;
  employmentType: EmploymentType | null;
  country: Entity;
  department: { id: number; name: string } | null;
  clientCompany: { id: number; name: string } | null;
  manager: { id: number; firstName: string; lastName: string } | null;
}

export interface Employee extends EmployeeListItem {
  address: string | null;
  gender: 'Male' | 'Female' | null;
  birthDate: string | null;
  nationality: string | null;
  cprNumber: string | null;
  departmentId: number | null;
  managerId: number | null;
  workLocation: string | null;
  probationEnd: string | null;
  isNational: boolean;
  siNewScheme: boolean;
  clientCompanyId: number | null;
  clientSupervisor: string | null;
  poNumber: string | null;
  deploymentStart: string | null;
  deploymentEnd: string | null;
  bankName: string | null;
  bankAccountNumber: string | null; // masked unless you can edit employees / see payroll
  emergencyName: string | null;
  emergencyPhone: string | null;
  user: { id: number; username: string; status: string } | null;
}

// ───── leave ─────
export interface PayTier {
  days: number;
  payPercent: number;
}

export interface LeaveType {
  id: number;
  country: Entity;
  code: string;
  name: string;
  description: string | null;
  allowance: 'yearly' | 'per_event';
  days: number;
  daysAfterYears: number | null;
  daysAfter: number | null;
  accrueFirstYear: boolean;
  payTiers: PayTier[] | null;
  minServiceMonths: number;
  gender: 'Male' | 'Female' | null;
  oncePerEmployment: boolean;
  requiresAttachment: boolean;
  countWorkingDays: boolean;
  noticeFreeDays: number;
  noticeDays: number | null;
  active: boolean;
}

export interface LeaveBalance {
  leaveTypeId: number;
  code: string;
  name: string;
  allowance: 'yearly' | 'per_event';
  entitlement?: number;
  used?: number;
  pending?: number;
  remaining?: number;
  daysPerEvent?: number;
  payTiers: PayTier[] | null;
}

export type LeaveStatus = 'pending_manager' | 'pending_hr' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveRequest {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  status: LeaveStatus;
  payBreakdown: { payPercent: number; days: number }[] | null;
  createdAt: string;
  employee: {
    id: number; employeeCode: string; firstName: string; lastName: string; managerId: number | null; country: Entity;
    department: { id: number; name: string } | null;
  };
  leaveType: { id: number; code: string; name: string; country: Entity };
  attachment: { id: number; originalName: string; mimeType: string; size: number } | null;
  approvals: { id: number; stage: 'manager' | 'hr'; decision: 'approved' | 'rejected'; comment: string | null; approverName: string; createdAt: string }[];
}

export interface PublicHoliday {
  id: number;
  country: Entity;
  date: string;
  name: string;
}

// ───── contracts ─────
export interface Contract {
  id: number;
  employeeId: number;
  contractNumber: string | null;
  contractType: string;
  jobTitle: string | null;
  weeklyHours: number | null;
  startDate: string;
  endDate: string | null;
  basicSalary?: Money; // hidden on "My contract"
  housingAllowance?: Money;
  transportAllowance?: Money;
  currency?: string;
  status: string;
  state?: 'Active' | 'Inactive' | 'Ended';
  notes: string | null;
  employee?: { id: number; employeeCode: string; firstName: string; lastName: string; country: Entity };
}

// ───── documents ─────
export interface HrDocument {
  id: number;
  employeeId: number;
  category: string;
  title: string;
  originalName: string;
  mimeType: string;
  size: number;
  expiryDate: string | null;
  visibleToEmployee: boolean;
  notes: string | null;
  createdAt: string;
}

// ───── payroll ─────
export type PayrollStatus = 'draft' | 'under_review' | 'approved' | 'processed' | 'paid';

export interface PayLine {
  code: string;
  name: string;
  amount: number;
  source?: string;
  note?: string;
}

export interface Payslip {
  id: number;
  runId: number;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  department: string | null;
  jobTitle: string | null;
  country: Entity;
  currency: string;
  basicSalary: Money;
  earnings: PayLine[];
  deductions: PayLine[];
  employerContributions: PayLine[];
  grossSalary: Money;
  totalDeductions: Money;
  netSalary: Money;
}

export interface PayrollRun {
  id: number;
  period: string; // "2026-11"
  entity: Entity;
  status: PayrollStatus;
  warnings: { employeeCode?: string; name?: string; reason: string }[] | null;
  approvedAt: string | null;
  processedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  payslips?: Payslip[];
}

export interface PayItemType {
  id: number;
  code: string;
  name: string;
  kind: 'earning' | 'deduction';
  contributory: boolean;
  active: boolean;
}

export interface PayItem {
  id: number;
  employeeId: number;
  typeId: number;
  amount: Money;
  recurring: boolean;
  fromPeriod: string;
  toPeriod: string | null;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  type?: PayItemType;
  employee?: { id: number; employeeCode: string; firstName: string; lastName: string };
}

// ───── requests & letters ─────
export interface RequestType {
  id: number;
  code: string;
  name: string;
  description: string | null;
  category: 'letter' | 'general';
  requiresAttachment: boolean;
  active: boolean;
}

export type RequestStatus = 'pending' | 'in_progress' | 'approved' | 'rejected' | 'completed' | 'cancelled';

export interface EmployeeRequest {
  id: number;
  reference?: string; // REQ-00005
  employeeId: number;
  typeId: number;
  purpose: string;
  details: string | null;
  addressedTo: string | null;
  status: RequestStatus;
  decisionComment: string | null;
  resultDocumentId: number | null;
  completedAt: string | null;
  createdAt: string;
  type?: { id: number; code: string; name: string; category: string };
  employee?: { id: number; employeeCode: string; firstName: string; lastName: string };
}

// ───── announcements & notifications ─────
export interface Announcement {
  id: number;
  title: string;
  body: string;
  priority: 'normal' | 'important' | 'urgent';
  pinned: boolean;
  audience: 'all' | 'departments' | 'employees';
  publishAt: string;
  expiresAt: string | null;
  attachmentName: string | null;
}

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

// ───── dashboards ─────
export interface AdminDashboard {
  entities: Entity[];
  employees: { total: number; active: number; inactive: number; onLeaveToday: number; newHiresThisMonth: number };
  pending: { leaveWithManager: number; leaveWithHr: number; hrRequests: number; payItemsToApprove: number };
  expiring: { withinDays: number; contracts: number; documents: number };
  payroll: {
    currentPeriod: string;
    latestRuns: { id: number; entity: Entity; period: string; status: PayrollStatus; totals: { currency: string; employees: number; net: Money | null }[] }[];
  };
  headcountByDepartment: { departmentId: number | null; department: string; employees: number }[];
  recentAnnouncements: Announcement[];
}

export interface EmployeeHome {
  employee: { firstName: string; lastName: string; employeeCode: string; jobTitle: string | null; photoUrl: string | null } | null;
  cards?: {
    remainingLeave: number | null;
    pendingRequests: number;
    contract: { id: number; contractNumber: string | null; contractType: string; endDate: string | null; daysLeft: number | null } | null;
  };
  leaveBalances?: LeaveBalance[];
  unreadNotifications: number;
  announcements: Announcement[];
}

// ───── audit / settings ─────
export interface AuditEntry {
  id: number;
  action: string;
  entity: string;
  entityId: string;
  changes: unknown;
  ip: string | null;
  createdAt: string;
  actor?: { id: number; username: string } | null;
}

export type CompanySettings = Record<string, string>;
