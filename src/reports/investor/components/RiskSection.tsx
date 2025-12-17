/**
 * Risk Section Component
 * Bez cestiny diakritiky
 */

import type { IKPIInvestorReportData } from '@/types/reporting';
import { formatNumber, formatPercent } from '../utils/formatters';
import { computeRiskScore } from '../utils/calculations';
import { AlertTriangle } from 'lucide-react';

interface RiskSectionProps {
  data: IKPIInvestorReportData['risk'];
}

export function RiskSection({ data }: RiskSectionProps) {
  const riskScore = computeRiskScore(data);

  return (
    <div className="risk-section mb-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Rizikove metriky</h2>

      {/* Risk Score */}
      <div
        className={`rounded-lg p-6 mb-6 ${
          riskScore.level === 'High'
            ? 'bg-red-100 border-l-4 border-red-600'
            : riskScore.level === 'Medium'
            ? 'bg-orange-100 border-l-4 border-orange-600'
            : 'bg-green-100 border-l-4 border-green-600'
        }`}
      >
        <div className="flex items-start">
          {riskScore.level === 'High' && (
            <AlertTriangle className="w-8 h-8 text-red-600 mr-4 flex-shrink-0" />
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold">Risk Score: {riskScore.score}/100</h3>
              <span
                className={`px-4 py-2 rounded-full text-sm font-bold ${
                  riskScore.level === 'High'
                    ? 'bg-red-600 text-white'
                    : riskScore.level === 'Medium'
                    ? 'bg-orange-600 text-white'
                    : 'bg-green-600 text-white'
                }`}
              >
                {riskScore.level} Risk
              </span>
            </div>
            <p
              className={`text-sm ${
                riskScore.level === 'High'
                  ? 'text-red-800'
                  : riskScore.level === 'Medium'
                  ? 'text-orange-800'
                  : 'text-green-800'
              }`}
            >
              {riskScore.description}
            </p>
          </div>
        </div>
      </div>

      {/* Metriky */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <RiskMetricBox
          label="Pozdni leasingy"
          value={formatNumber(data.lateLeases)}
          color={data.lateLeases > 5 ? 'red' : data.lateLeases > 2 ? 'orange' : 'green'}
        />
        <RiskMetricBox
          label="Nezaplacene faktury"
          value={formatNumber(data.unpaidInvoices)}
          color={data.unpaidInvoices > 10 ? 'red' : data.unpaidInvoices > 5 ? 'orange' : 'green'}
        />
        <RiskMetricBox
          label="Pripady v inkasu"
          value={formatNumber(data.debtCollectionCases)}
          color={data.debtCollectionCases > 3 ? 'red' : data.debtCollectionCases > 0 ? 'orange' : 'green'}
        />
        <RiskMetricBox
          label="Uspesnost plateb"
          value={formatPercent(data.paymentSuccessRate)}
          color={data.paymentSuccessRate < 90 ? 'red' : data.paymentSuccessRate < 95 ? 'orange' : 'green'}
        />
      </div>

      {/* Doporuceni */}
      {riskScore.level === 'High' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-red-600">
            Doporucene okamzite kroky:
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            {data.lateLeases > 5 && (
              <li className="flex items-start">
                <span className="font-bold mr-2">1.</span>
                <span>
                  Kontaktovat dlužníky s pozdnimi leasingy ({data.lateLeases}). Dohodnout splatky nebo
                  payment plan.
                </span>
              </li>
            )}
            {data.unpaidInvoices > 10 && (
              <li className="flex items-start">
                <span className="font-bold mr-2">2.</span>
                <span>
                  Proverit {data.unpaidInvoices} nezaplacenych faktur. Zaslat upominky a payment reminders.
                </span>
              </li>
            )}
            {data.debtCollectionCases > 3 && (
              <li className="flex items-start">
                <span className="font-bold mr-2">3.</span>
                <span>
                  Pokrocile inkasni kroky pro {data.debtCollectionCases} pripadu (zadrzeni vozidla, aukce).
                </span>
              </li>
            )}
            {data.paymentSuccessRate < 90 && (
              <li className="flex items-start">
                <span className="font-bold mr-2">4.</span>
                <span>
                  Zlepsit payment success rate ({formatPercent(data.paymentSuccessRate)}). Zkontrolovat
                  platebni metody zakazniku.
                </span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

interface RiskMetricBoxProps {
  label: string;
  value: string;
  color: 'red' | 'orange' | 'green';
}

function RiskMetricBox({ label, value, color }: RiskMetricBoxProps) {
  const bgColor =
    color === 'red'
      ? 'bg-red-50 border-red-200'
      : color === 'orange'
      ? 'bg-orange-50 border-orange-200'
      : 'bg-green-50 border-green-200';
  const textColor =
    color === 'red' ? 'text-red-700' : color === 'orange' ? 'text-orange-700' : 'text-green-700';

  return (
    <div className={`rounded-lg border-2 p-4 ${bgColor}`}>
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${textColor}`}>{value}</div>
    </div>
  );
}
