import { useState, useEffect } from 'react';
import { axiosClient } from '@/api/axiosClient';
import { Card } from '@/components';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface LeadListItem {
  _id: string;
  uniqueId: number;
  customerName: string;
  customerSurname: string;
  carModel: string;
  requestedAmount: number;
  status: string;
  statusLabel: string;
  subStatus: string;
  subStatusLabel: string;
  receivedAt?: string | null;
  convertedAt?: string | null;
}

interface DashboardStats {
  totalLeads: number;
  totalLeadsPrevious: number;
  totalLeadsChange: number;
  openLeads: number;
  openLeadsPrevious: number;
  openLeadsChange: number;
  convertedLeads: number;
  convertedLeadsPrevious: number;
  convertedLeadsChange: number;
  approvedAM: number;
  approvedAMPrevious: number;
  approvedAMChange: number;
  leads: LeadListItem[];
}

type PeriodType = 'day' | 'month' | 'year' | 'custom';

export function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>('month');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  const getDateRange = (): { from: string; to: string } | null => {
    if (period === 'custom') {
      if (!customDateFrom || !customDateTo) {
        return null;
      }
      return {
        from: new Date(customDateFrom).toISOString(),
        to: new Date(customDateTo).toISOString(),
      };
    }

    const now = new Date();
    let from = new Date(now);
    let to = new Date(now);

    switch (period) {
      case 'day':
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case 'year':
        from = new Date(now.getFullYear(), 0, 1);
        to = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case 'month':
      default:
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
    }

    return {
      from: from.toISOString(),
      to: to.toISOString(),
    };
  };

  const fetchStats = async () => {
    const dateRange = getDateRange();
    if (period === 'custom' && !dateRange) {
      return;
    }

    setLoading(true);

    try {
      const url = '/stats/admin-dashboard';
      const params = new URLSearchParams();

      if (period === 'custom' && dateRange) {
        params.append('dateFrom', dateRange.from);
        params.append('dateTo', dateRange.to);
      } else {
        params.append('period', period);
      }

      const response = await axiosClient.get(`${url}?${params.toString()}`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (period !== 'custom') {
      fetchStats();
    }
  }, [period]);

  const handleCustomDateSearch = () => {
    if (customDateFrom && customDateTo) {
      fetchStats();
    }
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change}%`;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'day': return 'dnes vs. včera';
      case 'month': return 'tento měsíc vs. minulý měsíc';
      case 'year': return 'tento rok vs. minulý rok';
      case 'custom': return 'vlastní období';
      default: return '';
    }
  };

  const statCards = stats ? [
    { 
      label: 'Celkem žádostí', 
      value: stats.totalLeads.toLocaleString('cs-CZ'), 
      change: formatChange(stats.totalLeadsChange),
      changeValue: stats.totalLeadsChange,
      previous: stats.totalLeadsPrevious 
    },
    { 
      label: 'Celkem konvertováno', 
      value: stats.convertedLeads.toLocaleString('cs-CZ'), 
      change: formatChange(stats.convertedLeadsChange),
      changeValue: stats.convertedLeadsChange,
      previous: stats.convertedLeadsPrevious 
    },
  ] : [];

  const formatCurrency = (amount: number) => {
    if (!amount || amount === 0) {
      return 'nezadáno';
    }
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const exportToExcel = (onlyConverted: boolean) => {
    if (!stats?.leads) return;

    // Filter leads if only converted
    const leadsToExport = onlyConverted 
      ? stats.leads.filter(lead => lead.status === 'CONVERTED')
      : stats.leads;

    // Prepare data for Excel
    const excelData = leadsToExport.map(lead => ({
      'ID': lead.uniqueId,
      'Jméno': lead.customerName || '',
      'Příjmení': lead.customerSurname || '',
      'Model auta': lead.carModel || '',
      'Požadovaná částka': lead.requestedAmount || 0,
      'Status': lead.statusLabel || lead.status || '',
      'Substatus': lead.subStatusLabel || '',
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 10 },  // ID
      { wch: 15 },  // Jméno
      { wch: 15 },  // Příjmení
      { wch: 25 },  // Model auta
      { wch: 18 },  // Požadovaná částka
      { wch: 20 },  // Status
      { wch: 20 },  // Substatus
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leady');

    // Generate filename with date
    const date = new Date().toISOString().split('T')[0];
    const filename = onlyConverted 
      ? `konvertovane_leady_${date}.xlsx`
      : `vsechny_leady_${date}.xlsx`;

    // Export
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, filename);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Přehled</h1>

      {/* Period Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Období:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPeriod('day')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === 'day' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Den
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === 'month' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Měsíc
            </button>
            <button
              onClick={() => setPeriod('year')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === 'year' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rok
            </button>
            <button
              onClick={() => setPeriod('custom')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === 'custom' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Vlastní
            </button>
          </div>

          {period === 'custom' && (
            <div className="flex items-center gap-2 ml-4">
              <input
                type="date"
                value={customDateFrom}
                onChange={(e) => setCustomDateFrom(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <span className="text-gray-500">—</span>
              <input
                type="date"
                value={customDateTo}
                onChange={(e) => setCustomDateTo(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button
                onClick={handleCustomDateSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Zobrazit
              </button>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Porovnání: {getPeriodLabel()}
        </p>
      </div>

      {/* Stats Cards - Only 2 cards now */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[1, 2].map((i) => (
            <Card key={i}>
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {statCards.map((stat) => (
            <Card key={stat.label}>
              <div className="text-sm text-gray-500">{stat.label}</div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-semibold text-gray-900">
                  {stat.value}
                </span>
                <span className={`text-sm ${getChangeColor(stat.changeValue)}`}>
                  {stat.change}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Předchozí období: {stat.previous.toLocaleString('cs-CZ')}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Leads Table */}
      <Card title="Žádosti za vybrané období">
        {/* Export buttons */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => exportToExcel(false)}
            disabled={loading || !stats?.leads?.length}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportovat všechny leady
          </button>
          <button
            onClick={() => exportToExcel(true)}
            disabled={loading || !stats?.leads?.length}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Exportovat konvertované
          </button>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : stats?.leads && stats.leads.length > 0 ? (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Jméno</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Příjmení</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Model auta</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Částka</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Substatus</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.leads.map((lead) => (
                  <tr 
                    key={lead._id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/leads/${lead._id}`)}
                  >
                    <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">
                      #{lead.uniqueId}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-900">
                      {lead.customerName || '—'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-900">
                      {lead.customerSurname || '—'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-900">
                      {lead.carModel || '—'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={!lead.requestedAmount || lead.requestedAmount === 0 ? 'text-gray-400 italic' : 'text-gray-900'}>
                        {formatCurrency(lead.requestedAmount)}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {lead.statusLabel || lead.status || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {lead.subStatusLabel ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          {lead.subStatusLabel}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            Žádné žádosti za vybrané období
          </p>
        )}
      </Card>
    </div>
  );
}

export default Dashboard;
