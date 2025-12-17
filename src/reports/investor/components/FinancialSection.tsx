/**
 * Financial Section Component
 * P/L report s tabulkou, MoM porovnanim a grafy
 * Bez cestiny diakritiky
 */

import type { IKPIInvestorReportData, IFinancialReportItem } from '@/types/reporting';
import { formatCzk, formatPercent } from '../utils/formatters';
import { calcMoMChange, validatePercentages } from '../utils/calculations';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

interface FinancialSectionProps {
  data: IKPIInvestorReportData['financial'];
}

export function FinancialSection({ data }: FinancialSectionProps) {
  const { stats, latestMonth, previousMonth, revenueByType, costsByType } = data;

  // Validace procent
  const revenueValidation = validatePercentages(revenueByType);
  const costsValidation = validatePercentages(costsByType);

  return (
    <div className="financial-section mb-12 print:break-before-page">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Financni prehled (P/L)</h2>

      {/* Agregaty Stats */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Agregaty za obdobi</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Metrika
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Hodnota
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">Celkove prijmy</td>
                <td className="px-6 py-4 text-sm text-right text-green-600 font-semibold">
                  {formatCzk(stats.totalRevenue)}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">Celkove naklady</td>
                <td className="px-6 py-4 text-sm text-right text-red-600 font-semibold">
                  {formatCzk(stats.totalCosts)}
                </td>
              </tr>
              <tr className="bg-blue-50">
                <td className="px-6 py-4 text-sm font-bold text-gray-900">Celkovy zisk (Net)</td>
                <td className="px-6 py-4 text-sm text-right text-blue-700 font-bold text-lg">
                  {formatCzk(stats.totalProfit)}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">Profit margin</td>
                <td className="px-6 py-4 text-sm text-right font-semibold">
                  {formatPercent(stats.profitMargin)}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  Prumerny mesicni prijem
                </td>
                <td className="px-6 py-4 text-sm text-right">{formatCzk(stats.averageMonthlyRevenue)}</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  Prumerny mesicni zisk
                </td>
                <td className="px-6 py-4 text-sm text-right">{formatCzk(stats.averageMonthlyProfit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* MoM porovnani */}
      {latestMonth && previousMonth && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Porovnani mesicu (MoM)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Metrika
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Aktualni ({latestMonth.month})
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Predchozi ({previousMonth.month})
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Delta
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <MoMRow
                  label="Prijmy"
                  current={latestMonth.totalRevenue}
                  previous={previousMonth.totalRevenue}
                />
                <MoMRow
                  label="Naklady"
                  current={latestMonth.totalCosts}
                  previous={previousMonth.totalCosts}
                />
                <MoMRow
                  label="Zisk (Net)"
                  current={latestMonth.netProfit}
                  previous={previousMonth.netProfit}
                  highlight
                />
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Profit margin</td>
                  <td className="px-6 py-4 text-sm text-right">
                    {formatPercent(latestMonth.profitMargin)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    {formatPercent(previousMonth.profitMargin)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-semibold">
                    {formatDelta(latestMonth.profitMargin - previousMonth.profitMargin, '%')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {generateMoMComment(latestMonth, previousMonth)}
        </div>
      )}

      {/* Grafy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue by type */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Prijmy podle typu</h3>
          {!revenueValidation.ok && (
            <div className="text-xs text-orange-600 mb-2">
              ?? {revenueValidation.message}
            </div>
          )}
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={revenueByType}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.type} (${formatPercent(entry.percentage, 1)})`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="amount"
              >
                {revenueByType.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCzk(value as number)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 text-sm">
            {revenueByType.map((item, index) => (
              <div key={index} className="flex justify-between py-1">
                <span className="text-gray-600">{item.type}</span>
                <span className="font-semibold">{formatCzk(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Costs by type */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Naklady podle typu</h3>
          {!costsValidation.ok && (
            <div className="text-xs text-orange-600 mb-2">
              ?? {costsValidation.message}
            </div>
          )}
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={costsByType}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" angle={-45} textAnchor="end" height={100} />
              <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatCzk(value as number)} />
              <Bar dataKey="amount" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-sm">
            {costsByType.map((item, index) => (
              <div key={index} className="flex justify-between py-1">
                <span className="text-gray-600">{item.type}</span>
                <span className="font-semibold">{formatCzk(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MoMRowProps {
  label: string;
  current: number;
  previous: number;
  highlight?: boolean;
}

function MoMRow({ label, current, previous, highlight }: MoMRowProps) {
  const change = calcMoMChange(current, previous);
  const className = highlight ? 'bg-blue-50' : '';

  return (
    <tr className={className}>
      <td className={`px-6 py-4 text-sm font-medium text-gray-900 ${highlight ? 'font-bold' : ''}`}>
        {label}
      </td>
      <td className="px-6 py-4 text-sm text-right">{formatCzk(current)}</td>
      <td className="px-6 py-4 text-sm text-right">{formatCzk(previous)}</td>
      <td className="px-6 py-4 text-sm text-right font-semibold">
        {formatDelta(change.absolute, 'Kc')}
        {change.percentage !== null && (
          <span className="text-xs ml-1">({formatPercent(change.percentage)})</span>
        )}
      </td>
    </tr>
  );
}

function formatDelta(value: number, unit: string): React.ReactElement {
  const isPositive = value > 0;
  const color = isPositive ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-500';
  const sign = isPositive ? '+' : '';
  const displayValue = unit === 'Kc' ? formatCzk(Math.abs(value)) : `${value.toFixed(1)}%`;

  return <span className={color}>{sign}{value < 0 ? '-' : ''}{displayValue}</span>;
}

function generateMoMComment(
  latest: IFinancialReportItem,
  previous: IFinancialReportItem
) {
  const change = calcMoMChange(latest.netProfit, previous.netProfit);
  let comment = '';

  if (change.percentage && change.percentage > 10) {
    comment = `Vyborny rust zisku o ${formatPercent(change.percentage)}. Udrzujte tempo!`;
  } else if (change.percentage && change.percentage < -10) {
    comment = `Pokles zisku o ${formatPercent(Math.abs(change.percentage))}. Analyzujte naklady a prijmy.`;
  } else {
    comment = 'Stabilni vysledky bez vyznamnych zmen.';
  }

  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
      <p className="text-sm text-gray-700">
        <span className="font-semibold">Komentar:</span> {comment}
      </p>
    </div>
  );
}

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
