// State, validation and payload for the onboarding form VTHR-ONB-F01
import type { Dependant, Entity, MaritalStatus } from '../../../types';

export type Team = 'BH' | 'SA' | 'OUT'; // VirtuThinko W.L.L. / VirtuThinko Company / Outsourced to client
export type YesNo = 'yes' | 'no' | '';

export interface DependantRow { fullName: string; relationship: Dependant['relationship']; birthDate: string; nationality: string; idNumber: string }
export interface EducationRow { title: string; institution: string; country: string; year: string; grade: string }
export interface CertificationRow { title: string; institution: string; obtainedDate: string; expiryDate: string }
export interface EmployerRow {
  employerName: string; jobTitle: string; fromDate: string; toDate: string; reasonForLeaving: string;
  refName: string; refJobTitle: string; refPhone: string; refEmail: string;
}
export interface ChecklistRow { na: boolean; received: boolean }

export const emptyDependant = (): DependantRow => ({ fullName: '', relationship: 'Spouse', birthDate: '', nationality: '', idNumber: '' });
export const emptyEducation = (): EducationRow => ({ title: '', institution: '', country: '', year: '', grade: '' });
export const emptyCertification = (): CertificationRow => ({ title: '', institution: '', obtainedDate: '', expiryDate: '' });
export const emptyEmployer = (): EmployerRow => ({
  employerName: '', jobTitle: '', fromDate: '', toDate: '', reasonForLeaving: '', refName: '', refJobTitle: '', refPhone: '', refEmail: '',
});

// Section 11; each upload is saved as an employee document in this category
export const CHECKLIST = [
  { key: 'passport', label: 'Passport (photo page and residence / visa pages)', category: 'id_copy' },
  { key: 'nationalId', label: 'CPR / National ID / Iqama (front and back)', category: 'id_copy' },
  { key: 'permit', label: 'Residence or work permit (LMRA / Iqama), if applicable', category: 'id_copy' },
  { key: 'photo', label: 'Recent passport-size photograph', category: 'personal' },
  { key: 'education', label: 'Educational certificates (attested where required)', category: 'certificate' },
  { key: 'professional', label: 'Professional certifications / licences', category: 'certificate' },
  { key: 'experience', label: 'Experience / relieving letters from previous employers', category: 'other' },
  { key: 'police', label: 'Police clearance / Good Conduct certificate (if required)', category: 'other' },
  { key: 'iban', label: 'Bank IBAN letter or statement', category: 'other' },
  { key: 'dependants', label: "Dependants' passport / ID copies (if applicable)", category: 'id_copy' },
  { key: 'cv', label: 'Updated CV', category: 'other' },
] as const;
export type ChecklistKey = (typeof CHECKLIST)[number]['key'];

export const YES_NO = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] as const;
export const grid4 = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-4'; // 4 fields per row on wide screens

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const NATIONALITIES = [
  'Bahraini', 'Saudi', 'Emirati', 'Kuwaiti', 'Omani', 'Qatari', 'Egyptian', 'Jordanian', 'Lebanese', 'Syrian', 'Sudanese',
  'Moroccan', 'Tunisian', 'Indian', 'Pakistani', 'Bangladeshi', 'Sri Lankan', 'Nepali', 'Filipino', 'British', 'American', 'Other',
];

export const initialForm = () => ({
  team: '' as Team | '',
  // outsourced box
  clientCompanyId: '', employedBy: 'BH' as Entity, clientSite: '', poNumber: '', deploymentStart: '', deploymentEnd: '', clientSupervisor: '',
  // 1 employment
  jobTitle: '', departmentId: '', hireDate: '', managerId: '', employmentType: 'Full-time', workLocation: '',
  email: '', probationEnd: '', contractEnd: '', siNewScheme: false,
  // 2 personal
  fullNamePassport: '', fullNameId: '', firstName: '', lastName: '', fullNameArabic: '', birthDate: '', placeOfBirth: '',
  nationality: '', otherNationality: '', gender: '' as 'Male' | 'Female' | '', maritalStatus: 'Single' as MaritalStatus, childrenCount: '0',
  // 3 ID and residence
  cprNumber: '', idExpiry: '', passportNumber: '', passportPlaceOfIssue: '', passportIssueDate: '', passportExpiry: '',
  permitNumber: '', permitExpiry: '', socialInsuranceNumber: '', drivingLicenceNumber: '',
  // 4 contact
  addressFlat: '', addressBuilding: '', addressRoad: '', addressBlock: '', addressCity: '', addressCountry: 'Bahrain',
  homeCountryAddress: '', phone: '', altPhone: '', personalEmail: '',
  // 5 emergency
  emergencyName: '', emergencyRelationship: '', emergencyPhone: '', emergencyAltPhone: '', emergencyAddress: '',
  emergency2Name: '', emergency2Relationship: '', emergency2Phone: '', emergency2AltPhone: '', emergency2Address: '',
  // 6-8 repeating
  dependants: [] as DependantRow[],
  education: [emptyEducation()],
  certifications: [] as CertificationRow[],
  languages: '',
  employers: [emptyEmployer()],
  mayContactEmployers: '' as YesNo,
  hasRestrictiveClauses: 'no' as YesNo,
  // 9 medical
  hasMedicalCondition: 'no' as YesNo, medicalDetails: '', bloodGroup: '', regularMedication: '',
  // 10 salary
  bankName: '', bankBranch: '', bankAccountHolder: '', bankAccountNumber: '', monthlySalary: '',
  // 11 checklist (files are kept separately, they can't go in a draft)
  checklist: {} as Partial<Record<ChecklistKey, ChecklistRow>>,
  // 12 declaration
  declarationAccepted: false, declarationName: '', declarationDate: '', declarationPlace: '',
  // HR only
  verifiedAt: '', hrRemarks: '',
});

export type OnboardingForm = ReturnType<typeof initialForm>;
export type Errors = Partial<Record<string, string>>;

export const countryOf = (f: OnboardingForm): Entity => (f.team === 'OUT' ? f.employedBy : f.team === 'SA' ? 'SA' : 'BH');
export const currencyOf = (f: OnboardingForm) => (countryOf(f) === 'SA' ? 'SAR' : 'BHD');

// Which section each field belongs to, so the chips can show where the errors are
export const SECTION_OF: Record<string, string> = {
  team: 'entity', clientCompanyId: 'entity', employedBy: 'entity', deploymentStart: 'entity', deploymentEnd: 'entity',
  jobTitle: 'employment', departmentId: 'employment', hireDate: 'employment', managerId: 'employment', employmentType: 'employment', email: 'employment', contractEnd: 'employment', probationEnd: 'employment',
  fullNamePassport: 'personal', fullNameId: 'personal', firstName: 'personal', lastName: 'personal', birthDate: 'personal', placeOfBirth: 'personal', nationality: 'personal', gender: 'personal', childrenCount: 'personal',
  cprNumber: 'id', idExpiry: 'id', passportNumber: 'id', passportPlaceOfIssue: 'id', passportIssueDate: 'id', passportExpiry: 'id',
  addressBuilding: 'contact', addressRoad: 'contact', addressBlock: 'contact', addressCity: 'contact', addressCountry: 'contact', phone: 'contact', personalEmail: 'contact',
  emergencyName: 'emergency', emergencyRelationship: 'emergency', emergencyPhone: 'emergency',
  dependants: 'dependants', qualifications: 'qualifications', employers: 'previous', mayContactEmployers: 'previous',
  medicalDetails: 'medical',
  bankName: 'salary', bankBranch: 'salary', bankAccountHolder: 'salary', bankAccountNumber: 'salary', monthlySalary: 'salary',
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const after = (a: string, b: string) => !a || !b || a > b; // YYYY-MM-DD compares as text

export function validate(f: OnboardingForm, opts: { needSalary: boolean }): Errors {
  const e: Errors = {};
  const need = (key: keyof OnboardingForm, label: string) => {
    const v = f[key];
    if (typeof v === 'string' && !v.trim()) e[key] = `${label} is required`;
  };

  if (!f.team) e.team = 'Choose the employing entity';
  if (f.team === 'OUT') {
    need('clientCompanyId', 'Client company');
    need('deploymentStart', 'Deployment start');
    if (!after(f.deploymentEnd, f.deploymentStart)) e.deploymentEnd = 'Must be after the deployment start';
  }

  need('jobTitle', 'Position'); need('departmentId', 'Department'); need('hireDate', 'Date of joining');
  need('managerId', 'Line manager'); need('email', 'Work email');
  if (f.email && !EMAIL.test(f.email)) e.email = 'Invalid email';
  if (f.employmentType === 'Fixed-term') {
    need('contractEnd', 'Contract end date');
    if (!after(f.contractEnd, f.hireDate)) e.contractEnd = 'Must be after the date of joining';
  }
  if (!after(f.probationEnd, f.hireDate)) e.probationEnd = 'Must be after the date of joining';

  need('fullNamePassport', 'Full name (passport)'); need('fullNameId', 'Full name (ID)');
  need('firstName', 'First name'); need('lastName', 'Last name');
  need('birthDate', 'Date of birth'); need('placeOfBirth', 'Place of birth'); need('nationality', 'Nationality');
  if (!f.gender) e.gender = 'Required';

  need('cprNumber', 'ID number'); need('idExpiry', 'ID expiry'); need('passportNumber', 'Passport number');
  need('passportPlaceOfIssue', 'Place of issue'); need('passportIssueDate', 'Issue date'); need('passportExpiry', 'Expiry date');
  const idDigits = countryOf(f) === 'SA' ? 10 : 9;
  if (f.cprNumber && !new RegExp(`^\\d{${idDigits}}$`).test(f.cprNumber)) e.cprNumber = `Must be ${idDigits} digits`;
  if (!after(f.passportExpiry, f.passportIssueDate)) e.passportExpiry = 'Must be after the issue date';

  need('addressBuilding', 'Building'); need('addressRoad', 'Road'); need('addressBlock', 'Block');
  need('addressCity', 'City'); need('addressCountry', 'Country'); need('phone', 'Mobile number'); need('personalEmail', 'Personal email');
  if (f.personalEmail && !EMAIL.test(f.personalEmail)) e.personalEmail = 'Invalid email';
  if (f.personalEmail && f.personalEmail.trim().toLowerCase() === f.email.trim().toLowerCase()) e.personalEmail = 'Use a personal email, not the work email';

  need('emergencyName', 'Name'); need('emergencyRelationship', 'Relationship'); need('emergencyPhone', 'Phone');

  if (f.dependants.some((d) => !d.fullName.trim())) e.dependants = 'Every dependant needs a name (or remove the empty row)';
  if (f.education.some((q) => !q.title.trim() && (q.institution || q.year))) e.qualifications = 'Give each qualification a title';
  if (f.education.some((q) => q.year && !/^\d{4}$/.test(q.year))) e.qualifications = 'Year must be 4 digits';
  if (f.certifications.some((c) => !c.title.trim() && (c.institution || c.obtainedDate))) e.qualifications = 'Give each certification a title';
  if (f.employers.some((p) => !p.employerName.trim() && (p.jobTitle || p.fromDate || p.refName))) e.employers = 'Add the employer name';
  if (f.employers.some((p) => !after(p.toDate, p.fromDate))) e.employers = '"Employed to" must be after "Employed from"';
  if (f.employers.some((p) => p.refEmail && !EMAIL.test(p.refEmail))) e.employers = 'Invalid reference email';
  if (!f.mayContactEmployers) e.mayContactEmployers = 'Required';

  if (f.hasMedicalCondition === 'yes') need('medicalDetails', 'Details');

  need('bankName', 'Bank name'); need('bankBranch', 'Branch / country'); need('bankAccountHolder', 'Account holder');
  need('bankAccountNumber', 'IBAN');
  const iban = f.bankAccountNumber.replace(/\s/g, '').toUpperCase();
  if (iban && !/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) e.bankAccountNumber = 'Not a valid IBAN';
  if (opts.needSalary) {
    need('monthlySalary', 'Monthly salary');
    const salary = Number(f.monthlySalary);
    if (f.monthlySalary && (!(salary > 0) || !/^\d+(\.\d{1,3})?$/.test(f.monthlySalary))) e.monthlySalary = 'Enter an amount with up to 3 decimals';
  }
  return e;
}

const opt = (v: string) => (v.trim() ? v.trim() : null);
const yn = (v: YesNo) => (v === 'yes' ? true : v === 'no' ? false : null);

// Body for POST /api/employees
export function toPayload(f: OnboardingForm) {
  const country = countryOf(f);
  const outsourced = f.team === 'OUT';
  // Bahraini in BH / Saudi in SA pay pension contributions
  const isNational = (country === 'BH' && f.nationality === 'Bahraini') || (country === 'SA' && f.nationality === 'Saudi');
  return {
    country,
    isNational,
    siNewScheme: country === 'SA' && isNational ? f.siNewScheme : false,
    employmentType: outsourced ? 'Outsourced' : f.employmentType,
    clientCompanyId: outsourced ? Number(f.clientCompanyId) : null,
    clientSupervisor: outsourced ? opt(f.clientSupervisor) : null,
    poNumber: outsourced ? opt(f.poNumber) : null,
    deploymentStart: outsourced ? opt(f.deploymentStart) : null,
    deploymentEnd: outsourced ? opt(f.deploymentEnd) : null,
    workLocation: opt(outsourced && f.clientSite ? f.clientSite : f.workLocation),

    jobTitle: f.jobTitle.trim(),
    departmentId: Number(f.departmentId),
    managerId: Number(f.managerId),
    hireDate: f.hireDate,
    probationEnd: opt(f.probationEnd),
    email: f.email.trim(),

    firstName: f.firstName.trim(),
    lastName: f.lastName.trim(),
    fullNamePassport: f.fullNamePassport.trim(),
    fullNameId: f.fullNameId.trim(),
    fullNameArabic: opt(f.fullNameArabic),
    birthDate: f.birthDate,
    placeOfBirth: f.placeOfBirth.trim(),
    nationality: f.nationality,
    otherNationality: opt(f.otherNationality),
    gender: f.gender || null,
    maritalStatus: f.maritalStatus,
    childrenCount: Number(f.childrenCount) || 0,

    cprNumber: f.cprNumber.trim(),
    idExpiry: f.idExpiry,
    passportNumber: f.passportNumber.trim(),
    passportPlaceOfIssue: f.passportPlaceOfIssue.trim(),
    passportIssueDate: f.passportIssueDate,
    passportExpiry: f.passportExpiry,
    permitNumber: opt(f.permitNumber),
    permitExpiry: opt(f.permitExpiry),
    socialInsuranceNumber: opt(f.socialInsuranceNumber),
    drivingLicenceNumber: opt(f.drivingLicenceNumber),

    addressFlat: opt(f.addressFlat),
    addressBuilding: f.addressBuilding.trim(),
    addressRoad: f.addressRoad.trim(),
    addressBlock: f.addressBlock.trim(),
    addressCity: f.addressCity.trim(),
    addressCountry: f.addressCountry,
    homeCountryAddress: opt(f.homeCountryAddress),
    phone: f.phone.trim(),
    altPhone: opt(f.altPhone),
    personalEmail: f.personalEmail.trim(),

    emergencyName: f.emergencyName.trim(),
    emergencyRelationship: f.emergencyRelationship.trim(),
    emergencyPhone: f.emergencyPhone.trim(),
    emergencyAltPhone: opt(f.emergencyAltPhone),
    emergencyAddress: opt(f.emergencyAddress),
    emergency2Name: opt(f.emergency2Name),
    emergency2Relationship: opt(f.emergency2Relationship),
    emergency2Phone: opt(f.emergency2Phone),
    emergency2AltPhone: opt(f.emergency2AltPhone),
    emergency2Address: opt(f.emergency2Address),

    dependants: f.dependants.map((d) => ({
      fullName: d.fullName.trim(), relationship: d.relationship, birthDate: opt(d.birthDate), nationality: opt(d.nationality), idNumber: opt(d.idNumber),
    })),
    qualifications: [
      ...f.education.filter((q) => q.title.trim()).map((q) => ({
        kind: 'education', title: q.title.trim(), institution: opt(q.institution), country: opt(q.country),
        year: q.year ? Number(q.year) : null, grade: opt(q.grade),
      })),
      ...f.certifications.filter((c) => c.title.trim()).map((c) => ({
        kind: 'certification', title: c.title.trim(), institution: opt(c.institution), obtainedDate: opt(c.obtainedDate), expiryDate: opt(c.expiryDate),
      })),
    ],
    languages: opt(f.languages),
    previousEmployments: f.employers.filter((p) => p.employerName.trim()).map((p) => ({
      employerName: p.employerName.trim(), jobTitle: opt(p.jobTitle), fromDate: opt(p.fromDate), toDate: opt(p.toDate),
      reasonForLeaving: opt(p.reasonForLeaving), refName: opt(p.refName), refJobTitle: opt(p.refJobTitle), refPhone: opt(p.refPhone), refEmail: opt(p.refEmail),
    })),
    mayContactEmployers: yn(f.mayContactEmployers),
    hasRestrictiveClauses: yn(f.hasRestrictiveClauses),

    hasMedicalCondition: yn(f.hasMedicalCondition),
    medicalDetails: f.hasMedicalCondition === 'yes' ? opt(f.medicalDetails) : null,
    bloodGroup: f.bloodGroup || null,
    regularMedication: opt(f.regularMedication),

    bankName: f.bankName.trim(),
    bankBranch: f.bankBranch.trim(),
    bankAccountHolder: f.bankAccountHolder.trim(),
    bankAccountNumber: f.bankAccountNumber.replace(/\s/g, '').toUpperCase(),

    documentChecklist: f.checklist,
    declarationAccepted: f.declarationAccepted,
    declarationName: opt(f.declarationName),
    declarationDate: opt(f.declarationDate),
    declarationPlace: opt(f.declarationPlace),
    verifiedAt: opt(f.verifiedAt),
    hrRemarks: opt(f.hrRemarks),
  };
}

// "Save as draft" keeps the form in this browser only; medical and bank details are never stored
const DRAFT_KEY = 'vt-onboarding-draft';

export function saveDraft(f: OnboardingForm) {
  const safe = { ...f, hasMedicalCondition: 'no', medicalDetails: '', bloodGroup: '', regularMedication: '', bankAccountNumber: '', monthlySalary: '' };
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(safe)); return true; } catch { return false; }
}

export function loadDraft(): OnboardingForm | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? { ...initialForm(), ...JSON.parse(raw) } : null;
  } catch { return null; }
}

export function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* storage blocked */ }
}

// Props every section receives
export interface SectionProps {
  f: OnboardingForm;
  set: <K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) => void;
  errors: Errors;
}

type StringKey = { [K in keyof OnboardingForm]: OnboardingForm[K] extends string ? K : never }[keyof OnboardingForm];

// <TextInput {...bind('jobTitle')} /> - value, onChange and the red border in one go
export const binder = ({ f, set, errors }: SectionProps) => (key: StringKey) => ({
  value: f[key] as string,
  onChange: (v: string) => set(key, v as never),
  invalid: !!errors[key],
});
