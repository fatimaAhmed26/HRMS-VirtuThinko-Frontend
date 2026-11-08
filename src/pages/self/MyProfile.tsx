import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import * as authApi from '../../api/auth';
import * as employeesApi from '../../api/employees';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ErrorMessage } from '../../components/ui/Feedback';
import { Initials } from '../../components/ui/Initials';
import { Loading } from '../../components/ui/Spinner';
import { COUNTRY_NAMES, fmtDate } from '../../lib/format';
import type { Employee } from '../../types';

const contactSchema = z.object({
  phone: z.string().trim().max(20, 'Too long'),
  address: z.string().trim().max(255, 'Too long'),
  emergencyName: z.string().trim().max(100, 'Too long'),
  emergencyPhone: z.string().trim().max(20, 'Too long'),
});
type ContactValues = z.infer<typeof contactSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  // same policy as the backend: 8+ characters with an uppercase letter, a lowercase letter and a number
  newPassword: z.string().min(8, 'At least 8 characters').max(72)
    .regex(/[A-Z]/, 'Add an uppercase letter').regex(/[a-z]/, 'Add a lowercase letter').regex(/[0-9]/, 'Add a number'),
  confirm: z.string(),
}).refine((v) => v.newPassword === v.confirm, { message: 'Passwords do not match', path: ['confirm'] });
type PasswordValues = z.infer<typeof passwordSchema>;

// My profile (design p.67): contact details are edited directly; name, ID and bank changes go to HR as a request
export default function MyProfile() {
  const { data: me, isLoading, error } = useQuery({ queryKey: ['employees', 'me'], queryFn: employeesApi.me });

  return (
    <>
      {isLoading && <Loading />}
      <ErrorMessage error={error} />
      {me && (
        <div className="mx-auto max-w-4xl space-y-6">
          <Card>
            <div className="flex flex-col items-center py-4 text-center">
              <Initials firstName={me.firstName} lastName={me.lastName} size="lg" />
              <h1 className="mt-3 text-xl font-semibold">{me.firstName} {me.lastName}</h1>
              <p className="text-sm text-slate-500">
                {[me.jobTitle, me.department?.name, me.country === 'SA' ? 'VirtuThinko KSA' : 'VirtuThinko W.L.L.'].filter(Boolean).join(' · ')}
              </p>
              <p className="mt-1 text-xs text-slate-400">{me.employeeCode} · {me.email}</p>
            </div>
          </Card>

          <p className="text-sm text-slate-500">You can update your contact details directly. Changes to your name, ID or bank details go to HR for approval.</p>

          <ContactForm me={me} />

          <Card title="Personal & ID" action={<span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Changes need HR approval</span>}>
            <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <Item label="Full name" value={`${me.firstName} ${me.lastName}`} />
              <Item label="CPR / ID number" value={me.cprNumber ? `•••••${me.cprNumber.slice(-4)}` : '-'} />
              <Item label="Nationality" value={me.nationality} />
              <Item label="Gender" value={me.gender} />
              <Item label="Date of birth" value={fmtDate(me.birthDate)} />
              <Item label="Entity" value={COUNTRY_NAMES[me.country]} />
              <Item label="Joined" value={fmtDate(me.hireDate)} />
              <Item label="Bank" value={me.bankName ? `${me.bankName} ${me.bankAccountNumber ? '· ••••' + me.bankAccountNumber.slice(-4) : ''}` : '-'} />
            </dl>
            <div className="mt-4 flex gap-2">
              <Link to="/my/requests?type=DETAILS_CHANGE"><Button variant="secondary">Request a change</Button></Link>
              <Link to="/my/requests?type=BANK_CHANGE"><Button variant="secondary">Change bank account</Button></Link>
            </div>
          </Card>

          <PasswordForm />
        </div>
      )}
    </>
  );
}

function Item({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{value || '-'}</dd>
    </div>
  );
}

function ContactForm({ me }: { me: Employee }) {
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);
  const { register, handleSubmit, formState: { errors, isDirty }, reset } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { phone: me.phone ?? '', address: me.address ?? '', emergencyName: me.emergencyName ?? '', emergencyPhone: me.emergencyPhone ?? '' },
  });
  const save = useMutation({
    mutationFn: (v: ContactValues) => employeesApi.updateMe({
      phone: v.phone || null, address: v.address || null, emergencyName: v.emergencyName || null, emergencyPhone: v.emergencyPhone || null,
    }),
    onSuccess: (updated) => {
      qc.setQueryData(['employees', 'me'], updated);
      reset({ phone: updated.phone ?? '', address: updated.address ?? '', emergencyName: updated.emergencyName ?? '', emergencyPhone: updated.emergencyPhone ?? '' });
      setSaved(true);
    },
  });

  return (
    <form onSubmit={handleSubmit((v) => { setSaved(false); save.mutate(v); })} className="space-y-6">
      <Card title="Contact details" action={<span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Edit directly</span>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="phone">Mobile</label>
            <input id="phone" className="input" placeholder="+973 XXXX XXXX" {...register('phone')} />
            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="address">Address</label>
            <input id="address" className="input" placeholder="Flat, building, road, block, city" {...register('address')} />
          </div>
        </div>
      </Card>
      <Card title="Emergency contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="emergencyName">Name and relationship</label>
            <input id="emergencyName" className="input" placeholder="e.g. Ahmed Ali (brother)" {...register('emergencyName')} />
          </div>
          <div>
            <label className="label" htmlFor="emergencyPhone">Phone</label>
            <input id="emergencyPhone" className="input" {...register('emergencyPhone')} />
          </div>
        </div>
      </Card>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={save.isPending} disabled={!isDirty}>Save changes</Button>
        {saved && <span className="text-sm text-green-700">Saved.</span>}
      </div>
      <ErrorMessage error={save.error} />
    </form>
  );
}

function PasswordForm() {
  const [done, setDone] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });
  const change = useMutation({
    mutationFn: (v: PasswordValues) => authApi.changeOwnPassword(v.currentPassword, v.newPassword),
    onSuccess: () => { reset(); setDone(true); },
  });
  return (
    <Card title="Change password">
      <form onSubmit={handleSubmit((v) => { setDone(false); change.mutate(v); })} className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="currentPassword">Current password</label>
          <input id="currentPassword" type="password" className="input" autoComplete="current-password" {...register('currentPassword')} />
          {errors.currentPassword && <p className="mt-1 text-xs text-red-600">{errors.currentPassword.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="newPassword">New password</label>
          <input id="newPassword" type="password" className="input" autoComplete="new-password" {...register('newPassword')} />
          {errors.newPassword && <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="confirm">Confirm new password</label>
          <input id="confirm" type="password" className="input" autoComplete="new-password" {...register('confirm')} />
          {errors.confirm && <p className="mt-1 text-xs text-red-600">{errors.confirm.message}</p>}
        </div>
        <div className="flex items-center gap-3 sm:col-span-3">
          <Button type="submit" variant="secondary" loading={change.isPending}>Change password</Button>
          {done && <span className="text-sm text-green-700">Password changed.</span>}
        </div>
        <div className="sm:col-span-3"><ErrorMessage error={change.error} /></div>
      </form>
    </Card>
  );
}
