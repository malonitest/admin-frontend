/**
 * Validation utilities for CFO P/L Report
 * No Czech diacritics allowed
 */

import { safeNumber, sumBy } from './calculations';

/**
 * Validate that percentages sum to approximately 100%
 * @param items - Array of items with percentage field
 * @param tolerance - Tolerance for sum (default: 0.5%)
 * @returns Validation result with ok flag and difference
 */
export const validatePercentages = (
  items: Array<{ percentage: number }>,
  tolerance: number = 0.5
): { ok: boolean; diff: number; sum: number } => {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: true, diff: 0, sum: 0 };
  }
  
  const sum = sumBy(items, item => safeNumber(item.percentage));
  const diff = Math.abs(100 - sum);
  const ok = diff <= tolerance;
  
  return { ok, diff, sum };
};

/**
 * Validate that monthly data sums match stats totals
 * @param monthlyData - Array of monthly P/L items
 * @param stats - Overall stats object
 * @param tolerance - Tolerance for comparison (default: 1.0)
 * @returns Validation results for each metric
 */
export const validateMonthlyTotals = (
  monthlyData: Array<{
    totalRevenue: number;
    totalCosts: number;
    netProfit: number;
  }>,
  stats: {
    totalRevenue: number;
    totalCosts: number;
    totalProfit: number;
  },
  tolerance: number = 1.0
): {
  revenue: { ok: boolean; expected: number; actual: number; diff: number };
  costs: { ok: boolean; expected: number; actual: number; diff: number };
  profit: { ok: boolean; expected: number; actual: number; diff: number };
} => {
  if (!Array.isArray(monthlyData)) {
    return {
      revenue: { ok: false, expected: 0, actual: 0, diff: 0 },
      costs: { ok: false, expected: 0, actual: 0, diff: 0 },
      profit: { ok: false, expected: 0, actual: 0, diff: 0 }
    };
  }
  
  const actualRevenue = sumBy(monthlyData, m => safeNumber(m.totalRevenue));
  const actualCosts = sumBy(monthlyData, m => safeNumber(m.totalCosts));
  const actualProfit = sumBy(monthlyData, m => safeNumber(m.netProfit));
  
  const expectedRevenue = safeNumber(stats.totalRevenue);
  const expectedCosts = safeNumber(stats.totalCosts);
  const expectedProfit = safeNumber(stats.totalProfit);
  
  const revenueDiff = Math.abs(actualRevenue - expectedRevenue);
  const costsDiff = Math.abs(actualCosts - expectedCosts);
  const profitDiff = Math.abs(actualProfit - expectedProfit);
  
  return {
    revenue: {
      ok: revenueDiff <= tolerance,
      expected: expectedRevenue,
      actual: actualRevenue,
      diff: actualRevenue - expectedRevenue
    },
    costs: {
      ok: costsDiff <= tolerance,
      expected: expectedCosts,
      actual: actualCosts,
      diff: actualCosts - expectedCosts
    },
    profit: {
      ok: profitDiff <= tolerance,
      expected: expectedProfit,
      actual: actualProfit,
      diff: actualProfit - expectedProfit
    }
  };
};

/**
 * Validate data consistency and return issues
 * @param data - Financial report data
 * @returns Array of validation issues
 */
export const validateFinancialData = (
  data: any
): Array<{ severity: 'error' | 'warning'; message: string }> => {
  const issues: Array<{ severity: 'error' | 'warning'; message: string }> = [];
  
  if (!data) {
    issues.push({
      severity: 'error',
      message: 'No data provided'
    });
    return issues;
  }
  
  // Validate required fields
  if (!data.stats) {
    issues.push({
      severity: 'error',
      message: 'Missing stats object'
    });
  }
  
  if (!Array.isArray(data.monthlyData) || data.monthlyData.length === 0) {
    issues.push({
      severity: 'error',
      message: 'Missing or empty monthlyData array'
    });
  }
  
  // Validate monthly totals
  if (data.stats && data.monthlyData) {
    const validation = validateMonthlyTotals(data.monthlyData, data.stats);
    
    if (!validation.revenue.ok) {
      issues.push({
        severity: 'warning',
        message: `Revenue mismatch: expected ${validation.revenue.expected.toFixed(2)}, got ${validation.revenue.actual.toFixed(2)} (diff: ${validation.revenue.diff.toFixed(2)})`
      });
    }
    
    if (!validation.costs.ok) {
      issues.push({
        severity: 'warning',
        message: `Costs mismatch: expected ${validation.costs.expected.toFixed(2)}, got ${validation.costs.actual.toFixed(2)} (diff: ${validation.costs.diff.toFixed(2)})`
      });
    }
    
    if (!validation.profit.ok) {
      issues.push({
        severity: 'warning',
        message: `Profit mismatch: expected ${validation.profit.expected.toFixed(2)}, got ${validation.profit.actual.toFixed(2)} (diff: ${validation.profit.diff.toFixed(2)})`
      });
    }
  }
  
  // Validate revenue breakdown percentages
  if (Array.isArray(data.revenueByType) && data.revenueByType.length > 0) {
    const revenueValidation = validatePercentages(data.revenueByType);
    
    if (!revenueValidation.ok) {
      issues.push({
        severity: 'warning',
        message: `Revenue percentages don't sum to 100%: ${revenueValidation.sum.toFixed(2)}% (diff: ${revenueValidation.diff.toFixed(2)}%)`
      });
    }
  }
  
  // Validate costs breakdown percentages
  if (Array.isArray(data.costsByType) && data.costsByType.length > 0) {
    const costsValidation = validatePercentages(data.costsByType);
    
    if (!costsValidation.ok) {
      issues.push({
        severity: 'warning',
        message: `Costs percentages don't sum to 100%: ${costsValidation.sum.toFixed(2)}% (diff: ${costsValidation.diff.toFixed(2)}%)`
      });
    }
  }
  
  return issues;
};

/**
 * Check if number is close to expected value within tolerance
 * @param actual - Actual value
 * @param expected - Expected value
 * @param tolerance - Tolerance (default: 1.0)
 * @returns True if within tolerance
 */
export const isClose = (
  actual: number,
  expected: number,
  tolerance: number = 1.0
): boolean => {
  const diff = Math.abs(actual - expected);
  return diff <= tolerance;
};
