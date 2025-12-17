/**
 * PDF Export Utility
 * Pouziva browser print API pro export
 * Bez cestiny diakritiky
 */

import { formatPdfFilename } from './formatters';

/**
 * Export stranky do PDF pomoci browser print dialog
 */
export function exportToPDF(dateFrom: Date | string, dateTo: Date | string): void {
  // Priprava stranky pro tisk
  document.body.classList.add('printing');
  
  // Timeout pro aplikovani print stylu
  setTimeout(() => {
    window.print();
    
    // Cleanup po zavøeni print dialogu
    setTimeout(() => {
      document.body.classList.remove('printing');
    }, 1000);
  }, 100);
}

/**
 * Kontrola podpory print API
 */
export function isPrintSupported(): boolean {
  return typeof window !== 'undefined' && 'print' in window;
}
