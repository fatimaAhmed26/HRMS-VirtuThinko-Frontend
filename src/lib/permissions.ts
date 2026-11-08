// Same names as the backend seed (prisma/seed.ts): "module:action"
export const P = {
  employeeView: 'employee:view',
  employeeCreate: 'employee:create',
  employeeEdit: 'employee:edit',
  employeeDeactivate: 'employee:deactivate',
  employeeExport: 'employee:export',
  departmentView: 'department:view',
  departmentManage: 'department:manage',
  leaveView: 'leave:view',
  leaveRequest: 'leave:request',
  leaveApprove: 'leave:approve',
  leaveManage: 'leave:manage',
  payrollView: 'payroll:view',
  payrollCreate: 'payroll:create',
  payrollEdit: 'payroll:edit',
  payrollApprove: 'payroll:approve',
  payrollProcess: 'payroll:process',
  contractView: 'contract:view',
  contractManage: 'contract:manage',
  documentView: 'document:view',
  documentUpload: 'document:upload',
  documentDelete: 'document:delete',
  requestView: 'request:view',
  requestCreate: 'request:create',
  requestProcess: 'request:process',
  announcementView: 'announcement:view',
  announcementManage: 'announcement:manage',
  reportView: 'report:view',
  reportExport: 'report:export',
  userView: 'user:view',
  userManage: 'user:manage',
  roleView: 'role:view',
  roleManage: 'role:manage',
  auditView: 'audit:view',
  settingsManage: 'settings:manage',
} as const;

export type Permission = (typeof P)[keyof typeof P];

// Users with any of these get the HR view. Managers and employees get the employee view.
export const HR_PERMISSIONS: Permission[] = [
  P.employeeCreate, P.leaveManage, P.payrollView, P.contractView, P.userView, P.settingsManage,
];
