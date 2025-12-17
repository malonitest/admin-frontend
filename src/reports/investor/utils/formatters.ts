/**
 * Investor KPI Report - Formatovaci utility funkce
 * Bez cestiny diakritiky pro kompatibilitu
 */

/**
 * Formatuje castku v CZK s mezerami tisicu
 */
export function formatCzk(amount: number): string {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' Kc';
}

/**
 * Formatuje cislo s definovanym poctem desetinnych mist
 */
export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formatuje procento s 1 desetinnym mistem
 */
export function formatPercent(value: number, decimals = 1): string {
  return formatNumber(value, decimals) + '%';
}

/**
 * Formatuje datum do ceske formatky
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('cs-CZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Formatuje datum a cas
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('cs-CZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formatuje obdobi (dateFrom - dateTo)
 */
export function formatPeriod(dateFrom: Date | string, dateTo: Date | string): string {
  return `${formatDate(dateFrom)} - ${formatDate(dateTo)}`;
}

/**
 * Formatuje nazev PDF souboru
 */
export function formatPdfFilename(dateFrom: Date | string, dateTo: Date | string): string {
  const from = typeof dateFrom === 'string' ? new Date(dateFrom) : dateFrom;
  const to = typeof dateTo === 'string' ? new Date(dateTo) : dateTo;
  
  const fromStr = from.toISOString().split('T')[0];
  const toStr = to.toISOString().split('T')[0];
  
  return `Investor_KPI_Report_${fromStr}_to_${toStr}.pdf`;
}
