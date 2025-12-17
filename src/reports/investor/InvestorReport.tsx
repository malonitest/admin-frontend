/**
 * Investor KPI Report - Main Page Component
 * Profesionalni investor report bez cestiny diakritiky
 */

import { useState, useEffect } from 'react';
import { reportingApi } from '@/api/reportingApi';
import type { IKPIInvestorReportData } from '@/types/reporting';
import { formatDate, formatPeriod, formatDateTime } from '../utils/formatters';
import { exportToPDF } from '../utils/export';
import { ExecutiveSummary } from '../components/ExecutiveSummary';
import { KPICards } from '../components/KPICards';
import { FinancialSection } from '../components/FinancialSection';
import { FunnelSection } from '../components/FunnelSection';
import { TechnicianSection } from '../components/TechnicianSection';
import { FleetSection } from '../components/FleetSection';
import { RiskSection } from '../components/RiskSection';
import { FileDown, Calendar } from 'lucide-react';

type PeriodType = 'day' | 'week' | 'month' | 'year' | 'custom';

export function InvestorReport() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodType>('month');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [data, setData] = useState<IKPIInvestorReportData | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const filters: any = {};

      if (period === 'custom' && customDateFrom && customDateTo) {
        filters.dateFrom = customDateFrom;
        filters.dateTo = customDateTo;
      } else if (period !== 'custom') {
        filters.period = period;
      }

      const response = await reportingApi.getKPIReport(filters);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodarilo se nacist data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (period !== 'custom') {
      fetchData();
    }
  }, [period]);

  const handleCustomDateSearch = () => {
    if (customDateFrom && customDateTo) {
      fetchData();
    }
  };

  const handleExportPDF = () => {
    if (data) {
      exportToPDF(data.dateFrom, data.dateTo);
    }
  };

  return (
    <div className="investor-report min-h-screen bg-gray-50">
      {/* Kontrolni panel - hidden v print mode */}
      <div className="print:hidden bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Investor KPI Report</h1>

            <div className="flex items-center gap-4 flex-wrap">
              {/* Period selector */}
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-600">Obdobi:</span>
                <div className="flex gap-2">
                  {(['day', 'week', 'month', 'year', 'custom'] as PeriodType[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                        period === p
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {p === 'day' && 'Den'}
                      {p === 'week' && 'Tyden'}
                      {p === 'month' && 'Mesic'}
                      {p === 'year' && 'Rok'}
                      {p === 'custom' && 'Vlastni'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom date picker */}
              {period === 'custom' && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded text-sm"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded text-sm"
                  />
                  <button
                    onClick={handleCustomDateSearch}
                    className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
                  >
                    Hledat
                  </button>
                </div>
              )}

              {/* PDF Export */}
              {data && (
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition-colors"
                >
                  <FileDown className="w-4 h-4" />
                  Export PDF
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-8 print:px-0 print:py-0">
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Nacitani...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">
            <p className="font-semibold">Chyba pri nacitani dat:</p>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* Cover page */}
            <div className="report-cover bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl p-12 mb-8 print:rounded-none print:mb-0 print:min-h-screen print:flex print:flex-col print:justify-center">
              <div className="text-center">
                <h1 className="text-5xl font-bold mb-6">Investor KPI Report</h1>
                <div className="text-2xl mb-4">
                  Obdobi: {formatPeriod(data.dateFrom, data.dateTo)}
                </div>
                <div className="text-lg opacity-90 mb-8">
                  Vygenerovano: {formatDateTime(new Date())}
                </div>
                <div className="inline-block bg-white/10 backdrop-blur rounded-lg px-8 py-4">
                  <p className="text-sm opacity-75">Verze reportu: v1.0</p>
                  <p className="text-xs mt-2 opacity-75">
                    Interni material - nesirit bez souhlasu.
                  </p>
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            <ExecutiveSummary data={data} />

            {/* Hlavni KPI */}
            <KPICards metrics={data.summary} title="Hlavni KPI" />

            {/* Highlights */}
            {data.highlights && data.highlights.length > 0 && (
              <KPICards metrics={data.highlights} title="Highlights" />
            )}

            {/* Financial Section */}
            <FinancialSection data={data.financial} />

            {/* Funnel Section */}
            <FunnelSection data={data.funnel} />

            {/* Technician Section */}
            <TechnicianSection data={data.technician} />

            {/* Fleet Section */}
            <FleetSection data={data.fleet} />

            {/* Risk Section */}
            <RiskSection data={data.risk} />

            {/* Footer - print only */}
            <div className="hidden print:block mt-12 pt-6 border-t border-gray-300 text-center text-sm text-gray-500">
              <p>Investor KPI Report | {formatPeriod(data.dateFrom, data.dateTo)}</p>
              <p className="mt-1">© {new Date().getFullYear()} CashNdrive | Interni dokument</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default InvestorReport;
