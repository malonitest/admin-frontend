import axiosClient from './axiosClient';
import type {
  DailySummaryResponse,
  LeadsAnalytics,
  LeasesAnalytics,
  FinancialAnalytics,
  ReportingFilters,
} from '@/types/reporting';

export const reportingApi = {
  /**
   * Získat denní souhrn (pre-agregovaná data)
   */
  async getDailySummary(filters: ReportingFilters): Promise<DailySummaryResponse> {
    const params: Record<string, any> = {};
    
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    
    const response = await axiosClient.get<DailySummaryResponse>(
      '/admin/reporting/summary/daily',
      { params }
    );
    return response.data;
  },

  /**
   * Lead analytika s možností group by
   */
  async getLeadsAnalytics(filters: ReportingFilters): Promise<LeadsAnalytics> {
    const params: Record<string, any> = {};
    
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    if (filters.period) params.period = filters.period;
    if (filters.groupBy) {
      // Backend oèekává multiple groupBy parametry
      filters.groupBy.forEach((field) => {
        if (!params.groupBy) {
          params.groupBy = field;
        } else if (Array.isArray(params.groupBy)) {
          params.groupBy.push(field);
        } else {
          params.groupBy = [params.groupBy, field];
        }
      });
    }
    
    const response = await axiosClient.get<LeadsAnalytics>(
      '/admin/reporting/analytics/leads',
      { params }
    );
    return response.data;
  },

  /**
   * Lease analytika
   */
  async getLeasesAnalytics(filters: ReportingFilters): Promise<LeasesAnalytics> {
    const params: Record<string, any> = {};
    
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    if (filters.period) params.period = filters.period;
    if (filters.groupBy) {
      filters.groupBy.forEach((field) => {
        if (!params.groupBy) {
          params.groupBy = field;
        } else if (Array.isArray(params.groupBy)) {
          params.groupBy.push(field);
        } else {
          params.groupBy = [params.groupBy, field];
        }
      });
    }
    
    const response = await axiosClient.get<LeasesAnalytics>(
      '/admin/reporting/analytics/leases',
      { params }
    );
    return response.data;
  },

  /**
   * Finanèní analytika
   */
  async getFinancialAnalytics(filters: ReportingFilters): Promise<FinancialAnalytics> {
    const params: Record<string, any> = {};
    
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    if (filters.period) params.period = filters.period;
    if (filters.groupBy) {
      filters.groupBy.forEach((field) => {
        if (!params.groupBy) {
          params.groupBy = field;
        } else if (Array.isArray(params.groupBy)) {
          params.groupBy.push(field);
        } else {
          params.groupBy = [params.groupBy, field];
        }
      });
    }
    
    const response = await axiosClient.get<FinancialAnalytics>(
      '/admin/reporting/analytics/financial',
      { params }
    );
    return response.data;
  },
};
