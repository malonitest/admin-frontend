# Frontend Instructions - Car Back-Rent API (Azure Backend)

## Production API Endpoint

```
Base URL: https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1
```

**DÙLEŽITÉ:**
- URL `backrent-api-prod.azurewebsites.net` **neexistuje** (chybná historická dokumentace)
- Správná URL je uvedená Azure Container Apps instance výše
- Backend bìží na **Azure Container Apps**, nikoliv App Service

## Authentication

### Login
```javascript
POST /v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "ADMIN"
  },
  "tokens": {
    "access": {
      "token": "eyJhbGc...",
      "expires": "2024-12-31T23:59:59.000Z"
    },
    "refresh": {
      "token": "eyJhbGc...",
      "expires": "2025-01-30T23:59:59.000Z"
    }
  }
}
```

### Using Bearer Token
All API requests require authentication header:
```javascript
headers: {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
}
```

## Report Endpoints (Stats)

### 1. Funnel Report - Konverzní trychtýø
```javascript
GET /v1/stats/funnel?period=month
GET /v1/stats/funnel?dateFrom=2024-01-01&dateTo=2024-01-31
```

**Query Parameters:**
- `period`: `day` | `week` | `month` | `year` (default: `month`)
- `dateFrom`: ISO date `YYYY-MM-DD` (custom range start)
- `dateTo`: ISO date `YYYY-MM-DD` (custom range end)

**Response Structure:**
```typescript
{
  dateFrom: "2024-01-01T00:00:00.000Z",
  dateTo: "2024-01-31T23:59:59.999Z",
  totalLeads: 150,
  convertedLeads: 30,
  conversionRate: 20.0,
  declinedLeads: 45,
  stages: [
    {
      stage: "Nový lead",
      count: 150,
      percentage: 100,
      declinedReasons: [
        {
          reason: "NEDOVOLÁNO 1X",
          count: 12,
          percentage: 8.0
        }
      ],
      notes: [
        {
          text: "Zákazník chce osobní schùzku",
          date: "2024-01-15T10:30:00.000Z",
          author: "Jan Novák"
        }
      ]
    }
  ],
  declinedReasons: [
    {
      reason: "NEDOVOLÁNO OPAKOVANÌ",
      count: 15,
      percentage: 33.3
    }
  ],
  averageTimeInStages: {
    "Nový lead": 2.5,
    "Schválen AM": 5.3
  }
}
```

### 2. CC Report - Call Center Report
```javascript
GET /v1/stats/cc-report
```
Statistiky pro Call Center tým.

### 3. OS Report - Obchodní Zástupci Report
```javascript
GET /v1/stats/os-report
```
Statistiky pro terénní obchodní zástupce.

### 4. Marketing Report
```javascript
GET /v1/stats/marketing-report
```
Marketingové statistiky a metriky.

### 5. Dashboard Stats
```javascript
GET /v1/stats/dashboard
```
Obecné dashboard statistiky pro bìžné uživatele.

### 6. Admin Dashboard Stats
```javascript
GET /v1/stats/admin-dashboard
```
Pokroèilé statistiky pro administrátory.

### 7. Sales Stats
```javascript
GET /v1/stats/sales
```
Prodejní statistiky.

### 8. KPI Investor Report
```javascript
GET /v1/stats/kpi-report?period=month
GET /v1/stats/kpi-report?dateFrom=2024-01-01&dateTo=2024-03-31
```
Komplexní investor dashboard kombinující souhrnná KPI, funnel, technické kontroly, vozový park, finance a rizika. Kompletní datová struktura je popsána v `docs/KPI-REPORT-API.md` (rozhraní `IKPIInvestorReportData`)

**Klíèové èásti odpovìdi:**
- `summary` a `highlights`: KPI karty se zmìnami/trendem
- `financial`: agregované P/L statistiky, poslední/ pøedchozí mìsíc, `revenueByType`, `costsByType`
- `funnel`: pøehled leadù, konverzí a fází (`stageBreakdown`)
- `technician`: schválení/zamítnutí, `declinedReasons`, `statusBreakdown`
- `fleet`: statistiky vozidel, top znaèky, `mileageBreakdown`
- `risk`: pozdní leasingy, nezaplacené faktury, inkaso, míra úspìšnosti plateb

**Filtrace:**
- `period=day|week|month|year` (default `month`)
- `dateFrom` + `dateTo` (ISO) pøepisuje `period`, vhodné pro vlastní kvartály

## Role a Oprávnìní

### Dostupné role:
- `ADMIN` - Plný pøístup ke všemu
- `FINANCE_DIRECTOR` - Finanèní oversight, stejná oprávnìní jako admin
- `SUPERVISOR` - Area manager, schvaluje leady, øídí sales tým
- `SALES` - Call center sales (CC tým)
- `OS` - Terénní sales (OS tým)
- `CUSTOMER` - Zákazník (limitovaný pøístup)

### Oprávnìní pro reporty:
**Pøístup k `/v1/stats/*`:**
- `ADMIN`
- `FINANCE_DIRECTOR`
- `SUPERVISOR`

**Bez pøístupu:**
- `SALES`
- `OS`
- `CUSTOMER`

## Frontend Implementation Examples

### React/Next.js Example

```typescript
// lib/api.ts
const API_BASE_URL = 'https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1';

interface ApiError {
  message: string;
  statusCode: number;
}

async function fetchAPI<T>(
  endpoint: string,
  token: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    
    if (response.status === 401) {
      // Token expired - redirect to login
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    
    if (response.status === 403) {
      throw new Error('Nemáte oprávnìní k této operaci');
    }
    
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
}

// hooks/useFunnelReport.ts
import { useState, useEffect } from 'react';

interface FunnelReportParams {
  period?: 'day' | 'week' | 'month' | 'year';
  dateFrom?: string;
  dateTo?: string;
}

export function useFunnelReport(token: string, params: FunnelReportParams) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams();
        
        if (params.period) {
          queryParams.append('period', params.period);
        }
        if (params.dateFrom && params.dateTo) {
          queryParams.append('dateFrom', params.dateFrom);
          queryParams.append('dateTo', params.dateTo);
        }

        const result = await fetchAPI(
          `/stats/funnel?${queryParams.toString()}`,
          token
        );
        
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [token, params.period, params.dateFrom, params.dateTo]);

  return { data, loading, error };
}

// hooks/useKPIReport.ts
// Typy viz docs/KPI-REPORT-API.md (doporuèeno sdílet pøes `IKPIInvestorReportData`)
import type { IKPIInvestorReportData } from '@/types/stats';
interface KPIReportParams extends FunnelReportParams {}

export function useKPIReport(token: string, params: KPIReportParams) {
  const [data, setData] = useState<IKPIInvestorReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchReport = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams();

        if (params.period) {
          queryParams.append('period', params.period);
        }
        if (params.dateFrom && params.dateTo) {
          queryParams.append('dateFrom', params.dateFrom);
          queryParams.append('dateTo', params.dateTo);
        }

        const result = await fetchAPI<IKPIInvestorReportData>(
          `/stats/kpi-report?${queryParams.toString()}`,
          token,
          { signal: controller.signal }
        );

        setData(result);
      } catch (err) {
        if ((err as DOMException).name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();

    return () => controller.abort();
  }, [token, params.period, params.dateFrom, params.dateTo]);

  return { data, loading, error };
}
```

### Vue.js Example

```typescript
// composables/useApi.ts
import { ref } from 'vue';

export function useApi<T>(endpoint: string, token: string) {
  const data = ref<T | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchData = async (params?: Record<string, string>) => {
    loading.value = true;
    error.value = null;

    try {
      const queryString = params 
        ? '?' + new URLSearchParams(params).toString()
        : '';

      const response = await fetch(
        `https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1${endpoint}${queryString}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login';
          throw new Error('Unauthorized');
        }
        throw new Error(`HTTP ${response.status}`);
      }

      data.value = await response.json();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading.value = false;
    }
  };

  return { data, loading, error, fetchData };
}

// components/FunnelReport.vue
<template>
  <div class="funnel-report">
    <header>
      <h1>Funnel Report</h1>
      <select v-model="period" @change="loadReport">
        <option value="day">Dnes</option>
        <option value="week">Tento týden</option>
        <option value="month">Tento mìsíc</option>
        <option value="year">Tento rok</option>
      </select>
    </header>

    <div v-if="loading">Naèítam...</div>
    <div v-else-if="error">Chyba: {{ error }}</div>
    <div v-else-if="data">
      <div class="stats-grid">
        <StatCard title="Celkem leadù" :value="data.totalLeads" />
        <StatCard title="Konvertováno" :value="data.convertedLeads" />
        <StatCard 
          title="Míra konverze" 
          :value="`${data.conversionRate.toFixed(1)}%`"
          highlight 
        />
      </div>

      <FunnelChart :stages="data.stages" />
      <DeclineReasonsChart :reasons="data.declinedReasons" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi } from '../composables/useApi';

const props = defineProps<{ token: string }>();
const period = ref('month');

const { data, loading, error, fetchData } = useApi('/stats/funnel', props.token);

const loadReport = () => {
  fetchData({ period: period.value });
};

onMounted(() => {
  loadReport();
});
</script>
```

### Vanilla JavaScript Example

```javascript
// api.js
class BackRentAPI {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async fetch(endpoint, options = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/login.html';
        throw new Error('Unauthorized');
      }
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  }

  async getFunnelReport(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.fetch(`/stats/funnel?${queryString}`);
  }

  async getCCReport() {
    return this.fetch('/stats/cc-report');
  }

  async getOSReport() {
    return this.fetch('/stats/os-report');
  }

  async getMarketingReport() {
    return this.fetch('/stats/marketing-report');
  }

  async getDashboardStats() {
    return this.fetch('/stats/dashboard');
  }
}

// Usage
const api = new BackRentAPI(
  'https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1',
  'eyJhbGc...' // Your token
);

// Get monthly funnel report
api.getFunnelReport({ period: 'month' })
  .then(data => {
    console.log('Conversion rate:', data.conversionRate);
    renderFunnelChart(data.stages);
  })
  .catch(error => {
    console.error('Failed to load report:', error);
  });
```

## UI Component Suggestions

### 1. Date Range Picker Component
```typescript
interface DateRangePickerProps {
  onDateChange: (dateFrom: string, dateTo: string) => void;
}

function DateRangePicker({ onDateChange }: DateRangePickerProps) {
  const [period, setPeriod] = useState('month');
  const [customDates, setCustomDates] = useState({
    from: '',
    to: ''
  });

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    
    const now = new Date();
    let from: Date;
    let to: Date = now;

    switch (newPeriod) {
      case 'day':
        from = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        from = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        from = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        from = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
    }

    onDateChange(from.toISOString(), to.toISOString());
  };

  return (
    <div className="date-range-picker">
      <select value={period} onChange={(e) => handlePeriodChange(e.target.value)}>
        <option value="day">Dnes</option>
        <option value="week">Poslední týden</option>
        <option value="month">Poslední mìsíc</option>
        <option value="year">Poslední rok</option>
        <option value="custom">Vlastní rozsah</option>
      </select>

      {period === 'custom' && (
        <div className="custom-dates">
          <input
            type="date"
            value={customDates.from}
            onChange={(e) => setCustomDates({ ...customDates, from: e.target.value })}
          />
          <input
            type="date"
            value={customDates.to}
            onChange={(e) => setCustomDates({ ...customDates, to: e.target.value })}
          />
          <button onClick={() => onDateChange(customDates.from, customDates.to)}>
            Použít
          </button>
        </div>
      )}
    </div>
  );
}
```

### 2. Funnel Chart Component (using Chart.js)
```typescript
import { Chart } from 'chart.js/auto';
import { useEffect, useRef } from 'react';

interface FunnelChartProps {
  stages: Array<{
    stage: string;
    count: number;
    percentage: number;
  }>;
}

function FunnelChart({ stages }: FunnelChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = new Chart(chartRef.current, {
      type: 'bar',
      data: {
        labels: stages.map(s => s.stage),
        datasets: [{
          label: 'Poèet leadù',
          data: stages.map(s => s.count),
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const stage = stages[context.dataIndex];
                return `${stage.count} leadù (${stage.percentage.toFixed(1)}%)`;
              }
            }
          }
        }
      });

    return () => chart.destroy();
  }, [stages]);

  return <canvas ref={chartRef} />;
}
```

### 3. Statistics Card Component
```typescript
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  highlight?: boolean;
}

function StatCard({ title, value, subtitle, highlight }: StatCardProps) {
  return (
    <div className={`stat-card ${highlight ? 'highlight' : ''}`}>
      <h3>{title}</h3>
      <div className="stat-value">{value}</div>
      {subtitle && <div className="stat-subtitle">{subtitle}</div>}
    </div>
  );
}

// Usage
<StatCard
  title="Míra konverze"
  value={`${conversionRate.toFixed(1)}%`}
  subtitle={`${convertedLeads} z ${totalLeads} leadù`}
  highlight
/>
```

### 4. Decline Reasons Chart (Pie Chart)
```typescript
import { Pie } from 'react-chartjs-2';

interface DeclineReason {
  reason: string;
  count: number;
  percentage: number;
}

function DeclineReasonsChart({ reasons }: { reasons: DeclineReason[] }) {
  const data = {
    labels: reasons.map(r => r.reason),
    datasets: [{
      data: reasons.map(r => r.count),
      backgroundColor: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF',
      ],
    }]
  };

  return (
    <div className="decline-reasons">
      <h3>Dùvody zamítnutí</h3>
      <Pie data={data} />
      <ul className="reasons-list">
        {reasons.map(reason => (
          <li key={reason.reason}>
            <span className="reason-name">{reason.reason}</span>
            <span className="reason-count">{reason.count}</span>
            <span className="reason-percentage">{reason.percentage.toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Czech Decline Reasons Reference

Používejte tyto pøeklady v UI:

| API Value | Czech Display |
|-----------|---------------|
| `NOT_REACHED_1X` | NEDOVOLÁNO 1X |
| `NOT_REACHED_2X` | NEDOVOLÁNO 2X |
| `NOT_REACHED_3X` | NEDOVOLÁNO 3X |
| `NOT_REACHED_4X` | NEDOVOLÁNO 4X |
| `NOT_REACHED_REPEATEDLY` | NEDOVOLÁNO OPAKOVANÌ |
| `NOT_INTERESTED` | NEMÁ ZÁJEM |
| `LOW_CAR_VALUE` | NÍZKÁ HODNOTA AUTA |
| `CAR_TOO_OLD` | STÁØÍ VOZU |
| `DENIED_BY_TECHNICIAN` | ZAMÍTNUTO TECHNIKEM |
| `BAD_TECHNICAL_CONDITION` | ŠPATNÝ TECHNICKÝ STAV VOZU |
| `HIGH_MILEAGE` | VYSOKÝ NÁJEZD |
| `NOT_OWNER` | AUTO NEVLASTNÍ |
| `CAR_ON_LEASE` | AUTO NA LEASING |
| `CAR_BURDENED` | AUTO ZAØÍŠENO ZÁVAZKY |
| `NOT_MEETING_CONDITIONS` | NESPLÒUJE PODMÍNKY |
| `DISADVANTAGEOUS_OFFER` | NEVÝHODNÁ NABÍDKA/CENA |
| `NO_LONGER_NEEDS_MONEY` | PENÍZE JIŽ NEPOTØEBUJE, VYØEŠENO JINAK |
| `OTHER` | OSTATNÍ |

## Error Handling Best Practices

```typescript
async function handleAPICall<T>(
  apiCall: () => Promise<T>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await apiCall();
    return { data, error: null };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return { 
          data: null, 
          error: 'Platnost pøihlášení vypršela. Prosím pøihlaste se znovu.' 
        };
      }
      
      if (error.message.includes('403')) {
        return { 
          data: null, 
          error: 'Nemáte oprávnìní k této operaci.' 
        };
      }
      
      return { data: null, error: error.message };
    }
    
    return { 
      data: null, 
      error: 'Nastala neoèekávaná chyba. Zkuste to prosím znovu.' 
    };
  }
}

// Usage
const { data, error } = await handleAPICall(() => 
  api.getFunnelReport({ period: 'month' })
);

if (error) {
  showNotification(error, 'error');
  return;
}

// Use data safely
renderChart(data);
```

## Quick Start Checklist

- [ ] Získejte pøihlašovací údaje od backend týmu
- [ ] Implementjte login flow s token refresh
- [ ] Vytvoøte API service vrstvu
- [ ] Implementujte error handling a retry logic
- [ ] Pøidejte loading states pro všechny API volání
- [ ] Vytvoøte komponenty pro zobrazení reportù
- [ ] Implementujte date range picker
- [ ] Pøidejte grafy (Chart.js, Recharts, nebo D3.js)
- [ ] Otestujte všechny role (ADMIN, SUPERVISOR, atd.)
- [ ] Implementujte responsive design pro mobilní zaøízení

## Additional Documentation

- **Complete API Reference**: `docs/API-ENDPOINTS-REFERENCE.md`
- **Funnel Report Details**: `docs/FUNNEL-REPORT-API.md`
- **KPI Investor Report Details**: `docs/KPI-REPORT-API.md`
- **Authentication Guide**: `docs/AUTHENTICATION-GUIDE.md`
- **Data Models**: `docs/DATA-MODELS.md`

## Support

Pro technickou podporu kontaktujte backend tým nebo vytvoøte issue v GitHub repository.

---

**Production URL**: `https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1`  
**API Version**: v1  
**Last Updated**: 2024
