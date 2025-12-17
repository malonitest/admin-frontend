/**
 * Investor KPI Report - Vypocetni utility funkce
 * Bez cestiny diakritiky
 */

export type Trend = 'up' | 'down' | 'flat';

export interface RiskScoreResult {
  score: number;
  level: 'Low' | 'Medium' | 'High';
  description: string;
}

export interface ValidationResult {
  ok: boolean;
  diff: number;
  message?: string;
}

/**
 * Vypocita procentualni zmenu mezi dvema hodnotami
 */
export function calcChangePercentage(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/**
 * Urci trend na zaklade procentualni zmeny
 */
export function calcTrend(changePercentage: number | null): Trend {
  if (changePercentage === null) return 'flat';
  if (Math.abs(changePercentage) < 1) return 'flat';
  return changePercentage > 0 ? 'up' : 'down';
}

/**
 * Vypocita risk score (0-100) na zaklade risk metrik
 */
export function computeRiskScore(risk: {
  lateLeases: number;
  unpaidInvoices: number;
  debtCollectionCases: number;
  paymentSuccessRate: number;
}): RiskScoreResult {
  let score = 0;
  
  // Penalizace za late leases (max 30 bodu)
  score += Math.min(risk.lateLeases * 5, 30);
  
  // Penalizace za unpaid invoices (max 25 bodu)
  score += Math.min(risk.unpaidInvoices * 2, 25);
  
  // Penalizace za debt collection cases (max 25 bodu)
  score += Math.min(risk.debtCollectionCases * 5, 25);
  
  // Penalizace za niskou payment success rate (max 20 bodu)
  const paymentPenalty = Math.max(0, 100 - risk.paymentSuccessRate);
  score += Math.min(paymentPenalty, 20);
  
  // Normalizace na 0-100
  score = Math.min(score, 100);
  
  // Urceni levelu
  let level: 'Low' | 'Medium' | 'High';
  let description: string;
  
  if (score < 30) {
    level = 'Low';
    description = 'Riziko je pod kontrolou. Monitorujte standardne.';
  } else if (score < 70) {
    level = 'Medium';
    description = 'Stredni riziko. Doporucujeme aktivni monitoring a prevenci.';
  } else {
    level = 'High';
    description = 'Vysoke riziko! Okamzite kroky nutne - kontakt s dluznikama, inkasni akce.';
  }
  
  return { score, level, description };
}

/**
 * Validuje, ze soucet procent je priblizne 100%
 */
export function validatePercentages(
  items: Array<{ percentage: number }>,
  tolerance = 0.5
): ValidationResult {
  const sum = items.reduce((acc, item) => acc + item.percentage, 0);
  const diff = Math.abs(sum - 100);
  const ok = diff <= tolerance;
  
  return {
    ok,
    diff,
    message: ok ? undefined : `Soucet procent je ${sum.toFixed(2)}%, melo byt 100%`,
  };
}

/**
 * Vypocita MoM (Month-over-Month) zmenu
 */
export function calcMoMChange(current: number, previous: number): {
  absolute: number;
  percentage: number | null;
} {
  const absolute = current - previous;
  const percentage = calcChangePercentage(current, previous);
  
  return { absolute, percentage };
}

/**
 * Najde metriku s nejvyssim pozitivnim trendem
 */
export function findBestMetric(
  metrics: Array<{ label: string; changePercentage?: number; trend?: Trend }>
): { label: string; changePercentage?: number } | null {
  const positive = metrics.filter(
    (m) => m.trend === 'up' && m.changePercentage !== undefined
  );
  
  if (positive.length === 0) return null;
  
  return positive.reduce((best, current) => {
    if (!best.changePercentage || !current.changePercentage) return best;
    return current.changePercentage > best.changePercentage ? current : best;
  });
}

/**
 * Najde metriku s nejvyssim negativnim trendem (nejvyssi riziko)
 */
export function findWorstMetric(
  metrics: Array<{ label: string; changePercentage?: number; trend?: Trend }>
): { label: string; changePercentage?: number } | null {
  const negative = metrics.filter(
    (m) => m.trend === 'down' && m.changePercentage !== undefined
  );
  
  if (negative.length === 0) return null;
  
  return negative.reduce((worst, current) => {
    if (!worst.changePercentage || !current.changePercentage) return worst;
    return current.changePercentage < worst.changePercentage ? current : worst;
  });
}

/**
 * Identifikuje bottleneck ve funnelu (nejvetsi stage)
 */
export function findFunnelBottleneck(
  stageBreakdown: Array<{ stage: string; count: number; percentage: number }>
): { stage: string; count: number; percentage: number } | null {
  if (stageBreakdown.length === 0) return null;
  
  return stageBreakdown.reduce((max, current) => {
    return current.count > max.count ? current : max;
  });
}
