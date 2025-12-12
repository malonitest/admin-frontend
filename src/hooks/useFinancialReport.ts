import { useCallback, useEffect, useState } from 'react';
import { axiosClient } from '@/api/axiosClient';
import type { IFinancialReportData, KPIReportPeriod } from '@/types';

export interface FinancialReportFilters {
  period: KPIReportPeriod;
  dateFrom?: string;
  dateTo?: string;
}

export interface UseFinancialReportResult {
  data: IFinancialReportData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const DEFAULT_ERROR_MESSAGE = 'Nepodaøilo se naèíst finanèní report. Zkuste to prosím znovu.';

export function useFinancialReport({ period, dateFrom, dateTo }: FinancialReportFilters): UseFinancialReportResult {
  const [data, setData] = useState<IFinancialReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shouldFetch = period !== 'custom' || (!!dateFrom && !!dateTo);

  const fetchReport = useCallback(async () => {
    if (!shouldFetch) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (period === 'custom' && dateFrom && dateTo) {
        params.append('dateFrom', dateFrom);
        params.append('dateTo', dateTo);
      } else {
        params.append('period', period);
      }

      const response = await axiosClient.get<IFinancialReportData>(`/stats/financial-report?${params.toString()}`);
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : DEFAULT_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, period, shouldFetch]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return {
    data,
    loading,
    error,
    refetch: fetchReport,
  };
}
