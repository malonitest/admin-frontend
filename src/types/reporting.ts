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
