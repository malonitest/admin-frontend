/**
 * Formatting utilities for Funnel Technik Report
 * No Czech diacritics - ASCII only
 */

/**
 * Format amount to CZK with thousand separators
 * @example formatCzk(1234567) => "1 234 567 Kc"
 */
export const formatCzk = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0 Kc';
  }
  
  const rounded = Math.round(amount);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} Kc`;
};

/**
 * Format date to Czech format (DD.MM.YYYY)
 * @example formatDate(new Date('2025-12-16')) => "16.12.2025"
 */
export const formatDate = (date: Date | string | undefined | null): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '-';
    
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}.${month}.${year}`;
  } catch {
    return '-';
  }
};

/**
 * Format date with time
 * @example formatDateTime(new Date('2025-12-16T15:30:00')) => "16.12.2025 15:30"
 */
export const formatDateTime = (date: Date | string | undefined | null): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '-';
    
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  } catch {
    return '-';
  }
};

/**
 * Mask VIN - show only last 6 characters
 * @example maskVin("WF0XXGCGXBBY36496") => "************36496"
 */
export const maskVin = (vin: string | undefined | null): string => {
  if (!vin || vin === 'Neuvedeno') return 'Neuvedeno';
  
  if (vin.length <= 6) return vin;
  
  const masked = '*'.repeat(vin.length - 6);
  const visible = vin.slice(-6);
  return masked + visible;
};

/**
 * Get full VIN (for export)
 */
export const getFullVin = (vin: string | undefined | null): string => {
  return vin || 'Neuvedeno';
};

/**
 * Format percentage to 1 decimal place
 * @example formatPercentage(54.5555) => "54.6%"
 */
export const formatPercentage = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return '0.0%';
  }
  const safeValue: number = value;
  return `${safeValue.toFixed(1)}%`;
};

/**
 * Format car name (brand + model)
 */
export const formatCarName = (brand?: string, model?: string): string => {
  const b = brand ?? '';
  const m = model ?? '';
  
  if (!b && !m) return 'Neuvedeno';
  if (!b) return m;
  if (!m) return b;
  
  return `${b} ${m}`;
};

/**
 * Format customer phone
 */
export const formatPhone = (phone: string | undefined | null): string => {
  if (!phone) return '-';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 0) return '-';
  
  // Format: +420 123 456 789
  if (cleaned.startsWith('420') && cleaned.length === 12) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }
  
  // Format: 123 456 789
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  
  return phone;
};

/**
 * Get status badge color
 */
export const getStatusColor = (status: string): string => {
  if (status.includes('Schvaleno') || status.includes('Konvertovano')) {
    return 'green';
  }
  if (status.includes('Zamitnuto')) {
    return 'red';
  }
  if (status.includes('Predano') || status.includes('reseni')) {
    return 'blue';
  }
  return 'gray';
};

/**
 * Get SLA badge color based on days
 */
export const getSLAColor = (days: number): string => {
  if (days <= 3) return 'green';
  if (days <= 7) return 'orange';
  return 'red';
};
