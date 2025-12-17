// Reporting database types

export interface DailySummary {
  date: string;
  year: number;
  month: number;
  quarter: number;
  
  // Leads
  newLeads: number;
  convertedLeads: number;
  declinedLeads: number;
  conversionRate: number;
  
  // Leases
  activeLeases: number;
  newLeases: number;
  closedLeases: number;
  overdueLeases: number;
  
  // Financial
  totalRevenue: number;
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  averagePayment: number;
  
  exportedAt: string;
  exportVersion: number;
}

export interface DailySummaryResponse {
  period: {
    from: string;
    to: string;
    days: number;
  };
  totals: {
    newLeads: number;
    convertedLeads: number;
    declinedLeads: number;
    totalRevenue: number;
    totalPayments: number;
  };
  averages: {
    conversionRate: number;
    activeLeases: number;
    dailyRevenue: number;
  };
  timeSeries: DailySummary[];
}

export interface LeadsAnalytics {
  summary: {
    totalLeads: number;
    convertedLeads: number;
    declinedLeads: number;
    conversionRate: number;
  };
  aggregations: Record<string, Array<{
    value: string;
    count: number;
    converted?: number;
    declined?: number;
    conversionRate?: number;
  }>>;
  timeSeries: Array<{
    year: number;
    month: number;
    total: number;
    converted: number;
    conversionRate: number;
  }>;
  topItems: Array<{
    uniqueId: number; // PRIMARY KEY (6-digit number)
    status: string;
    source: string;
    createdAt: string;
    customerName: string;
    requestedAmount: number;
    timeToConversion?: number;
  }>;
}

export interface LeasesAnalytics {
  summary: {
    totalLeases: number;
    activeLeases: number;
    closedLeases: number;
    overdueLeases: number;
    problemLeases: number;
    totalLeaseAmount: number;
    totalPaid: number;
    avgPaymentSuccessRate: number;
  };
  aggregations: Record<string, Array<{
    value: string;
    count: number;
    active?: number;
    overdue?: number;
    closed?: number;
    totalAmount: number;
  }>>;
  topItems: Array<{
    uniqueId: string; // Lease uniqueId
    leadUniqueId: number; // FOREIGN KEY to Lead (6-digit number)
    status: string;
    customerName: string;
    carBrand: string;
    carModel: string;
    leaseAmount: number;
    totalPaid: number;
    remainingBalance: number;
    createdAt: string;
  }>;
}

export interface FinancialAnalytics {
  summary: {
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
    successRate: number;
    totalAmount: number;
    avgAmount: number;
  };
  aggregations: Record<string, Array<{
    value: string;
    count: number;
    successful: number;
    totalAmount: number;
  }>>;
  topItems: Array<{
    transactionId: string;
    leadUniqueId?: number; // FOREIGN KEY to Lead (6-digit number)
    type: string;
    amount: number;
    status: string;
    customerName: string;
    createdAt: string;
    isSuccessful: boolean;
  }>;
}

export interface ReportingFilters {
  dateFrom?: string;
  dateTo?: string;
  period?: 'day' | 'week' | 'month' | 'year' | '30d' | '90d';
  groupBy?: string[];
}

// Funnel Technik Types

export interface FunnelTechnikNote {
  text: string;
  date: string;
  author: string;
}

export interface FunnelTechnikLeadItem {
  leadId: string;
  uniqueId: number;
  customerName: string;
  customerPhone: string;
  carBrand: string;
  carModel: string;
  carVIN: string;
  requestedAmount: number;
  handedToTechnicianDate: string;
  currentStatus: string;
  currentStatusLabel: string;
  declinedReason?: string;
  declinedReasonLabel?: string;
  notes?: FunnelTechnikNote[];
  daysInTechnicianReview: number;
}

export interface FunnelTechnikStats {
  totalHandedToTechnician: number;
  approved: number;
  rejected: number;
  inProgress: number;
  approvalRate: number;
  rejectionRate: number;
  averageDaysInReview: number;
}

export interface FunnelTechnikDeclinedReason {
  reason: string;
  count: number;
  percentage: number;
}

export interface FunnelTechnikStatusBreakdown {
  status: string;
  count: number;
  percentage: number;
}

export interface FunnelTechnikReportData {
  dateFrom: string;
  dateTo: string;
  stats: FunnelTechnikStats;
  leads: FunnelTechnikLeadItem[];
  declinedReasons: FunnelTechnikDeclinedReason[];
  statusBreakdown: FunnelTechnikStatusBreakdown[];
}

// Type aliases with I prefix for compatibility
export type IFunnelTechnikReportData = FunnelTechnikReportData;
export type IFunnelTechnikLeadItem = FunnelTechnikLeadItem;
export type IFunnelTechnikStats = FunnelTechnikStats;

// KPI Investor Report Types

export interface IKPIMetric {
  label: string;
  value: number;
  unit?: string;
  changePercentage?: number;
  trend?: 'up' | 'down' | 'flat';
  description?: string;
}

export interface IFinancialStats {
  totalRevenue: number;
  totalCosts: number;
  totalProfit: number;
  averageMonthlyRevenue: number;
  averageMonthlyProfit: number;
  profitMargin: number;
  totalCarsPurchased: number;
  totalCarsPurchasedValue: number;
  activeLeases: number;
  totalLeaseValue: number;
}

export interface IFinancialReportItem {
  month: string;
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  profitMargin: number;
  paymentSuccessRate: number;
}

export interface ICarStats {
  totalCars: number;
  totalPurchaseValue: number;
  totalEstimatedValue: number;
  averagePurchasePrice: number;
  averageEstimatedValue: number;
  averageMileage: number;
  averageAge: number;
}

export interface IKPIInvestorReportData {
  dateFrom: string;
  dateTo: string;
  summary: IKPIMetric[];
  highlights: IKPIMetric[];
  financial: {
    stats: IFinancialStats;
    latestMonth?: IFinancialReportItem;
    previousMonth?: IFinancialReportItem;
    revenueByType: Array<{ type: string; amount: number; percentage: number }>;
    costsByType: Array<{ type: string; amount: number; percentage: number }>;
  };
  funnel: {
    totalLeads: number;
    convertedLeads: number;
    declinedLeads: number;
    conversionRate: number;
    avgConversionDays: number;
    averageRequestedAmount: number;
    stageBreakdown: Array<{ stage: string; count: number; percentage: number }>;
  };
  technician: {
    stats: FunnelTechnikStats;
    declinedReasons: Array<{ reason: string; count: number; percentage: number }>;
    statusBreakdown: Array<{ status: string; count: number; percentage: number }>;
  };
  fleet: {
    stats: ICarStats;
    topBrands: Array<{ brand: string; count: number; totalValue: number; percentage: number }>;
    mileageBreakdown: Array<{ range: string; count: number; percentage: number }>;
  };
  risk: {
    lateLeases: number;
    unpaidInvoices: number;
    debtCollectionCases: number;
    paymentSuccessRate: number;
  };
}

// Funnel General Report Types

export interface IFunnelNote {
  text: string;
  date: Date;
  author: string;
}

export interface IFunnelDeclinedReason {
  reason: string;
  count: number;
  percentage: number;
}

export interface IFunnelStageData {
  stage: string;
  count: number;
  percentage: number;
  declinedReasons?: IFunnelDeclinedReason[];
  notes?: IFunnelNote[];
}

export interface IFunnelReportData {
  dateFrom: Date;
  dateTo: Date;
  stages: IFunnelStageData[];
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  declinedLeads: number;
  declinedReasons: IFunnelDeclinedReason[];
  averageTimeInStages: Record<string, number>;
}

export interface IDropOff {
  from: string;
  to: string;
  dropCount: number;
  dropRate: number;
}
