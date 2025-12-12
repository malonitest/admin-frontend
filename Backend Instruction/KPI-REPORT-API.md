# KPI Investor Report API Documentation

## ? READY TO TEST

**Status:**
- ? Backend implementován
- ? Endpoint `/v1/stats/kpi-report` pøipraven
- ? Pøipraveno pro QA a frontend integraci

**Production URL:**
```
https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1/stats/kpi-report
```

---

## Endpoint

**URL:** `GET /v1/stats/kpi-report`

**Auth:** Required (Bearer token)

**Permission:** `getStats`

## Popis

KPI report sluèuje všechny hlavní metriky pro investory na jedno místo. Kombinuje údaje z funnel reportu, technické kontroly, vozového parku i finanèního P/L. Vhodné pro rychlý "Investor Update" bez nutnosti otevírat více dashboardù.

Zahrnuje napøíklad:
- ?? Souhrnné KPI (pøíjmy, zisk, konverzní pomìr, poèet aktivních leasingù)
- ?? Highlights (MRR, míra schválení techniky, prùmìrná doba kontroly, prùmìrný buyout)
- ?? Funnel overview (poèty leadù po fázích, konverzní pomìr, prùmìrná doba konverze)
- ??? Technická kontrola (schválení/zamítnutí, dùvody zamítnutí, stav fronty)
- ?? Fleet overview (poèet aut, hodnota, top znaèky, nájezdové pásma)
- ?? Finanèní souhrn (P/L statistiky, poslední mìsíc vs. pøedchozí, pøíjmy/náklady podle typu)
- ?? Risk metriky (poèet pozdních leasingù, nezaplacené faktury, pøípady v inkasu, úspìšnost plateb)

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `period` | string | No | Jedna z hodnot `day`, `week`, `month`, `year`. Default `month`. |
| `dateFrom` | string | No | Vlastní zaèátek období (ISO). Pokud zadáno spoleènì s `dateTo`, ignoruje se `period`. |
| `dateTo` | string | No | Vlastní konec období (ISO). |

## Response Format

```typescript
interface IKPIInvestorReportData {
  dateFrom: Date;
  dateTo: Date;
  summary: IKPIMetric[];            // hlavní KPI boxy
  highlights: IKPIMetric[];         // dodateèné ukazatele
  financial: {
    stats: IFinancialStats;         // agregované P/L hodnoty
    latestMonth?: IFinancialReportItem;
    previousMonth?: IFinancialReportItem;
    revenueByType: Array<{ type: string; amount: number; percentage: number }>;
    costsByType: Array<{ type: string; amount: number; percentage: number }>;
  };
  funnel: {
    totalLeads: number;
    convertedLeads: number;
    declinedLeads: number;
    conversionRate: number;
    avgConversionDays: number;
    averageRequestedAmount: number;
    stageBreakdown: Array<{ stage: string; count: number; percentage: number }>;
  };
  technician: {
    stats: IFunnelTechnikStats;
    declinedReasons: Array<{ reason: string; count: number; percentage: number }>;
    statusBreakdown: Array<{ status: string; count: number; percentage: number }>;
  };
  fleet: {
    stats: ICarStats;
    topBrands: Array<{ brand: string; count: number; totalValue: number; percentage: number }>;
    mileageBreakdown: Array<{ range: string; count: number; percentage: number }>;
  };
  risk: {
    lateLeases: number;
    unpaidInvoices: number;
    debtCollectionCases: number;
    paymentSuccessRate: number;
  };
}
```

### IKPIMetric
```
{
  label: string;            // Název metriky
  value: number;            // Hodnota
  unit?: string;            // Napø. "Kè", "%"
  changePercentage?: number;// Mezimìsíèní zmìna (pokud dává smysl)
  trend?: 'up' | 'down' | 'flat';
  description?: string;     // Krátký popis
}
```

## Example Response (zkráceno)

```json
{
  "dateFrom": "2024-01-01T00:00:00.000Z",
  "dateTo": "2024-03-31T23:59:59.999Z",
  "summary": [
    { "label": "Celkové pøíjmy", "value": 12500000, "unit": "Kè", "changePercentage": 12.5, "trend": "up" },
    { "label": "Celkový zisk (P/L)", "value": 3750000, "unit": "Kè", "changePercentage": 8.3, "trend": "up" },
    { "label": "Konverzní pomìr", "value": 32.4, "unit": "%" },
    { "label": "Aktivní leasingy", "value": 85 },
    { "label": "Hodnota leasingù", "value": 21500000, "unit": "Kè" },
    { "label": "Investice do vozù (období)", "value": 18750000, "unit": "Kè" }
  ],
  "funnel": {
    "totalLeads": 154,
    "convertedLeads": 50,
    "declinedLeads": 32,
    "conversionRate": 32.47,
    "avgConversionDays": 11.2,
    "averageRequestedAmount": 420000,
    "stageBreakdown": [
      { "stage": "Nový lead", "count": 64, "percentage": 41.5 },
      { "stage": "Schváleno AM", "count": 48, "percentage": 31.1 },
      { "stage": "Upload dokumentù", "count": 23, "percentage": 14.9 },
      { "stage": "Konvertováno", "count": 19, "percentage": 12.3 }
    ]
  },
  "technician": {
    "stats": {
      "totalHandedToTechnician": 45,
      "approved": 31,
      "rejected": 7,
      "inProgress": 7,
      "approvalRate": 68.9,
      "rejectionRate": 15.6,
      "averageDaysInReview": 4
    },
    "declinedReasons": [{ "reason": "Špatný technický stav vozidla", "count": 3, "percentage": 42.9 }],
    "statusBreakdown": [{ "status": "Schváleno technikem", "count": 31, "percentage": 68.9 }]
  },
  "fleet": {
    "stats": {
      "totalCars": 128,
      "totalPurchaseValue": 18800000,
      "totalEstimatedValue": 22100000,
      "averagePurchasePrice": 146875,
      "averageEstimatedValue": 172656,
      "averageMileage": 112450,
      "averageAge": 6.4
    },
    "topBrands": [{ "brand": "Škoda", "count": 32, "totalValue": 5400000, "percentage": 25 }],
    "mileageBreakdown": [{ "range": "100-150k", "count": 54, "percentage": 42.2 }]
  },
  "financial": {
    "stats": {
      "totalRevenue": 12500000,
      "totalCosts": 8750000,
      "totalProfit": 3750000,
      "averageMonthlyRevenue": 1041667,
      "averageMonthlyProfit": 312500,
      "profitMargin": 30,
      "totalCarsPurchased": 125,
      "totalCarsPurchasedValue": 18750000,
      "activeLeases": 85,
      "totalLeaseValue": 21500000
    },
    "latestMonth": {
      "month": "2024-03",
      "totalRevenue": 510000,
      "totalCosts": 325000,
      "netProfit": 185000,
      "profitMargin": 36.3,
      "paymentSuccessRate": 96.2
    },
    "revenueByType": [{ "type": "Nájem", "amount": 5400000, "percentage": 43.2 }],
    "costsByType": [{ "type": "Odkup aut", "amount": 18750000, "percentage": 70 }]
  },
  "risk": {
    "lateLeases": 6,
    "unpaidInvoices": 12,
    "debtCollectionCases": 4,
    "paymentSuccessRate": 95.1
  }
}
```

## Usage Examples

### Get rolling quarterly KPI overview
```javascript
const response = await fetch('/v1/stats/kpi-report?period=month', {
  headers: { Authorization: `Bearer ${token}` }
});
const data = await response.json();
```

### Custom date range
```javascript
const response = await fetch('/v1/stats/kpi-report?dateFrom=2024-01-01&dateTo=2024-03-31', {
  headers: { Authorization: `Bearer ${token}` }
});
const data = await response.json();
```

---

**Permission reminder:** pouze role s `getStats` (napø. `ADMIN`, `FINANCE_DIRECTOR`, `SUPERVISOR`).
