import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import * as leaveApi from '../../api/leave';
import { dateKey } from '../../lib/leave';

// Everything the request / planner screens need about the signed-in employee:
// balances (only the types they are eligible for), the rules of each type, and public holidays
export function useLeaveSetup() {
  const balancesQ = useQuery({ queryKey: ['leave', 'balances', 'me'], queryFn: leaveApi.myBalances });
  const country = balancesQ.data?.employee.country;
  const typesQ = useQuery({ queryKey: ['leave', 'types', country], queryFn: () => leaveApi.types(country!), enabled: !!country });
  const holidaysQ = useQuery({ queryKey: ['leave', 'holidays', country], queryFn: () => leaveApi.holidays({ country }), enabled: !!country });

  const holidays = useMemo(() => {
    const map = new Map<string, string>();
    (holidaysQ.data ?? []).forEach((h) => map.set(dateKey(h.date), h.name));
    return map;
  }, [holidaysQ.data]);

  return {
    country,
    balances: balancesQ.data?.balances ?? [],
    types: typesQ.data ?? [],
    holidays,
    holidaySet: useMemo(() => new Set(holidays.keys()), [holidays]),
    isLoading: balancesQ.isLoading || typesQ.isLoading,
    error: balancesQ.error ?? typesQ.error,
  };
}
