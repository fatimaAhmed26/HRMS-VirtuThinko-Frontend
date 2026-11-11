// A saved employee → the onboarding form, for "Edit employee"
import type { Employee } from '../../../types';
import { emptyEducation, emptyEmployer, initialForm, type ChecklistKey, type OnboardingForm, type YesNo } from './formState';

const day = (v: string | null | undefined) => (v ? v.slice(0, 10) : ''); // "2026-12-01T00:00:00.000Z" → "2026-12-01"
const str = (v: string | number | null | undefined) => (v === null || v === undefined ? '' : String(v));
const yn = (v: boolean | null | undefined): YesNo => (v === true ? 'yes' : v === false ? 'no' : '');

export function fromEmployee(e: Employee): OnboardingForm {
  const base = initialForm();
  const outsourced = e.employmentType === 'Outsourced';
  const education = e.qualifications.filter((q) => q.kind === 'education').map((q) => ({
    title: q.title, institution: str(q.institution), country: str(q.country), year: str(q.year), grade: str(q.grade),
  }));
  const employers = e.previousEmployments.map((p) => ({
    employerName: p.employerName, jobTitle: str(p.jobTitle), fromDate: day(p.fromDate), toDate: day(p.toDate),
    reasonForLeaving: str(p.reasonForLeaving), refName: str(p.refName), refJobTitle: str(p.refJobTitle), refPhone: str(p.refPhone), refEmail: str(p.refEmail),
  }));

  return {
    ...base,
    team: outsourced ? 'OUT' : e.country,
    clientCompanyId: str(e.clientCompanyId), employedBy: e.country, clientSite: outsourced ? str(e.workLocation) : '',
    poNumber: str(e.poNumber), deploymentStart: day(e.deploymentStart), deploymentEnd: day(e.deploymentEnd), clientSupervisor: str(e.clientSupervisor),

    jobTitle: str(e.jobTitle), departmentId: str(e.departmentId), hireDate: day(e.hireDate), managerId: str(e.managerId),
    employmentType: outsourced || !e.employmentType ? base.employmentType : e.employmentType,
    workLocation: outsourced ? '' : str(e.workLocation), email: e.email, probationEnd: day(e.probationEnd), siNewScheme: e.siNewScheme,

    fullNamePassport: str(e.fullNamePassport), fullNameId: str(e.fullNameId), firstName: e.firstName, lastName: e.lastName,
    fullNameArabic: str(e.fullNameArabic), birthDate: day(e.birthDate), placeOfBirth: str(e.placeOfBirth),
    nationality: str(e.nationality), otherNationality: str(e.otherNationality), gender: e.gender ?? '',
    maritalStatus: e.maritalStatus ?? 'Single', childrenCount: str(e.childrenCount ?? 0),

    cprNumber: str(e.cprNumber), idExpiry: day(e.idExpiry), passportNumber: str(e.passportNumber), passportPlaceOfIssue: str(e.passportPlaceOfIssue),
    passportIssueDate: day(e.passportIssueDate), passportExpiry: day(e.passportExpiry), permitNumber: str(e.permitNumber), permitExpiry: day(e.permitExpiry),
    socialInsuranceNumber: str(e.socialInsuranceNumber), drivingLicenceNumber: str(e.drivingLicenceNumber),

    addressFlat: str(e.addressFlat), addressBuilding: str(e.addressBuilding), addressRoad: str(e.addressRoad), addressBlock: str(e.addressBlock),
    addressCity: str(e.addressCity), addressCountry: e.addressCountry ?? base.addressCountry, homeCountryAddress: str(e.homeCountryAddress),
    phone: str(e.phone), altPhone: str(e.altPhone), personalEmail: str(e.personalEmail),

    emergencyName: str(e.emergencyName), emergencyRelationship: str(e.emergencyRelationship), emergencyPhone: str(e.emergencyPhone),
    emergencyAltPhone: str(e.emergencyAltPhone), emergencyAddress: str(e.emergencyAddress),
    emergency2Name: str(e.emergency2Name), emergency2Relationship: str(e.emergency2Relationship), emergency2Phone: str(e.emergency2Phone),
    emergency2AltPhone: str(e.emergency2AltPhone), emergency2Address: str(e.emergency2Address),

    dependants: e.dependants.map((d) => ({ fullName: d.fullName, relationship: d.relationship, birthDate: day(d.birthDate), nationality: str(d.nationality), idNumber: str(d.idNumber) })),
    education: education.length ? education : [emptyEducation()],
    certifications: e.qualifications.filter((q) => q.kind === 'certification').map((q) => ({
      title: q.title, institution: str(q.institution), obtainedDate: day(q.obtainedDate), expiryDate: day(q.expiryDate),
    })),
    languages: str(e.languages),
    employers: employers.length ? employers : [emptyEmployer()],
    mayContactEmployers: yn(e.mayContactEmployers),
    hasRestrictiveClauses: yn(e.hasRestrictiveClauses) || 'no',

    hasMedicalCondition: yn(e.hasMedicalCondition) || 'no', medicalDetails: str(e.medicalDetails),
    bloodGroup: str(e.bloodGroup), regularMedication: str(e.regularMedication),

    bankName: str(e.bankName), bankBranch: str(e.bankBranch), bankAccountHolder: str(e.bankAccountHolder), bankAccountNumber: str(e.bankAccountNumber),

    checklist: (e.documentChecklist ?? {}) as Partial<Record<ChecklistKey, { na: boolean; received: boolean }>>,
    declarationAccepted: e.declarationAccepted, declarationName: str(e.declarationName),
    declarationDate: day(e.declarationDate), declarationPlace: str(e.declarationPlace),
    verifiedAt: day(e.verifiedAt), hrRemarks: str(e.hrRemarks),
  };
}
