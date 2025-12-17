/**
 * Technician Section Component
 * Bez cestiny diakritiky
 */

import type { IKPIInvestorReportData } from '@/types/reporting';
import { formatNumber, formatPercent } from '../utils/formatters';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface TechnicianSectionProps {
  data: IKPIInvestorReportData['technician'];
}

export function TechnicianSection({ data }: TechnicianSectionProps) {
  const { stats, declinedReasons, statusBreakdown } = data;
  const hasSLAAlert = stats.averageDaysInReview > 3;

  return (
    <div className="technician-section mb-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Technicka kontrola</h2>

      {/* SLA Alert */}
      {hasSLAAlert && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-6">
          <div className="flex items-center">
            <span className="text-red-600 font-bold text-lg mr-2">??</span>
            <div>
              <p className="text-red-800 font-semibold">SLA Alert!</p>
              <p className="text-red-700 text-sm">
                Prumerna doba kontroly {stats.averageDaysInReview} dni prekracuje SLA (max 3 dny).
                Doporucujeme zrychleni procesu nebo navyseni kapacity.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricBox
          label="Celkem predano"
          value={formatNumber(stats.totalHandedToTechnician)}
        />
        <MetricBox label="Schvaleno" value={formatNumber(stats.approved)} color="green" />
        <MetricBox label="Zamitnuto" value={formatNumber(stats.rejected)} color="red" />
        <MetricBox label="V kontrole" value={formatNumber(stats.inProgress)} color="orange" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <MetricBox label="Mira schvaleni" value={formatPercent(stats.approvalRate)} color="green" />
        <MetricBox label="Mira zamitnuti" value={formatPercent(stats.rejectionRate)} color="red" />
        <MetricBox
          label="Prumer. doba kontroly"
          value={`${stats.averageDaysInReview} dni`}
          color={hasSLAAlert ? 'red' : 'blue'}
        />
      </div>

      {/* Grafy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Status Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Rozlozeni podle statusu</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.status} (${formatPercent(entry.percentage, 0)})`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {statusBreakdown.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Declined Reasons */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Top 5 duvodu zamitnuti</h3>
          {declinedReasons.length > 0 ? (
            <div className="space-y-3">
              {declinedReasons.slice(0, 5).map((reason, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{reason.reason}</span>
                    <span className="font-semibold">
                      {reason.count} ({formatPercent(reason.percentage)})
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${reason.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Zadna zamitnuti</p>
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
      : color === 'orange'
      ? 'text-orange-600'
      : color === 'blue'
      ? 'text-blue-600'
      : 'text-gray-900';

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-xl font-bold ${colorClass}`}>{value}</div>
    </div>
  );
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];
