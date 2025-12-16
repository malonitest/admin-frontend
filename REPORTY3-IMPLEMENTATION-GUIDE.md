# ?? Reporty 3 - Implementaèní prùvodce

## ? Co bude vytvoøeno

Nová sekce **"Reporty 3"** v menu s 4 reporty využívající **reporting databázi** z backendu:

1. **KPI Investor** - Klíèové ukazatele pro investory
2. **Finanèní P/L** - Mìsíèní profit/loss report
3. **Funnel** - Cesta leadu od NEW po CONVERTED
4. **Statistiky aut** - Analýza vozového parku

---

## ?? Backend endpointy (již implementovány)

Reporting databáze bìží v Azure Cosmos DB a obsahuje denormalizovaná data:

```
GET /v1/admin/reporting/summary/daily
  - Denní agregované metriky
  - Parametry: dateFrom, dateTo

GET /v1/admin/reporting/analytics/leads
  - Lead analytika s group by
  - Parametry: dateFrom, dateTo, groupBy[]

GET /v1/admin/reporting/analytics/leases
  - Lease analytika
  - Parametry: dateFrom, dateTo, groupBy[]

GET /v1/admin/reporting/analytics/financial
  - Finanèní analytika
  - Parametry: dateFrom, dateTo, groupBy[]
```

---

## ?? Soubory k vytvoøení

### 1. API funkce
```
apps/frontend/src/api/reportingApi.ts
```

### 2. TypeScript typy
```
apps/frontend/src/types/reporting.ts
```

### 3. Stránky reportù
```
apps/frontend/src/pages/Reports3KPI.tsx
apps/frontend/src/pages/Reports3Financial.tsx
apps/frontend/src/pages/Reports3Funnel.tsx
apps/frontend/src/pages/Reports3Cars.tsx
```

### 4. Aktualizace existujících souborù
```
apps/frontend/src/layouts/AdminLayout.tsx  (pøidat menu položku)
apps/frontend/src/routes/index.tsx          (pøidat routy)
```

---

## ?? Implementace

### Krok 1: Vytvoøit TypeScript typy

**Soubor**: `apps/frontend/src/types/reporting.ts`

```typescript
// Reporting database types

export interface DailySummary {
  date: string;
  year: number;
  month: number;
  quarter: number;
  
  // Leads
  newLeads: number;
  convertedLeads: number;
  declinedLeads: number;
  conversionRate: number;
  
  // Leases
  activeLeases: number;
  newLeases: number;
  closedLeases: number;
  overdueLeases: number;
  
  // Financial
  totalRevenue: number;
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  averagePayment: number;
  
  exportedAt: string;
  exportVersion: number;
}

export interface DailySummaryResponse {
  period: {
    from: string;
    to: string;
    days: number;
  };
  totals: {
    newLeads: number;
    convertedLeads: number;
    declinedLeads: number;
    totalRevenue: number;
    totalPayments: number;
  };
  averages: {
    conversionRate: number;
    activeLeases: number;
    dailyRevenue: number;
  };
  timeSeries: DailySummary[];
}

export interface LeadsAnalytics {
  summary: {
    totalLeads: number;
    convertedLeads: number;
    declinedLeads: number;
    conversionRate: number;
  };
  aggregations: Record<string, Array<{
    value: string;
    count: number;
    converted?: number;
    declined?: number;
    conversionRate?: number;
  }>>;
  timeSeries: Array<{
    year: number;
    month: number;
    total: number;
    converted: number;
    conversionRate: number;
  }>;
}

export interface LeasesAnalytics {
  summary: {
    totalLeases: number;
    activeLeases: number;
    closedLeases: number;
    overdueLeases: number;
    problemLeases: number;
    totalLeaseAmount: number;
    totalPaid: number;
    avgPaymentSuccessRate: number;
  };
  aggregations: Record<string, Array<{
    value: string;
    count: number;
    active?: number;
    overdue?: number;
    closed?: number;
    totalAmount: number;
  }>>;
}

export interface FinancialAnalytics {
  summary: {
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
    successRate: number;
    totalAmount: number;
    avgAmount: number;
  };
  aggregations: Record<string, Array<{
    value: string;
    count: number;
    successful: number;
    totalAmount: number;
  }>>;
}

export interface ReportingFilters {
  dateFrom?: string;
  dateTo?: string;
  period?: 'day' | 'week' | 'month' | 'year' | '30d' | '90d';
  groupBy?: string[];
}
```

---

### Krok 2: Vytvoøit API funkce

**Soubor**: `apps/frontend/src/api/reportingApi.ts`

```typescript
import axiosClient from './axiosClient';
import type {
  DailySummaryResponse,
  LeadsAnalytics,
  LeasesAnalytics,
  FinancialAnalytics,
  ReportingFilters,
} from '@/types/reporting';

export const reportingApi = {
  /**
   * Získat denní souhrn (pre-agregovaná data)
   */
  async getDailySummary(filters: ReportingFilters): Promise<DailySummaryResponse> {
    const params: Record<string, any> = {};
    
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    
    const response = await axiosClient.get<DailySummaryResponse>(
      '/admin/reporting/summary/daily',
      { params }
    );
    return response.data;
  },

  /**
   * Lead analytika s možností group by
   */
  async getLeadsAnalytics(filters: ReportingFilters): Promise<LeadsAnalytics> {
    const params: Record<string, any> = {};
    
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    if (filters.period) params.period = filters.period;
    if (filters.groupBy) {
      filters.groupBy.forEach((field) => {
        params[`groupBy`] = params[`groupBy`] 
          ? `${params[`groupBy`]},${field}` 
          : field;
      });
    }
    
    const response = await axiosClient.get<LeadsAnalytics>(
      '/admin/reporting/analytics/leads',
      { params }
    );
    return response.data;
  },

  /**
   * Lease analytika
   */
  async getLeasesAnalytics(filters: ReportingFilters): Promise<LeasesAnalytics> {
    const params: Record<string, any> = {};
    
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    if (filters.period) params.period = filters.period;
    if (filters.groupBy) {
      filters.groupBy.forEach((field) => {
        params[`groupBy`] = params[`groupBy`] 
          ? `${params[`groupBy`]},${field}` 
          : field;
      });
    }
    
    const response = await axiosClient.get<LeasesAnalytics>(
      '/admin/reporting/analytics/leases',
      { params }
    );
    return response.data;
  },

  /**
   * Finanèní analytika
   */
  async getFinancialAnalytics(filters: ReportingFilters): Promise<FinancialAnalytics> {
    const params: Record<string, any> = {};
    
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    if (filters.period) params.period = filters.period;
    if (filters.groupBy) {
      filters.groupBy.forEach((field) => {
        params[`groupBy`] = params[`groupBy`] 
          ? `${params[`groupBy`]},${field}` 
          : field;
      });
    }
    
    const response = await axiosClient.get<FinancialAnalytics>(
      '/admin/reporting/analytics/financial',
      { params }
    );
    return response.data;
  },
};
```

---

### Krok 3: Vytvoøit stránky reportù

#### 3.1 KPI Investor Report

**Soubor**: `apps/frontend/src/pages/Reports3KPI.tsx`

```typescript
import { useState, useEffect } from 'react';
import { reportingApi } from '@/api/reportingApi';
import type { DailySummaryResponse } from '@/types/reporting';
import { Card } from '@/components';

export default function Reports3KPI() {
  const [data, setData] = useState<DailySummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'30d' | '90d' | 'year'>('30d');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const dateTo = new Date();
      const dateFrom = new Date();
      
      if (period === '30d') {
        dateFrom.setDate(dateTo.getDate() - 30);
      } else if (period === '90d') {
        dateFrom.setDate(dateTo.getDate() - 90);
      } else if (period === 'year') {
        dateFrom.setFullYear(dateTo.getFullYear() - 1);
      }

      const response = await reportingApi.getDailySummary({
        dateFrom: dateFrom.toISOString().split('T')[0],
        dateTo: dateTo.toISOString().split('T')[0],
      });

      setData(response);
    } catch (err: any) {
      setError(err.message || 'Chyba pøi naèítání dat');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Naèítám data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="bg-red-50 border-red-200">
          <p className="text-red-600">{error}</p>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('cs-CZ').format(Math.round(num));
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">KPI Investor</h1>
        <p className="text-gray-600">
          Reporting databáze - rychlé pøedpoèítané metriky
        </p>
      </div>

      {/* Period selector */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setPeriod('30d')}
          className={`px-4 py-2 rounded-md ${
            period === '30d'
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          Posledních 30 dní
        </button>
        <button
          onClick={() => setPeriod('90d')}
          className={`px-4 py-2 rounded-md ${
            period === '90d'
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          Posledních 90 dní
        </button>
        <button
          onClick={() => setPeriod('year')}
          className={`px-4 py-2 rounded-md ${
            period === 'year'
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          Poslední rok
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="text-sm text-gray-600 mb-1">Nové Leady</div>
          <div className="text-3xl font-bold text-gray-900">
            {formatNumber(data.totals.newLeads)}
          </div>
          <div className="text-sm text-green-600 mt-1">
            {data.period.days} dní
          </div>
        </Card>

        <Card>
          <div className="text-sm text-gray-600 mb-1">Konverze</div>
          <div className="text-3xl font-bold text-gray-900">
            {formatNumber(data.totals.convertedLeads)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {data.averages.conversionRate.toFixed(1)}% míra konverze
          </div>
        </Card>

        <Card>
          <div className="text-sm text-gray-600 mb-1">Aktivní Leasy</div>
          <div className="text-3xl font-bold text-gray-900">
            {formatNumber(data.averages.activeLeases)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            prùmìr za období
          </div>
        </Card>

        <Card>
          <div className="text-sm text-gray-600 mb-1">Celkový Pøíjem</div>
          <div className="text-3xl font-bold text-gray-900">
            {formatCurrency(data.totals.totalRevenue)}
          </div>
          <div className="text-sm text-green-600 mt-1">
            {formatCurrency(data.averages.dailyRevenue)} / den
          </div>
        </Card>
      </div>

      {/* Time series chart */}
      <Card>
        <h2 className="text-lg font-bold mb-4">Vývoj v èase</h2>
        <div className="space-y-4">
          {data.timeSeries.map((day) => (
            <div key={day.date} className="border-b border-gray-200 pb-3">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium">
                  {new Date(day.date).toLocaleDateString('cs-CZ')}
                </div>
                <div className="text-sm text-gray-600">
                  {day.conversionRate.toFixed(1)}% konverze
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Leady</div>
                  <div className="font-medium">{day.newLeads}</div>
                </div>
                <div>
                  <div className="text-gray-600">Konverze</div>
                  <div className="font-medium">{day.convertedLeads}</div>
                </div>
                <div>
                  <div className="text-gray-600">Aktivní</div>
                  <div className="font-medium">{day.activeLeases}</div>
                </div>
                <div>
                  <div className="text-gray-600">Pøíjem</div>
                  <div className="font-medium">{formatCurrency(day.totalRevenue)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
```

---

#### 3.2 Finanèní P/L Report

**Soubor**: `apps/frontend/src/pages/Reports3Financial.tsx`

```typescript
import { useState, useEffect } from 'react';
import { reportingApi } from '@/api/reportingApi';
import type { FinancialAnalytics } from '@/types/reporting';
import { Card } from '@/components';

export default function Reports3Financial() {
  const [data, setData] = useState<FinancialAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'month' | 'year'>('year');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await reportingApi.getFinancialAnalytics({
        period,
        groupBy: ['type'],
      });

      setData(response);
    } catch (err: any) {
      setError(err.message || 'Chyba pøi naèítání dat');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Naèítám data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="bg-red-50 border-red-200">
          <p className="text-red-600">{error}</p>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const typeLabels: Record<string, string> = {
    RENT: 'Pronájem',
    PAYOUT: 'Výplaty',
    ADMIN_FEE: 'Admin poplatky',
    PAYBACK: 'Zpìtný odkup',
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Finanèní P/L</h1>
        <p className="text-gray-600">
          Reporting databáze - finanèní pøehled
        </p>
      </div>

      {/* Period selector */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setPeriod('month')}
          className={`px-4 py-2 rounded-md ${
            period === 'month'
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          Tento mìsíc
        </button>
        <button
          onClick={() => setPeriod('year')}
          className={`px-4 py-2 rounded-md ${
            period === 'year'
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          Tento rok
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <div className="text-sm text-gray-600 mb-1">Celkem Transakcí</div>
          <div className="text-3xl font-bold text-gray-900">
            {data.summary.totalTransactions}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {data.summary.successRate.toFixed(1)}% úspìšnost
          </div>
        </Card>

        <Card>
          <div className="text-sm text-gray-600 mb-1">Celková Èástka</div>
          <div className="text-3xl font-bold text-gray-900">
            {formatCurrency(data.summary.totalAmount)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {formatCurrency(data.summary.avgAmount)} prùmìr
          </div>
        </Card>

        <Card>
          <div className="text-sm text-gray-600 mb-1">Úspìšné Platby</div>
          <div className="text-3xl font-bold text-green-600">
            {data.summary.successfulTransactions}
          </div>
          <div className="text-sm text-red-600 mt-1">
            {data.summary.failedTransactions} neúspìšných
          </div>
        </Card>
      </div>

      {/* Breakdown by type */}
      <Card>
        <h2 className="text-lg font-bold mb-4">Rozdìlení podle typu</h2>
        <div className="space-y-4">
          {data.aggregations.type?.map((item) => (
            <div key={item.value} className="border-b border-gray-200 pb-3">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium">
                  {typeLabels[item.value] || item.value}
                </div>
                <div className="text-sm text-gray-600">
                  {((item.successful / item.count) * 100).toFixed(1)}% úspìšnost
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Poèet</div>
                  <div className="font-medium">{item.count}</div>
                </div>
                <div>
                  <div className="text-gray-600">Úspìšné</div>
                  <div className="font-medium text-green-600">{item.successful}</div>
                </div>
                <div>
                  <div className="text-gray-600">Celková èástka</div>
                  <div className="font-medium">{formatCurrency(item.totalAmount)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
```

---

#### 3.3 Funnel Report

**Soubor**: `apps/frontend/src/pages/Reports3Funnel.tsx`

```typescript
import { useState, useEffect } from 'react';
import { reportingApi } from '@/api/reportingApi';
import type { LeadsAnalytics } from '@/types/reporting';
import { Card } from '@/components';

export default function Reports3Funnel() {
  const [data, setData] = useState<LeadsAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'30d' | '90d' | 'year'>('30d');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await reportingApi.getLeadsAnalytics({
        period,
        groupBy: ['status', 'source'],
      });

      setData(response);
    } catch (err: any) {
      setError(err.message || 'Chyba pøi naèítání dat');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Naèítám data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="bg-red-50 border-red-200">
          <p className="text-red-600">{error}</p>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const statusLabels: Record<string, string> = {
    NEW: 'Nový',
    SUPERVISOR_APPROVED: 'Schváleno supervisorem',
    CUSTOMER_APPROVED: 'Schváleno zákazníkem',
    ASSIGNED: 'Pøiøazeno',
    SALES_APPROVED: 'Schváleno sales',
    CONVERTED: 'Konvertováno',
    DECLINED: 'Zamítnuto',
  };

  const sourceLabels: Record<string, string> = {
    WEB: 'Web',
    APP: 'Aplikace',
    SALES: 'Prodej',
    OS: 'Obchodní zástupce',
    RECOMMENDATION: 'Doporuèení',
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Funnel Report</h1>
        <p className="text-gray-600">
          Cesta leadu od NEW po CONVERTED
        </p>
      </div>

      {/* Period selector */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setPeriod('30d')}
          className={`px-4 py-2 rounded-md ${
            period === '30d'
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          Posledních 30 dní
        </button>
        <button
          onClick={() => setPeriod('90d')}
          className={`px-4 py-2 rounded-md ${
            period === '90d'
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          Posledních 90 dní
        </button>
        <button
          onClick={() => setPeriod('year')}
          className={`px-4 py-2 rounded-md ${
            period === 'year'
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          Poslední rok
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <div className="text-sm text-gray-600 mb-1">Celkem Leadù</div>
          <div className="text-3xl font-bold text-gray-900">
            {data.summary.totalLeads}
          </div>
        </Card>

        <Card>
          <div className="text-sm text-gray-600 mb-1">Konvertováno</div>
          <div className="text-3xl font-bold text-green-600">
            {data.summary.convertedLeads}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {data.summary.conversionRate.toFixed(1)}% míra konverze
          </div>
        </Card>

        <Card>
          <div className="text-sm text-gray-600 mb-1">Zamítnuto</div>
          <div className="text-3xl font-bold text-red-600">
            {data.summary.declinedLeads}
          </div>
        </Card>
      </div>

      {/* Funnel by status */}
      <Card className="mb-6">
        <h2 className="text-lg font-bold mb-4">Funnel podle statusu</h2>
        <div className="space-y-2">
          {data.aggregations.status?.map((item, index) => {
            const percentage = (item.count / data.summary.totalLeads) * 100;
            return (
              <div key={item.value}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">
                    {statusLabels[item.value] || item.value}
                  </span>
                  <span className="text-sm text-gray-600">
                    {item.count} ({percentage.toFixed(1)}%)
                    {item.conversionRate !== undefined && 
                      ` • ${item.conversionRate.toFixed(1)}% konverze`
                    }
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-6">
                  <div
                    className="bg-red-600 h-6 rounded-full flex items-center px-2"
                    style={{ width: `${percentage}%` }}
                  >
                    <span className="text-xs text-white font-medium">
                      {item.count}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Breakdown by source */}
      <Card>
        <h2 className="text-lg font-bold mb-4">Rozdìlení podle zdroje</h2>
        <div className="space-y-4">
          {data.aggregations.source?.map((item) => (
            <div key={item.value} className="border-b border-gray-200 pb-3">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium">
                  {sourceLabels[item.value] || item.value}
                </div>
                <div className="text-sm text-gray-600">
                  {item.conversionRate !== undefined &&
                    `${item.conversionRate.toFixed(1)}% konverze`
                  }
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Celkem</div>
                  <div className="font-medium">{item.count}</div>
                </div>
                <div>
                  <div className="text-gray-600">Konvertováno</div>
                  <div className="font-medium text-green-600">{item.converted || 0}</div>
                </div>
                <div>
                  <div className="text-gray-600">Zamítnuto</div>
                  <div className="font-medium text-red-600">{item.declined || 0}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
```

---

#### 3.4 Statistiky aut Report

**Soubor**: `apps/frontend/src/pages/Reports3Cars.tsx`

```typescript
import { useState, useEffect } from 'react';
import { reportingApi } from '@/api/reportingApi';
import type { LeasesAnalytics } from '@/types/reporting';
import { Card } from '@/components';

export default function Reports3Cars() {
  const [data, setData] = useState<LeasesAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'month' | 'year'>('year');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await reportingApi.getLeasesAnalytics({
        period,
        groupBy: ['status'],
      });

      setData(response);
    } catch (err: any) {
      setError(err.message || 'Chyba pøi naèítání dat');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Naèítám data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="bg-red-50 border-red-200">
          <p className="text-red-600">{error}</p>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const statusLabels: Record<string, string> = {
    OPEN: 'Aktivní',
    LATE: 'Po splatnosti',
    PAIDBACK: 'Splaceno',
    SELL: 'Prodáno',
    AWAITS_PAYOUT: 'Èeká na výplatu',
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Statistiky Aut</h1>
        <p className="text-gray-600">
          Reporting databáze - pøehled vozového parku
        </p>
      </div>

      {/* Period selector */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setPeriod('month')}
          className={`px-4 py-2 rounded-md ${
            period === 'month'
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          Tento mìsíc
        </button>
        <button
          onClick={() => setPeriod('year')}
          className={`px-4 py-2 rounded-md ${
            period === 'year'
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          Tento rok
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="text-sm text-gray-600 mb-1">Celkem Leasù</div>
          <div className="text-3xl font-bold text-gray-900">
            {data.summary.totalLeases}
          </div>
        </Card>

        <Card>
          <div className="text-sm text-gray-600 mb-1">Aktivní</div>
          <div className="text-3xl font-bold text-green-600">
            {data.summary.activeLeases}
          </div>
        </Card>

        <Card>
          <div className="text-sm text-gray-600 mb-1">Po splatnosti</div>
          <div className="text-3xl font-bold text-red-600">
            {data.summary.overdueLeases}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {data.summary.problemLeases} problémových
          </div>
        </Card>

        <Card>
          <div className="text-sm text-gray-600 mb-1">Splaceno</div>
          <div className="text-3xl font-bold text-gray-900">
            {data.summary.closedLeases}
          </div>
        </Card>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <div className="text-sm text-gray-600 mb-1">Celková hodnota leasù</div>
          <div className="text-3xl font-bold text-gray-900">
            {formatCurrency(data.summary.totalLeaseAmount)}
          </div>
        </Card>

        <Card>
          <div className="text-sm text-gray-600 mb-1">Celkem zaplaceno</div>
          <div className="text-3xl font-bold text-green-600">
            {formatCurrency(data.summary.totalPaid)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {data.summary.avgPaymentSuccessRate.toFixed(1)}% úspìšnost plateb
          </div>
        </Card>
      </div>

      {/* Breakdown by status */}
      <Card>
        <h2 className="text-lg font-bold mb-4">Rozdìlení podle statusu</h2>
        <div className="space-y-4">
          {data.aggregations.status?.map((item) => (
            <div key={item.value} className="border-b border-gray-200 pb-3">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium">
                  {statusLabels[item.value] || item.value}
                </div>
                <div className="text-sm text-gray-600">
                  {((item.count / data.summary.totalLeases) * 100).toFixed(1)}%
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Poèet</div>
                  <div className="font-medium">{item.count}</div>
                </div>
                <div>
                  <div className="text-gray-600">Aktivní</div>
                  <div className="font-medium text-green-600">{item.active || 0}</div>
                </div>
                <div>
                  <div className="text-gray-600">Po splatnosti</div>
                  <div className="font-medium text-red-600">{item.overdue || 0}</div>
                </div>
                <div>
                  <div className="text-gray-600">Celková èástka</div>
                  <div className="font-medium">{formatCurrency(item.totalAmount)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
```

---

### Krok 4: Aktualizovat AdminLayout

**Upravit**: `apps/frontend/src/layouts/AdminLayout.tsx`

Pøidat novou položku do `navigation` pole:

```typescript
// ... existující importy ...

const navigation: NavItem[] = [
  // ... existující položky ...
  { 
    name: 'Reporty 2', 
    href: '/reports2', 
    icon: Reports2Icon,
    children: [
      { name: 'KPI Investor', href: '/reports2/kpi' },
      { name: 'Finanèní P/L', href: '/reports2/financial' },
      { name: 'Funnel Technik', href: '/reports2/funnel-technik' },
      { name: 'Statistiky aut', href: '/reports2/cars' },
    ]
  },
  // PØIDAT TUTO NOVOU SEKCI:
  { 
    name: 'Reporty 3', 
    href: '/reports3', 
    icon: Reports3Icon,
    children: [
      { name: 'KPI Investor', href: '/reports3/kpi' },
      { name: 'Finanèní P/L', href: '/reports3/financial' },
      { name: 'Funnel', href: '/reports3/funnel' },
      { name: 'Statistiky aut', href: '/reports3/cars' },
    ]
  },
  // ... zbytek položek ...
];

// Pøidat ikonu pro Reporty 3
function Reports3Icon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}
```

---

### Krok 5: Pøidat routy

**Upravit**: `apps/frontend/src/routes/index.tsx`

Pøidat import a routy pro nové stránky:

```typescript
// Pøidat importy
import Reports3KPI from '@/pages/Reports3KPI';
import Reports3Financial from '@/pages/Reports3Financial';
import Reports3Funnel from '@/pages/Reports3Funnel';
import Reports3Cars from '@/pages/Reports3Cars';

// V router konfiguraci pøidat:
{
  path: '/reports3',
  children: [
    {
      path: 'kpi',
      element: <Reports3KPI />,
    },
    {
      path: 'financial',
      element: <Reports3Financial />,
    },
    {
      path: 'funnel',
      element: <Reports3Funnel />,
    },
    {
      path: 'cars',
      element: <Reports3Cars />,
    },
  ],
}
```

---

## ? Závìr

Po implementaci budete mít:

1. ? Novou sekci "Reporty 3" v menu
2. ? 4 nové reporty využívající reporting databázi z backendu
3. ? Rychlé naèítání (pre-agregovaná data)
4. ? Denní export dat v 2:00 AM (backend)
5. ? Nezatìžuje produkèní databázi

**Výhody**:
- 10-100x rychlejší než klasické dotazy
- Historické snapshoty dat
- Žádný dopad na výkon aplikace
- BI-ready architektura

