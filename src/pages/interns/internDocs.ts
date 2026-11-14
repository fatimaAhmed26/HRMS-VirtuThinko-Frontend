export const INTERN_DOCS = [
  { key: 'cv', short: 'CV', label: 'CV', hint: 'PDF', category: 'personal', accept: '.pdf' },
  { key: 'nationalId', short: 'CPR', label: 'Copy of CPR', hint: 'Front and back · PDF, JPEG or PNG', category: 'id_copy', accept: '.pdf,.jpg,.jpeg,.png' },
  { key: 'photo', short: 'Photo', label: 'Photo', hint: 'Passport-size · JPEG or PNG', category: 'personal', accept: '.jpg,.jpeg,.png' },
  { key: 'slp', short: 'SLP', label: 'SLP document', hint: 'From the university · PDF', category: 'other', accept: '.pdf' },
  { key: 'agreement', short: 'Agreement', label: 'Internship agreement', hint: 'Signed copy · PDF', category: 'contract', accept: '.pdf' },
] as const;
export type InternDocKey = (typeof INTERN_DOCS)[number]['key'];

export const MAJORS = ['Database', 'MIS', 'Cyber Security', 'Networking', 'Programming'];

export const MAX_FILE = 5 * 1024 * 1024;
