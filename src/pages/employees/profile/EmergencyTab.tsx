// Profile tab "Emergency & dependants" (design screen 11), with the confidential medical section
import { useState } from 'react';
import { useAuth } from '../../../auth/useAuth';
import { Button } from '../../../components/ui/Button';
import { fmtDate, yesNo } from '../../../lib/format';
import { P } from '../../../lib/permissions';
import type { Employee } from '../../../types';
import { Grid, Item, Panel } from './ui';

export function EmergencyTab({ emp }: { emp: Employee }) {
  const { can } = useAuth();
  const [showMedical, setShowMedical] = useState(false);
  const contacts = [
    { name: emp.emergencyName, rel: emp.emergencyRelationship, phone: emp.emergencyPhone, alt: emp.emergencyAltPhone, address: emp.emergencyAddress },
    { name: emp.emergency2Name, rel: emp.emergency2Relationship, phone: emp.emergency2Phone, alt: emp.emergency2AltPhone, address: emp.emergency2Address },
  ].filter((c) => c.name);

  return (
    <div className="space-y-4">
      <Panel title="Emergency contacts">
        {contacts.length === 0 ? <p className="text-sm text-amber-700">No emergency contact recorded.</p> : (
          <div className="space-y-4">
            {contacts.map((c, i) => (
              <Grid key={i} cols={4}>
                <Item label={`Contact ${i + 1}`} value={[c.name, c.rel].filter(Boolean).join(' · ')} />
                <Item label="Phone" value={c.phone} />
                <Item label="Alternative phone" value={c.alt} />
                <Item label="Address / country" value={c.address} />
              </Grid>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Dependants">
        {emp.dependants.length === 0 ? <p className="text-sm text-slate-500">No dependants recorded.</p> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Name</th><th>Relationship</th><th>Date of birth</th><th>Nationality</th><th>ID / passport</th></tr></thead>
              <tbody>
                {emp.dependants.map((d, i) => (
                  <tr key={i}>
                    <td>{d.fullName}</td><td>{d.relationship}</td><td>{d.birthDate ? fmtDate(d.birthDate) : '-'}</td>
                    <td>{d.nationality ?? '-'}</td><td>{d.idNumber ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Medical (confidential)">
        {!can(P.employeeEdit) ? (
          <p className="text-sm text-slate-500">Visible to authorised HR only.</p>
        ) : !showMedical ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">Visible to authorised HR only. Use it for safety, emergency care and medical insurance.</p>
            <Button variant="secondary" onClick={() => setShowMedical(true)}>Show medical information</Button>
          </div>
        ) : (
          <Grid cols={4}>
            <Item label="Condition, allergy or disability declared" value={yesNo(emp.hasMedicalCondition)} />
            <Item label="Details" value={emp.medicalDetails} className="sm:col-span-2" />
            <Item label="Blood group" value={emp.bloodGroup} />
            <Item label="Regular medication" value={emp.regularMedication} className="sm:col-span-2" />
          </Grid>
        )}
      </Panel>
    </div>
  );
}
