export const INTERN_TYPES = [
  { value: 'student', label: 'University student' },
  { value: 'graduate', label: 'Graduate' },
  { value: 'training', label: 'Other training programme' },
] as const;

export const INTERN_DOCS = [
  { key: 'cv', short: 'CV', label: 'CV', hint: 'PDF', category: 'personal', accept: '.pdf', onlyFor: null },
  { key: 'nationalId', short: 'CPR', label: 'Copy of CPR', hint: 'Front and back · PDF, JPEG or PNG', category: 'id_copy', accept: '.pdf,.jpg,.jpeg,.png', onlyFor: null },
  { key: 'photo', short: 'Photo', label: 'Photo', hint: 'Passport-size · JPEG or PNG', category: 'personal', accept: '.jpg,.jpeg,.png', onlyFor: null },
  { key: 'clp', short: 'CLP', label: 'CLP document', hint: 'Bahrain Polytechnic CLP only · PDF', category: 'other', accept: '.pdf', onlyFor: 'clp' },
  { key: 'agreement', short: 'Agreement', label: 'Internship agreement', hint: 'Signed copy · PDF', category: 'contract', accept: '.pdf', onlyFor: null },
] as const;
export type InternDocKey = (typeof INTERN_DOCS)[number]['key'];

// the CLP document is asked only when the intern is ticked as part of the CLP (Cooperative Learning Project)
export const docApplies = (d: { onlyFor: 'clp' | null }, intern: { isClp?: boolean }) => d.onlyFor === null || !!intern.isClp;

export const MAJORS = ['Database', 'MIS', 'Cyber Security', 'Networking', 'Programming'];

export const MAX_FILE = 5 * 1024 * 1024;
