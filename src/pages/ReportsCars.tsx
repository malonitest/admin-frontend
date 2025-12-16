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

const CONVERTED_STATUS_VALUES = ['converted', 'konvertovano', 'konvertováno'];

const normalizeStatus = (value?: string | null) => {
  if (!value) return '';
  return value.trim().toLowerCase();
};

const isConvertedCar = (car: ICarItem): boolean => {
  const extended = car as ICarItem & { status?: string; carStatus?: string; leaseStatus?: string };
  const candidates = [car.currentStatus, extended.status, extended.carStatus, extended.leaseStatus];
  return candidates.some(status => CONVERTED_STATUS_VALUES.includes(normalizeStatus(status)));
};

const MILEAGE_BUCKETS = [
  { label: '0-50k', min: 0, max: 50_000 },
  { label: '50-100k', min: 50_000, max: 100_000 },
  { label: '100-150k', min: 100_000, max: 150_000 },
  { label: '150-200k', min: 150_000, max: 200_000 },
  { label: '200k+', min: 200_000, max: Number.POSITIVE_INFINITY },
];

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
      console.error('Car stats error:', err);
      setError(err instanceof Error ? err.message : 'Nepodarilo se nacist data reportu');
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

  const convertedCars = useMemo(() => {
    if (!reportData) return [] as ICarItem[];
    return reportData.cars.filter(isConvertedCar);
  }, [reportData]);

  const summaryStats = useMemo<ICarStatsSummary | null>(() => {
    if (!convertedCars.length) return null;

    let totalPurchaseValue = 0;
    let totalEstimatedValue = 0;
    let totalMileage = 0;
    let mileageSamples = 0;
    let totalAge = 0;
    let ageSamples = 0;

    convertedCars.forEach(car => {
      const purchase = numberFromValue(car.purchasePrice);
      const estimated = numberFromValue(car.estimatedValue);
      if (purchase !== null) totalPurchaseValue += purchase;
      if (estimated !== null) totalEstimatedValue += estimated;

      const mileage = resolveCarMileage(car);
      if (mileage !== null) {
        totalMileage += mileage;
        mileageSamples += 1;
      }

      const year = resolveCarYear(car);
      if (year !== null && year > 1900) {
        const currentYear = new Date().getFullYear();
        totalAge += currentYear - year;
        ageSamples += 1;
      }
    });

    const totalCars = convertedCars.length;

    return {
      totalCars,
      totalPurchaseValue,
      totalEstimatedValue,
      averagePurchasePrice: totalCars ? totalPurchaseValue / totalCars : 0,
      averageEstimatedValue: totalCars ? totalEstimatedValue / totalCars : 0,
      averageMileage: mileageSamples ? totalMileage / mileageSamples : 0,
      averageAge: ageSamples ? totalAge / ageSamples : 0,
    };
  }, [convertedCars]);

  const brandBreakdown = useMemo<IBrandDistributionItem[]>(() => {
    if (!convertedCars.length) return [];
    const map = new Map<string, { count: number; totalValue: number }>();

    convertedCars.forEach(car => {
      const brand = car.carBrand || 'Neznama znacka';
      const purchase = numberFromValue(car.purchasePrice) ?? 0;
      const current = map.get(brand) ?? { count: 0, totalValue: 0 };
      current.count += 1;
      current.totalValue += purchase;
      map.set(brand, current);
    });

    const totalCars = convertedCars.length;

    return Array.from(map.entries()).map(([brand, data]) => ({
      brand,
      count: data.count,
      totalValue: data.totalValue,
      avgPrice: data.count ? data.totalValue / data.count : 0,
      percentage: totalCars ? (data.count / totalCars) * 100 : 0,
    }));
  }, [convertedCars]);

  const yearBreakdown = useMemo<IYearDistributionItem[]>(() => {
    if (!convertedCars.length) return [];
    const map = new Map<number, { count: number; mileageSum: number; mileageSamples: number; priceSum: number }>();

    convertedCars.forEach(car => {
      const year = resolveCarYear(car);
      if (year === null) return;

      const mileage = resolveCarMileage(car);
      const purchase = numberFromValue(car.purchasePrice) ?? 0;
      const current = map.get(year) ?? { count: 0, mileageSum: 0, mileageSamples: 0, priceSum: 0 };
      current.count += 1;
      current.priceSum += purchase;
      if (mileage !== null) {
        current.mileageSum += mileage;
        current.mileageSamples += 1;
      }
      map.set(year, current);
    });

    return Array.from(map.entries())
      .map(([year, data]) => ({
        year,
        count: data.count,
        avgMileage: data.mileageSamples ? data.mileageSum / data.mileageSamples : 0,
        avgPrice: data.count ? data.priceSum / data.count : 0,
      }))
      .sort((a, b) => b.year - a.year);
  }, [convertedCars]);

  const mileageBreakdown = useMemo<IMileageRangeItem[]>(() => {
    if (!convertedCars.length) return [];

    const totals = MILEAGE_BUCKETS.map(bucket => ({ ...bucket, count: 0 }));

    convertedCars.forEach(car => {
      const mileage = resolveCarMileage(car);
      if (mileage === null) return;
      const bucket = totals.find(b => mileage >= b.min && mileage < b.max);
      if (bucket) {
        bucket.count += 1;
      }
    });

    return totals
      .filter(bucket => bucket.count > 0)
      .map(bucket => ({
        range: bucket.label,
        count: bucket.count,
        percentage: convertedCars.length ? (bucket.count / convertedCars.length) * 100 : 0,
      }));
  }, [convertedCars]);

  const brandChartData = useMemo<Array<Record<string, number | string>>>(() => {
    return brandBreakdown.map(item => ({
      brand: item.brand,
      count: item.count,
      percentage: item.percentage,
      totalValue: item.totalValue,
      avgPrice: item.avgPrice,
    }));
  }, [brandBreakdown]);

  const yearChartData = useMemo(() => yearBreakdown, [yearBreakdown]);
  const mileageChartData = useMemo(() => mileageBreakdown, [mileageBreakdown]);

  const filteredCars = useMemo(() => {
    if (!convertedCars.length) return [] as ICarItem[];
    return convertedCars.filter(car => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        car.carBrand?.toLowerCase().includes(q) ||
        car.carModel?.toLowerCase().includes(q) ||
        car.carVIN?.toLowerCase().includes(q) ||
        car.carSPZ?.toLowerCase().includes(q)
      );
    });
  }, [convertedCars, searchQuery]);

  const uniqueBrands = useMemo(() => {
    if (!convertedCars.length) return [] as string[];
    return Array.from(new Set(convertedCars.map(car => car.carBrand))).sort();
  }, [convertedCars]);

  const uniqueYears = useMemo(() => {
    if (!convertedCars.length) return [] as number[];
    const resolvedYears = convertedCars
      .map(car => resolveCarYear(car))
      .filter((year): year is number => year !== null);
    return Array.from(new Set(resolvedYears)).sort((a, b) => b - a);
  }, [convertedCars]);

  const formatCurrency = (value: number | string | null | undefined): string => {
    const numericValue = numberFromValue(value);
    if (numericValue === null) return '-';
    return `${numericValue.toLocaleString('cs-CZ')} Kc`;
  };

  const formatNumber = (value: number | string | null | undefined, suffix = ''): string => {
    const numericValue = numberFromValue(value);
    if (numericValue === null) return '-';
    return `${numericValue.toLocaleString('cs-CZ')}${suffix}`;
  };

  const formatTooltipCount = (
    value: number | string | Array<number | string> | ReadonlyArray<number | string> | null | undefined,
  ) => {
    const raw = Array.isArray(value) ? value[0] : value;
    const numericValue = numberFromValue(raw);
    return `${(numericValue ?? 0).toLocaleString('cs-CZ')} ks`;
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
      <li>Vyberte <strong>obdobi</strong> (den, tyden, mesic, rok nebo vlastni rozsah) - filtruje data primo na backendu.</li>
      <li>Filtrovani podle <strong>znacky, roku vyroby a najezdu</strong> vyuziva parametry API (brand, yearFrom, mileageFrom/To).</li>
      <li>Vyhledavani pomaha v tabulce (znacka, model, VIN, SPZ) - zustava jen na frontendu.</li>
      <li>Rozsirene statistiky kombinuji udaje podle znacky, roku vyroby a najezdovych pasem.</li>
      <li>Detailni tabulka zobrazuje kontakt na zakaznika, datum konverze i stav dokumentace.</li>
      <li>Export dat probiha pres endpoint <code className="text-xs bg-blue-100 px-1.5 py-0.5 rounded">GET /v1/stats/car-stats</code>.</li>
    </ul>
  );

  const renderCurlExamples = () => (
    <div className="mt-3 space-y-2">
      <p className="text-xs text-blue-800 font-semibold">Priklady dotazu na API:</p>
      <pre className="bg-blue-100 text-[11px] text-blue-900 p-2 rounded break-all">{DEFAULT_CURL}</pre>
      <pre className="bg-blue-100 text-[11px] text-blue-900 p-2 rounded break-all">{FILTERED_CURL}</pre>
    </div>
  );

  const renderSummaryCards = () => {
    if (!summaryStats) {
      return (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          Zadna konvertovana vozidla pro vybrany filtr.
        </div>
      );
    }

    const cards = [
      { label: 'Celkem aut v systemu', value: summaryStats.totalCars.toLocaleString('cs-CZ') },
      { label: 'Celkova odkupni hodnota', value: `${summaryStats.totalPurchaseValue.toLocaleString('cs-CZ')} Kc` },
      { label: 'Celkova odhadovana hodnota', value: `${summaryStats.totalEstimatedValue.toLocaleString('cs-CZ')} Kc` },
      { label: 'Prumerna odkupni cena', value: `${summaryStats.averagePurchasePrice.toLocaleString('cs-CZ')} Kc` },
      { label: 'Prumerna odhadovana hodnota', value: `${summaryStats.averageEstimatedValue.toLocaleString('cs-CZ')} Kc` },
      { label: 'Prumerny najezd', value: `${summaryStats.averageMileage.toLocaleString('cs-CZ')} km` },
      { label: 'Prumerne stari vozidel', value: `${summaryStats.averageAge.toFixed(1)} roku` },
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
    if (!summaryStats || !convertedCars.length) return null;
    const total = summaryStats.totalCars;
    const withPhotos = convertedCars.filter(car => car.hasPhotos).length;
    const withDocuments = convertedCars.filter(car => car.hasDocuments).length;
    const complete = convertedCars.filter(car => car.hasPhotos && car.hasDocuments).length;

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
        label: 'Kompletni slozky',
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
    if (!convertedCars.length) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {brandChartData.length ? (
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rozlozeni podle znacky</h3>
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
                <Tooltip formatter={(value) => formatTooltipCount(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : null}

        {yearChartData.length ? (
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuce podle roku vyroby</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={yearChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip formatter={(value) => formatTooltipCount(value)} />
                <Bar dataKey="count" fill="#10B981" name="Pocet vozidel" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : null}

        {mileageChartData.length ? (
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuce podle najezdu</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={mileageChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="range" width={120} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => formatTooltipCount(value)} />
                <Bar dataKey="count" fill="#F59E0B" name="Pocet vozidel" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </div>
    );
  };

  const renderAdvancedTables = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {brandBreakdown.length ? (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiky podle znacky</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="text-gray-500 uppercase text-xs">
                  <th className="px-3 py-2">Znacka</th>
                  <th className="px-3 py-2 text-right">Pocet</th>
                  <th className="px-3 py-2 text-right">Celkova hodnota</th>
                  <th className="px-3 py-2 text-right">Prumerna cena</th>
                  <th className="px-3 py-2 text-right">Podil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {brandBreakdown.map(item => (
                  <tr key={item.brand}>
                    <td className="px-3 py-2 font-medium text-gray-900">{item.brand}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{item.count}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{item.totalValue.toLocaleString('cs-CZ')} Kc</td>
                    <td className="px-3 py-2 text-right text-gray-700">{item.avgPrice.toLocaleString('cs-CZ')} Kc</td>
                    <td className="px-3 py-2 text-right text-gray-700">{item.percentage.toFixed(1)} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {yearBreakdown.length ? (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiky podle roku vyroby</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="text-gray-500 uppercase text-xs">
                  <th className="px-3 py-2">Rok</th>
                  <th className="px-3 py-2 text-right">Pocet</th>
                  <th className="px-3 py-2 text-right">Prumerny najezd</th>
                  <th className="px-3 py-2 text-right">Prumerna cena</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {yearBreakdown.map(item => (
                  <tr key={item.year}>
                    <td className="px-3 py-2 font-medium text-gray-900">{item.year}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{item.count}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{item.avgMileage.toLocaleString('cs-CZ')} km</td>
                    <td className="px-3 py-2 text-right text-gray-700">{item.avgPrice.toLocaleString('cs-CZ')} Kc</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {mileageBreakdown.length ? (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiky podle najezdu</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="text-gray-500 uppercase text-xs">
                  <th className="px-3 py-2">Rozsah</th>
                  <th className="px-3 py-2 text-right">Pocet</th>
                  <th className="px-3 py-2 text-right">Podil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mileageBreakdown.map(item => (
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
        <h2 className="text-lg font-semibold text-gray-900">Detailni tabulka aut ({filteredCars.length})</h2>
        <p className="text-sm text-gray-500 mt-1">Obsahuje ID auta, zakaznika, dokumentaci i financni udaje.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-[11px] uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">ID auta</th>
              <th className="px-4 py-3 text-left">Znacka & model</th>
              <th className="px-4 py-3 text-right">Rok</th>
              <th className="px-4 py-3 text-right">Najezd</th>
              <th className="px-4 py-3 text-left">SPZ</th>
              <th className="px-4 py-3 text-left">VIN</th>
              <th className="px-4 py-3 text-right">Odkupni cena</th>
              <th className="px-4 py-3 text-right">Odhad hodnota</th>
              <th className="px-4 py-3 text-left">Zakaznik</th>
              <th className="px-4 py-3 text-left">Datum konverze</th>
              <th className="px-4 py-3 text-center">Fotky</th>
              <th className="px-4 py-3 text-center">Dokumenty</th>
              <th className="px-4 py-3 text-right">Mesicni splatka</th>
              <th className="px-4 py-3 text-left">Poznamky</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-sm">
            {filteredCars.length === 0 ? (
              <tr>
                <td colSpan={14} className="px-4 py-8 text-center text-gray-500">
                  Zadna vozidla nenalezena pro vybrane parametry.
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
          <p className="text-sm text-gray-500 mt-1">Komplexni prehled portfolia aut, jejich hodnot a stavu dokumentace.</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">Jak pouzivat report vozidel</h3>
        {renderInstructionList()}
        {renderCurlExamples()}
      </div>

      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Obdobi:</span>
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
                {p === 'week' && 'Tyden'}
                {p === 'month' && 'Mesic'}
                {p === 'year' && 'Rok'}
                {p === 'custom' && 'Vlastni'}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Znacka</label>
            <select
              value={brandFilter}
              onChange={e => setBrandFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Vsechny znacky</option>
              {uniqueBrands.map(brand => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rok vyroby (od)</label>
            <select
              value={yearFromFilter}
              onChange={e => setYearFromFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Zadny filtr</option>
              {uniqueYears.map(year => (
                <option key={`from-${year}`} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rok vyroby (do)</label>
            <select
              value={yearToFilter}
              onChange={e => setYearToFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Zadny filtr</option>
              {uniqueYears.map(year => (
                <option key={`to-${year}`} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Najezd (od)</label>
            <input
              type="number"
              value={mileageFromFilter}
              onChange={e => setMileageFromFilter(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Najezd (do)</label>
            <input
              type="number"
              value={mileageToFilter}
              onChange={e => setMileageToFilter(e.target.value)}
              placeholder="200000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Vyhledavani</label>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Znacka, model, VIN nebo SPZ"
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
            Zrusit filtry
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
          Nepodarilo se nacist data. Zkuste to prosim znovu.
        </div>
      )}
    </div>
  );
};

export default ReportsCars;
