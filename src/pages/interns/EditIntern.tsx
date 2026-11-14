import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import * as employeesApi from '../../api/employees';
import { ErrorMessage } from '../../components/ui/Feedback';
import { Loading } from '../../components/ui/Spinner';
import { InternForm } from './InternForm';

export default function EditIntern() {
  const id = Number(useParams().id);
  const intern = useQuery({ queryKey: ['employees', id], queryFn: () => employeesApi.get(id) });
  if (intern.isLoading) return <Loading />;
  if (intern.error || !intern.data) return <ErrorMessage error={intern.error ?? 'Intern not found'} />;
  return <InternForm key={intern.data.id} intern={intern.data} />;
}
