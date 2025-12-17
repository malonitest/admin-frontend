/**
 * Formatting utilities for CFO P/L Report
 * No Czech diacritics allowed
 */

/**
 * Format amount as CZK with thousands separators
 * @param amount - Amount to format
 * @returns Formatted string like "1 234 567 Kc"
 */
export const formatCzk = (amount: number | null | undefined): string => {
  const value = safeNumber(amount);
  
  // Format with spaces as thousand separators
  const formatted = Math.abs(value)
    .toFixed(0)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  
  const sign = value < 0 ? '-' : '';
  return `${sign}${formatted} Kc`;
};

/**
 * Format date in Czech format DD.MM.YYYY
 * @param date - Date to format
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '-';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}.${month}.${year}`;
};

/**
 * Format date in ISO format YYYY-MM-DD
 * @param date - Date to format
 * @returns ISO formatted date string
 */
export const formatDateISO = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '-';
  
  return d.toISOString().split('T')[0];
};

/**
 * Format percentage with specified decimals
 * @param value - Value to format (as decimal, e.g., 0.15 for 15%)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage like "15.0%"
 */
export const formatPercent = (
  value: number | null | undefined,
  decimals: number = 1
): string => {
  const num = safeNumber(value);
  return `${num.toFixed(decimals)}%`;
};

/**
 * Safely convert value to number
 * @param value - Value to convert
 * @returns Number or 0 if invalid
 */
export const safeNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

/**
 * Format month label from YYYY-MM format
 * @param month - Month in YYYY-MM format
 * @returns Localized month label like "Leden 2024"
 */
export const formatMonthLabel = (month: string | null | undefined): string => {
  if (!month) return '-';
  
  const parts = month.split('-');
  if (parts.length !== 2) return month;
  
  const year = parts[0];
  const monthNum = parseInt(parts[1] || '0', 10);
  
  const monthNames = [
    'Leden', 'Unor', 'Brezen', 'Duben', 'Kveten', 'Cerven',
    'Cervenec', 'Srpen', 'Zari', 'Rijen', 'Listopad', 'Prosinec'
  ];
  
  const monthName = monthNames[monthNum - 1];
  
  if (!monthName) return month;
  
  return `${monthName} ${year}`;
};

/**
 * Format number with specified decimals
 * @param value - Value to format
 * @param decimals - Number of decimal places
 * @returns Formatted number string
 */
export const formatNumber = (
  value: number | null | undefined,
  decimals: number = 0
): string => {
  const num = safeNumber(value);
  return num.toFixed(decimals);
};

/**
 * Format count (whole number)
 * @param value - Value to format
 * @returns Formatted count string
 */
export const formatCount = (value: number | null | undefined): string => {
  return formatNumber(value, 0);
};

/**
 * Format aging bucket label
 * @param days - Number of days
 * @returns Aging bucket label
 */
export const formatAgingBucket = (days: number): string => {
  if (days <= 0) return 'Not overdue';
  if (days <= 7) return '1-7 dni';
  if (days <= 30) return '8-30 dni';
  if (days <= 60) return '31-60 dni';
  return '60+ dni';
};
