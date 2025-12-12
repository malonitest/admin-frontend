# Financial Report - P/L Statement API Documentation

## ? READY TO IMPLEMENT

**Status:**
- ? Backend implementován
- ? Endpoint `/v1/stats/financial-report` pøipraven
- ? **PØIPRAVENO K TESTOVÁNÍ A NASAZENÍ**

**Production URL:**
```
https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1
```

---

## Endpoint

**URL:** `GET /v1/stats/financial-report`  
**Full Endpoint:** `https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1/stats/financial-report`  
**Auth:** Required (Bearer token)  
**Permission:** `getStats`

## Popis

Tento endpoint poskytuje **kompletní finanèní pøehled a P/L statement** (výkaz zisku a ztráty) po mìsících. Zobrazuje:
- ?? Pøíjmy (nájem, admin. poplatky, pojištìní, poplatky za prodlení)
- ?? Náklady (odkup aut, pojištìní, údržba, provoz)
- ?? Zisk/Ztráta po mìsících
- ?? Zisková marže a trendy
- ?? Faktury a platby
- ?? Vykoupená auta a jejich èástky
- ?? Detailní rozpad pøíjmù a nákladù

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `period` | string | No | Pre-defined period: `day`, `week`, `month`, `year` (default) |
| `dateFrom` | string | No | Custom start date (ISO format: `2024-01-01`) |
| `dateTo` | string | No | Custom end date (ISO format: `2024-12-31`) |

**Note:** If `dateFrom` and `dateTo` are provided, they override the `period` parameter.

## Response Format

```typescript
interface IFinancialReportItem {
  month: string;                     // Mìsíc (YYYY-MM)
  monthLabel: string;                // Mìsíc (leden 2024)
  
  // Revenue (Pøíjmy)
  rentPayments: number;              // Pøíjmy z nájmù
  adminFees: number;                 // Pøíjmy z admin. poplatkù
  insuranceFees: number;             // Pøíjmy z pojištìní
  latePaymentFees: number;           // Pøíjmy z poplatkù za prodlení
  otherRevenue: number;              // Ostatní pøíjmy
  totalRevenue: number;              // Celkové pøíjmy
  
  // Costs (Náklady)
  carPurchases: number;              // Náklady na odkup aut
  carPurchasesCount: number;         // Poèet odkoupených aut
  insuranceCosts: number;            // Náklady na pojištìní
  maintenanceCosts: number;          // Náklady na údržbu
  operationalCosts: number;          // Provozní náklady
  otherCosts: number;                // Ostatní náklady
  totalCosts: number;                // Celkové náklady
  
  // Profit/Loss
  grossProfit: number;               // Hrubý zisk
  netProfit: number;                 // Èistý zisk
  profitMargin: number;              // Zisková marže (%)
  
  // Statistics
  activeLeases: number;              // Poèet aktivních leasingù
  newLeases: number;                 // Nové leasingy v mìsíci
  endedLeases: number;               // Ukonèené leasingy v mìsíci
  averageRentPayment: number;        // Prùmìrná splátka nájmu
  paymentSuccessRate: number;        // Úspìšnost plateb (%)
}

interface IFinancialStats {
  totalRevenue: number;              // Celkové pøíjmy (období)
  totalCosts: number;                // Celkové náklady (období)
  totalProfit: number;               // Celkový zisk (období)
  averageMonthlyRevenue: number;     // Prùmìrné mìsíèní pøíjmy
  averageMonthlyProfit: number;      // Prùmìrný mìsíèní zisk
  profitMargin: number;              // Celková zisková marže (%)
  totalCarsPurchased: number;        // Celkem odkoupených aut
  totalCarsPurchasedValue: number;   // Celková hodnota odkupù
  activeLeases: number;              // Aktivní leasingy
  totalLeaseValue: number;           // Celková hodnota leasingù
}

interface IInvoiceItem {
  invoiceId: string;
  invoiceNumber: string;
  leaseId: string;
  customerId: string;
  customerName: string;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: string;                    // PAID, UNPAID, OVERDUE
  type: string;                      // RENT, ADMIN_FEE, INSURANCE, LATE_FEE
  month: string;
}

interface IPaymentItem {
  paymentId: string;
  leaseId: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentDate: Date;
  type: string;
  month: string;
  status: string;
}

interface IFinancialReportData {
  dateFrom: Date;
  dateTo: Date;
  stats: IFinancialStats;
  monthlyData: IFinancialReportItem[];
  invoices: IInvoiceItem[];
  payments: IPaymentItem[];
  revenueByType: Array<{
    type: string;
    amount: number;
    percentage: number;
  }>;
  costsByType: Array<{
    type: string;
    amount: number;
    percentage: number;
  }>;
}
```

## Example Response

```json
{
  "dateFrom": "2024-01-01T00:00:00.000Z",
  "dateTo": "2024-12-31T23:59:59.999Z",
  "stats": {
    "totalRevenue": 12500000,
    "totalCosts": 8750000,
    "totalProfit": 3750000,
    "averageMonthlyRevenue": 1041667,
    "averageMonthlyProfit": 312500,
    "profitMargin": 30.0,
    "totalCarsPurchased": 125,
    "totalCarsPurchasedValue": 18750000,
    "activeLeases": 85,
    "totalLeaseValue": 21500000
  },
  "monthlyData": [
    {
      "month": "2024-01",
      "monthLabel": "Leden 2024",
      "rentPayments": 425000,
      "adminFees": 25000,
      "insuranceFees": 18000,
      "latePaymentFees": 12000,
      "otherRevenue": 5000,
      "totalRevenue": 485000,
      "carPurchases": 900000,
      "carPurchasesCount": 6,
      "insuranceCosts": 15000,
      "maintenanceCosts": 8000,
      "operationalCosts": 12000,
      "otherCosts": 5000,
      "totalCosts": 940000,
      "grossProfit": -455000,
      "netProfit": -455000,
      "profitMargin": -93.81,
      "activeLeases": 45,
      "newLeases": 6,
      "endedLeases": 2,
      "averageRentPayment": 9444,
      "paymentSuccessRate": 95.5
    },
    {
      "month": "2024-02",
      "monthLabel": "Únor 2024",
      "rentPayments": 450000,
      "adminFees": 28000,
      "insuranceFees": 19500,
      "latePaymentFees": 8000,
      "otherRevenue": 3000,
      "totalRevenue": 508500,
      "carPurchases": 750000,
      "carPurchasesCount": 5,
      "insuranceCosts": 16000,
      "maintenanceCosts": 10000,
      "operationalCosts": 13000,
      "otherCosts": 4000,
      "totalCosts": 793000,
      "grossProfit": -284500,
      "netProfit": -284500,
      "profitMargin": -55.95,
      "activeLeases": 48,
      "newLeases": 5,
      "endedLeases": 2,
      "averageRentPayment": 9375,
      "paymentSuccessRate": 96.8
    }
  ],
  "invoices": [
    {
      "invoiceId": "...",
      "invoiceNumber": "INV-2024-001",
      "leaseId": "...",
      "customerId": "...",
      "customerName": "Jan Novák",
      "amount": 5000,
      "dueDate": "2024-01-15T00:00:00.000Z",
      "paidDate": "2024-01-14T10:30:00.000Z",
      "status": "PAID",
      "type": "RENT",
      "month": "2024-01"
    }
  ],
  "payments": [
    {
      "paymentId": "...",
      "leaseId": "...",
      "customerId": "...",
      "customerName": "Jan Novák",
      "amount": 5000,
      "paymentDate": "2024-01-14T10:30:00.000Z",
      "type": "RENT",
      "month": "2024-01",
      "status": "COMPLETED"
    }
  ],
  "revenueByType": [
    {
      "type": "Nájem",
      "amount": 5400000,
      "percentage": 43.2
    },
    {
      "type": "Admin. poplatky",
      "amount": 336000,
      "percentage": 2.69
    },
    {
      "type": "Pojištìní",
      "amount": 234000,
      "percentage": 1.87
    },
    {
      "type": "Poplatky za prodlení",
      "amount": 120000,
      "percentage": 0.96
    },
    {
      "type": "Ostatní",
      "amount": 60000,
      "percentage": 0.48
    }
  ],
  "costsByType": [
    {
      "type": "Odkup aut",
      "amount": 18750000,
      "percentage": 70.0
    },
    {
      "type": "Pojištìní",
      "amount": 192000,
      "percentage": 7.2
    },
    {
      "type": "Údržba",
      "amount": 120000,
      "percentage": 4.5
    },
    {
      "type": "Provozní náklady",
      "amount": 156000,
      "percentage": 5.8
    },
    {
      "type": "Ostatní",
      "amount": 60000,
      "percentage": 2.2
    }
  ]
}
```

## Usage Examples

### Get current year report:
```javascript
const response = await fetch('/v1/stats/financial-report', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
```

### Get report for specific date range:
```javascript
const response = await fetch(
  '/v1/stats/financial-report?dateFrom=2024-01-01&dateTo=2024-12-31',
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);
const data = await response.json();
```

### Get current month report:
```javascript
const response = await fetch('/v1/stats/financial-report?period=month', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
```

## Frontend Implementation Example

```typescript
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

interface FinancialReportData {
  dateFrom: Date;
  dateTo: Date;
  stats: {
    totalRevenue: number;
    totalCosts: number;
    totalProfit: number;
    averageMonthlyRevenue: number;
    averageMonthlyProfit: number;
    profitMargin: number;
    totalCarsPurchased: number;
    totalCarsPurchasedValue: number;
    activeLeases: number;
    totalLeaseValue: number;
  };
  monthlyData: Array<{
    month: string;
    monthLabel: string;
    rentPayments: number;
    adminFees: number;
    insuranceFees: number;
    latePaymentFees: number;
    totalRevenue: number;
    carPurchases: number;
    carPurchasesCount: number;
    totalCosts: number;
    netProfit: number;
    profitMargin: number;
    activeLeases: number;
    newLeases: number;
    paymentSuccessRate: number;
  }>;
  invoices: Array<any>;
  payments: Array<any>;
  revenueByType: Array<{
    type: string;
    amount: number;
    percentage: number;
  }>;
  costsByType: Array<{
    type: string;
    amount: number;
    percentage: number;
  }>;
}

const FinancialReport: React.FC<{ token: string }> = ({ token }) => {
  const [data, setData] = useState<FinancialReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('year');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `https://backrent-api-prod.azurewebsites.net/v1/stats/financial-report?period=${period}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setData(response.data);
      } catch (error) {
        console.error('Error fetching financial report:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, period]);

  if (loading) return <div>Naèítám...</div>;
  if (!data) return <div>Žádná data</div>;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="financial-report">
      <header>
        <h1>Finanèní Report - P/L Statement</h1>
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="month">Tento mìsíc</option>
          <option value="year">Tento rok</option>
        </select>
      </header>

      {/* Summary Cards */}
      <div className="stats-grid">
        <StatCard
          title="Celkové pøíjmy"
          value={`${data.stats.totalRevenue.toLocaleString('cs-CZ')} Kè`}
          icon="??"
          color="green"
        />
        <StatCard
          title="Celkové náklady"
          value={`${data.stats.totalCosts.toLocaleString('cs-CZ')} Kè`}
          icon="??"
          color="red"
        />
        <StatCard
          title="Èistý zisk"
          value={`${data.stats.totalProfit.toLocaleString('cs-CZ')} Kè`}
          icon="??"
          color={data.stats.totalProfit >= 0 ? 'green' : 'red'}
        />
        <StatCard
          title="Zisková marže"
          value={`${data.stats.profitMargin.toFixed(1)}%`}
          icon="??"
        />
        <StatCard
          title="Prùmìrný mìsíèní pøíjem"
          value={`${data.stats.averageMonthlyRevenue.toLocaleString('cs-CZ')} Kè`}
          icon="??"
        />
        <StatCard
          title="Vykoupená auta"
          value={data.stats.totalCarsPurchased}
          subtitle={`${data.stats.totalCarsPurchasedValue.toLocaleString('cs-CZ')} Kè`}
          icon="??"
        />
      </div>

      {/* P/L Statement Chart */}
      <div className="chart-section">
        <h2>P/L Statement - Mìsíèní pøehled</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data.monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="monthLabel" />
            <YAxis />
            <Tooltip formatter={(value: number) => `${value.toLocaleString('cs-CZ')} Kè`} />
            <Legend />
            <Line
              type="monotone"
              dataKey="totalRevenue"
              stroke="#00C49F"
              name="Pøíjmy"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="totalCosts"
              stroke="#FF8042"
              name="Náklady"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="netProfit"
              stroke="#0088FE"
              name="Zisk"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue Breakdown */}
      <div className="chart-section">
        <h2>Rozpad pøíjmù</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data.revenueByType}
              dataKey="amount"
              nameKey="type"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={(entry) => `${entry.type}: ${entry.percentage}%`}
            >
              {data.revenueByType.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `${value.toLocaleString('cs-CZ')} Kè`} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Costs Breakdown */}
      <div className="chart-section">
        <h2>Rozpad nákladù</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.costsByType}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="type" />
            <YAxis />
            <Tooltip formatter={(value: number) => `${value.toLocaleString('cs-CZ')} Kè`} />
            <Bar dataKey="amount" fill="#FF8042">
              {data.costsByType.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly P/L Table */}
      <div className="table-section">
        <h2>Mìsíèní P/L Statement</h2>
        <table className="financial-table">
          <thead>
            <tr>
              <th>Mìsíc</th>
              <th>Pøíjmy</th>
              <th>Náklady</th>
              <th>Zisk</th>
              <th>Marže</th>
              <th>Aktivní leasingy</th>
              <th>Nové leasingy</th>
              <th>Odkoupená auta</th>
            </tr>
          </thead>
          <tbody>
            {data.monthlyData.map((month) => (
              <tr key={month.month}>
                <td>{month.monthLabel}</td>
                <td className="amount">{month.totalRevenue.toLocaleString('cs-CZ')} Kè</td>
                <td className="amount">{month.totalCosts.toLocaleString('cs-CZ')} Kè</td>
                <td className={`amount ${month.netProfit >= 0 ? 'positive' : 'negative'}`}>
                  {month.netProfit.toLocaleString('cs-CZ')} Kè
                </td>
                <td className={month.profitMargin >= 0 ? 'positive' : 'negative'}>
                  {month.profitMargin.toFixed(1)}%
                </td>
                <td>{month.activeLeases}</td>
                <td>{month.newLeases}</td>
                <td>{month.carPurchasesCount}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="total-row">
              <td><strong>Celkem</strong></td>
              <td className="amount"><strong>{data.stats.totalRevenue.toLocaleString('cs-CZ')} Kè</strong></td>
              <td className="amount"><strong>{data.stats.totalCosts.toLocaleString('cs-CZ')} Kè</strong></td>
              <td className={`amount ${data.stats.totalProfit >= 0 ? 'positive' : 'negative'}`}>
                <strong>{data.stats.totalProfit.toLocaleString('cs-CZ')} Kè</strong>
              </td>
              <td className={data.stats.profitMargin >= 0 ? 'positive' : 'negative'}>
                <strong>{data.stats.profitMargin.toFixed(1)}%</strong>
              </td>
              <td><strong>{data.stats.activeLeases}</strong></td>
              <td>-</td>
              <td><strong>{data.stats.totalCarsPurchased}</strong></td>
            </tr>
          </tfoot>
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
  color?: 'green' | 'red' | 'blue';
}> = ({ title, value, subtitle, icon, color }) => (
  <div className={`stat-card ${color || ''}`}>
    {icon && <div className="icon">{icon}</div>}
    <h3>{title}</h3>
    <div className="value">{value}</div>
    {subtitle && <div className="subtitle">{subtitle}</div>}
  </div>
);

export default FinancialReport;
```

## CSS Styling

```css
.financial-report {
  padding: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  text-align: center;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.15);
}

.stat-card.green {
  border-left: 6px solid #10b981;
}

.stat-card.red {
  border-left: 6px solid #ef4444;
}

.stat-card.blue {
  border-left: 6px solid #3b82f6;
}

.stat-card .icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.stat-card h3 {
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  font-weight: 600;
}

.stat-card .value {
  font-size: 2rem;
  font-weight: bold;
  color: #111827;
  margin-bottom: 0.5rem;
}

.stat-card .subtitle {
  font-size: 0.875rem;
  color: #6b7280;
}

.chart-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.chart-section h2 {
  margin-bottom: 1.5rem;
  color: #111827;
  font-size: 1.5rem;
}

.table-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow-x: auto;
}

.financial-table {
  width: 100%;
  border-collapse: collapse;
}

.financial-table th {
  background: #f9fafb;
  padding: 1rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  border-bottom: 2px solid #e5e7eb;
}

.financial-table td {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.9375rem;
}

.financial-table .amount {
  text-align: right;
  font-family: 'Roboto Mono', monospace;
}

.financial-table .positive {
  color: #059669;
  font-weight: 600;
}

.financial-table .negative {
  color: #dc2626;
  font-weight: 600;
}

.financial-table tfoot .total-row {
  background: #f9fafb;
  font-weight: 700;
}

.financial-table tr:hover {
  background: #f9fafb;
}
```

## Permission Requirements

User must have the `getStats` permission. This is typically granted to:
- ? `ADMIN`
- ? `FINANCE_DIRECTOR`
- ? `SUPERVISOR`

---

**Production URL**: `https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1/stats/financial-report`  
**API Version**: v1  
**Last Updated**: 2024
