/**
 * Marketing Cost Tracking API Client
 * API calls for marketing expenses and ROI calculations
 */

import axiosClient from './axiosClient';

// Types
export interface MarketingCost {
  id: string;
  source: 'Google Ads' | 'Facebook' | 'Instagram' | 'Seznam' | 'Ostatní';
  month: string; // ISO date
  cost: number;
  currency: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMarketingCost {
  source: string;
  month: string;
  cost: number;
  currency?: string;
  notes?: string;
}

export interface UpdateMarketingCost {
  cost?: number;
  currency?: string;
  notes?: string;
}

export interface ROIResult {
  source: string;
  totalCost: number;
  totalRevenue: number;
  roi: number; // Return on Investment percentage
  roas: number; // Return on Ad Spend
  cpl: number; // Cost Per Lead
  cpa: number; // Cost Per Acquisition
  leads: number;
  conversions: number;
  conversionRate: number;
}

export interface MonthlyCostSummary {
  month: string; // YYYY-MM
  sources: Array<{
    source: string;
    cost: number;
  }>;
  totalCost: number;
}

export interface CostRevenueComparison {
  period: string;
  costs: Array<{ source: string; cost: number }>;
  revenues: Array<{ source: string; revenue: number }>;
  roi: Array<{ source: string; roi: number }>;
  totalCost: number;
  totalRevenue: number;
  overallROI: number;
}

export interface CostQueryParams {
  source?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  limit?: number;
  page?: number;
}

export interface BulkCostUpdate {
  costs: CreateMarketingCost[];
}

// Marketing Cost API
export const marketingCostApi = {
  /**
   * Create marketing cost entry
   */
  createCost: async (data: CreateMarketingCost): Promise<MarketingCost> => {
    const response = await axiosClient.post('/admin/marketing/costs', data);
    return response.data;
  },

  /**
   * Get all marketing costs with pagination
   */
  getCosts: async (params?: CostQueryParams): Promise<{
    results: MarketingCost[];
    page: number;
    limit: number;
    totalPages: number;
    totalResults: number;
  }> => {
    const response = await axiosClient.get('/admin/marketing/costs', { params });
    return response.data;
  },

  /**
   * Get cost by ID
   */
  getCost: async (costId: string): Promise<MarketingCost> => {
    const response = await axiosClient.get(`/admin/marketing/costs/${costId}`);
    return response.data;
  },

  /**
   * Update cost by ID
   */
  updateCost: async (costId: string, data: UpdateMarketingCost): Promise<MarketingCost> => {
    const response = await axiosClient.patch(`/admin/marketing/costs/${costId}`, data);
    return response.data;
  },

  /**
   * Delete cost by ID
   */
  deleteCost: async (costId: string): Promise<void> => {
    await axiosClient.delete(`/admin/marketing/costs/${costId}`);
  },

  /**
   * Get cost by source and month
   */
  getCostBySourceMonth: async (source: string, month: string): Promise<MarketingCost> => {
    const response = await axiosClient.get(
      `/admin/marketing/costs/${encodeURIComponent(source)}/${month}`
    );
    return response.data;
  },

  /**
   * Bulk update costs (CSV import)
   */
  bulkUpdateCosts: async (data: BulkCostUpdate): Promise<{
    created: number;
    updated: number;
    errors: string[];
  }> => {
    const response = await axiosClient.post('/admin/marketing/costs/bulk', data);
    return response.data;
  },

  /**
   * Calculate ROI for date range
   */
  calculateROI: async (params: {
    dateFrom: string;
    dateTo: string;
    sources?: string;
  }): Promise<ROIResult[]> => {
    const response = await axiosClient.get('/admin/marketing/roi', { params });
    return response.data;
  },

  /**
   * Get monthly cost summary
   */
  getMonthlySummary: async (params: {
    dateFrom: string;
    dateTo: string;
  }): Promise<MonthlyCostSummary[]> => {
    const response = await axiosClient.get('/admin/marketing/costs/summary/monthly', { params });
    return response.data;
  },

  /**
   * Get cost vs revenue comparison
   */
  getCostRevenueComparison: async (params: {
    dateFrom: string;
    dateTo: string;
  }): Promise<CostRevenueComparison> => {
    const response = await axiosClient.get('/admin/marketing/cost-revenue', { params });
    return response.data;
  },
};

export default marketingCostApi;
