export type KPIReportPeriod = 'day' | 'week' | 'month' | 'year' | 'custom';

export interface IKPIMetric {
  label: string;
  value: number;
  unit?: string;
  changePercentage?: number;
  trend?: 'up' | 'down' | 'flat';
  description?: string;
}

export interface IKPIFinancialBreakdownItem {
  type: string;
  amount: number;
  percentage: number;
}

export interface IFinancialReportItem {
  month: string;
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  profitMargin: number;
  paymentSuccessRate?: number;
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

export interface IKPIFinancialSection {
  stats: IFinancialStats;
  latestMonth?: IFinancialReportItem;
  previousMonth?: IFinancialReportItem;
  revenueByType: IKPIFinancialBreakdownItem[];
  costsByType: IKPIFinancialBreakdownItem[];
}

export interface IKPIFunnelStage {
  stage: string;
  count: number;
  percentage: number;
}

export interface IKPIFunnelSection {
  totalLeads: number;
  convertedLeads: number;
  declinedLeads: number;
  conversionRate: number;
  avgConversionDays: number;
  averageRequestedAmount: number;
  stageBreakdown: IKPIFunnelStage[];
}

export interface IFunnelTechnikStats {
  totalHandedToTechnician: number;
  approved: number;
  rejected: number;
  inProgress: number;
  approvalRate: number;
  rejectionRate: number;
  averageDaysInReview: number;
}

export interface IKPITechnicianReason {
  reason: string;
  count: number;
  percentage: number;
}

export interface IKPITechnicianStatus {
  status: string;
  count: number;
  percentage: number;
}

export interface IKPITechnicianSection {
  stats: IFunnelTechnikStats;
  declinedReasons: IKPITechnicianReason[];
  statusBreakdown: IKPITechnicianStatus[];
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

export interface IKPIFleetBrand {
  brand: string;
  count: number;
  totalValue: number;
  percentage: number;
}

export interface IKPIFleetMileageBucket {
  range: string;
  count: number;
  percentage: number;
}

export interface IKPIFleetSection {
  stats: ICarStats;
  topBrands: IKPIFleetBrand[];
  mileageBreakdown: IKPIFleetMileageBucket[];
}

export interface IKPIRiskOverview {
  lateLeases: number;
  unpaidInvoices: number;
  debtCollectionCases: number;
  paymentSuccessRate: number;
}

export interface IKPIInvestorReportData {
  dateFrom: string;
  dateTo: string;
  summary: IKPIMetric[];
  highlights: IKPIMetric[];
  financial: IKPIFinancialSection;
  funnel: IKPIFunnelSection;
  technician: IKPITechnicianSection;
  fleet: IKPIFleetSection;
  risk: IKPIRiskOverview;
}
