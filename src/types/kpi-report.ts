export type KPIReportPeriod = 'day' | 'week' | 'month' | 'year' | 'custom';

export type KPIValueUnit = 'czk' | 'percentage' | 'count' | 'ratio' | 'days' | 'hours' | 'items';

export interface IKPITrendItem {
  label: string;
  value: number;
  unit: KPIValueUnit;
  changePercentage?: number;
  trend?: 'up' | 'down' | 'flat';
  helperText?: string;
}

export interface IKPIHighlight extends IKPITrendItem {
  description?: string;
}

export interface IKPIBreakdownItem {
  label: string;
  value: number;
  percentage?: number;
}

export interface IKPIFinancialComparison {
  label: string;
  revenue: number;
  costs: number;
  netProfit: number;
  marginPercentage?: number;
}

export interface IKPIFinancialOverview {
  totals: {
    revenue: number;
    costs: number;
    netProfit: number;
    marginPercentage?: number;
  };
  latestMonth: IKPIFinancialComparison;
  previousMonth: IKPIFinancialComparison;
  revenueByType: IKPIBreakdownItem[];
  costsByType: IKPIBreakdownItem[];
}

export interface IKPIFunnelStage extends IKPIBreakdownItem {
  stage?: string;
  count: number;
}

export interface IKPIFunnelOverview {
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  avgConversionDays: number;
  stageBreakdown: IKPIFunnelStage[];
}

export interface IKPITechnicianOverview {
  totalInspections: number;
  approved: number;
  declined: number;
  approvalRate: number;
  avgInspectionTimeHours: number;
  queueSize: number;
  statusBreakdown: IKPIBreakdownItem[];
  declinedReasons: IKPIBreakdownItem[];
}

export interface IKPIFleetBrand {
  brand: string;
  count: number;
  percentage?: number;
  value?: number;
}

export interface IKPIFleetOverview {
  activeCars: number;
  fleetValue: number;
  utilizationRate: number;
  carsInMaintenance: number;
  avgMileage: number;
  topBrands: IKPIFleetBrand[];
  mileageBreakdown: IKPIBreakdownItem[];
}

export interface IKPIRiskOverview {
  lateLeases: number;
  unpaidInvoices: number;
  debtCollectionCases: number;
  paymentSuccessRate: number;
}

export interface IKPIInvestorReportData {
  generatedAt: string;
  period: {
    appliedPreset: Exclude<KPIReportPeriod, 'custom'> | null;
    label: string;
    dateFrom: string;
    dateTo: string;
  };
  summary: IKPITrendItem[];
  highlights: IKPIHighlight[];
  financials: IKPIFinancialOverview;
  funnel: IKPIFunnelOverview;
  technician: IKPITechnicianOverview;
  fleet: IKPIFleetOverview;
  risk: IKPIRiskOverview;
}
