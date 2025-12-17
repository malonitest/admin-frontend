/**
 * Excel Export for CFO P/L Report
 * No Czech diacritics allowed
 */

import * as XLSX from 'xlsx';
import { IFinancialReportData } from '../types';
import { formatCzk, formatPercent, formatDate } from '../utils/formatters';

/**
 * Export financial report to Excel (.xlsx)
 * @param data - Financial report data
 * @param filename - Output filename (without extension)
 */
export const exportToExcel = (
  data: IFinancialReportData,
  filename?: string
): void => {
  try {
    const workbook = XLSX.utils.book_new();
    
    // Sheet 1: Monthly P/L
    const monthlySheet = createMonthlyPLSheet(data);
    XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly_PnL');
    
    // Sheet 2: Invoices
    const invoicesSheet = createInvoicesSheet(data);
    XLSX.utils.book_append_sheet(workbook, invoicesSheet, 'Invoices');
    
    // Sheet 3: Payments
    const paymentsSheet = createPaymentsSheet(data);
    XLSX.utils.book_append_sheet(workbook, paymentsSheet, 'Payments');
    
    // Generate filename
    const dateFrom = formatDate(data.dateFrom).replace(/\./g, '-');
    const dateTo = formatDate(data.dateTo).replace(/\./g, '-');
    const finalFilename = filename || `PL_CFO_${dateFrom}_to_${dateTo}.xlsx`;
    
    // Write file
    XLSX.writeFile(workbook, finalFilename);
    
    console.log(`Excel file exported: ${finalFilename}`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Failed to export Excel file');
  }
};

/**
 * Create Monthly P/L sheet
 */
const createMonthlyPLSheet = (data: IFinancialReportData): XLSX.WorkSheet => {
  const { monthlyData, stats } = data;
  
  // Prepare data rows
  const rows: any[] = [];
  
  // Header row 1
  rows.push([
    'Mesic',
    'Najem', 'Admin', 'Pojisteni', 'Poplatky', 'Ostatni', 'Celkem prijmy',
    'Odkup aut', 'Pojisteni', 'Udrzba', 'Provoz', 'Ostatni', 'Celkem naklady',
    'Hruby zisk', 'Cisty zisk', 'Marze %',
    'Aktivni', 'Nove', 'Vykoupeno', 'Prum. najem', 'Uspesnost %'
  ]);
  
  // Data rows
  monthlyData.forEach(month => {
    rows.push([
      month.monthLabel || month.month,
      month.rentPayments,
      month.adminFees,
      month.insuranceFees,
      month.latePaymentFees,
      month.otherRevenue,
      month.totalRevenue,
      month.carPurchases,
      month.insuranceCosts,
      month.maintenanceCosts,
      month.operationalCosts,
      month.otherCosts,
      month.totalCosts,
      month.grossProfit,
      month.netProfit,
      month.profitMargin,
      month.activeLeases,
      month.newLeases,
      month.carPurchasesCount,
      month.averageRentPayment,
      month.paymentSuccessRate
    ]);
  });
  
  // Total row
  rows.push([
    'CELKEM',
    monthlyData.reduce((sum, m) => sum + m.rentPayments, 0),
    monthlyData.reduce((sum, m) => sum + m.adminFees, 0),
    monthlyData.reduce((sum, m) => sum + m.insuranceFees, 0),
    monthlyData.reduce((sum, m) => sum + m.latePaymentFees, 0),
    monthlyData.reduce((sum, m) => sum + m.otherRevenue, 0),
    stats.totalRevenue,
    monthlyData.reduce((sum, m) => sum + m.carPurchases, 0),
    monthlyData.reduce((sum, m) => sum + m.insuranceCosts, 0),
    monthlyData.reduce((sum, m) => sum + m.maintenanceCosts, 0),
    monthlyData.reduce((sum, m) => sum + m.operationalCosts, 0),
    monthlyData.reduce((sum, m) => sum + m.otherCosts, 0),
    stats.totalCosts,
    monthlyData.reduce((sum, m) => sum + m.grossProfit, 0),
    stats.totalProfit,
    stats.profitMargin,
    '', '', '',
    stats.averageMonthlyRevenue,
    ''
  ]);
  
  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 15 }, // Month
    { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, // Revenue
    { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, // Costs
    { wch: 12 }, { wch: 12 }, { wch: 10 }, // Profit
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 } // Operations
  ];
  
  return worksheet;
};

/**
 * Create Invoices sheet
 */
const createInvoicesSheet = (data: IFinancialReportData): XLSX.WorkSheet => {
  const { invoices } = data;
  
  const rows: any[] = [];
  
  // Header
  rows.push([
    'Invoice ID',
    'Invoice Number',
    'Lease ID',
    'Customer ID',
    'Customer Name',
    'Amount',
    'Due Date',
    'Paid Date',
    'Status',
    'Type',
    'Month'
  ]);
  
  // Data rows
  invoices.forEach(inv => {
    rows.push([
      inv.invoiceId,
      inv.invoiceNumber,
      inv.leaseId,
      inv.customerId,
      inv.customerName,
      inv.amount,
      formatDate(inv.dueDate),
      inv.paidDate ? formatDate(inv.paidDate) : '',
      inv.status,
      inv.type,
      inv.month
    ]);
  });
  
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 25 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 10 }
  ];
  
  return worksheet;
};

/**
 * Create Payments sheet
 */
const createPaymentsSheet = (data: IFinancialReportData): XLSX.WorkSheet => {
  const { payments } = data;
  
  const rows: any[] = [];
  
  // Header
  rows.push([
    'Payment ID',
    'Lease ID',
    'Customer ID',
    'Customer Name',
    'Amount',
    'Payment Date',
    'Type',
    'Status',
    'Month'
  ]);
  
  // Data rows
  payments.forEach(pmt => {
    rows.push([
      pmt.paymentId,
      pmt.leaseId,
      pmt.customerId,
      pmt.customerName,
      pmt.amount,
      formatDate(pmt.paymentDate),
      pmt.type,
      pmt.status,
      pmt.month
    ]);
  });
  
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }
  ];
  
  return worksheet;
};

/**
 * Export financial report to CSV
 * @param data - Financial report data
 * @param filename - Output filename (without extension)
 */
export const exportToCSV = (
  data: IFinancialReportData,
  filename?: string
): void => {
  try {
    const { monthlyData } = data;
    
    // Prepare CSV content
    const headers = [
      'Mesic', 'Prijmy', 'Naklady', 'Zisk', 'Marze %',
      'Aktivni', 'Nove', 'Vykoupeno'
    ].join(',');
    
    const rows = monthlyData.map(month => [
      month.monthLabel || month.month,
      month.totalRevenue,
      month.totalCosts,
      month.netProfit,
      month.profitMargin,
      month.activeLeases,
      month.newLeases,
      month.carPurchasesCount
    ].join(','));
    
    const csvContent = [headers, ...rows].join('\n');
    
    // Generate filename
    const dateFrom = formatDate(data.dateFrom).replace(/\./g, '-');
    const dateTo = formatDate(data.dateTo).replace(/\./g, '-');
    const finalFilename = filename || `PL_CFO_${dateFrom}_to_${dateTo}.csv`;
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = finalFilename;
    link.click();
    
    console.log(`CSV file exported: ${finalFilename}`);
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw new Error('Failed to export CSV file');
  }
};
