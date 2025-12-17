/**
 * Funnel Report Page Component
 * Hlavni stranka funneloveho reportu
 * Bez cestiny diakritiky
 */

import { useState, useEffect } from 'react';
import { reportingApi } from '@/api/reportingApi';
import type { IFunnelReportData } from '@/types/reporting';
import { 
  formatPeriod, 
  formatDateTime, 
  normalizeStages,
  computeConversionRate 
} from './utils/formatters';
import { exportToPDF, exportToJSONFile } from './utils/export';
import { FunnelKPICards } from './components/FunnelKPICards';
import { FunnelChart } from './components/FunnelChart';
import { FunnelStagesTable } from './components/FunnelStagesTable';
import { DeclinedReasonsSection } from './components/DeclinedReasonsSection';
import { StageDeclinedReasons } from './components/StageDeclinedReasons';
import { NotesSection } from './components/NotesSection';
import { ActionItems } from './components/ActionItems';
import { FileDown, Calendar, Download } from 'lucide-react';
import './styles/print.css';

type PeriodType = 'day' | 'week' | 'month' | 'year' | 'custom';

export function FunnelReportPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodType>('month');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [data, setData] = useState<IFunnelReportData | null>(null);

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

      const response = await reportingApi.getFunnelReport(filters);
      
      // Normalizace stages a fallback pro conversionRate
      const normalizedStages = normalizeStages(response.stages);
      const conversionRate = response.conversionRate || 
        computeConversionRate(response.convertedLeads, response.totalLeads);
      
      setData({
        ...response,
        stages: normalizedStages,
        conversionRate,
      });
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

  const handleExportPDF = async () => {
    if (data) {
      await exportToPDF(data);
    }
  };

  const handleExportJSON = () => {
    if (data) {
      exportToJSONFile(data);
    }
  };

  return (
    <div className="funnel-report-container min-h-screen bg-gray-50">
      {/* Control Panel - hidden in print */}
      <div className="no-print bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Funnel Report Leadu</h1>

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

              {/* Export buttons */}
              {data && (
                <div className="flex gap-2">
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition-colors"
                  >
                    <FileDown className="w-4 h-4" />
                    PDF
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    JSON
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
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
            {/* Report Header - visible in print */}
            <div className="report-header bg-white rounded-lg p-8 mb-8 shadow-sm">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Funnel Report Leadu</h1>
              <div className="text-lg text-gray-700">
                Obdobi: {formatPeriod(data.dateFrom, data.dateTo)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Vygenerovano: {formatDateTime(new Date())}
              </div>
            </div>

            {/* KPI Cards */}
            <FunnelKPICards data={data} />

            {/* Funnel Visualization */}
            <FunnelChart stages={data.stages} />

            {/* Stages Table */}
            <FunnelStagesTable 
              stages={data.stages} 
              averageTimeInStages={data.averageTimeInStages} 
            />

            {/* Declined Reasons Overall */}
            <DeclinedReasonsSection 
              declinedReasons={data.declinedReasons}
              declinedLeads={data.declinedLeads}
            />

            {/* Declined Reasons by Stage */}
            <StageDeclinedReasons stages={data.stages} />

            {/* Notes Section */}
            <NotesSection stages={data.stages} />

            {/* Action Items */}
            <ActionItems data={data} />

            {/* Footer - print only */}
            <div className="hidden print:block report-footer">
              <p>Funnel Report Leadu | {formatPeriod(data.dateFrom, data.dateTo)}</p>
              <p className="mt-1">© {new Date().getFullYear()} CashNdrive | Interni dokument</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default FunnelReportPage;
