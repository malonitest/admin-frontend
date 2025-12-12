export interface IFinancialReportItem {
  month: string;
  monthLabel: string;
  rentPayments: number;
  adminFees: number;
  insuranceFees: number;
  latePaymentFees: number;
  otherRevenue: number;
  totalRevenue: number;
  carPurchases: number;
  carPurchasesCount: number;
  insuranceCosts: number;
  maintenanceCosts: number;
  operationalCosts: number;
  otherCosts: number;
  totalCosts: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
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

export type InvoiceStatus = 'PAID' | 'UNPAID' | 'OVERDUE' | string;
export type InvoiceType = 'RENT' | 'ADMIN_FEE' | 'INSURANCE' | 'LATE_FEE' | 'OTHER' | string;

export interface IInvoiceItem {
  invoiceId: string;
  invoiceNumber: string;
  leaseId: string;
  customerId: string;
  customerName: string;
  amount: number;
  dueDate: string;
  paidDate?: string | null;
  status: InvoiceStatus;
  type: InvoiceType;
  month: string;
}

export type PaymentStatus = 'COMPLETED' | 'PENDING' | 'FAILED' | string;
export type PaymentType =
  | 'RENT'
  | 'ADMIN_FEE'
  | 'INSURANCE'
  | 'LATE_FEE'
  | 'OTHER'
  | 'BANK_TRANSFER'
  | 'CARD'
  | 'CASH'
  | string;

export interface IPaymentItem {
  paymentId: string;
  leaseId: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentDate: string;
  type: PaymentType;
  month: string;
  status: PaymentStatus;
}

export interface IFinancialBreakdownItem {
  type: string;
  amount: number;
  percentage: number;
}

export interface IFinancialReportData {
  dateFrom: string;
  dateTo: string;
  stats: IFinancialStats;
  monthlyData: IFinancialReportItem[];
  invoices: IInvoiceItem[];
  payments: IPaymentItem[];
  revenueByType: IFinancialBreakdownItem[];
  costsByType: IFinancialBreakdownItem[];
}
