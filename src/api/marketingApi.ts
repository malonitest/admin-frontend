/**
 * Marketing API Client
 * API calls for marketing analytics and cost tracking
 */

import axiosClient from './axiosClient';

// ==================== TYPES ====================

export interface MarketingOverview {
  dateFrom: string;
  dateTo: string;
  totalLeads: number;
  totalConversions: number;
  overallConversionRate: number;
  totalRevenue: number;
  sources: SourceMetrics[];
  topPerformingSource: string;
  worstPerformingSource: string;
}

export interface SourceMetrics {
  source: string;
  totalLeads: number;
  convertedLeads: number;
  declinedLeads: number;
  inProgressLeads: number;
  conversionRate: number;
  declineRate: number;
  avgTimeToConversion: number;
  avgLeaseValue: number;
  totalRevenue: number;
}

export interface StatusBreakdown {
  source: string;
  statuses: {
    status: string;
    count: number;
    percentage: number;
  }[];
}

export interface TimeSeries {
  source: string;
  timeSeries: {
    date: string;
    leads: number;
    conversions: number;
    conversionRate: number;
  }[];
}

export interface DeclineReason {
  source: string;
  reasons: {
    reason: string;
    count: number;
    percentage: number;
  }[];
}

export interface CampaignStats {
  campaign: string;
  source: string;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  totalRevenue: number;
}

export interface UTMAnalysis {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string | null;
  utmContent: string | null;
  leads: number;
  conversions: number;
  conversionRate: number;
}

export interface GeographicData {
  region: string;
  sources: {
    source: string;
    leads: number;
    conversions: number;
  }[];
}

export interface QualityMetrics {
  source: string;
  avgCustomerAge: number;
  avgCarValue: number;
  avgLeaseAmount: number;
  avgLeaseDuration: number;
  customerTypes: {
    type: string;
    count: number;
    percentage: number;
  }[];
}

export interface DealerPerformance {
  dealerId: string;
  dealerName: string;
  sources: {
    source: string;
    leads: number;
    conversions: number;
    conversionRate: number;
  }[];
}

export interface FunnelAnalysis {
  source: string;
  stages: {
    stage: string;
    count: number;
    percentage: number;
    dropOff?: number;
    dropOffRate?: number;
  }[];
}

export interface SourceComparison {
  sources: string[];
  dateFrom: string;
  dateTo: string;
  metrics: {
    metric: string;
    values: Record<string, number>;
  }[];
}

export interface MarketingCost {
  id: string;
  source: string;
  month: string;
  cost: number;
  currency: string;
  notes?: string;
  createdBy?: {
    id: string;
    name: string;
  };
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
  roi: number;
  roas: number;
  cpl: number;
  cpa: number;
  leads: number;
  conversions: number;
  conversionRate: number;
}

// ==================== QUERY PARAMETERS ====================

export interface MarketingQueryParams {
  period?: 'day' | 'week' | 'month' | 'year';
  dateFrom?: string;
  dateTo?: string;
  sources?: string[];
  dealers?: string[];
  statuses?: string[];
  includeUTM?: boolean;
  includeGeo?: boolean;
  includeQuality?: boolean;
}

export interface CostQueryParams {
  source?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  limit?: number;
  page?: number;
}

// ==================== API CLIENT ====================

export const marketingApi = {
  // ========== ANALYTICS ENDPOINTS ==========
  
  /**
   * Get marketing overview with all sources
   */
  getOverview: async (params?: MarketingQueryParams): Promise<MarketingOverview> => {
    const response = await axiosClient.get('/admin/marketing/overview', { params });
    return response.data;
  },

  /**
   * Get status breakdown by source
   */
  getStatusBreakdown: async (params?: MarketingQueryParams): Promise<StatusBreakdown[]> => {
    const response = await axiosClient.get('/admin/marketing/status-breakdown', { params });
    return response.data;
  },

  /**
   * Get time series data
   */
  getTimeSeries: async (params?: MarketingQueryParams): Promise<TimeSeries[]> => {
    const response = await axiosClient.get('/admin/marketing/time-series', { params });
    return response.data;
  },

  /**
   * Get decline reasons by source
   */
  getDeclineReasons: async (params?: MarketingQueryParams): Promise<DeclineReason[]> => {
    const response = await axiosClient.get('/admin/marketing/decline-reasons', { params });
    return response.data;
  },

  /**
   * Get campaign statistics
   */
  getCampaigns: async (params?: MarketingQueryParams): Promise<CampaignStats[]> => {
    const response = await axiosClient.get('/admin/marketing/campaigns', { params });
    return response.data;
  },

  /**
   * Get UTM analysis
   */
  getUTMAnalysis: async (params?: MarketingQueryParams): Promise<UTMAnalysis[]> => {
    const response = await axiosClient.get('/admin/marketing/utm', { params });
    return response.data;
  },

  /**
   * Get geographic distribution
   */
  getGeographic: async (params?: MarketingQueryParams): Promise<GeographicData[]> => {
    const response = await axiosClient.get('/admin/marketing/geographic', { params });
    return response.data;
  },

  /**
   * Get lead quality metrics
   */
  getQuality: async (params?: MarketingQueryParams): Promise<QualityMetrics[]> => {
    const response = await axiosClient.get('/admin/marketing/quality', { params });
    return response.data;
  },

  /**
   * Get dealer performance by source
   */
  getDealerPerformance: async (params?: MarketingQueryParams): Promise<DealerPerformance[]> => {
    const response = await axiosClient.get('/admin/marketing/dealer-performance', { params });
    return response.data;
  },

  /**
   * Get funnel analysis
   */
  getFunnel: async (params?: MarketingQueryParams): Promise<FunnelAnalysis[]> => {
    const response = await axiosClient.get('/admin/marketing/funnel', { params });
    return response.data;
  },

  /**
   * Get detailed report (all data combined)
   */
  getDetailedReport: async (params?: MarketingQueryParams): Promise<any> => {
    const response = await axiosClient.get('/admin/marketing/report', { params });
    return response.data;
  },

  /**
   * Compare multiple sources side-by-side
   */
  compareSources: async (sources: string[], params?: MarketingQueryParams): Promise<SourceComparison> => {
    const response = await axiosClient.get('/admin/marketing/compare', {
      params: {
        ...params,
        sources,
      },
    });
    return response.data;
  },

  // ========== COST TRACKING ENDPOINTS ==========

  /**
   * Get all marketing costs
   */
  getCosts: async (params?: CostQueryParams): Promise<{ results: MarketingCost[] }> => {
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
   * Create marketing cost
   */
  createCost: async (data: Partial<MarketingCost>): Promise<MarketingCost> => {
    const response = await axiosClient.post('/admin/marketing/costs', data);
    return response.data;
  },

  /**
   * Update marketing cost
   */
  updateCost: async (costId: string, data: Partial<MarketingCost>): Promise<MarketingCost> => {
    const response = await axiosClient.patch(`/admin/marketing/costs/${costId}`, data);
    return response.data;
  },

  /**
   * Delete marketing cost
   */
  deleteCost: async (costId: string): Promise<void> => {
    await axiosClient.delete(`/admin/marketing/costs/${costId}`);
  },

  /**
   * Calculate ROI for date range
   */
  calculateROI: async (dateFrom: string, dateTo: string, sources?: string[]): Promise<ROIResult[]> => {
    const response = await axiosClient.get('/admin/marketing/roi', {
      params: { dateFrom, dateTo, sources: sources?.join(',') },
    });
    return response.data;
  },

  /**
   * Get monthly cost summary
   */
  getMonthlySummary: async (dateFrom: string, dateTo: string): Promise<any> => {
    const response = await axiosClient.get('/admin/marketing/costs/summary/monthly', {
      params: { dateFrom, dateTo },
    });
    return response.data;
  },

  /**
   * Get cost vs revenue comparison
   */
  getCostRevenueComparison: async (dateFrom: string, dateTo: string): Promise<any> => {
    const response = await axiosClient.get('/admin/marketing/cost-revenue', {
      params: { dateFrom, dateTo },
    });
    return response.data;
  },

  /**
   * Bulk update costs (CSV import)
   */
  bulkUpdateCosts: async (costs: Partial<MarketingCost>[]): Promise<any> => {
    const response = await axiosClient.post('/admin/marketing/costs/bulk', { costs });
    return response.data;
  },

  /**
   * Get cost for specific source and month
   */
  getCostBySourceMonth: async (source: string, month: string): Promise<MarketingCost> => {
    const response = await axiosClient.get(
      `/admin/marketing/costs/${encodeURIComponent(source)}/${month}`
    );
    return response.data;
  },
};

export default marketingApi;
