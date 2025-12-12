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

interface ICarItem {
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

interface ICarStatsSummary {
  totalCars: number;
  totalPurchaseValue: number;
  totalEstimatedValue: number;
  averagePurchasePrice: number;
  averageEstimatedValue: number;
  averageMileage: number;
  averageAge: number;
}

interface IBrandDistributionItem {
  brand: string;
  count: number;
  totalValue: number;
  avgPrice: number;
  percentage: number;
}

interface IYearDistributionItem {
  year: number;
  count: number;
  avgMileage: number;
  avgPrice: number;
}

interface IMileageRangeItem {
  range: string;
  count: number;
  percentage: number;
}

interface ICarReportData {
  dateFrom: string;
  dateTo: string;
  stats: ICarStatsSummary;
  cars: ICarItem[];
  byBrand: IBrandDistributionItem[];
  byYear: IYearDistributionItem[];
  byMileageRange: IMileageRangeItem[];
}

type PeriodType = 'day' | 'week' | 'month' | 'year' | 'custom';

const CHART_COLORS = ['#C41E3A', '#8B1A1A', '#2563EB', '#059669', '#D97706', '#7C3AED', '#DC2626', '#0891B2', '#65A30D', '#EA580C'];

const DEFAULT_CURL = `curl "https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1/stats/car-stats?period=month" -H "Authorization: Bearer YOUR_TOKEN"`;
const FILTERED_CURL = `curl "https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1/stats/car-stats?brand=Škoda&yearFrom=2018&mileageTo=150000" -H "Authorization: Bearer YOUR_TOKEN"`;

const numberFromValue = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const resolveCarYear = (car: ICarItem): number | null => {
  const extendedCar = car as ICarItem & {
    year?: number | string | null;
    registration?: number | string | null;
    car?: { year?: number | string | null; registration?: number | string | null };
    carDetails?: { year?: number | string | null; registration?: number | string | null };
  };

  const candidates = [
    car.carYear,
    extendedCar.year,
    extendedCar.registration,
    extendedCar.car?.year,
    extendedCar.car?.registration,
    extendedCar.carDetails?.year,
    extendedCar.carDetails?.registration,
  ];

  for (const candidate of candidates) {
    const parsed = numberFromValue(candidate);
    if (parsed !== null) {
      return parsed;
    }
  }
  return null;
};

const resolveCarMileage = (car: ICarItem): number | null => {
  const extendedCar = car as ICarItem & {
    mileage?: number | string | null;
    car?: { mileage?: number | string | null };
    carDetails?: { mileage?: number | string | null };
  };

  const candidates = [
    car.carMileage,
    extendedCar.mileage,
    extendedCar.car?.mileage,
    extendedCar.carDetails?.mileage,
  ];

  for (const candidate of candidates) {
    const parsed = numberFromValue(candidate);
    if (parsed !== null) {
      return parsed;
    }
  }
  return null;
};

const ReportsCars: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ICarReportData | null>(null);

  const [period, setPeriod] = useState<PeriodType>('month');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [yearFromFilter, setYearFromFilter] = useState('');
  const [yearToFilter, setYearToFilter] = useState('');
  const [mileageFromFilter, setMileageFromFilter] = useState('');
  const [mileageToFilter, setMileageToFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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

      const query = params.toString();
      const response = await axiosClient.get(query ? `/stats/car-stats?${query}` : '/stats/car-stats');
      setReportData(response.data);
    } catch (err) {
      console.error('? Car stats error:', err);
      setError(err instanceof Error ? err.message : 'Nepodaøilo se naèíst data reportu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (period === 'custom' && (!customDateFrom || !customDateTo)) {
      return;
    }
    fetchReportData();
  }, [period, customDateFrom, customDateTo, brandFilter, yearFromFilter, yearToFilter, mileageFromFilter, mileageToFilter]);

  const filteredCars = useMemo(() => {
    if (!reportData) return [];
    return reportData.cars.filter(car => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        car.carBrand?.toLowerCase().includes(q) ||
        car.carModel?.toLowerCase().includes(q) ||
        car.carVIN?.toLowerCase().includes(q) ||
        car.carSPZ?.toLowerCase().includes(q)
      );
    });
  }, [reportData, searchQuery]);

  const uniqueBrands = useMemo(() => {
    if (!reportData) return [] as string[];
    return Array.from(new Set(reportData.cars.map(car => car.carBrand))).sort();
  }, [reportData]);

  const uniqueYears = useMemo(() => {
    if (!reportData) return [] as number[];
    const resolvedYears = reportData.cars
      .map(car => resolveCarYear(car))
      .filter((year): year is number => year !== null);
    return Array.from(new Set(resolvedYears)).sort((a, b) => b - a);
  }, [reportData]);

  const brandChartData = useMemo<Array<Record<string, number | string>>>(() => {
    return (reportData?.byBrand ?? []).map(item => ({
      brand: item.brand,
      count: item.count,
      percentage: item.percentage,
      totalValue: item.totalValue,
      avgPrice: item.avgPrice,
    }));
  }, [reportData]);

  const yearChartData = useMemo(() => reportData?.byYear ?? [], [reportData]);
  const mileageChartData = useMemo(() => reportData?.byMileageRange ?? [], [reportData]);

  const formatCurrency = (value: number | string | null | undefined): string => {
    const numericValue = numberFromValue(value);
    if (numericValue === null) return '-';
    return `${numericValue.toLocaleString('cs-CZ')} Kè`;
  };

  const formatNumber = (value: number | string | null | undefined, suffix = ''): string => {
    const numericValue = numberFromValue(value);
    if (numericValue === null) return '-';
    return `${numericValue.toLocaleString('cs-CZ')}${suffix}`;
  };

  const formatDate = (value?: string): string => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('cs-CZ');
  };

  const getStatusColor = (status: string): string => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderBrandLabel = (entry: { payload?: Partial<IBrandDistributionItem> }) => {
    const brand = entry.payload?.brand;
    const percentage = entry.payload?.percentage;
    if (!brand || typeof percentage !== 'number') {
      return '';
    }
    return `${brand} (${percentage.toFixed(1)}%)`;
  };

  const renderInstructionList = () => (
    <ul className="text-sm text-blue-700 space-y-1 list-disc ml-5">
      <li>Vyberte <strong>období</strong> (den, týden, mìsíc, rok nebo vlastní rozsah) – filtruje data pøímo na backendu.</li>
      <li>Filtrování podle <strong>znaèky, roku výroby a nájezdu</strong> využívá parametry API (brand, yearFrom, mileageFrom/To).</li>
      <li>Vyhledávání pomáhá v tabulce (znaèka, model, VIN, SPZ) – zùstává jen na frontendu.</li>
      <li>Rozšíøené statistiky kombinují údaje podle znaèky, roku výroby a nájezdových pásem.</li>
      <li>Detailní tabulka zobrazuje kontakt na zákazníka, datum konverze i stav dokumentace.</li>
      <li>Export dat probíhá pøes endpoint <code className="text-xs bg-blue-100 px-1.5 py-0.5 rounded">GET /v1/stats/car-stats</code>.</li>
    </ul>
  );

  const renderCurlExamples = () => (
    <div className="mt-3 space-y-2">
      <p className="text-xs text-blue-800 font-semibold">Pøíklady dotazù na API:</p>
      <pre className="bg-blue-100 text-[11px] text-blue-900 p-2 rounded break-all">{DEFAULT_CURL}</pre>
      <pre className="bg-blue-100 text-[11px] text-blue-900 p-2 rounded break-all">{FILTERED_CURL}</pre>
    </div>
  );

  const renderSummaryCards = () => {
    const stats = reportData?.stats;
    if (!stats) return null;

    const cards = [
      { label: 'Celkem aut v systému', value: stats.totalCars.toLocaleString('cs-CZ') },
      { label: 'Celková odkupní hodnota', value: `${stats.totalPurchaseValue.toLocaleString('cs-CZ')} Kè` },
      { label: 'Celková odhadovaná hodnota', value: `${stats.totalEstimatedValue.toLocaleString('cs-CZ')} Kè` },
      { label: 'Prùmìrná odkupní cena', value: `${stats.averagePurchasePrice.toLocaleString('cs-CZ')} Kè` },
      { label: 'Prùmìrná odhadovaná hodnota', value: `${stats.averageEstimatedValue.toLocaleString('cs-CZ')} Kè` },
      { label: 'Prùmìrný nájezd', value: `${stats.averageMileage.toLocaleString('cs-CZ')} km` },
      { label: 'Prùmìrné stáøí vozidel', value: `${stats.averageAge.toFixed(1)} roku` },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => (
          <div key={card.label} className="bg-white rounded-lg shadow p-4">
            <div className="text-sm font-medium text-gray-500">{card.label}</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{card.value}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderCompleteness = () => {
    if (!reportData) return null;
    const total = reportData.stats.totalCars;
    const withPhotos = reportData.cars.filter(car => car.hasPhotos).length;
    const withDocuments = reportData.cars.filter(car => car.hasDocuments).length;
    const complete = reportData.cars.filter(car => car.hasPhotos && car.hasDocuments).length;

    const cards = [
      {
        label: 'S fotografiemi',
        value: withPhotos,
        trackBg: 'bg-blue-200',
        fillBg: 'bg-blue-600',
        accent: 'text-blue-700',
      },
      {
        label: 'S dokumenty',
        value: withDocuments,
        trackBg: 'bg-green-200',
        fillBg: 'bg-green-600',
        accent: 'text-green-700',
      },
      {
        label: 'Kompletní složky',
        value: complete,
        trackBg: 'bg-purple-200',
        fillBg: 'bg-purple-600',
        accent: 'text-purple-700',
      },
    ];

    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Dokumentace a fotografie</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {cards.map(card => (
            <div key={card.label} className="rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-center">
                <span className={`text-sm font-medium ${card.accent}`}>{card.label}</span>
                <span className="text-xl font-bold text-gray-900">{card.value}</span>
              </div>
              <div className="mt-2">
                <div className={`${card.trackBg} w-full rounded-full h-2`}>
                  <div
                    className={`${card.fillBg} h-2 rounded-full`}
                    style={{ width: `${total > 0 ? (card.value / total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCharts = () => {
    if (!reportData) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {brandChartData.length ? (
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rozložení podle znaèky</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={brandChartData}
                  dataKey="count"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  labelLine={false}
                  label={renderBrandLabel}
                >
                  {brandChartData.map((_, index) => (
                    <Cell key={`brand-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toLocaleString('cs-CZ')} ks`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : null}

        {yearChartData.length ? (
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuce podle roku výroby</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={yearChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value.toLocaleString('cs-CZ')} ks`} />
                <Bar dataKey="count" fill="#10B981" name="Poèet vozidel" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : null}

        {mileageChartData.length ? (
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuce podle nájezdu</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={mileageChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="range" width={120} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => `${value.toLocaleString('cs-CZ')} ks`} />
                <Bar dataKey="count" fill="#F59E0B" name="Poèet vozidel" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </div>
    );
  };

  const renderAdvancedTables = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {reportData?.byBrand.length ? (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiky podle znaèky</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="text-gray-500 uppercase text-xs">
                  <th className="px-3 py-2">Znaèka</th>
                  <th className="px-3 py-2 text-right">Poèet</th>
                  <th className="px-3 py-2 text-right">Celková hodnota</th>
                  <th className="px-3 py-2 text-right">Prùmìrná cena</th>
                  <th className="px-3 py-2 text-right">Podíl</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reportData.byBrand.map(item => (
                  <tr key={item.brand}>
                    <td className="px-3 py-2 font-medium text-gray-900">{item.brand}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{item.count}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{item.totalValue.toLocaleString('cs-CZ')} Kè</td>
                    <td className="px-3 py-2 text-right text-gray-700">{item.avgPrice.toLocaleString('cs-CZ')} Kè</td>
                    <td className="px-3 py-2 text-right text-gray-700">{item.percentage.toFixed(1)} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {reportData?.byYear.length ? (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiky podle roku výroby</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="text-gray-500 uppercase text-xs">
                  <th className="px-3 py-2">Rok</th>
                  <th className="px-3 py-2 text-right">Poèet</th>
                  <th className="px-3 py-2 text-right">Prùmìrný nájezd</th>
                  <th className="px-3 py-2 text-right">Prùmìrná cena</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reportData.byYear.map(item => (
                  <tr key={item.year}>
                    <td className="px-3 py-2 font-medium text-gray-900">{item.year}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{item.count}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{item.avgMileage.toLocaleString('cs-CZ')} km</td>
                    <td className="px-3 py-2 text-right text-gray-700">{item.avgPrice.toLocaleString('cs-CZ')} Kè</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {reportData?.byMileageRange.length ? (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiky podle nájezdu</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="text-gray-500 uppercase text-xs">
                  <th className="px-3 py-2">Rozsah</th>
                  <th className="px-3 py-2 text-right">Poèet</th>
                  <th className="px-3 py-2 text-right">Podíl</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reportData.byMileageRange.map(item => (
                  <tr key={item.range}>
                    <td className="px-3 py-2 font-medium text-gray-900">{item.range}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{item.count}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{item.percentage.toFixed(1)} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );

  const renderCarTable = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-gray-900">Detailní tabulka aut ({filteredCars.length})</h2>
        <p className="text-sm text-gray-500 mt-1">Obsahuje ID auta, zákazníka, dokumentaci i finanèní údaje.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-[11px] uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">ID auta</th>
              <th className="px-4 py-3 text-left">Znaèka & model</th>
              <th className="px-4 py-3 text-right">Rok</th>
              <th className="px-4 py-3 text-right">Nájezd</th>
              <th className="px-4 py-3 text-left">SPZ</th>
              <th className="px-4 py-3 text-left">VIN</th>
              <th className="px-4 py-3 text-right">Odkupní cena</th>
              <th className="px-4 py-3 text-right">Odhad hodnota</th>
              <th className="px-4 py-3 text-left">Zákazník</th>
              <th className="px-4 py-3 text-left">Datum konverze</th>
              <th className="px-4 py-3 text-center">Fotky</th>
              <th className="px-4 py-3 text-center">Dokumenty</th>
              <th className="px-4 py-3 text-right">Mìsíèní splátka</th>
              <th className="px-4 py-3 text-left">Poznámky</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-sm">
            {filteredCars.length === 0 ? (
              <tr>
                <td colSpan={14} className="px-4 py-8 text-center text-gray-500">
                  Žádná vozidla nenalezena pro vybrané parametry.
                </td>
              </tr>
            ) : (
              filteredCars.map((car, index) => (
                <tr key={car.carId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 font-medium text-gray-900">{car.carId}</td>
                  <td className="px-4 py-3">
                    <div className="text-gray-900 font-semibold">{car.carBrand} {car.carModel}</div>
                    {car.currentStatus && (
                      <span className={`inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-[11px] font-medium ${getStatusColor(car.currentStatus)}`}>
                        {car.currentStatus}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatNumber(resolveCarYear(car))}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatNumber(resolveCarMileage(car), ' km')}</td>
                  <td className="px-4 py-3 text-gray-700">{car.carSPZ || '-'}</td>
                  <td className="px-4 py-3 text-gray-700">{car.carVIN || '-'}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(car.purchasePrice)}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(car.estimatedValue)}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {car.customerName || '-'}

                    {car.customerPhone && <div className="text-xs text-gray-500">{car.customerPhone}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{formatDate(car.convertedDate)}</td>
                  <td className="px-4 py-3 text-center">
                    {car.hasPhotos ? <span className="text-green-600">?</span> : <span className="text-red-600">?</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {car.hasDocuments ? <span className="text-green-600">?</span> : <span className="text-red-600">?</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {car.monthlyPayment ? formatCurrency(car.monthlyPayment) : '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {car.notes ? `${car.notes.slice(0, 60)}${car.notes.length > 60 ? '…' : ''}` : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report vozidel (Cars)</h1>
          <p className="text-sm text-gray-500 mt-1">Komplexní pøehled portfolia aut, jejich hodnot a stavu dokumentace.</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">?? Jak používat report vozidel</h3>
        {renderInstructionList()}
        {renderCurlExamples()}
      </div>

      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Období:</span>
          <div className="flex flex-wrap gap-2">
            {(['day', 'week', 'month', 'year', 'custom'] as PeriodType[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  period === p ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {p === 'day' && 'Den'}
                {p === 'week' && 'Týden'}
                {p === 'month' && 'Mìsíc'}
                {p === 'year' && 'Rok'}
                {p === 'custom' && 'Vlastní'}
              </button>
            ))}
          </div>
          {period === 'custom' && (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={customDateFrom}
                onChange={e => setCustomDateFrom(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                value={customDateTo}
                onChange={e => setCustomDateTo(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Znaèka</label>
            <select
              value={brandFilter}
              onChange={e => setBrandFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Všechny znaèky</option>
              {uniqueBrands.map(brand => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rok výroby (od)</label>
            <select
              value={yearFromFilter}
              onChange={e => setYearFromFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Žádný filtr</option>
              {uniqueYears.map(year => (
                <option key={`from-${year}`} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rok výroby (do)</label>
            <select
              value={yearToFilter}
              onChange={e => setYearToFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Žádný filtr</option>
              {uniqueYears.map(year => (
                <option key={`to-${year}`} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nájezd (od)</label>
            <input
              type="number"
              value={mileageFromFilter}
              onChange={e => setMileageFromFilter(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nájezd (do)</label>
            <input
              type="number"
              value={mileageToFilter}
              onChange={e => setMileageToFilter(e.target.value)}
              placeholder="200000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Vyhledávání</label>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Znaèka, model, VIN nebo SPZ"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>

        {(brandFilter || yearFromFilter || yearToFilter || mileageFromFilter || mileageToFilter || searchQuery || period === 'custom') && (
          <button
            onClick={() => {
              setBrandFilter('');
              setYearFromFilter('');
              setYearToFilter('');
              setMileageFromFilter('');
              setMileageToFilter('');
              setSearchQuery('');
              setPeriod('month');
              setCustomDateFrom('');
              setCustomDateTo('');
            }}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
          >
            Zrušit filtry
          </button>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      ) : reportData ? (
        <>
          {renderSummaryCards()}
          {renderCompleteness()}
          {renderCharts()}
          {renderAdvancedTables()}
          {renderCarTable()}
        </>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Nepodaøilo se naèíst data. Zkuste to prosím znovu.
        </div>
      )}
    </div>
  );
};

export default ReportsCars;
