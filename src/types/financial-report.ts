import type { KPIReportPeriod } from './kpi-report';

export interface IFinancialCategoryItem {
  type: string;
  label: string;
  amount: number;
  count?: number;
  percentage?: number;
  description?: string;
}

export interface IFinancialProfitSummary {
  grossProfit: number;
  netProfit: number;
  profitMarginPercentage: number;
}

export interface IFinancialMonthlyOverview {
  revenue: IFinancialCategoryItem[];
  costs: IFinancialCategoryItem[];
  profit: IFinancialProfitSummary;
}

export interface IFinancialStatsOverview {
  activeLeases: number;
  newLeases: number;
  completedLeases: number;
  averageInstallment: number;
  paymentSuccessRate: number;
}

export type InvoiceStatus = 'PAID' | 'UNPAID' | 'OVERDUE';
export type InvoiceType = 'RENT' | 'ADMIN_FEE' | 'INSURANCE' | 'LATE_FEE' | 'OTHER';

export interface IFinancialInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  dueDate: string;
  paidDate?: string | null;
  status: InvoiceStatus;
  type: InvoiceType;
}

export type PaymentStatus = 'COMPLETED' | 'PENDING' | 'FAILED';
export type PaymentType = 'BANK_TRANSFER' | 'CARD' | 'CASH' | 'OTHER';

export interface IFinancialPayment {
  id: string;
  leaseId: string;
  customerName: string;
  amount: number;
  paidAt: string;
  type: PaymentType;
  status: PaymentStatus;
}

export interface IFinancialBreakdownItem {
  type: string;
  label: string;
  amount: number;
  percentage: number;
}

export interface IFinancialReportData {
  generatedAt: string;
  period: {
    appliedPreset: Exclude<KPIReportPeriod, 'custom'> | null;
    label: string;
    dateFrom: string;
    dateTo: string;
  };
  monthlyOverview: IFinancialMonthlyOverview;
  totals: {
    revenue: number;
    costs: number;
    grossProfit: number;
    netProfit: number;
    profitMarginPercentage: number;
    carBuyoutsCount: number;
    carBuyoutsAmount: number;
  };
  stats: IFinancialStatsOverview;
  invoices: IFinancialInvoice[];
  payments: IFinancialPayment[];
  revenueBreakdown: IFinancialBreakdownItem[];
  costBreakdown: IFinancialBreakdownItem[];
}
