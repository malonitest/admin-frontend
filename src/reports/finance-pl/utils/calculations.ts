/**
 * Calculation utilities for CFO P/L Report
 * No Czech diacritics allowed
 */

import { safeNumber } from './formatters';

/**
 * Sum array of items by selector function
 * @param items - Array of items
 * @param selector - Function to extract number from item
 * @returns Sum of extracted numbers
 */
export const sumBy = <T>(
  items: T[],
  selector: (item: T) => number
): number => {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => sum + safeNumber(selector(item)), 0);
};

/**
 * Calculate average of array of items by selector
 * @param items - Array of items
 * @param selector - Function to extract number from item
 * @returns Average of extracted numbers
 */
export const avgBy = <T>(
  items: T[],
  selector: (item: T) => number
): number => {
  if (!Array.isArray(items) || items.length === 0) return 0;
  const sum = sumBy(items, selector);
  return sum / items.length;
};

/**
 * Calculate month-over-month change
 * @param current - Current period value
 * @param previous - Previous period value
 * @returns Object with absolute difference and percentage change
 */
export const calcMoM = (
  current: number,
  previous: number
): { diff: number; pct: number | null } => {
  const curr = safeNumber(current);
  const prev = safeNumber(previous);
  
  const diff = curr - prev;
  
  if (prev === 0) {
    return { diff, pct: null };
  }
  
  const pct = (diff / Math.abs(prev)) * 100;
  
  return { diff, pct };
};

/**
 * Group items by month field
 * @param items - Array of items with month field
 * @param monthField - Name of month field (default: 'month')
 * @returns Map of month to items
 */
export const groupByMonth = <T extends Record<string, any>>(
  items: T[],
  monthField: string = 'month'
): Map<string, T[]> => {
  const map = new Map<string, T[]>();
  
  if (!Array.isArray(items)) return map;
  
  items.forEach(item => {
    const month = item[monthField];
    if (!month) return;
    
    const existing = map.get(month) || [];
    existing.push(item);
    map.set(month, existing);
  });
  
  return map;
};

/**
 * Calculate days between two dates
 * @param from - Start date
 * @param to - End date
 * @returns Number of days
 */
export const daysBetween = (
  from: Date | string,
  to: Date | string
): number => {
  const fromDate = typeof from === 'string' ? new Date(from) : from;
  const toDate = typeof to === 'string' ? new Date(to) : to;
  
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) return 0;
  
  const diff = toDate.getTime() - fromDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

/**
 * Calculate aging buckets for invoices
 * @param invoices - Array of invoice items
 * @param now - Current date (default: new Date())
 * @returns Aging buckets with counts and amounts
 */
export const buildAgingBuckets = (
  invoices: Array<{ dueDate: Date | string; amount: number; status: string }>,
  now: Date = new Date()
): Array<{ bucket: string; count: number; amount: number; days: number }> => {
  const buckets = [
    { bucket: '1-7 dni', min: 1, max: 7, count: 0, amount: 0, days: 0 },
    { bucket: '8-30 dni', min: 8, max: 30, count: 0, amount: 0, days: 0 },
    { bucket: '31-60 dni', min: 31, max: 60, count: 0, amount: 0, days: 0 },
    { bucket: '60+ dni', min: 61, max: Infinity, count: 0, amount: 0, days: 0 }
  ];
  
  if (!Array.isArray(invoices)) return buckets;
  
  invoices.forEach(invoice => {
    if (invoice.status === 'PAID') return;
    
    const days = daysBetween(invoice.dueDate, now);
    
    if (days <= 0) return; // Not overdue
    
    const bucket = buckets.find(b => days >= b.min && days <= b.max);
    
    if (bucket) {
      bucket.count++;
      bucket.amount += safeNumber(invoice.amount);
      bucket.days = Math.max(bucket.days, days);
    }
  });
  
  return buckets;
};

/**
 * Calculate payment reconciliation
 * @param payments - Array of payment items
 * @param monthlyData - Monthly P/L data
 * @returns Reconciliation report
 */
export const calculateReconciliation = (
  payments: Array<{ type: string; amount: number; month: string }>,
  monthlyData: Array<{
    month: string;
    rentPayments: number;
    adminFees: number;
    insuranceFees: number;
    latePaymentFees: number;
  }>
): Array<{
  month: string;
  type: string;
  expected: number;
  actual: number;
  diff: number;
  diffPct: number;
}> => {
  const results: Array<{
    month: string;
    type: string;
    expected: number;
    actual: number;
    diff: number;
    diffPct: number;
  }> = [];
  
  if (!Array.isArray(payments) || !Array.isArray(monthlyData)) {
    return results;
  }
  
  const paymentsByMonth = groupByMonth(payments, 'month');
  
  monthlyData.forEach(monthData => {
    const monthPayments = paymentsByMonth.get(monthData.month) || [];
    
    // Reconcile rent payments
    const rentActual = sumBy(
      monthPayments.filter(p => p.type === 'RENT'),
      p => p.amount
    );
    const rentExpected = safeNumber(monthData.rentPayments);
    const rentDiff = rentActual - rentExpected;
    const rentDiffPct = rentExpected !== 0 ? (rentDiff / rentExpected) * 100 : 0;
    
    results.push({
      month: monthData.month,
      type: 'RENT',
      expected: rentExpected,
      actual: rentActual,
      diff: rentDiff,
      diffPct: rentDiffPct
    });
    
    // Reconcile admin fees
    const adminActual = sumBy(
      monthPayments.filter(p => p.type === 'ADMIN_FEE'),
      p => p.amount
    );
    const adminExpected = safeNumber(monthData.adminFees);
    const adminDiff = adminActual - adminExpected;
    const adminDiffPct = adminExpected !== 0 ? (adminDiff / adminExpected) * 100 : 0;
    
    results.push({
      month: monthData.month,
      type: 'ADMIN_FEE',
      expected: adminExpected,
      actual: adminActual,
      diff: adminDiff,
      diffPct: adminDiffPct
    });
    
    // Reconcile insurance
    const insuranceActual = sumBy(
      monthPayments.filter(p => p.type === 'INSURANCE'),
      p => p.amount
    );
    const insuranceExpected = safeNumber(monthData.insuranceFees);
    const insuranceDiff = insuranceActual - insuranceExpected;
    const insuranceDiffPct = insuranceExpected !== 0 ? (insuranceDiff / insuranceExpected) * 100 : 0;
    
    results.push({
      month: monthData.month,
      type: 'INSURANCE',
      expected: insuranceExpected,
      actual: insuranceActual,
      diff: insuranceDiff,
      diffPct: insuranceDiffPct
    });
  });
  
  return results;
};

/**
 * Find top items in array by selector
 * @param items - Array of items
 * @param selector - Function to extract number from item
 * @param n - Number of top items to return (default: 3)
 * @returns Top N items
 */
export const topN = <T>(
  items: T[],
  selector: (item: T) => number,
  n: number = 3
): T[] => {
  if (!Array.isArray(items)) return [];
  
  return [...items]
    .sort((a, b) => selector(b) - selector(a))
    .slice(0, n);
};
