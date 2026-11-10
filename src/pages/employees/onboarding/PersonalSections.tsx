// Sections 2-5: personal details, ID and residence documents, contact details, emergency contacts
import clsx from 'clsx';
import type { MaritalStatus } from '../../../types';
import { Field, Radios, Section, SubBox, TextInput } from './fields';
import { NATIONALITIES, binder, countryOf, type SectionProps, grid4 } from './formState';

const MARITAL: { value: MaritalStatus; label: string }[] = ['Single', 'Married', 'Divorced', 'Widowed'].map((v) => ({ value: v as MaritalStatus, label: v }));
const COUNTRIES = ['Bahrain', 'Saudi Arabia', 'United Arab Emirates', 'Kuwait', 'Oman', 'Qatar'];

export function PersonalSection(props: SectionProps) {
  const { f, set, errors } = props;
  const bind = binder(props);

  // suggest the portal first / last name from the passport name until HR types their own
  function onPassportName(v: string) {
    const words = v.trim().split(/\s+/).filter(Boolean);
    const prevWords = f.fullNamePassport.trim().split(/\s+/).filter(Boolean);
    if (!f.firstName || f.firstName === prevWords[0]) set('firstName', (words[0] ?? '').slice(0, 50));
    const prevLast = prevWords.length > 1 ? prevWords[prevWords.length - 1] : '';
    if (!f.lastName || f.lastName === prevLast) set('lastName', words.length > 1 ? words[words.length - 1].slice(0, 50) : '');
    set('fullNamePassport', v);
  }

  return (
    <Section id="personal" number={2} title="Personal details">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name (as in passport)" required hint="As written in the passport, in English" error={errors.fullNamePassport}>
          <TextInput {...bind('fullNamePassport')} onChange={onPassportName} maxLength={150} />
        </Field>
        <Field label="Full name (as in ID)" required hint="As written on the CPR / Iqama, in English" error={errors.fullNameId}>
          <TextInput {...bind('fullNameId')} maxLength={150} />
        </Field>
        <Field label="First name (used in the portal)" required error={errors.firstName}>
          <TextInput {...bind('firstName')} maxLength={50} />
        </Field>
        <Field label="Last name (used in the portal)" required error={errors.lastName}>
          <TextInput {...bind('lastName')} maxLength={50} />
        </Field>
      </div>
      <div className={clsx(grid4, 'mt-4')}>
        <Field label="Full name in Arabic (if shown on ID)" className="sm:col-span-2">
          <TextInput {...bind('fullNameArabic')} dir="rtl" maxLength={150} />
        </Field>
        <Field label="Date of birth" required error={errors.birthDate}>
          <TextInput type="date" {...bind('birthDate')} />
        </Field>
        <Field label="Place of birth" required error={errors.placeOfBirth}>
          <TextInput {...bind('placeOfBirth')} maxLength={100} />
        </Field>
        <Field label="Nationality" required error={errors.nationality}>
          <select className={clsx('input', errors.nationality && 'border-red-400')} value={f.nationality} onChange={(e) => set('nationality', e.target.value)}>
            <option value="">Select…</option>
            {NATIONALITIES.map((n) => <option key={n}>{n}</option>)}
          </select>
        </Field>
        <Field label="Other nationality (if any)">
          <TextInput {...bind('otherNationality')} maxLength={50} />
        </Field>
      </div>
      <div className="mt-4 space-y-2">
        <Radios name="gender" label="Gender" required value={f.gender} onChange={(v) => set('gender', v)} error={errors.gender}
          options={[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }]} />
        <Radios name="marital" label="Marital status" required value={f.maritalStatus} onChange={(v) => set('maritalStatus', v)} options={MARITAL} />
      </div>
      <Field label="Number of children" className="mt-4" error={errors.childrenCount}>
        <TextInput type="number" min={0} max={30} {...bind('childrenCount')} />
      </Field>
    </Section>
  );
}

export function IdSection(props: SectionProps) {
  const { errors } = props;
  const bind = binder(props);
  const saudi = countryOf(props.f) === 'SA';
  return (
    <Section id="id" number={3} title="Identification & residence documents">
      <div className={grid4}>
        <Field label="CPR / National ID / Iqama no." required error={errors.cprNumber}>
          <TextInput {...bind('cprNumber')} inputMode="numeric" maxLength={10} placeholder={saudi ? '10 digits' : '9 digits'} />
        </Field>
        <Field label="ID expiry date" required error={errors.idExpiry}>
          <TextInput type="date" {...bind('idExpiry')} />
        </Field>
        <Field label="Passport number" required error={errors.passportNumber}>
          <TextInput {...bind('passportNumber')} maxLength={30} />
        </Field>
        <Field label="Passport place of issue" required error={errors.passportPlaceOfIssue}>
          <TextInput {...bind('passportPlaceOfIssue')} maxLength={100} />
        </Field>
        <Field label="Passport issue date" required error={errors.passportIssueDate}>
          <TextInput type="date" {...bind('passportIssueDate')} />
        </Field>
        <Field label="Passport expiry date" required error={errors.passportExpiry}>
          <TextInput type="date" {...bind('passportExpiry')} />
        </Field>
        <Field label="Residence / work permit no." hint="If applicable">
          <TextInput {...bind('permitNumber')} maxLength={30} />
        </Field>
        <Field label="Permit expiry date">
          <TextInput type="date" {...bind('permitExpiry')} />
        </Field>
        <Field label={saudi ? 'Social insurance no. (GOSI)' : 'Social insurance no. (SIO)'} hint="If any">
          <TextInput {...bind('socialInsuranceNumber')} maxLength={30} />
        </Field>
        <Field label="Driving licence no." hint="If any">
          <TextInput {...bind('drivingLicenceNumber')} maxLength={30} />
        </Field>
      </div>
    </Section>
  );
}

export function ContactSection(props: SectionProps) {
  const { f, set, errors } = props;
  const bind = binder(props);
  const saudi = countryOf(f) === 'SA';
  return (
    <Section id="contact" number={4} title="Contact details">
      <h3 className="mb-2 text-sm font-semibold text-slate-700">Current address</h3>
      <div className={grid4}>
        <Field label="Flat / villa no."><TextInput {...bind('addressFlat')} maxLength={20} /></Field>
        <Field label="Building no." required error={errors.addressBuilding}><TextInput {...bind('addressBuilding')} maxLength={20} /></Field>
        <Field label="Road / street" required error={errors.addressRoad}><TextInput {...bind('addressRoad')} maxLength={50} /></Field>
        <Field label="Block" required error={errors.addressBlock}><TextInput {...bind('addressBlock')} maxLength={20} /></Field>
        <Field label="City / area" required error={errors.addressCity}><TextInput {...bind('addressCity')} maxLength={100} /></Field>
        <Field label="Country" required error={errors.addressCountry}>
          <select className="input" value={f.addressCountry} onChange={(e) => set('addressCountry', e.target.value)}>
            {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Home country address" hint="If different from the address above" className="mt-4">
        <textarea className="input min-h-16" value={f.homeCountryAddress} maxLength={255} onChange={(e) => set('homeCountryAddress', e.target.value)} />
      </Field>
      <h3 className="mb-2 mt-5 text-sm font-semibold text-slate-700">Phone & email</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Mobile number" required error={errors.phone}>
          <TextInput type="tel" {...bind('phone')} maxLength={20} placeholder={saudi ? '+966 5X XXX XXXX' : '+973 XXXX XXXX'} />
        </Field>
        <Field label="Alternative phone"><TextInput type="tel" {...bind('altPhone')} maxLength={20} /></Field>
        <Field label="Personal email" required hint="Not a company or current employer email" error={errors.personalEmail}>
          <TextInput type="email" {...bind('personalEmail')} maxLength={100} />
        </Field>
      </div>
    </Section>
  );
}

export function EmergencySection(props: SectionProps) {
  const { errors } = props;
  const bind = binder(props);
  return (
    <Section id="emergency" number={5} title="Emergency contacts" hint="At least one adult who is reachable in an emergency and has agreed to be listed.">
      <div className="space-y-3">
        <SubBox title="Contact 1 *">
          <div className={grid4}>
            <Field label="Full name" error={errors.emergencyName}><TextInput {...bind('emergencyName')} maxLength={100} /></Field>
            <Field label="Relationship" error={errors.emergencyRelationship}><TextInput {...bind('emergencyRelationship')} maxLength={50} /></Field>
            <Field label="Phone number" error={errors.emergencyPhone}><TextInput type="tel" {...bind('emergencyPhone')} maxLength={20} /></Field>
            <Field label="Alternative phone"><TextInput type="tel" {...bind('emergencyAltPhone')} maxLength={20} /></Field>
            <Field label="Address / country" className="sm:col-span-2"><TextInput {...bind('emergencyAddress')} maxLength={255} /></Field>
          </div>
        </SubBox>
        <SubBox title="Contact 2">
          <div className={grid4}>
            <Field label="Full name"><TextInput {...bind('emergency2Name')} maxLength={100} /></Field>
            <Field label="Relationship"><TextInput {...bind('emergency2Relationship')} maxLength={50} /></Field>
            <Field label="Phone number"><TextInput type="tel" {...bind('emergency2Phone')} maxLength={20} /></Field>
            <Field label="Alternative phone"><TextInput type="tel" {...bind('emergency2AltPhone')} maxLength={20} /></Field>
            <Field label="Address / country" className="sm:col-span-2"><TextInput {...bind('emergency2Address')} maxLength={255} /></Field>
          </div>
        </SubBox>
      </div>
    </Section>
  );
}
