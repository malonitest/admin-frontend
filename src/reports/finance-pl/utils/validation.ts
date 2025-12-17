/**
 * Data validation utilities for CFO P/L Report
 * No Czech diacritics allowed
 */

import { safeNumber as safeNum } from './formatters';

// Re-export safeNumber for use by calculations.ts
export { safeNumber } from './formatters';

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate revenue/costs breakdown percentages
 * Should sum to 100%
 * @param items - Array of breakdown items with percentage field
 * @param tolerance - Allowed deviation from 100% (default: 0.1%)
 * @returns Validation result
 */
export const validatePercentages = (
  items: Array<{ type: string; percentage: number }>,
  tolerance: number = 0.1
): ValidationResult => {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  };

  if (!Array.isArray(items) || items.length === 0) {
    result.valid = false;
    result.errors.push('No items to validate');
    return result;
  }

  const total = items.reduce((sum, item) => sum + safeNum(item.percentage), 0);
  
  const diff = Math.abs(100 - total);
  
  if (diff > tolerance) {
    result.valid = false;
    result.errors.push(
      `Percentages sum to ${total.toFixed(2)}%, expected 100% (diff: ${diff.toFixed(2)}%)`
    );
  }

  return result;
};

/**
 * Validate monthly totals match stats totals
 * @param monthlyData - Array of monthly data
 * @param stats - Overall stats
 * @param tolerance - Allowed deviation (default: 1 CZK)
 * @returns Validation result
 */
export const validateTotals = (
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
  tolerance: number = 1
): ValidationResult => {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  };

  if (!Array.isArray(monthlyData) || !stats) {
    result.valid = false;
    result.errors.push('Invalid data provided');
    return result;
  }

  // Sum monthly revenue
  const monthlyRevenue = monthlyData.reduce(
    (sum, month) => sum + safeNum(month.totalRevenue),
    0
  );
  const revenueDiff = Math.abs(monthlyRevenue - safeNum(stats.totalRevenue));
  
  if (revenueDiff > tolerance) {
    result.valid = false;
    result.errors.push(
      `Revenue mismatch: Monthly sum ${monthlyRevenue.toFixed(2)} != Stats ${stats.totalRevenue.toFixed(2)} (diff: ${revenueDiff.toFixed(2)})`
    );
  }

  // Sum monthly costs
  const monthlyCosts = monthlyData.reduce(
    (sum, month) => sum + safeNum(month.totalCosts),
    0
  );
  const costsDiff = Math.abs(monthlyCosts - safeNum(stats.totalCosts));
  
  if (costsDiff > tolerance) {
    result.valid = false;
    result.errors.push(
      `Costs mismatch: Monthly sum ${monthlyCosts.toFixed(2)} != Stats ${stats.totalCosts.toFixed(2)} (diff: ${costsDiff.toFixed(2)})`
    );
  }

  // Sum monthly profit
  const monthlyProfit = monthlyData.reduce(
    (sum, month) => sum + safeNum(month.netProfit),
    0
  );
  const profitDiff = Math.abs(monthlyProfit - safeNum(stats.totalProfit));
  
  if (profitDiff > tolerance) {
    result.valid = false;
    result.errors.push(
      `Profit mismatch: Monthly sum ${monthlyProfit.toFixed(2)} != Stats ${stats.totalProfit.toFixed(2)} (diff: ${profitDiff.toFixed(2)})`
    );
  }

  return result;
};

/**
 * Validate reconciliation warnings
 * Check if differences exceed threshold
 * @param reconciliation - Reconciliation data
 * @param threshold - Warning threshold percentage (default: 5%)
 * @returns Validation result
 */
export const validateReconciliation = (
  reconciliation: Array<{
    month: string;
    type: string;
    expected: number;
    actual: number;
    diffPct: number;
  }>,
  threshold: number = 5
): ValidationResult => {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  };

  if (!Array.isArray(reconciliation)) {
    result.valid = false;
    result.errors.push('Invalid reconciliation data');
    return result;
  }

  reconciliation.forEach(item => {
    const absDiff = Math.abs(item.diffPct);
    
    if (absDiff > threshold) {
      result.warnings.push(
        `${item.month} ${item.type}: ${absDiff.toFixed(1)}% difference (Expected: ${item.expected.toFixed(2)}, Actual: ${item.actual.toFixed(2)})`
      );
    }
  });

  return result;
};

/**
 * Validate complete financial report data
 * Run all validation checks
 * @param data - Complete financial report data
 * @returns Validation result with all errors and warnings
 */
export const validateFinancialReport = (
  data: {
    stats: {
      totalRevenue: number;
      totalCosts: number;
      totalProfit: number;
    };
    monthlyData: Array<{
      totalRevenue: number;
      totalCosts: number;
      netProfit: number;
    }>;
    revenueByType: Array<{ type: string; percentage: number }>;
    costsByType: Array<{ type: string; percentage: number }>;
  }
): ValidationResult => {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  };

  // Validate revenue percentages
  const revenueValidation = validatePercentages(data.revenueByType);
  result.errors.push(...revenueValidation.errors);
  result.warnings.push(...revenueValidation.warnings);
  if (!revenueValidation.valid) result.valid = false;

  // Validate costs percentages
  const costsValidation = validatePercentages(data.costsByType);
  result.errors.push(...costsValidation.errors);
  result.warnings.push(...costsValidation.warnings);
  if (!costsValidation.valid) result.valid = false;

  // Validate totals
  const totalsValidation = validateTotals(
    data.monthlyData,
    data.stats
  );
  result.errors.push(...totalsValidation.errors);
  result.warnings.push(...totalsValidation.warnings);
  if (!totalsValidation.valid) result.valid = false;

  return result;
};
