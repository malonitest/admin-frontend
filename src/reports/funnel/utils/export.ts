/**
 * Funnel Report - Export Utilities
 * PDF a JSON export
 * Bez cestiny diakritiky
 */

import { generateExportFilename, exportToJSON } from './formatters';
import type { IFunnelReportData } from '@/types/reporting';

/**
 * Export reportu do PDF pomocí browser print API
 */
export async function exportToPDF(
  _data: IFunnelReportData
): Promise<void> {
  // Skrytí ovládacích prvkù
  const controls = document.querySelectorAll('.no-print');
  controls.forEach(el => el.classList.add('print-hidden'));
  
  // Pøidání print tøídy na body
  document.body.classList.add('printing');
  
  // Timeout pro aplikování stylù
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Spuštìní print dialogu
  window.print();
  
  // Cleanup po zavøení dialogu
  await new Promise(resolve => setTimeout(resolve, 1000));
  document.body.classList.remove('printing');
  controls.forEach(el => el.classList.remove('print-hidden'));
}

/**
 * Export reportu do JSON souboru
 */
export function exportToJSONFile(data: IFunnelReportData): void {
  const jsonString = exportToJSON(data, data.dateFrom, data.dateTo);
  const filename = generateExportFilename(data.dateFrom, data.dateTo, 'json');
  
  // Vytvoøení blob a download linku
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  
  // Cleanup
  URL.revokeObjectURL(url);
}
