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
interface ICarItem {
  id: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  purchasePrice: number;
  estimatedValue: number;
  vin?: string;
  hasPhotos: boolean;
  hasDocuments: boolean;
  notes?: string;
  status: string;
}

interface ICarStats {
  totalCars: number;
  totalValue: number;
  averagePrice: number;
  averageYear: number;
  averageMileage: number;
  roi: number;
  brandDistribution: Array<{
    brand: string;
    count: number;
    percentage: number;
  }>;
  yearDistribution: Array<{
    year: number;
    count: number;
  }>;
  mileageDistribution: Array<{
    range: string;
    count: number;
  }>;
  completeness: {
    withPhotos: number;
    withDocuments: number;
    complete: number;
  };
}

interface ICarReportData {
  stats: ICarStats;
  cars: ICarItem[];
}

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

const ReportsCars: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ICarReportData | null>(null);

  // Filters
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('');
  const [mileageFilter, setMileageFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axiosClient.get('/stats/car-stats');
      console.log('?? Car stats response:', response.data);
      setReportData(response.data);
    } catch (err) {
      console.error('? Car stats error:', err);
      setError(err instanceof Error ? err.message : 'Nepodaøilo se naèíst data reportu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  // Filtered cars
  const filteredCars = useMemo(() => {
    if (!reportData) return [];
    
    return reportData.cars.filter(car => {
      const matchesBrand = !brandFilter || car.brand === brandFilter;
      const matchesYear = !yearFilter || car.year.toString() === yearFilter;
      const matchesMileage = !mileageFilter || (
        mileageFilter === '0-50000' ? car.mileage <= 50000 :
        mileageFilter === '50000-100000' ? (car.mileage > 50000 && car.mileage <= 100000) :
        mileageFilter === '100000-150000' ? (car.mileage > 100000 && car.mileage <= 150000) :
        car.mileage > 150000
      );
      const matchesSearch = !searchQuery || 
        car.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        car.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (car.vin && car.vin.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesBrand && matchesYear && matchesMileage && matchesSearch;
    });
  }, [reportData, brandFilter, yearFilter, mileageFilter, searchQuery]);

  // Unique brands and years for filters
  const uniqueBrands = useMemo(() => {
    if (!reportData) return [];
    return Array.from(new Set(reportData.cars.map(car => car.brand))).sort();
  }, [reportData]);

  const uniqueYears = useMemo(() => {
    if (!reportData) return [];
    return Array.from(new Set(reportData.cars.map(car => car.year))).sort((a, b) => b - a);
  }, [reportData]);

  const formatCurrency = (value: number): string => {
    return value.toLocaleString('cs-CZ') + ' Kè';
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'sold': return 'bg-blue-100 text-blue-800';
      case 'reserved': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pøehled portfolia vozidel</h1>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">{error}</div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Summary Cards */}
      {!loading && reportData && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 text-blue-700 mb-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="text-sm">Celkem vozidel</span>
              </div>
              <div className="text-3xl font-bold text-blue-900">{reportData.stats.totalCars}</div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2 text-green-700 mb-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">Celková hodnota</span>
              </div>
              <div className="text-2xl font-bold text-green-900">{formatCurrency(reportData.stats.totalValue)}</div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 text-purple-700 mb-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">Prùmìrná cena</span>
              </div>
              <div className="text-2xl font-bold text-purple-900">{formatCurrency(reportData.stats.averagePrice)}</div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center gap-2 text-orange-700 mb-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">Prùmìrný rok</span>
              </div>
              <div className="text-3xl font-bold text-orange-900">{Math.round(reportData.stats.averageYear)}</div>
            </div>

            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
              <div className="flex items-center gap-2 text-indigo-700 mb-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="text-sm">Prùmìrný nájezd</span>
              </div>
              <div className="text-2xl font-bold text-indigo-900">{reportData.stats.averageMileage.toLocaleString('cs-CZ')} km</div>
            </div>

            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center gap-2 text-red-700 mb-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-sm">ROI</span>
              </div>
              <div className="text-3xl font-bold text-red-900">{reportData.stats.roi.toFixed(1)}%</div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Brand Distribution Pie Chart */}
            {reportData.stats.brandDistribution.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rozložení podle znaèky</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={reportData.stats.brandDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.brand}: ${entry.count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {reportData.stats.brandDistribution.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Year Distribution Bar Chart */}
            {reportData.stats.yearDistribution.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuce podle roku výroby</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={reportData.stats.yearDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10B981" name="Poèet vozidel" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Mileage Distribution */}
            {reportData.stats.mileageDistribution.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuce podle nájezdu</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={reportData.stats.mileageDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="range" type="category" width={100} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#F59E0B" name="Poèet vozidel" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Quality Control Section */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Kontrola kompletnosti dokumentace</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">S fotografiemi</span>
                  <span className="text-2xl font-bold text-blue-900">{reportData.stats.completeness.withPhotos}</span>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(reportData.stats.completeness.withPhotos / reportData.stats.totalCars) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700">S dokumenty</span>
                  <span className="text-2xl font-bold text-green-900">{reportData.stats.completeness.withDocuments}</span>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(reportData.stats.completeness.withDocuments / reportData.stats.totalCars) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-700">Kompletní</span>
                  <span className="text-2xl font-bold text-purple-900">{reportData.stats.completeness.complete}</span>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-purple-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${(reportData.stats.completeness.complete / reportData.stats.totalCars) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtry</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hledat</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Znaèka, model, VIN..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Znaèka</label>
                <select
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Všechny znaèky</option>
                  {uniqueBrands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rok výroby</label>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Všechny roky</option>
                  {uniqueYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nájezd</label>
                <select
                  value={mileageFilter}
                  onChange={(e) => setMileageFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Všechny</option>
                  <option value="0-50000">0 - 50 000 km</option>
                  <option value="50000-100000">50 000 - 100 000 km</option>
                  <option value="100000-150000">100 000 - 150 000 km</option>
                  <option value="150000+">150 000+ km</option>
                </select>
              </div>
            </div>

            {(brandFilter || yearFilter || mileageFilter || searchQuery) && (
              <button
                onClick={() => {
                  setBrandFilter('');
                  setYearFilter('');
                  setMileageFilter('');
                  setSearchQuery('');
                }}
                className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Zrušit filtry
              </button>
            )}
          </div>

          {/* Cars Table */}
          <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Seznam vozidel ({filteredCars.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Vozidlo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">VIN</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Rok</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Nájezd</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Odkupní cena</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Odhadovaná hodnota</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Fotky</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Dokumenty</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCars.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                        Žádná vozidla nenalezena pro vybrané filtry
                      </td>
                    </tr>
                  ) : (
                    filteredCars.map((car, index) => (
                      <tr key={car.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{car.brand} {car.model}</div>
                          {car.notes && (
                            <div className="text-xs text-gray-500 mt-1">{car.notes.substring(0, 50)}...</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{car.vin || '-'}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">{car.year}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                          {car.mileage.toLocaleString('cs-CZ')} km
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          {formatCurrency(car.purchasePrice)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          {formatCurrency(car.estimatedValue)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {car.hasPhotos ? (
                            <span className="inline-flex items-center text-green-600">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-red-600">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {car.hasDocuments ? (
                            <span className="inline-flex items-center text-green-600">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-red-600">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(car.status)}`}>
                            {car.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsCars;
