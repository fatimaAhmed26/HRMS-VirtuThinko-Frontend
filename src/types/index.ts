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

  // onboarding form VTHR-ONB-F01
  fullNamePassport: string | null;
  fullNameId: string | null;
  fullNameArabic: string | null;
  placeOfBirth: string | null;
  otherNationality: string | null;
  maritalStatus: MaritalStatus | null;
  childrenCount: number | null;
  idExpiry: string | null;
  passportNumber: string | null;
  passportPlaceOfIssue: string | null;
  passportIssueDate: string | null;
  passportExpiry: string | null;
  permitNumber: string | null;
  permitExpiry: string | null;
  socialInsuranceNumber: string | null;
  drivingLicenceNumber: string | null;
  addressFlat: string | null;
  addressBuilding: string | null;
  addressRoad: string | null;
  addressBlock: string | null;
  addressCity: string | null;
  addressCountry: string | null;
  homeCountryAddress: string | null;
  altPhone: string | null;
  personalEmail: string | null;
  emergencyRelationship: string | null;
  emergencyAltPhone: string | null;
  emergencyAddress: string | null;
  emergency2Name: string | null;
  emergency2Relationship: string | null;
  emergency2Phone: string | null;
  emergency2AltPhone: string | null;
  emergency2Address: string | null;
  languages: string | null;
  mayContactEmployers: boolean | null;
  hasRestrictiveClauses: boolean | null;
  // medical: null unless you can edit employees (or it is your own record)
  hasMedicalCondition: boolean | null;
  medicalDetails: string | null;
  bloodGroup: string | null;
  regularMedication: string | null;
  bankBranch: string | null;
  bankAccountHolder: string | null;
  documentChecklist: Record<string, { na?: boolean; received?: boolean }> | null;
  declarationAccepted: boolean;
  declarationName: string | null;
  declarationDate: string | null;
  declarationPlace: string | null;
  verifiedByUserId: number | null;
  verifiedAt: string | null;
  hrRemarks: string | null;
  dependants: Dependant[];
  qualifications: Qualification[];
  previousEmployments: PreviousEmployment[];
}

export type MaritalStatus = 'Single' | 'Married' | 'Divorced' | 'Widowed';

export interface Dependant {
  fullName: string;
  relationship: 'Spouse' | 'Son' | 'Daughter' | 'Parent' | 'Other';
  birthDate: string | null;
  nationality: string | null;
  idNumber: string | null;
}

export interface Qualification {
  kind: 'education' | 'certification';
  title: string;
  institution: string | null;
  country: string | null;
  year: number | null;
  grade: string | null;
  obtainedDate: string | null;
  expiryDate: string | null;
}

export interface PreviousEmployment {
  employerName: string;
  jobTitle: string | null;
  fromDate: string | null;
  toDate: string | null;
  reasonForLeaving: string | null;
  refName: string | null;
  refJobTitle: string | null;
  refPhone: string | null;
  refEmail: string | null;
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

// Team calendar entry (approved leave or a planner reservation)
export interface CalendarEntry {
  id: number;
  employeeId: number;
  name: string;
  department: string | null;
  startDate: string;
  endDate: string;
  type: string; // leave type code, or PRIVATE when colleagues only see "On leave"
  typeName: string;
  days?: number;
  mine?: boolean;
}

export interface LeaveReservation {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  note: string | null;
  remindedAt: string | null;
  leaveType: { id: number; code: string; name: string };
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
  displayStatus?: string; // active | expiring_soon | renewed | expired | terminated
  state?: 'Active' | 'Inactive' | 'Ended';
  daysLeft?: number | null;
  notes: string | null;
  document?: { id: number; originalName: string } | null; // signed copy
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
  remindDaysBefore: number | null;
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
  resultDocument?: { id: number; originalName: string; visibleToEmployee: boolean } | null;
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
  attachmentMime: string | null;
  hasAttachment: boolean;
}

// Colleague directory - work contact details only
export interface DirectoryEntry {
  id: number;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  email: string;
  photoUrl: string | null;
  department: { name: string } | null;
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
