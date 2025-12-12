import { useState, useEffect, useMemo } from 'react';
import { axiosClient } from '@/api/axiosClient';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Types based on backend API
interface ICarStatsItem {
  carId: string;
  leadId?: string;
  leaseId?: string;
  customerName: string;
  customerPhone: string;
  carBrand: string;
  carModel: string;
  carVIN: string;
  carSPZ: string;
  carYear: number;
  carMileage: number;
  purchasePrice: number;
  estimatedValue: number;
  convertedDate: string;
  currentStatus: string;
  hasPhotos: boolean;
  hasDocuments: boolean;
  monthlyPayment?: number;
  leaseDuration?: number;
  notes: string;
}

interface ICarStats {
  totalCars: number;
  totalPurchaseValue: number;
  totalEstimatedValue: number;
  averagePurchasePrice: number;
  averageEstimatedValue: number;
  averageMileage: number;
  averageAge: number;
}

interface ICarStatsReportData {
  dateFrom: string;
  dateTo: string;
  stats: ICarStats;
  cars: ICarStatsItem[];
  byBrand: Array<{ brand: string; count: number; totalValue: number; avgPrice: number; percentage: number }>;
  byYear: Array<{ year: number; count: number; avgMileage: number; avgPrice: number }>;
  byMileageRange: Array<{ range: string; count: number; percentage: number }>;
}

type PeriodType = 'day' | 'week' | 'month' | 'year' | 'custom';

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export function Reports2CarStats() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ICarStatsReportData | null>(null);

  // Period filters
  const [period, setPeriod] = useState<PeriodType>('month');
  const [customDateFrom, setCustomDateFrom] = useState<string>('');
  const [customDateTo, setCustomDateTo] = useState<string>('');

  // Additional filters
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [yearFromFilter, setYearFromFilter] = useState<string>('');
  const [yearToFilter, setYearToFilter] = useState<string>('');
  const [mileageFromFilter, setMileageFromFilter] = useState<string>('');
  const [mileageToFilter, setMileageToFilter] = useState<string>('');

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      
      if (period === 'custom' && customDateFrom && customDateTo) {
        params.append('dateFrom', customDateFrom);
        params.append('dateTo', customDateTo);
      } else {
        params.append('period', period);
      }

      if (brandFilter) params.append('brand', brandFilter);
      if (yearFromFilter) params.append('yearFrom', yearFromFilter);
      if (yearToFilter) params.append('yearTo', yearToFilter);
      if (mileageFromFilter) params.append('mileageFrom', mileageFromFilter);
      if (mileageToFilter) params.append('mileageTo', mileageToFilter);

      const response = await axiosClient.get(`/stats/car-stats?${params.toString()}`);
      setReportData(response.data);
    } catch (err) {
      console.error('Car Stats API error:', err);
      setError(err instanceof Error ? err.message : 'Nepodařilo se načíst data reportu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [period]);

  const handleFilter = () => {
    fetchReportData();
  };

  const clearFilters = () => {
    setBrandFilter('');
    setYearFromFilter('');
    setYearToFilter('');
    setMileageFromFilter('');
    setMileageToFilter('');
    fetchReportData();
  };

  const getPeriodLabel = (): string => {
    switch (period) {
      case 'day': return 'Dnes';
      case 'week': return 'Tento týden';
      case 'month': return 'Tento měsíc';
      case 'year': return 'Tento rok';
      case 'custom': return `${customDateFrom} - ${customDateTo}`;
      default: return '';
    }
  };

  // Prepare chart data
  const brandChartData = useMemo(() => {
    if (!reportData?.byBrand) return [];
    return reportData.byBrand.slice(0, 6).map(item => ({
      name: item.brand,
      count: item.count,
      value: item.totalValue,
      avgPrice: item.avgPrice,
    }));
  }, [reportData]);

  const yearChartData = useMemo(() => {
    if (!reportData?.byYear) return [];
    return reportData.byYear.map(item => ({
      name: item.year.toString(),
      count: item.count,
      avgPrice: item.avgPrice,
      avgMileage: item.avgMileage,
    }));
  }, [reportData]);

  const mileageChartData = useMemo(() => {
    if (!reportData?.byMileageRange) return [];
    return reportData.byMileageRange.map(item => ({
      name: item.range,
      count: item.count,
      percentage: item.percentage,
    }));
  }, [reportData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📊 Statistiky aut</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kompletní přehled konvertovaných vozidel s filtrováním
          </p>
        </div>
      </div>

      {/* Period Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <span className="text-sm font-medium text-gray-700">Období:</span>
          <div className="flex gap-2 flex-wrap">
            {(['day', 'week', 'month', 'year', 'custom'] as PeriodType[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {p === 'day' && 'Den'}
                {p === 'week' && 'Týden'}
                {p === 'month' && 'Měsíc'}
                {p === 'year' && 'Rok'}
                {p === 'custom' && 'Vlastní'}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customDateFrom}
                onChange={(e) => setCustomDateFrom(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                value={customDateTo}
                onChange={(e) => setCustomDateTo(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          )}
        </div>

        {/* Additional Filters */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex flex-wrap items-center gap-4">
            <input
              type="text"
              placeholder="Značka (např. Škoda)"
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm w-36"
            />
            <input
              type="number"
              placeholder="Rok od"
              value={yearFromFilter}
              onChange={(e) => setYearFromFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm w-24"
            />
            <input
              type="number"
              placeholder="Rok do"
              value={yearToFilter}
              onChange={(e) => setYearToFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm w-24"
            />
            <input
              type="number"
              placeholder="Nájezd od (km)"
              value={mileageFromFilter}
              onChange={(e) => setMileageFromFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm w-32"
            />
            <input
              type="number"
              placeholder="Nájezd do (km)"
              value={mileageToFilter}
              onChange={(e) => setMileageToFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm w-32"
            />
            <button
              onClick={handleFilter}
              className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
            >
              Filtrovat
            </button>
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
            >
              Vymazat filtry
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      )}

      {/* Report Content */}
      {!loading && reportData && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="text-sm font-medium text-purple-600">🚗 Celkem aut</div>
              <div className="text-3xl font-bold text-purple-900 mt-1">
                {reportData.stats?.totalCars}
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-sm font-medium text-blue-600">💰 Celková hodnota odkupu</div>
              <div className="text-2xl font-bold text-blue-900 mt-1">
                {reportData.stats?.totalPurchaseValue?.toLocaleString('cs-CZ')} Kč
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-sm font-medium text-green-600">📊 Průměrná cena</div>
              <div className="text-2xl font-bold text-green-900 mt-1">
                {reportData.stats?.averagePurchasePrice?.toLocaleString('cs-CZ')} Kč
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="text-sm font-medium text-orange-600">🛣️ Průměrný nájezd</div>
              <div className="text-2xl font-bold text-orange-900 mt-1">
                {reportData.stats?.averageMileage?.toLocaleString('cs-CZ')} km
              </div>
            </div>
            <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
              <div className="text-sm font-medium text-cyan-600">📅 Průměrné stáří</div>
              <div className="text-2xl font-bold text-cyan-900 mt-1">
                {reportData.stats?.averageAge?.toFixed(1)} let
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Brand Distribution */}
            {brandChartData.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Rozložení podle značky</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={brandChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Year Distribution */}
            {yearChartData.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Rozložení podle roku</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={yearChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Mileage Distribution */}
            {mileageChartData.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🛣️ Rozložení podle nájezdu</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={mileageChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name }) => name as string}
                      outerRadius={80}
                      dataKey="count"
                    >
                      {mileageChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Cars Table */}
          {reportData.cars && reportData.cars.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">🚗 Seznam aut ({reportData.cars.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Značka & Model</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Rok</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Nájezd</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">SPZ</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">VIN</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Odkupní cena</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Odhad. hodnota</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Zákazník</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Datum</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Foto</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Dok.</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.cars.map((car, index) => (
                      <tr key={car.carId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{car.carBrand} {car.carModel}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-900">{car.carYear}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {car.carMileage?.toLocaleString('cs-CZ')} km
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{car.carSPZ}</td>
                        <td className="px-4 py-3 text-xs font-mono text-gray-500">{car.carVIN}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                          {car.purchasePrice?.toLocaleString('cs-CZ')} Kč
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-blue-600">
                          {car.estimatedValue?.toLocaleString('cs-CZ')} Kč
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{car.customerName}</div>
                          <div className="text-xs text-gray-500">{car.customerPhone}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(car.convertedDate).toLocaleDateString('cs-CZ')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {car.hasPhotos ? <span className="text-green-600">✓</span> : <span className="text-red-600">✗</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {car.hasDocuments ? <span className="text-green-600">✓</span> : <span className="text-red-600">✗</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Brand Statistics Table */}
          {reportData.byBrand && reportData.byBrand.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">📊 Statistiky podle značky</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Značka</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Počet</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Celková hodnota</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Průměrná cena</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Podíl</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.byBrand.map((item, index) => (
                      <tr key={item.brand} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.brand}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">{item.count}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                          {item.totalValue?.toLocaleString('cs-CZ')} Kč
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {item.avgPrice?.toLocaleString('cs-CZ')} Kč
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">{item.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">📝 Poznámky k reportu</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Zobrazuje pouze konvertovaná vozidla (úspěšně odkoupená)</li>
              <li>• Použijte filtry pro detailnější analýzu podle značky, roku nebo nájezdu</li>
              <li>• <strong>Odkupní cena</strong> - cena, za kterou bylo auto odkoupeno</li>
              <li>• <strong>Odhadovaná hodnota</strong> - aktuální tržní odhad</li>
              <li>• Data jsou aktuální k vybranému období: <strong>{getPeriodLabel()}</strong></li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default Reports2CarStats;
