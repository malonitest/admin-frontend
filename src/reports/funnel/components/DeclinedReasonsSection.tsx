/**
 * Declined Reasons Section Component
 * Celkovy prehled duvodu zamitnuti
 * Bez cestiny diakritiky
 */

import type { IFunnelDeclinedReason } from '@/types/reporting';
import { formatNumber, formatPercent, validatePercentages } from '../utils/formatters.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DeclinedReasonsSectionProps {
  declinedReasons: IFunnelDeclinedReason[];
  declinedLeads: number;
}

export function DeclinedReasonsSection({ declinedReasons, declinedLeads }: DeclinedReasonsSectionProps) {
  const validation = validatePercentages(declinedReasons);
  
  // Top 5 + ostatní
  const top5 = declinedReasons.slice(0, 5);
  const others = declinedReasons.slice(5);
  const othersSum = others.reduce((sum, r) => sum + r.count, 0);
  const othersPercentage = others.reduce((sum, r) => sum + r.percentage, 0);
  
  const chartData = [...top5];
  if (others.length > 0) {
    chartData.push({
      reason: 'Ostatni',
      count: othersSum,
      percentage: othersPercentage,
    });
  }

  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#6b7280'];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Duvody zamitnuti - Celkem ({formatNumber(declinedLeads)})
      </h2>

      {!validation.ok && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded text-sm text-orange-700">
          ?? Pozor: Soucet procent se odchyluje o {validation.diff.toFixed(2)}%
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabulka */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Prehled</h3>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Duvod
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Pocet
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  %
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {declinedReasons.map((reason, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-900">{reason.reason}</td>
                  <td className="px-4 py-2 text-sm text-right text-gray-700 font-semibold">
                    {formatNumber(reason.count)}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-gray-700">
                    {formatPercent(reason.percentage)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Graf */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Top 5 + Ostatni</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey="reason" 
                type="category" 
                width={120}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number) => formatNumber(value)} 
                labelStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="count">
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
