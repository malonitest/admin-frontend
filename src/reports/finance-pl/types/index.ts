/**
 * Type definitions for CFO P/L Report
 * No Czech diacritics allowed
 */

// Re-export types from API documentation
export interface IFinancialReportItem {
  month: string;
  monthLabel: string;
  
  // Revenue
  rentPayments: number;
  adminFees: number;
  insuranceFees: number;
  latePaymentFees: number;
  otherRevenue: number;
  totalRevenue: number;
  
  // Costs
  carPurchases: number;
  carPurchasesCount: number;
  insuranceCosts: number;
  maintenanceCosts: number;
  operationalCosts: number;
  otherCosts: number;
  totalCosts: number;
  
  // Profit/Loss
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  
  // Statistics
  activeLeases: number;
  newLeases: number;
  endedLeases: number;
  averageRentPayment: number;
  paymentSuccessRate: number;
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

export interface IInvoiceItem {
  invoiceId: string;
  invoiceNumber: string;
  leaseId: string;
  customerId: string;
  customerName: string;
  amount: number;
  dueDate: Date | string;
  paidDate?: Date | string;
  status: string;
  type: string;
  month: string;
}

export interface IPaymentItem {
  paymentId: string;
  leaseId: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentDate: Date | string;
  type: string;
  month: string;
  status: string;
}

export interface IFinancialReportData {
  dateFrom: Date | string;
  dateTo: Date | string;
  stats: IFinancialStats;
  monthlyData: IFinancialReportItem[];
  invoices: IInvoiceItem[];
  payments: IPaymentItem[];
  revenueByType: Array<{
    type: string;
    amount: number;
    percentage: number;
  }>;
  costsByType: Array<{
    type: string;
    amount: number;
    percentage: number;
  }>;
}

// Additional types for UI components
export interface IAgingBucket {
  bucket: string;
  count: number;
  amount: number;
  days: number;
}

export interface IReconciliationItem {
  month: string;
  type: string;
  expected: number;
  actual: number;
  diff: number;
  diffPct: number;
}

export interface ICFOInsight {
  category: 'revenue' | 'costs' | 'profit' | 'operations' | 'recommendations';
  priority: 'high' | 'medium' | 'low';
  message: string;
  metric?: string;
  value?: number;
}

export type ViewMode = 'summary' | 'detailed' | 'audit';

export interface IFilterState {
  viewMode: ViewMode;
  monthRange?: [string, string];
  showNegativeOnly?: boolean;
}

export interface IValidationIssue {
  severity: 'error' | 'warning';
  message: string;
}
