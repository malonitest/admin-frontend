/**
 * Fleet Section Component
 * Bez cestiny diakritiky
 */

import type { IKPIInvestorReportData } from '@/types/reporting';
import { formatNumber, formatCzk, formatPercent } from '../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FleetSectionProps {
  data: IKPIInvestorReportData['fleet'];
}

export function FleetSection({ data }: FleetSectionProps) {
  const { stats, topBrands, mileageBreakdown } = data;

  return (
    <div className="fleet-section mb-12 print:break-before-page">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Vozovy park (Fleet)</h2>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricBox label="Celkem vozidel" value={formatNumber(stats.totalCars)} />
        <MetricBox
          label="Nakupni hodnota"
          value={formatCzk(stats.totalPurchaseValue)}
          color="blue"
        />
        <MetricBox
          label="Odhadovana hodnota"
          value={formatCzk(stats.totalEstimatedValue)}
          color="green"
        />
        <MetricBox
          label="Prumer. nakupni cena"
          value={formatCzk(stats.averagePurchasePrice)}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <MetricBox
          label="Prumer. odhadovana hodnota"
          value={formatCzk(stats.averageEstimatedValue)}
        />
        <MetricBox
          label="Prumer. najezd"
          value={`${formatNumber(stats.averageMileage)} km`}
        />
        <MetricBox label="Prumer. stari" value={`${formatNumber(stats.averageAge, 1)} let`} />
      </div>

      {/* Value Appreciation */}
      {stats.totalEstimatedValue > stats.totalPurchaseValue && (
        <div className="bg-green-50 border-l-4 border-green-600 p-4 mb-6">
          <p className="text-green-800 font-semibold">
            ? Hodnota vozoveho parku vzrostla o{' '}
            {formatPercent(
              ((stats.totalEstimatedValue - stats.totalPurchaseValue) / stats.totalPurchaseValue) *
                100
            )}
            . Dobry vyber vozidel!
          </p>
        </div>
      )}

      {/* Top Brands */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Top znacky</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Znacka</th>
                <th className="px-4 py-2 text-right">Pocet</th>
                <th className="px-4 py-2 text-right">Celkova hodnota</th>
                <th className="px-4 py-2 text-right">% z floty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {topBrands.map((brand, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 font-medium">{brand.brand}</td>
                  <td className="px-4 py-2 text-right">{brand.count}</td>
                  <td className="px-4 py-2 text-right font-semibold">
                    {formatCzk(brand.totalValue)}
                  </td>
                  <td className="px-4 py-2 text-right">{formatPercent(brand.percentage)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mileage Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Rozlozeni podle najezdu</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={mileageBreakdown}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          {mileageBreakdown.map((range, index) => (
            <div key={index} className="bg-gray-50 rounded p-3">
              <div className="text-xs text-gray-500">{range.range}</div>
              <div className="text-lg font-bold text-gray-900">
                {range.count} ({formatPercent(range.percentage)})
              </div>
            </div>
          ))}
        </div>
        {generateMileageComment(mileageBreakdown, stats.averageMileage)}
      </div>
    </div>
  );
}

function MetricBox({ label, value, color }: { label: string; value: string; color?: string }) {
  const colorClass =
    color === 'green'
      ? 'text-green-600'
      : color === 'blue'
      ? 'text-blue-600'
      : 'text-gray-900';

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-lg font-bold ${colorClass}`}>{value}</div>
    </div>
  );
}

function generateMileageComment(
  breakdown: Array<{ range: string; count: number; percentage: number }>,
  avgMileage: number
) {
  const highMileage = breakdown.find((b) => b.range.includes('200') || b.range.includes('250'));
  const highMileagePercent = highMileage?.percentage || 0;

  let comment = '';
  if (highMileagePercent > 30) {
    comment = `?? Vysoky podil (${formatPercent(highMileagePercent)}) vozidel s vysokym najezdem. Vyssi riziko/nizsi hodnota.`;
  } else if (avgMileage < 100000) {
    comment = '? Prumerny najezd je nizky. Dobra kvalita floty.';
  } else {
    comment = 'Rozlozeni najezdu je standardni.';
  }

  return (
    <div className="mt-4 p-3 bg-blue-50 rounded">
      <p className="text-sm text-gray-700">
        <span className="font-semibold">Komentar:</span> {comment}
      </p>
    </div>
  );
}
