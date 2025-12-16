/**
 * Export utilities for Funnel Technik Report
 * No Czech diacritics - ASCII only
 */

import { IFunnelTechnikReportData, IFunnelTechnikLeadItem } from '../../../types/reporting';
import { formatDate, formatDateTime, getFullVin, formatCarName } from './formatters';
import { getLastNote } from './calculations';

/**
 * Export report to JSON
 */
export const exportToJson = (data: IFunnelTechnikReportData): string => {
  const exportData = {
    reportType: 'Funnel Technik Report',
    generatedAt: new Date().toISOString(),
    period: {
      dateFrom: data.dateFrom,
      dateTo: data.dateTo
    },
    stats: data.stats,
    statusBreakdown: data.statusBreakdown,
    declinedReasons: data.declinedReasons,
    leads: data.leads.map((lead: IFunnelTechnikLeadItem) => ({
      ...lead,
      carVIN: getFullVin(lead.carVIN), // Full VIN in export
      requestedAmount: lead.requestedAmount,
      handedToTechnicianDate: lead.handedToTechnicianDate,
      daysInTechnicianReview: lead.daysInTechnicianReview,
      notes: lead.notes
    }))
  };

  return JSON.stringify(exportData, null, 2);
};

/**
 * Download JSON file
 */
export const downloadJson = (data: IFunnelTechnikReportData): void => {
  const json = exportToJson(data);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const filename = `funnel-technik-report-${formatDate(data.dateFrom)}-${formatDate(data.dateTo)}.json`;
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  
  URL.revokeObjectURL(url);
};

/**
 * Export to CSV
 */
export const exportToCsv = (data: IFunnelTechnikReportData): string => {
  const headers = [
    'UniqueID',
    'Zakaznik',
    'Telefon',
    'Auto',
    'VIN',
    'Pozadovana castka',
    'Datum predani',
    'Aktualni status',
    'Dny v kontrole',
    'Duvod zamitnuti',
    'Posledni poznamka'
  ];

  const rows = data.leads.map((lead: IFunnelTechnikLeadItem) => {
    const lastNote = getLastNote(lead.notes);
    
    return [
      lead.uniqueId || '',
      lead.customerName || '',
      lead.customerPhone || '',
      formatCarName(lead.carBrand, lead.carModel),
      getFullVin(lead.carVIN), // Full VIN in export
      lead.requestedAmount || 0,
      formatDate(lead.handedToTechnicianDate),
      lead.currentStatusLabel || lead.currentStatus || '',
      lead.daysInTechnicianReview || 0,
      lead.declinedReasonLabel || lead.declinedReason || '',
      lastNote?.text || ''
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map((row: (string | number)[]) => row.map((cell: string | number) => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
};

/**
 * Download CSV file
 */
export const downloadCsv = (data: IFunnelTechnikReportData): void => {
  const csv = exportToCsv(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const filename = `funnel-technik-report-${formatDate(data.dateFrom)}-${formatDate(data.dateTo)}.csv`;
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  
  URL.revokeObjectURL(url);
};

/**
 * Export summary statistics to text
 */
export const exportSummary = (data: IFunnelTechnikReportData): string => {
  const { stats, dateFrom, dateTo } = data;
  
  return `
REPORT KONTROLY TECHNIKA
========================

Obdobi: ${formatDate(dateFrom)} - ${formatDate(dateTo)}
Datum generovani: ${formatDateTime(new Date())}

SOUHRN
------
Celkem predano technikovi: ${stats.totalHandedToTechnician}
Schvaleno: ${stats.approved}
Zamitnuto: ${stats.rejected}
V kontrole: ${stats.inProgress}

Mira schvaleni: ${stats.approvalRate.toFixed(1)}%
Mira zamitnuti: ${stats.rejectionRate.toFixed(1)}%
Prumerny pocet dni v kontrole: ${stats.averageDaysInReview}

ROZPAD PODLE STATUSU
--------------------
${data.statusBreakdown?.map((item: { status: string; count: number; percentage: number }) => 
  `${item.status}: ${item.count} (${item.percentage.toFixed(1)}%)`
).join('\n') || 'Neni k dispozici'}

NEJCASTEJSI DUVODY ZAMITNUTI
----------------------------
${data.declinedReasons?.map((item: { reason: string; count: number; percentage: number }) => 
  `${item.reason}: ${item.count} (${item.percentage.toFixed(1)}%)`
).join('\n') || 'Neni k dispozici'}
`.trim();
};

/**
 * Download summary as text file
 */
export const downloadSummary = (data: IFunnelTechnikReportData): void => {
  const summary = exportSummary(data);
  const blob = new Blob([summary], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const filename = `funnel-technik-summary-${formatDate(data.dateFrom)}-${formatDate(data.dateTo)}.txt`;
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  
  URL.revokeObjectURL(url);
};

/**
 * Copy summary to clipboard
 */
export const copySummaryToClipboard = async (data: IFunnelTechnikReportData): Promise<void> => {
  const summary = exportSummary(data);
  await navigator.clipboard.writeText(summary);
};
