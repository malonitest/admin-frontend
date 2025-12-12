# Funnel Technik Report - Frontend Documentation

## ? DEPLOYMENT ÚSPÌŠNÝ!

**Status implementace:**
- ? Backend kód implementován a otestován
- ? Endpoint `/v1/stats/funnel-technik` nasazen na production
- ? Všechny stats endpointy fungují
- ? **PØIPRAVENO K POUŽITÍ**

**Aktuální Production URL:**
```
https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1
```

---

## Endpoint

**URL:** `GET /v1/stats/funnel-technik`  
**Production Base URL:** `https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io`  
**Full Endpoint:** `https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1/stats/funnel-technik`  
**Auth:** Required (Bearer token)  
**Permission:** `getStats`

## Popis

Tento endpoint poskytuje **kompletní pøehled o leadech pøedaných technikovi** pro kontrolu vozidel. Zobrazuje:
- ?? Všechny leady ve fázi `UPLOAD_DOCUMENTS` (pøedáno technikovi)
- ? Schválené leady (pokraèující do `FINAL_APPROVAL` nebo `CONVERTED`)
- ? Zamítnuté leady (technické dùvody odmítnutí)
- ?? Poznámky a komentáøe ke každému leadu
- ?? Statistiky schvalovacího procesu technika
- ?? Prùmìrná doba kontroly vozidel

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `period` | string | No | Pre-defined period: `day`, `week`, `month` (default), `year` |
| `dateFrom` | string | No | Custom start date (ISO format: `2024-01-01`) |
| `dateTo` | string | No | Custom end date (ISO format: `2024-01-31`) |

**Note:** If `dateFrom` and `dateTo` are provided, they override the `period` parameter.

## Response Format

```typescript
interface IFunnelTechnikLeadItem {
  leadId: string;                    // MongoDB ID leadu
  uniqueId: number;                  // Jedineèné èíslo žádosti
  customerName: string;              // Jméno zákazníka
  customerPhone: string;             // Telefon zákazníka
  carBrand: string;                  // Znaèka auta
  carModel: string;                  // Model auta
  carVIN: string;                    // VIN èíslo vozidla
  requestedAmount: number;           // Požadovaná èástka (Kè)
  handedToTechnicianDate: Date;      // Datum pøedání technikovi
  currentStatus: string;             // Aktuální status (enum)
  currentStatusLabel: string;        // Pøeložený label statusu
  declinedReason?: string;           // Dùvod zamítnutí (enum)
  declinedReasonLabel?: string;      // Pøeložený dùvod zamítnutí
  notes: Array<{                     // Poznámky k leadu
    text: string;                    // Text poznámky
    date: Date;                      // Datum poznámky
    author: string;                  // Autor poznámky
  }>?;
  daysInTechnicianReview: number;    // Poèet dní v kontrole technika
}

interface IFunnelTechnikStats {
  totalHandedToTechnician: number;   // Celkem pøedáno technikovi
  approved: number;                  // Schváleno technikem
  rejected: number;                  // Zamítnuto technikem
  inProgress: number;                // Aktuálnì v kontrole
  approvalRate: number;              // Míra schválení (%)
  rejectionRate: number;             // Míra zamítnutí (%)
  averageDaysInReview: number;       // Prùmìrná doba kontroly (dny)
}

interface IFunnelTechnikReportData {
  dateFrom: Date;                    // Filtr od data
  dateTo: Date;                      // Filtr do data
  stats: IFunnelTechnikStats;        // Souhrnné statistiky
  leads: IFunnelTechnikLeadItem[];   // Seznam leadù
  declinedReasons: Array<{           // Dùvody zamítnutí
    reason: string;                  // Pøeložený dùvod
    count: number;                   // Poèet
    percentage: number;              // Procento z celkovì zamítnutých
  }>?;
  statusBreakdown: Array<{           // Rozpad podle statusù
    status: string;                  // Pøeložený status
    count: number;                   // Poèet
    percentage: number;              // Procento z celku
  }>?;
}
```

## Example Response

```json
{
  "dateFrom": "2024-01-01T00:00:00.000Z",
  "dateTo": "2024-01-31T23:59:59.999Z",
  "stats": {
    "totalHandedToTechnician": 85,
    "approved": 62,
    "rejected": 18,
    "inProgress": 5,
    "approvalRate": 72.94,
    "rejectionRate": 21.18,
    "averageDaysInReview": 3
  },
  "leads": [
    {
      "leadId": "60d0fe4f5311236168a109ca",
      "uniqueId": 12345,
      "customerName": "Jan Novák",
      "customerPhone": "+420 777 123 456",
      "carBrand": "Škoda",
      "carModel": "Octavia",
      "carVIN": "TMBJJ7NE8J0123456",
      "requestedAmount": 150000,
      "handedToTechnicianDate": "2024-01-15T10:00:00.000Z",
      "currentStatus": "FINAL_APPROVAL",
      "currentStatusLabel": "Finální potvrzení",
      "notes": [
        {
          "text": "Vozidlo v dobrém stavu, pouze drobné škrábance",
          "date": "2024-01-16T14:30:00.000Z",
          "author": "Petr Technik"
        },
        {
          "text": "Kilometrovník odpovídá, dokumenty kompletní",
          "date": "2024-01-17T09:15:00.000Z",
          "author": "Petr Technik"
        }
      ],
      "daysInTechnicianReview": 2
    },
    {
      "leadId": "60d0fe4f5311236168a109cb",
      "uniqueId": 12346,
      "customerName": "Marie Svobodová",
      "customerPhone": "+420 603 987 654",
      "carBrand": "Volkswagen",
      "carModel": "Passat",
      "carVIN": "WVWZZZ3CZKE123456",
      "requestedAmount": 180000,
      "handedToTechnicianDate": "2024-01-20T11:00:00.000Z",
      "currentStatus": "DECLINED",
      "currentStatusLabel": "Zamítnut",
      "declinedReason": "CAR_BAD_TECHNICAL_STATE",
      "declinedReasonLabel": "ŠPATNÝ TECHNICKÝ STAV VOZU",
      "notes": [
        {
          "text": "Vùz má poškozený motor, úniky oleje",
          "date": "2024-01-21T10:00:00.000Z",
          "author": "Petr Technik"
        },
        {
          "text": "Neschvalujeme - náklady na opravu pøíliš vysoké",
          "date": "2024-01-21T15:00:00.000Z",
          "author": "Petr Technik"
        }
      ],
      "daysInTechnicianReview": 1
    },
    {
      "leadId": "60d0fe4f5311236168a109cc",
      "uniqueId": 12347,
      "customerName": "Tomáš Dvoøák",
      "customerPhone": "+420 724 555 777",
      "carBrand": "BMW",
      "carModel": "320d",
      "carVIN": "WBA3A5G50DNP12345",
      "requestedAmount": 250000,
      "handedToTechnicianDate": "2024-01-28T09:00:00.000Z",
      "currentStatus": "UPLOAD_DOCUMENTS",
      "currentStatusLabel": "Pøedáno technikovi",
      "notes": [
        {
          "text": "Èekám na doplnìní servisní knihy",
          "date": "2024-01-29T11:00:00.000Z",
          "author": "Petr Technik"
        }
      ],
      "daysInTechnicianReview": 3
    }
  ],
  "declinedReasons": [
    {
      "reason": "ŠPATNÝ TECHNICKÝ STAV VOZU",
      "count": 8,
      "percentage": 44.44
    },
    {
      "reason": "VYSOKÝ NÁJEZD",
      "count": 5,
      "percentage": 27.78
    },
    {
      "reason": "ZAMÍTNUTO TECHNIKEM",
      "count": 3,
      "percentage": 16.67
    },
    {
      "reason": "NÍZKÁ HODNOTA AUTA",
      "count": 2,
      "percentage": 11.11
    }
  ],
  "statusBreakdown": [
    {
      "status": "V øešení technika",
      "count": 5,
      "percentage": 5.88
    },
    {
      "status": "Schváleno technikem",
      "count": 62,
      "percentage": 72.94
    },
    {
      "status": "Zamítnuto technikem",
      "count": 18,
      "percentage": 21.18
    }
  ]
}
```

## Technické dùvody zamítnutí

Technik zamítá leady z následujících dùvodù:

| API Value | Czech Display |
|-----------|---------------|
| `CAR_DENIED_BY_TECHNICIAN` | ZAMÍTNUTO TECHNIKEM |
| `CAR_BAD_TECHNICAL_STATE` | ŠPATNÝ TECHNICKÝ STAV VOZU |
| `CAR_HIGH_MILEAGE` | VYSOKÝ NÁJEZD |
| `CAR_OLD` | STÁØÍ VOZU |
| `CAR_LOW_VALUE` | NÍZKÁ HODNOTA AUTA |
| `CAR_BURDENED` | AUTO ZATÍŽENO ZÁVAZKY |

## Statusy leadù v technické kontrole

| API Value | Czech Display | Popis |
|-----------|---------------|-------|
| `UPLOAD_DOCUMENTS` | Pøedáno technikovi | Lead aktuálnì v kontrole technika |
| `FINAL_APPROVAL` | Finální potvrzení | Schváleno technikem, èeká na finální potvrzení |
| `CONVERTED` | Konvertováno | Úspìšnì schváleno a konvertováno na lease |
| `DECLINED` | Zamítnut | Zamítnuto technikem z technických dùvodù |

## Usage Examples

### Get current month report:
```javascript
const response = await fetch('/v1/stats/funnel-technik', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
```

### Get report for specific date range:
```javascript
const response = await fetch(
  '/v1/stats/funnel-technik?dateFrom=2024-01-01&dateTo=2024-01-31',
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);
const data = await response.json();
```

### Get this week's report:
```javascript
const response = await fetch('/v1/stats/funnel-technik?period=week', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
```

## Frontend Implementation Examples

### React Component Example

```typescript
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface FunnelTechnikData {
  dateFrom: Date;
  dateTo: Date;
  stats: {
    totalHandedToTechnician: number;
    approved: number;
    rejected: number;
    inProgress: number;
    approvalRate: number;
    rejectionRate: number;
    averageDaysInReview: number;
  };
  leads: Array<{
    leadId: string;
    uniqueId: number;
    customerName: string;
    customerPhone: string;
    carBrand: string;
    carModel: string;
    carVIN: string;
    requestedAmount: number;
    handedToTechnicianDate: Date;
    currentStatus: string;
    currentStatusLabel: string;
    declinedReason?: string;
    declinedReasonLabel?: string;
    notes: Array<{
      text: string;
      date: Date;
      author: string;
    }>?;
    daysInTechnicianReview: number;
  }>?;
  declinedReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>?;
  statusBreakdown: Array<{
    status: string;
    count: number;
    percentage: number;
  }>?;
}

const FunnelTechnikReport: React.FC<{ token: string }> = ({ token }) => {
  const [data, setData] = useState<FunnelTechnikData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `https://backrent-api-prod.azurewebsites.net/v1/stats/funnel-technik?period=${period}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setData(response.data);
      } catch (error) {
        console.error('Error fetching funnel technik data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, period]);

  if (loading) return <div>Naèítám...</div>;
  if (!data) return <div>Žádná data</div>;

  return (
    <div className="funnel-technik-report">
      <header>
        <h1>Funnel Technik - Pøehled kontroly vozidel</h1>
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="day">Dnes</option>
          <option value="week">Tento týden</option>
          <option value="month">Tento mìsíc</option>
          <option value="year">Tento rok</option>
        </select>
      </header>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <StatCard
          title="Celkem pøedáno"
          value={data.stats.totalHandedToTechnician}
          icon="??"
        />
        <StatCard
          title="Schváleno"
          value={data.stats.approved}
          subtitle={`${data.stats.approvalRate.toFixed(1)}%`}
          icon="?"
          color="green"
        />
        <StatCard
          title="Zamítnuto"
          value={data.stats.rejected}
          subtitle={`${data.stats.rejectionRate.toFixed(1)}%`}
          icon="?"
          color="red"
        />
        <StatCard
          title="V kontrole"
          value={data.stats.inProgress}
          icon="?"
          color="orange"
        />
        <StatCard
          title="Prùmìrná doba kontroly"
          value={`${data.stats.averageDaysInReview} dní`}
          icon="??"
        />
      </div>

      {/* Status Breakdown Chart */}
      <div className="status-breakdown">
        <h2>Rozložení podle statusù</h2>
        <PieChart data={data.statusBreakdown} />
      </div>

      {/* Declined Reasons Chart */}
      <div className="declined-reasons">
        <h2>Dùvody zamítnutí</h2>
        <BarChart data={data.declinedReasons} />
      </div>

      {/* Leads Table */}
      <div className="leads-table">
        <h2>Seznam leadù ({data.leads.length})</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Zákazník</th>
              <th>Vozidlo</th>
              <th>Èástka</th>
              <th>Status</th>
              <th>Dny v kontrole</th>
              <th>Poznámky</th>
            </tr>
          </thead>
          <tbody>
            {data.leads.map((lead) => (
              <tr key={lead.leadId}>
                <td>{lead.uniqueId}</td>
                <td>
                  <div>{lead.customerName}</div>
                  <div className="phone">{lead.customerPhone}</div>
                </td>
                <td>
                  <div>{lead.carBrand} {lead.carModel}</div>
                  <div className="vin">VIN: {lead.carVIN}</div>
                </td>
                <td>{lead.requestedAmount.toLocaleString('cs-CZ')} Kè</td>
                <td>
                  <StatusBadge 
                    status={lead.currentStatus}
                    label={lead.currentStatusLabel}
                  />
                  {lead.declinedReasonLabel && (
                    <div className="declined-reason">
                      {lead.declinedReasonLabel}
                    </div>
                  )}
                </td>
                <td>{lead.daysInTechnicianReview}</td>
                <td>
                  <NotesButton 
                    notes={lead.notes}
                    leadId={lead.leadId}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Helper Components
const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: 'green' | 'red' | 'orange';
}> = ({ title, value, subtitle, icon, color }) => (
  <div className={`stat-card ${color || ''}`}>
    {icon && <div className="icon">{icon}</div>}
    <h3>{title}</h3>
    <div className="value">{value}</div>
    {subtitle && <div className="subtitle">{subtitle}</div>}
  </div>
);

const StatusBadge: React.FC<{
  status: string;
  label: string;
}> = ({ status, label }) => {
  const getColor = () => {
    if (status === 'FINAL_APPROVAL' || status === 'CONVERTED') return 'green';
    if (status === 'DECLINED') return 'red';
    if (status === 'UPLOAD_DOCUMENTS') return 'orange';
    return 'gray';
  };

  return (
    <span className={`status-badge ${getColor()}`}>
      {label}
    </span>
  );
};

const NotesButton: React.FC<{
  notes: Array<{ text: string; date: Date; author: string }>?;
  leadId: string;
}> = ({ notes, leadId }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button 
        className="notes-btn"
        onClick={() => setShowModal(true)}
      >
        ?? {notes?.length}
      </button>
      {showModal && (
        <NotesModal 
          notes={notes}
          leadId={leadId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default FunnelTechnikReport;
```

### Vue.js Component Example

```vue
<template>
  <div class="funnel-technik-report">
    <header>
      <h1>Funnel Technik - Pøehled kontroly vozidel</h1>
      <select v-model="period" @change="fetchData">
        <option value="day">Dnes</option>
        <option value="week">Tento týden</option>
        <option value="month">Tento mìsíc</option>
        <option value="year">Tento rok</option>
      </select>
    </header>

    <div v-if="loading">Naèítám...</div>
    <div v-else-if="!data">Žádná data</div>
    <div v-else>
      <!-- Statistics Cards -->
      <div class="stats-grid">
        <StatCard
          title="Celkem pøedáno"
          :value="data.stats.totalHandedToTechnician"
          icon="??"
        />
        <StatCard
          title="Schváleno"
          :value="data.stats.approved"
          :subtitle="`${data.stats.approvalRate.toFixed(1)}%`"
          icon="?"
          color="green"
        />
        <StatCard
          title="Zamítnuto"
          :value="data.stats.rejected"
          :subtitle="`${data.stats.rejectionRate.toFixed(1)}%`"
          icon="?"
          color="red"
        />
        <StatCard
          title="V kontrole"
          :value="data.stats.inProgress"
          icon="?"
          color="orange"
        />
        <StatCard
          title="Prùmìrná doba kontroly"
          :value="`${data.stats.averageDaysInReview} dní`"
          icon="??"
        />
      </div>

      <!-- Status Breakdown Chart -->
      <div class="status-breakdown">
        <h2>Rozložení podle statusù</h2>
        <PieChart :data="data.statusBreakdown" />
      </div>

      <!-- Declined Reasons Chart -->
      <div class="declined-reasons">
        <h2>Dùvody zamítnutí</h2>
        <BarChart :data="data.declinedReasons" />
      </div>

      <!-- Leads Table -->
      <div class="leads-table">
        <h2>Seznam leadù ({{ data.leads.length }})</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Zákazník</th>
              <th>Vozidlo</th>
              <th>Èástka</th>
              <th>Status</th>
              <th>Dny v kontrole</th>
              <th>Poznámky</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="lead in data.leads" :key="lead.leadId">
              <td>{{ lead.uniqueId }}</td>
              <td>
                <div>{{ lead.customerName }}</div>
                <div class="phone">{{ lead.customerPhone }}</div>
              </td>
              <td>
                <div>{{ lead.carBrand }} {{ lead.carModel }}</div>
                <div class="vin">VIN: {{ lead.carVIN }}</div>
              </td>
              <td>{{ lead.requestedAmount.toLocaleString('cs-CZ') }} Kè</td>
              <td>
                <StatusBadge 
                  :status="lead.currentStatus"
                  :label="lead.currentStatusLabel"
                />
                <div v-if="lead.declinedReasonLabel" class="declined-reason">
                  {{ lead.declinedReasonLabel }}
                </div>
              </td>
              <td>{{ lead.daysInTechnicianReview }}</td>
              <td>
                <NotesButton 
                  :notes="lead.notes"
                  :leadId="lead.leadId"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

const props = defineProps<{ token: string }>();

const data = ref(null);
const loading = ref(true);
const period = ref('month');

const fetchData = async () => {
  try {
    loading.value = true;
    const response = await axios.get(
      `https://backrent-api-prod.azurewebsites.net/v1/stats/funnel-technik?period=${period.value}`,
      {
        headers: {
          Authorization: `Bearer ${props.token}`,
        },
      }
    );
    data.value = response.data;
  } catch (error) {
    console.error('Error fetching funnel technik data:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchData();
});
</script>
```

## Visualization Suggestions

### 1. Statistics Dashboard
Display key metrics prominently:
- Total handed to technician
- Approval rate (green)
- Rejection rate (red)
- In progress count (orange)
- Average review time

### 2. Status Breakdown Pie Chart
Show distribution of leads by status:
- V øešení technika (orange)
- Schváleno technikem (green)
- Zamítnuto technikem (red)

### 3. Decline Reasons Bar Chart
Display top rejection reasons:
- Sort by count descending
- Show percentage of total rejections
- Color code by severity

### 4. Leads Table
Interactive table with:
- Sortable columns
- Status badges with colors
- Expandable notes section
- Click to view full lead details
- Filter by status
- Search by customer name, VIN, ID

### 5. Timeline View
Show leads on timeline:
- X-axis: Date handed to technician
- Y-axis: Lead ID
- Color: Status
- Size: Days in review

## CSS Styling Examples

```css
/* Statistics Cards */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
}

.stat-card.green {
  border-left: 4px solid #10b981;
}

.stat-card.red {
  border-left: 4px solid #ef4444;
}

.stat-card.orange {
  border-left: 4px solid #f59e0b;
}

.stat-card .icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.stat-card h3 {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.stat-card .value {
  font-size: 2rem;
  font-weight: bold;
  color: #111827;
}

.stat-card .subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

/* Status Badge */
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.green {
  background-color: #d1fae5;
  color: #065f46;
}

.status-badge.red {
  background-color: #fee2e2;
  color: #991b1b;
}

.status-badge.orange {
  background-color: #fef3c7;
  color: #92400e;
}

.status-badge.gray {
  background-color: #f3f4f6;
  color: #374151;
}

/* Declined Reason */
.declined-reason {
  font-size: 0.75rem;
  color: #dc2626;
  margin-top: 0.25rem;
  font-weight: 500;
}

/* Notes Button */
.notes-btn {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.notes-btn:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

/* Table */
.leads-table {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow-x: auto;
}

.leads-table table {
  width: 100%;
  border-collapse: collapse;
}

.leads-table th {
  background: #f9fafb;
  padding: 0.75rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  border-bottom: 2px solid #e5e7eb;
}

.leads-table td {
  padding: 1rem 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;
}

.leads-table .phone,
.leads-table .vin {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.leads-table tr:hover {
  background: #f9fafb;
}
```

## Error Handling

```javascript
try {
  const response = await fetch(
    '/v1/stats/funnel-technik?dateFrom=2024-01-01&dateTo=2024-01-31',
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  if (!response.ok) {
    if (response.status === 401) {
      // Handle unauthorized - redirect to login
      window.location.href = '/login';
    } else if (response.status === 403) {
      // Handle forbidden - user doesn't have permission
      alert('Nemáte oprávnìní k pøístupu k tomuto reportu');
    } else {
      // Handle other errors
      throw new Error(`HTTP ${response.status}`);
    }
  }
  
  const data = await response.json();
  // Use data
} catch (error) {
  // Handle network errors
  console.error('Failed to fetch funnel technik stats:', error);
  alert('Nepodaøilo se naèíst data. Zkuste to prosím pozdìji.');
}
```

## Permission Requirements

User must have the `getStats` permission. This is typically granted to:
- ? `ADMIN`
- ? `FINANCE_DIRECTOR`
- ? `SUPERVISOR`

Sales representatives (`SALES`, `OS`) and customers (`CUSTOMER`) **do not** have access to this endpoint.

## Use Cases

### 1. Technician Performance Monitoring
- Track approval/rejection rates
- Identify bottlenecks in review process
- Monitor average review time

### 2. Quality Control
- Analyze rejection reasons
- Identify common vehicle issues
- Improve vehicle acceptance criteria

### 3. Process Optimization
- Reduce average review time
- Streamline document collection
- Improve lead quality before technician review

### 4. Lead Management
- See which leads are waiting longest
- Follow up on in-progress reviews
- Track notes and communication history

### 5. Reporting
- Generate monthly technician reports
- Track trends over time
- Compare periods (week vs week, month vs month)

---

**Production URL**: `https://backrent-api-prod.azurewebsites.net/v1/stats/funnel-technik`  
**API Version**: v1  
**Last Updated**: 2024
