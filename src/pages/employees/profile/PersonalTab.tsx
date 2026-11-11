// Profile tab "Personal" (design screen 3): details from the onboarding form
import { fmtDate } from '../../../lib/format';
import type { Employee } from '../../../types';
import { Grid, Item, Panel } from './ui';

export function PersonalTab({ emp }: { emp: Employee }) {
  const saudi = emp.country === 'SA';
  const address = [
    emp.addressFlat && `Flat ${emp.addressFlat}`, emp.addressBuilding && `Bldg ${emp.addressBuilding}`,
    emp.addressRoad && `Road ${emp.addressRoad}`, emp.addressBlock && `Block ${emp.addressBlock}`, emp.addressCity, emp.addressCountry,
  ].filter(Boolean).join(', ') || emp.address;

  return (
    <div className="space-y-4">
      <Panel title="Personal details">
        <Grid>
          <Item label="Full name (passport)" value={emp.fullNamePassport} />
          <Item label="Full name (ID)" value={emp.fullNameId} />
          <Item label="Full name (Arabic)" value={emp.fullNameArabic} dir="rtl" />
          <Item label="Date of birth" value={emp.birthDate && fmtDate(emp.birthDate)} />
          <Item label="Place of birth" value={emp.placeOfBirth} />
          <Item label="Nationality" value={[emp.nationality, emp.otherNationality].filter(Boolean).join(' / ')} />
          <Item label="Gender" value={emp.gender} />
          <Item label="Marital status" value={emp.maritalStatus && `${emp.maritalStatus}${emp.childrenCount ? ` · ${emp.childrenCount} ${emp.childrenCount === 1 ? 'child' : 'children'}` : ''}`} />
          <Item label="Languages" value={emp.languages} className="sm:col-span-2" />
        </Grid>
      </Panel>

      <Panel title="ID & residence">
        <Grid>
          <Item label={saudi ? 'National ID / Iqama' : 'CPR number'} value={emp.cprNumber} />
          <Item label="ID expiry" value={emp.idExpiry && fmtDate(emp.idExpiry)} />
          <Item label="Passport no." value={emp.passportNumber} />
          <Item label="Passport issued" value={[emp.passportPlaceOfIssue, emp.passportIssueDate && fmtDate(emp.passportIssueDate)].filter(Boolean).join(' · ')} />
          <Item label="Passport expiry" value={emp.passportExpiry && fmtDate(emp.passportExpiry)} />
          <Item label="Work permit" value={emp.permitNumber ? `${emp.permitNumber}${emp.permitExpiry ? ` · until ${fmtDate(emp.permitExpiry)}` : ''}` : 'Not required'} />
          <Item label="Social insurance" value={emp.socialInsuranceNumber && `${saudi ? 'GOSI' : 'SIO'} · ${emp.socialInsuranceNumber}`} />
          <Item label="Driving licence" value={emp.drivingLicenceNumber} />
        </Grid>
      </Panel>

      <Panel title="Contact">
        <Grid cols={4}>
          <Item label="Mobile" value={emp.phone} />
          <Item label="Alternative phone" value={emp.altPhone} />
          <Item label="Personal email" value={emp.personalEmail} />
          <Item label="Work email" value={emp.email} />
          <Item label="Address" value={address} className="sm:col-span-2" />
          <Item label="Home country address" value={emp.homeCountryAddress} className="sm:col-span-2" />
        </Grid>
      </Panel>
    </div>
  );
}
