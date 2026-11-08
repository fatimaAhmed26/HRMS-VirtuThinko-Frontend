import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="text-5xl font-semibold text-brand-600">404</p>
      <h1 className="mt-3 text-xl font-semibold">Page not found</h1>
      <Link to="/" className="mt-6 inline-block text-sm font-medium text-brand-600 hover:underline">Back to home</Link>
    </div>
  );
}
