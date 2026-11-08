import { PlaceholderPage } from '../../components/ui/PlaceholderPage';

export default function MyDocuments() {
  return <PlaceholderPage title="My documents" subtitle="Upload and download your documents" endpoints={['GET /api/documents/me', 'POST /api/documents']} />;
}
