import { useCallback, useEffect, useMemo, useState } from 'react';
import { axiosClient } from '@/api/axiosClient';
import type { CollectionReportPeriod, ICollectionReportResponse } from '@/types';

interface UseCollectionReportOptions {
  period: CollectionReportPeriod;
  dateFrom?: string;
  dateTo?: string;
}

const toISOString = (value: string, endOfDay = false) => {
  try {
    if (value.includes('T')) {
      return new Date(value).toISOString();
    }
    const suffix = endOfDay ? 'T23:59:59' : 'T00:00:00';
    return new Date(`${value}${suffix}`).toISOString();
  } catch {
    return value;
  }
};

export function useCollectionReport({ period, dateFrom, dateTo }: UseCollectionReportOptions) {
  const [data, setData] = useState<ICollectionReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCustomPeriod = period === 'custom';
  const shouldWaitForRange = isCustomPeriod && (!dateFrom || !dateTo);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (isCustomPeriod && dateFrom && dateTo) {
      params.append('dateFrom', toISOString(dateFrom));
      params.append('dateTo', toISOString(dateTo, true));
    } else {
      params.append('period', period);
    }

    return params.toString();
  }, [dateFrom, dateTo, isCustomPeriod, period]);

  const fetchReport = useCallback(async () => {
    if (shouldWaitForRange) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axiosClient.get<ICollectionReportResponse>(`/stats/collection-report?${queryString}`);
      setData(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nepodaøilo se naèíst collection report.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [queryString, shouldWaitForRange]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return {
    data,
    loading,
    error,
    refetch: fetchReport,
    isWaitingForRange: shouldWaitForRange,
  };
}

export default useCollectionReport;
