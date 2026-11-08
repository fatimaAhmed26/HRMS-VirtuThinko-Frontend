// The self-service hub (design p.66). Request tiles open "Requests & certificates" with that type selected.
export interface Service {
  title: string;
  hint: string;
  to: string;
}

export const SERVICE_GROUPS: { label: string; items: Service[] }[] = [
  {
    label: 'Leave',
    items: [
      { title: 'Request leave', hint: 'Annual, sick, emergency, special', to: '/leave/request' },
      { title: 'My leave balance & history', hint: 'Balances and past requests', to: '/leave' },
      { title: 'Plan my leave', hint: 'Reserve dates in the leave planner', to: '/leave/planner' },
    ],
  },
  {
    label: 'Letters & certificates',
    items: [
      { title: 'Salary certificate', hint: 'For a bank, embassy or loan', to: '/my/requests?type=SALARY_CERT' },
      { title: 'Employment certificate', hint: 'To whom it may concern', to: '/my/requests?type=EMPLOYMENT_CERT' },
      { title: 'Experience certificate', hint: 'Role and service period', to: '/my/requests?type=EXPERIENCE_CERT' },
      { title: 'No objection letter (NOC)', hint: 'Travel, visa or other', to: '/my/requests?type=NOC' },
    ],
  },
  {
    label: 'Documents',
    items: [
      { title: 'Add a document', hint: 'Renewed CPR, passport, certificates', to: '/my/documents?upload=1' },
      { title: 'My documents', hint: 'Everything HR holds for you', to: '/my/documents' },
      { title: 'My contract', hint: 'View and download', to: '/my/contract' },
    ],
  },
  {
    label: 'My details',
    items: [
      { title: 'Update my profile', hint: 'Mobile, address, emergency contact', to: '/my/profile' },
      { title: 'Change personal details', hint: 'Name, marital status, ID - HR approves', to: '/my/requests?type=DETAILS_CHANGE' },
      { title: 'Change bank account', hint: 'New IBAN - HR approves', to: '/my/requests?type=BANK_CHANGE' },
      { title: 'Claim reimbursement', hint: 'Taxi, travel, purchases', to: '/my/requests?type=REIMBURSEMENT' },
    ],
  },
];

// Shortcuts on the home page
export const HOME_SHORTCUTS: Service[] = [
  { title: 'Request leave', hint: 'Annual, sick, emergency...', to: '/leave/request' },
  { title: 'Request a certificate', hint: 'Salary, employment, experience', to: '/my/requests?type=SALARY_CERT' },
  { title: 'Add a document', hint: 'Renewed CPR, passport...', to: '/my/documents?upload=1' },
  { title: 'Update my profile', hint: 'Contact, address, emergency', to: '/my/profile' },
];
