/**
 * Executive Summary Component
 * Auto-generovany investorsky souhrn bez cestiny diakritiky
 */

import type { IKPIInvestorReportData } from '@/types/reporting';
import {
  findBestMetric,
  computeRiskScore,
  findFunnelBottleneck,
} from '../utils/calculations';
import { formatPercent } from '../utils/formatters';

interface ExecutiveSummaryProps {
  data: IKPIInvestorReportData;
}

export function ExecutiveSummary({ data }: ExecutiveSummaryProps) {
  // Auto-generovani insightu
  const insights = generateInsights(data);

  return (
    <div className="executive-summary bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 mb-8 print:bg-white print:border print:border-gray-300">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Executive Summary</h2>
      <div className="prose prose-sm max-w-none">
        <ul className="space-y-3 text-gray-700">
          {insights.map((insight, index) => (
            <li key={index} className="flex items-start">
              <span className="inline-block w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                {index + 1}
              </span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function generateInsights(data: IKPIInvestorReportData): string[] {
  const insights: string[] = [];

  // 1. Nejlepsi pozitivni trend
  const bestMetric = findBestMetric(data.summary);
  if (bestMetric && bestMetric.changePercentage) {
    insights.push(
      `Nejvyssi pozitivni trend: ${bestMetric.label} vzrostlo o ${formatPercent(bestMetric.changePercentage)} oproti predchozimu obdobi.`
    );
  }

  // 2. Konverzni pomer
  if (data.funnel.conversionRate > 30) {
    insights.push(
      `Konverzni pomer ${formatPercent(data.funnel.conversionRate)} je nad cilem. Kvalita leadu je vysoka.`
    );
  } else if (data.funnel.conversionRate < 20) {
    insights.push(
      `Konverzni pomer ${formatPercent(data.funnel.conversionRate)} je nizky. Doporucujeme zlepsit kvalitu vstupnich leadu a zrychleni zpracovani.`
    );
  }

  // 3. Risk score
  const riskScore = computeRiskScore(data.risk);
  if (riskScore.level === 'High') {
    insights.push(
      `RIZIKO: ${riskScore.description} Aktualni late leases: ${data.risk.lateLeases}, debt collection: ${data.risk.debtCollectionCases}.`
    );
  } else if (riskScore.level === 'Low') {
    insights.push(
      `Rizikove metriky jsou pod kontrolou. Payment success rate: ${formatPercent(data.risk.paymentSuccessRate)}.`
    );
  }

  // 4. Profit margin
  if (data.financial.stats.profitMargin > 25) {
    insights.push(
      `Profit margin ${formatPercent(data.financial.stats.profitMargin)} je zdravy. Byznys je profitabilni.`
    );
  } else if (data.financial.stats.profitMargin < 15) {
    insights.push(
      `Profit margin ${formatPercent(data.financial.stats.profitMargin)} je nizky. Analyzujte naklady a optimalizujte strukturu odkupu aut.`
    );
  }

  // 5. Technician SLA
  if (data.technician.stats.averageDaysInReview > 3) {
    insights.push(
      `Technicka kontrola prilis pomala: prumerny cas ${data.technician.stats.averageDaysInReview} dni. Doporucujeme zrychleni procesu nebo navyseni kapacity.`
    );
  } else {
    insights.push(
      `Technicka kontrola efektivni: prumerny cas ${data.technician.stats.averageDaysInReview} dni.`
    );
  }

  // 6. Fleet value
  if (data.fleet.stats.totalEstimatedValue > data.fleet.stats.totalPurchaseValue * 1.1) {
    insights.push(
      `Hodnota vozoveho parku vzrostla o ${formatPercent(
        ((data.fleet.stats.totalEstimatedValue - data.fleet.stats.totalPurchaseValue) /
          data.fleet.stats.totalPurchaseValue) *
          100
      )}. Dobry vyber vozidel.`
    );
  }

  // 7. Funnel bottleneck
  const bottleneck = findFunnelBottleneck(data.funnel.stageBreakdown);
  if (bottleneck && bottleneck.percentage > 40) {
    insights.push(
      `Bottleneck ve funnelu: ${bottleneck.stage} obsahuje ${formatPercent(bottleneck.percentage)} leadu. Zvyste kapacitu nebo zrychleni tohoto kroku.`
    );
  }

  // 8. Prority na dalsi mesic
  const priorities = generatePriorities(data, riskScore.level);
  insights.push(`Priority pro dalsi mesic: ${priorities.join(', ')}.`);

  return insights.slice(0, 8); // Max 8 odrážek
}

function generatePriorities(
  data: IKPIInvestorReportData,
  riskLevel: 'Low' | 'Medium' | 'High'
): string[] {
  const priorities: string[] = [];

  if (riskLevel === 'High' || data.risk.lateLeases > 5) {
    priorities.push('snizeni late leases');
  }

  if (data.funnel.conversionRate < 25) {
    priorities.push('zvyseni konverzniho pomeru');
  }

  if (data.technician.stats.averageDaysInReview > 3) {
    priorities.push('zrychleni technicke kontroly');
  }

  if (data.financial.stats.profitMargin < 20) {
    priorities.push('optimalizace nakladu');
  }

  if (priorities.length === 0) {
    priorities.push('udrzeni aktualniho vykoneu', 'rozsireni portfolia', 'marketing');
  }

  return priorities.slice(0, 3); // Max 3 priority
}
