/**
 * Funnel Section Component
 * Bez cestiny diakritiky
 */

import type { IKPIInvestorReportData } from '@/types/reporting';
import { formatNumber, formatPercent, formatCzk } from '../utils/formatters';
import { findFunnelBottleneck } from '../utils/calculations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FunnelSectionProps {
  data: IKPIInvestorReportData['funnel'];
}

export function FunnelSection({ data }: FunnelSectionProps) {
  const bottleneck = findFunnelBottleneck(data.stageBreakdown);

  return (
    <div className="funnel-section mb-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Funnel overview</h2>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <MetricBox label="Celkem leadu" value={formatNumber(data.totalLeads)} />
        <MetricBox label="Konvertovano" value={formatNumber(data.convertedLeads)} color="green" />
        <MetricBox label="Zamitnuto" value={formatNumber(data.declinedLeads)} color="red" />
        <MetricBox label="Konverzni pomer" value={formatPercent(data.conversionRate)} color="blue" />
        <MetricBox
          label="Prumer. doba konverze"
          value={`${formatNumber(data.avgConversionDays, 1)} dni`}
        />
        <MetricBox
          label="Prumer. castka"
          value={formatCzk(data.averageRequestedAmount)}
        />
      </div>

      {/* Stage Breakdown */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Rozlozeni podle fazi</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.stageBreakdown}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="stage" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Faze</th>
                <th className="px-4 py-2 text-right">Pocet</th>
                <th className="px-4 py-2 text-right">Procento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.stageBreakdown.map((stage, index) => (
                <tr key={index}>
                  <td className="px-4 py-2">{stage.stage}</td>
                  <td className="px-4 py-2 text-right font-semibold">{stage.count}</td>
                  <td className="px-4 py-2 text-right">{formatPercent(stage.percentage)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Insights</h3>
        <div className="space-y-2 text-sm text-gray-700">
          {data.conversionRate < 20 && (
            <p>
              ?? Konverzni pomer {formatPercent(data.conversionRate)} je nizky. Doporuceni: zlepsit
              kvalitu vstupnich leadu a zrychleni zpracovani.
            </p>
          )}
          {data.conversionRate >= 30 && (
            <p>? Konverzni pomer {formatPercent(data.conversionRate)} je vyborny!</p>
          )}
          {data.avgConversionDays > 10 && (
            <p>
              ?? Prumerna doba konverze {formatNumber(data.avgConversionDays, 1)} dni je prilis dlouha.
              Zrychlete proces.
            </p>
          )}
          {bottleneck && bottleneck.percentage > 40 && (
            <p>
              ?? Bottleneck: faze "{bottleneck.stage}" obsahuje {formatPercent(bottleneck.percentage)}{' '}
              leadu. Zvyste kapacitu nebo zrychleni tohoto kroku.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricBox({ label, value, color }: { label: string; value: string; color?: string }) {
  const colorClass =
    color === 'green'
      ? 'text-green-600'
      : color === 'red'
      ? 'text-red-600'
      : color === 'blue'
      ? 'text-blue-600'
      : 'text-gray-900';

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
    </div>
  );
}
