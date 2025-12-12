export type CollectionReportPeriod = 'day' | 'week' | 'month' | 'year' | 'custom';

export interface ICollectionKPI {
  totalCustomers: number;
  totalOverdueAmount: number;
  averageDaysOverdue: number;
  maxDaysOverdue: number;
}

export interface ICollectionCustomer {
  id: string;
  customerId: string;
  customerName: string;
  leaseId?: string;
  dueDate: string;
  daysOverdue: number;
  totalDueAmount: number;
  notes?: string;
  status: string;
}

export interface ICollectionReportResponse {
  dateFrom: string;
  dateTo: string;
  kpi: ICollectionKPI;
  customers: ICollectionCustomer[];
}
