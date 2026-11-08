import { useQuery } from '@tanstack/react-query';
import * as announcementsApi from '../../api/announcements';
import { AnnouncementCard } from '../../components/AnnouncementCard';
import { EmptyState, ErrorMessage } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading } from '../../components/ui/Spinner';

// Announcements (design p.72): each with its banner image or a document to download
export default function MyAnnouncements() {
  const { data = [], isLoading, error } = useQuery({ queryKey: ['announcements', 'me'], queryFn: announcementsApi.forMe });
  return (
    <>
      <PageHeader title="Announcements" subtitle="News and notices from HR." />
      {isLoading && <Loading />}
      <ErrorMessage error={error} />
      {!isLoading && data.length === 0 && <EmptyState title="No announcements right now" />}
      <div className="mx-auto max-w-3xl space-y-5">
        {data.map((a) => <AnnouncementCard key={a.id} a={a} />)}
      </div>
    </>
  );
}
