import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../auth/useAuth';
import { Button } from '../components/ui/Button';
import { ErrorMessage } from '../components/ui/Feedback';
import { HR_PERMISSIONS } from '../lib/permissions';

const schema = z.object({
  identifier: z.string().trim().min(1, 'Enter your username or email'),
  password: z.string().min(1, 'Enter your password'),
});
type FormValues = z.infer<typeof schema>;
const YEAR = new Date().getFullYear();

export default function Login() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [error, setError] = useState<unknown>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  // Once signed in, go back to the page the user first opened, or to their home page
  if (user) {
    const from = (location.state as { from?: string } | null)?.from;
    const isHr = HR_PERMISSIONS.some((p) => user.permissions.includes(p));
    return <Navigate to={from && from !== '/login' ? from : isHr ? '/dashboard' : '/home'} replace />;
  }

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      await login(values.identifier, values.password);
    } catch (err) {
      setError(err);
    }
  }

  return (
    <div className="flex min-h-full">
      <div className="hidden flex-1 flex-col justify-between bg-gradient-to-br from-brand-600 to-brand-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="" className="h-10 w-10" />
          <span className="text-xl font-semibold">VirtuThinko</span>
        </div>
        <div>
          <h1 className="text-4xl font-semibold leading-tight">One portal for HR<br />in Bahrain and Saudi Arabia</h1>
          <p className="mt-4 max-w-md text-white/80">Employees, leave, contracts, payroll, letters and announcements in one place.</p>
        </div>
        <p className="text-sm text-white/60">© {YEAR} VirtuThinko W.L.L.</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-5" noValidate>
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Sign in</h2>
            <p className="mt-1 text-sm text-slate-500">Use your VirtuThinko username or email.</p>
          </div>

          <ErrorMessage error={error} />

          <div>
            <label className="label" htmlFor="identifier">Username or email</label>
            <input id="identifier" className="input" autoComplete="username" autoFocus {...register('identifier')} />
            {errors.identifier && <p className="mt-1 text-xs text-red-600">{errors.identifier.message}</p>}
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" className="input" autoComplete="current-password" {...register('password')} />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>

          <Button type="submit" className="w-full" loading={isSubmitting}>Sign in</Button>
        </form>
      </div>
    </div>
  );
}
