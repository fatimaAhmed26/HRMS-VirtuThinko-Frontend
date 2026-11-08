import { Link } from 'react-router-dom';

export default function Forbidden() {
  return (
    <div className="py-20 text-center">
      <p className="text-5xl font-semibold text-brand-600">403</p>
      <h1 className="mt-3 text-xl font-semibold">You don't have access to this page</h1>
      <p className="mt-1 text-sm text-slate-500">Ask HR or the system administrator if you think you should.</p>
      <Link to="/" className="mt-6 inline-block text-sm font-medium text-brand-600 hover:underline">Back to home</Link>
    </div>
  );
}
