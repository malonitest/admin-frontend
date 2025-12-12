# Frontend Developer Guide: Reports & DriveBot Integration

## Quick Start (Production)

### 1. Set Your Base URL
```typescript
const API_BASE_URL = 'https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1';
```

### 2. Login
```typescript
const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'final-test@carbackrent.cz',
    password: 'Test123!'
  })
});

const { tokens } = await loginResponse.json();
const accessToken = tokens.access.token;
```

### 3. Fetch KPI Report
```typescript
const kpiResponse = await fetch(`${API_BASE_URL}/stats/kpi-investor?period=month`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});

const kpiData = await kpiResponse.json();
console.log(kpiData);
```

### 4. Use DriveBot
```typescript
const botResponse = await fetch(`${API_BASE_URL}/bot/chat`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'Jaké byly pøíjmy tento mìsíc?'
  })
});

const botData = await botResponse.json();
console.log(botData.response); // AI response
console.log(botData.data);     // Structured data
```

---

## Table of Contents
1. [Admin Credentials](#admin-credentials)
2. [Available Reports](#available-reports)
3. [DriveBot Integration](#drivebot-integration)
4. [API Endpoints Reference](#api-endpoints-reference)
5. [Data Models & Types](#data-models--types)
6. [Authentication & Permissions](#authentication--permissions)
7. [Code Examples](#code-examples)

---

## Admin Credentials

### Test Admin User
```
Email: final-test@carbackrent.cz
Password: Test123!
Role: ADMIN
```

### Base URL Configuration
```typescript
// Production
const API_BASE_URL = 'https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1';

// Development
const API_BASE_URL = 'http://localhost:8080/v1';
```

### Authentication Headers
```typescript
const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
};
```

### Getting Access Token
```typescript
// POST /v1/auth/login
const response = await fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'final-test@carbackrent.cz',
    password: 'Test123!'
  })
});

const { tokens } = await response.json();
const accessToken = tokens.access.token;
```

---

## Available Reports

### 1. KPI Investor Report
**Endpoint:** `GET /v1/stats/kpi-investor`

**Purpose:** Executive dashboard with key performance indicators for investors

**Query Parameters:**
- `period` (optional): 'day' | 'week' | 'month' | 'year' (default: 'month')
- `dateFrom` (optional): ISO date string (YYYY-MM-DD)
- `dateTo` (optional): ISO date string (YYYY-MM-DD)

**Response Structure:**
```typescript
interface IKPIInvestorReportData {
  dateFrom: Date;
  dateTo: Date;
  summary: IKPIMetric[];           // Main KPIs with trends
  highlights: IKPIMetric[];        // Important highlights
  financial: {
    stats: IFinancialStats;
    latestMonth?: IFinancialReportItem;
    previousMonth?: IFinancialReportItem;
    revenueByType: Array<{ type: string; amount: number; percentage: number }>;
    costsByType: Array<{ type: string; amount: number; percentage: number }>;
  };
  funnel: IKPIInvestorFunnel;      // Lead conversion funnel
  technician: {
    stats: IFunnelTechnikStats;
    declinedReasons: Array<{ reason: string; count: number; percentage: number }>;
    statusBreakdown: Array<{ status: string; count: number; percentage: number }>;
  };
  fleet: {
    stats: ICarStats;
    topBrands: Array<{ brand: string; count: number; totalValue: number; avgPrice: number; percentage: number }>;
    mileageBreakdown: Array<{ range: string; count: number; percentage: number }>;
  };
  risk: IKPIInvestorRiskMetrics;   // Risk indicators
}

interface IKPIMetric {
  label: string;
  value: number;
  unit?: string;                    // 'Kè', '%', 'dny'
  changePercentage?: number;
  trend?: 'up' | 'down' | 'flat';
  target?: number;
  status?: 'good' | 'warning' | 'critical';
  description?: string;
}
```

**Example Request:**
```typescript
// Using production base URL
const API_BASE_URL = 'https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1';

const response = await fetch(
  `${API_BASE_URL}/stats/kpi-investor?period=month`,
  { headers }
);
const kpiReport = await response.json();
```

---

### 2. Financial Report (P/L Statement)
**Endpoint:** `GET /v1/stats/financial-report`

**Purpose:** Detailed profit/loss statement with monthly breakdown

**Query Parameters:**
- `period` (optional): 'day' | 'week' | 'month' | 'year' (default: 'year')
- `dateFrom` (optional): ISO date string
- `dateTo` (optional): ISO date string

**Response Structure:**
```typescript
interface IFinancialReportData {
  dateFrom: Date;
  dateTo: Date;
  stats: IFinancialStats;          // Overall statistics
  monthlyData: IFinancialReportItem[]; // Month-by-month breakdown
  invoices: IInvoiceItem[];
  payments: IPaymentItem[];
  revenueByType: Array<{ type: string; amount: number; percentage: number }>;
  costsByType: Array<{ type: string; amount: number; percentage: number }>;
}

interface IFinancialReportItem {
  month: string;                   // YYYY-MM
  monthLabel: string;              // "Leden 2024"
  
  // Revenue
  rentPayments: number;
  adminFees: number;
  insuranceFees: number;
  latePaymentFees: number;
  otherRevenue: number;
  totalRevenue: number;
  
  // Costs
  carPurchases: number;
  carPurchasesCount: number;
  insuranceCosts: number;
  maintenanceCosts: number;
  operationalCosts: number;
  otherCosts: number;
  totalCosts: number;
  
  // Profit/Loss
  grossProfit: number;
  netProfit: number;
  profitMargin: number;            // %
  
  // Statistics
  activeLeases: number;
  newLeases: number;
  endedLeases: number;
  averageRentPayment: number;
  paymentSuccessRate: number;
}
```

**Example Request:**
```typescript
const response = await fetch(
  `${API_BASE_URL}/stats/financial-report?dateFrom=2024-01-01&dateTo=2024-12-31`,
  { headers }
);
const financialReport = await response.json();
```

---

### 3. Funnel Technik Report
**Endpoint:** `GET /v1/stats/funnel-technik`

**Purpose:** Technical review process tracking - leads handed to technician

**Response Structure:**
```typescript
interface IFunnelTechnikReportData {
  dateFrom: Date;
  dateTo: Date;
  stats: IFunnelTechnikStats;
  leads: IFunnelTechnikLeadItem[];
  declinedReasons: Array<{ reason: string; count: number; percentage: number }>;
  statusBreakdown: Array<{ status: string; count: number; percentage: number }>;
}

interface IFunnelTechnikStats {
  totalHandedToTechnician: number;
  approved: number;
  rejected: number;
  inProgress: number;
  approvalRate: number;            // %
  rejectionRate: number;           // %
  averageDaysInReview: number;
}

interface IFunnelTechnikLeadItem {
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
  notes: Array<{ text: string; date: Date; author: string }>;
  daysInTechnicianReview: number;
}
```

---

### 4. Car Statistics Report
**Endpoint:** `GET /v1/stats/car-stats`

**Purpose:** Fleet analysis - all converted cars with detailed statistics

**Query Parameters:**
- `period` (optional): 'day' | 'week' | 'month' | 'year'
- `dateFrom` (optional): ISO date string
- `dateTo` (optional): ISO date string
- `brand` (optional): Filter by car brand
- `model` (optional): Filter by car model
- `yearFrom` (optional): Filter by registration year (from)
- `yearTo` (optional): Filter by registration year (to)
- `mileageFrom` (optional): Filter by mileage (from)
- `mileageTo` (optional): Filter by mileage (to)

**Response Structure:**
```typescript
interface ICarStatsReportData {
  dateFrom: Date;
  dateTo: Date;
  stats: ICarStats;
  cars: ICarStatsItem[];
  byBrand: Array<{ brand: string; count: number; totalValue: number; avgPrice: number; percentage: number }>;
  byYear: Array<{ year: number; count: number; avgMileage: number; avgPrice: number }>;
  byMileageRange: Array<{ range: string; count: number; percentage: number }>;
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
```

---

### 5. Admin Dashboard Stats
**Endpoint:** `GET /v1/stats/admin-dashboard`

**Purpose:** Real-time admin dashboard with period comparison

**Query Parameters:**
- `period` (optional): 'day' | 'month' | 'year' (default: 'month')
- `dateFrom` (optional): ISO date string
- `dateTo` (optional): ISO date string

**Response Structure:**
```typescript
interface IAdminDashboardStats {
  totalLeads: number;
  totalLeadsPrevious: number;
  totalLeadsChange: number;        // % change
  openLeads: number;
  openLeadsPrevious: number;
  openLeadsChange: number;
  convertedLeads: number;
  convertedLeadsPrevious: number;
  convertedLeadsChange: number;
  approvedAM: number;              // Approved by Area Manager
  approvedAMPrevious: number;
  approvedAMChange: number;
  leads: ILeadListItem[];          // Last 100 leads
}
```

---

### 6. CC Report (Call Center)
**Endpoint:** `GET /v1/stats/cc-report`

**Purpose:** Call center performance analytics

**Query Parameters:**
- `period`, `dateFrom`, `dateTo` (same as above)
- `status` (optional): Filter by lead status
- `subStatus` (optional): Filter by substatus
- `dealer` (optional): Filter by dealer ID
- `source` (optional): Filter by lead source

**Response Structure:**
```typescript
interface ICCReportData {
  byStatus: Record<string, number>;
  bySubStatus: Record<string, number>;
  byDealer: Array<{ dealer: string; dealerId: string; count: number }>;
  bySource: Record<string, number>;
  byDay: Array<{ date: string; count: number }>;
  totalLeads: number;
  convertedLeads: number;
  declinedLeads: number;
  conversionRate: number;
}
```

---

### 7. Marketing Report
**Endpoint:** `GET /v1/stats/marketing-report`

**Purpose:** Marketing campaign tracking with referral URL analysis

**Query Parameters:**
- `period`, `dateFrom`, `dateTo` (same as above)
- `status`, `subStatus`, `dealer`, `source` (filters)
- `referralURL` (optional): Filter by referral URL (partial match)

**Response Structure:**
```typescript
interface IMarketingReportData {
  byStatus: Record<string, number>;
  bySubStatus: Record<string, number>;
  byDealer: Array<{ dealer: string; dealerId: string; count: number }>;
  bySource: Record<string, number>;
  byReferralURL: Array<{
    url: string;
    count: number;
    converted: number;
    conversionRate: number;
  }>;
  byDay: Array<{
    date: string;
    count: number;
    converted: number;
  }>;
  totalLeads: number;
  convertedLeads: number;
  declinedLeads: number;
  conversionRate: number;
}
```

---

### 8. Funnel Report (General)
**Endpoint:** `GET /v1/stats/funnel`

**Purpose:** Lead funnel analysis - conversion through stages

**Response Structure:**
```typescript
interface IFunnelReportData {
  dateFrom: Date;
  dateTo: Date;
  stages: IFunnelStageData[];
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  declinedLeads: number;
  declinedReasons: Array<{ reason: string; count: number; percentage: number }>;
  averageTimeInStages: Record<string, number>;
}
```

---

## DriveBot Integration

### DriveBot Overview
DriveBot is an AI-powered assistant that helps users query business data using natural language.

### DriveBot Endpoint
**Endpoint:** `POST /v1/bot/chat`

**Purpose:** Send natural language queries to DriveBot and receive AI-generated responses with data

### Authentication
DriveBot requires the same authentication as other endpoints (Bearer token).

### Request Structure
```typescript
interface BotChatRequest {
  message: string;                 // User's natural language question
  conversationId?: string;         // Optional: Continue existing conversation
}
```

### Response Structure
```typescript
interface BotChatResponse {
  response: string;                // AI-generated text response
  data?: any;                      // Structured data (if applicable)
  conversationId: string;          // ID to continue conversation
  timestamp: string;
}
```

### Example DriveBot Queries

**Financial Questions:**
```typescript
// Example 1: Monthly revenue
const response = await fetch(`${API_BASE_URL}/v1/bot/chat`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    message: "Jaké byly pøíjmy v prosinci 2024?"
  })
});

// Example 2: Conversion rate
const response = await fetch(`${API_BASE_URL}/v1/bot/chat`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    message: "Jaká je konverzní míra leadù tento mìsíc?"
  })
});

// Example 3: Car fleet
const response = await fetch(`${API_BASE_URL}/v1/bot/chat`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    message: "Kolik aut máme ve flotile a jaká je jejich prùmìrná cena?"
  })
});
```

**Lead & Lease Questions:**
```typescript
// Example 4: Open leads
await fetch(`${API_BASE_URL}/v1/bot/chat`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    message: "Kolik je aktuálnì otevøených leadù?"
  })
));

// Example 5: Late payments
await fetch(`${API_BASE_URL}/v1/bot/chat`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    message: "Kolik zákazníkù má problémy se splácením?"
  })
});
```

### DriveBot Response Handling

```typescript
const handleDriveBotQuery = async (userMessage: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/bot/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: userMessage })
    });

    if (!response.ok) {
      throw new Error(`DriveBot error: ${response.statusText}`);
    }

    const result = await response.json();
    
    return {
      text: result.response,        // Display to user
      data: result.data,            // Use for charts/tables
      conversationId: result.conversationId
    };
  } catch (error) {
    console.error('DriveBot query failed:', error);
    return {
      text: 'Omlouváme se, ale nepodaøilo se zpracovat váš dotaz.',
      data: null,
      conversationId: null
    };
  }
};
```

### DriveBot Capabilities

**1. Financial Queries:**
- Revenue, costs, profit/loss
- Monthly comparisons
- Payment success rates
- Invoice status

**2. Lead & Conversion Queries:**
- Lead counts by status
- Conversion rates
- Average time in stages
- Declined reasons

**3. Fleet Queries:**
- Car counts
- Average prices
- Brand distribution
- Mileage statistics

**4. Risk & Collections Queries:**
- Late payments
- Debt collection cases
- Unpaid invoices

---

## API Endpoints Reference

### Base URL
```
Production: https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1
Development: http://localhost:8080/v1
```

### Complete Stats Endpoints

**Base Path:** `/v1/` (already included in base URL above)

| Endpoint Path | Method | Auth | Description |
|----------|--------|------|-------------|
| `/stats/kpi-investor` | GET | Required | KPI investor report |
| `/stats/financial-report` | GET | Required | Financial P/L report |
| `/stats/funnel-technik` | GET | Required | Technician review report |
| `/stats/car-stats` | GET | Required | Car fleet statistics |
| `/stats/admin-dashboard` | GET | Required | Admin dashboard |
| `/stats/cc-report` | GET | Required | Call center report |
| `/stats/marketing-report` | GET | Required | Marketing report |
| `/stats/funnel` | GET | Required | General funnel report |
| `/bot/chat` | POST | Required | DriveBot chat |

### Authentication Endpoints

| Endpoint Path | Method | Description |
|----------|--------|-------------|
| `/auth/login` | POST | User login |
| `/auth/register` | POST | User registration |
| `/auth/logout` | POST | User logout |
| `/auth/refresh-tokens` | POST | Refresh access token |

---

## Data Models & Types

### TypeScript Type Definitions

```typescript
// KPI Metric
export interface IKPIMetric {
  label: string;
  value: number;
  unit?: string;
  changePercentage?: number;
  trend?: 'up' | 'down' | 'flat';
  target?: number;
  status?: 'good' | 'warning' | 'critical';
  description?: string;
}

// Lead States
export enum LeadState {
  CONCEPT = 'CONCEPT',
  NEW = 'NEW',
  SUPERVISOR_APPROVED = 'SUPERVISOR_APPROVED',
  CUSTOMER_APPROVED = 'CUSTOMER_APPROVED',
  ASSIGNED = 'ASSIGNED',
  SENT_TO_OZ = 'SENT_TO_OZ',
  SALES_APPROVED = 'SALES_APPROVED',
  UPLOAD_DOCUMENTS = 'UPLOAD_DOCUMENTS',
  FINAL_APPROVAL = 'FINAL_APPROVAL',
  CONVERTED = 'CONVERTED',
  DECLINED = 'DECLINED'
}

// Lease States
export enum LeaseState {
  AWAITS_PAYOUT = 'AWAITS_PAYOUT',
  AWAITS_PAYMENT_METHOD = 'AWAITS_PAYMENT_METHOD',
  OPEN = 'OPEN',
  LATE = 'LATE',
  PAIDBACK = 'PAIDBACK',
  SELL = 'SELL'
}

// Dealer Types
export enum DealerType {
  ADMIN = 'ADMIN',
  FINANCE_DIRECTOR = 'FINANCE_DIRECTOR',
  SUPERVISOR = 'SUPERVISOR',
  SALES = 'SALES',
  OS = 'OS',
  CUSTOMER = 'CUSTOMER'
}
```

---

## Authentication & Permissions

### Role-Based Access Control

**Required Permissions by Report:**

| Report | Required Permission | Notes |
|--------|---------------------|-------|
| KPI Investor | `getKPIInvestor` | Admin, Finance Director |
| Financial Report | `getFinancialReport` | Admin, Finance Director |
| Funnel Technik | `getFunnelTechnik` | Admin, Supervisor, Sales |
| Car Stats | `getCarStats` | Admin, Finance Director |
| Admin Dashboard | `getAdminDashboard` | Admin only |
| CC Report | `getCCReport` | Admin, Supervisor |
| Marketing Report | `getMarketingReport` | Admin, Supervisor |
| Funnel | `getFunnel` | Admin, Supervisor, Sales |
| DriveBot | `useDriveBot` | Admin, Finance Director, Supervisor |

### Permission Configuration

Located in `src/config/roles.ts`:

```typescript
const allRoles = {
  ADMIN: [
    'getUsers',
    'manageUsers',
    'getLeads',
    'manageLeads',
    'getKPIInvestor',
    'getFinancialReport',
    'getFunnelTechnik',
    'getCarStats',
    'getAdminDashboard',
    'getCCReport',
    'getMarketingReport',
    'getFunnel',
    'useDriveBot',
    // ... all other permissions
  ],
  FINANCE_DIRECTOR: [
    'getKPIInvestor',
    'getFinancialReport',
    'getCarStats',
    'useDriveBot',
    // ... finance-related permissions
  ],
  SUPERVISOR: [
    'getFunnelTechnik',
    'getCCReport',
    'getMarketingReport',
    'getFunnel',
    'useDriveBot',
    // ... supervisor permissions
  ],
  // ... other roles
};
```

---

## Code Examples

### React Component Example: KPI Dashboard

```typescript
import React, { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';

interface KPIDashboardProps {
  apiBaseUrl: string;
}

const KPIDashboard: React.FC<KPIDashboardProps> = ({ apiBaseUrl }) => {
  const { accessToken } = useAuth();
  const [kpiData, setKpiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKPIData = async () => {
      try {
        const response = await fetch(
          `${apiBaseUrl}/v1/stats/kpi-investor?period=month`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch KPI data');
        }

        const data = await response.json();
        setKpiData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchKPIData();
  }, [accessToken, apiBaseUrl]);

  if (loading) return <div>Loading KPI data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!kpiData) return null;

  return (
    <div className="kpi-dashboard">
      <h1>KPI Investor Dashboard</h1>
      
      {/* Summary Metrics */}
      <div className="kpi-summary">
        {kpiData.summary.map((metric: any, index: number) => (
          <div key={index} className="kpi-card">
            <h3>{metric.label}</h3>
            <p className="kpi-value">
              {metric.value.toLocaleString('cs-CZ')} {metric.unit}
            </p>
            {metric.trend && (
              <span className={`trend trend-${metric.trend}`}>
                {metric.changePercentage > 0 ? '+' : ''}
                {metric.changePercentage}%
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Financial Overview */}
      <div className="financial-section">
        <h2>Financial Overview</h2>
        <div className="stats-grid">
          <div>Total Revenue: {kpiData.financial.stats.totalRevenue.toLocaleString('cs-CZ')} Kè</div>
          <div>Total Costs: {kpiData.financial.stats.totalCosts.toLocaleString('cs-CZ')} Kè</div>
          <div>Total Profit: {kpiData.financial.stats.totalProfit.toLocaleString('cs-CZ')} Kè</div>
          <div>Profit Margin: {kpiData.financial.stats.profitMargin.toFixed(2)}%</div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="revenue-breakdown">
        <h2>Revenue by Type</h2>
        {kpiData.financial.revenueByType.map((item: any, index: number) => (
          <div key={index}>
            {item.type}: {item.amount.toLocaleString('cs-CZ')} Kè ({item.percentage}%)
          </div>
        ))}
      </div>

      {/* Risk Metrics */}
      <div className="risk-section">
        <h2>Risk Indicators</h2>
        <div className="risk-metrics">
          <div className={kpiData.risk.lateLeases > 0 ? 'warning' : 'ok'}>
            Late Leases: {kpiData.risk.lateLeases}
          </div>
          <div className={kpiData.risk.unpaidInvoices > 10 ? 'warning' : 'ok'}>
            Unpaid Invoices: {kpiData.risk.unpaidInvoices}
          </div>
          <div className={kpiData.risk.debtCollectionCases > 0 ? 'critical' : 'ok'}>
            Debt Collection Cases: {kpiData.risk.debtCollectionCases}
          </div>
          <div>
            Payment Success Rate: {kpiData.risk.paymentSuccessRate.toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPIDashboard;
```

### React Component Example: DriveBot Chat

```typescript
import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  data?: any;
  timestamp: Date;
}

const DriveBotChat: React.FC<{ apiBaseUrl: string }> = ({ apiBaseUrl }) => {
  const { accessToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/v1/bot/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: input,
          conversationId
        })
      });

      if (!response.ok) {
        throw new Error('DriveBot request failed');
      }

      const result = await response.json();

      const botMessage: Message = {
        role: 'assistant',
        content: result.response,
        data: result.data,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setConversationId(result.conversationId);
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Omlouváme se, ale nepodaøilo se zpracovat váš dotaz.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="drivebot-chat">
      <div className="chat-header">
        <h2>DriveBot Assistant</h2>
        <p>Ask me anything about your business data</p>
      </div>

      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message message-${message.role}`}>
            <div className="message-content">{message.content}</div>
            {message.data && (
              <div className="message-data">
                <pre>{JSON.stringify(message.data, null, 2)}</pre>
              </div>
            )}
            <div className="message-timestamp">
              {message.timestamp.toLocaleTimeString('cs-CZ')}
            </div>
          </div>
        ))}
        {loading && <div className="message message-loading">Thinking...</div>}
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask a question..."
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}>
          Send
        </button>
      </div>

      <div className="suggested-questions">
        <p>Try asking:</p>
        <button onClick={() => setInput("Jaké byly pøíjmy tento mìsíc?")}>
          Monthly revenue
        </button>
        <button onClick={() => setInput("Kolik máme otevøených leadù?")}>
          Open leads
        </button>
        <button onClick={() => setInput("Jaká je konverzní míra?")}>
          Conversion rate
        </button>
      </div>
    </div>
  );
};

export default DriveBotChat;
```

### Custom Hook: useReports

```typescript
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface UseReportsOptions {
  apiBaseUrl: string;
  period?: 'day' | 'week' | 'month' | 'year';
  dateFrom?: string;
  dateTo?: string;
}

export const useReports = (options: UseReportsOptions) => {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildUrl = (endpoint: string, params: Record<string, any> = {}) => {
    const url = new URL(`${options.apiBaseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });
    return url.toString();
  };

  const fetchReport = async <T,>(endpoint: string, additionalParams: Record<string, any> = {}): Promise<T> => {
    setLoading(true);
    setError(null);

    try {
      const url = buildUrl(endpoint, {
        period: options.period,
        dateFrom: options.dateFrom,
        dateTo: options.dateTo,
        ...additionalParams
      });

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch report: ${response.statusText}`);
      }

      const data = await response.json();
      return data as T;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchKPIReport: () => fetchReport('/v1/stats/kpi-investor'),
    fetchFinancialReport: () => fetchReport('/v1/stats/financial-report'),
    fetchFunnelTechnikReport: () => fetchReport('/v1/stats/funnel-technik'),
    fetchCarStatsReport: (filters?: any) => fetchReport('/v1/stats/car-stats', filters),
    fetchAdminDashboard: () => fetchReport('/v1/stats/admin-dashboard'),
    fetchCCReport: (filters?: any) => fetchReport('/v1/stats/cc-report', filters),
    fetchMarketingReport: (filters?: any) => fetchReport('/v1/stats/marketing-report', filters),
  };
};
```

---

## Error Handling

### Common Error Codes

| Status Code | Meaning | Solution |
|-------------|---------|----------|
| 401 | Unauthorized | Check access token, re-login if expired |
| 403 | Forbidden | User doesn't have required permission |
| 404 | Not Found | Check endpoint URL |
| 500 | Server Error | Contact backend team |

### Error Response Format

```typescript
interface ErrorResponse {
  code: number;
  message: string;
}

// Example error handling
const handleApiError = (error: any) => {
  if (error.code === 401) {
    // Redirect to login
    window.location.href = '/login';
  } else if (error.code === 403) {
    alert('You do not have permission to access this resource');
  } else {
    console.error('API Error:', error.message);
  }
};
```

---

## Testing & Debugging

### Test Reports in Browser

```javascript
// Open browser console and run:
const accessToken = 'YOUR_ACCESS_TOKEN';

// Production
const apiBaseUrl = 'https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1;

// Or Development
// const apiBaseUrl = 'http://localhost:8080/v1';

// Test KPI Report
fetch(`${apiBaseUrl}/stats/kpi-investor?period=month`, {
  headers: { 'Authorization': `Bearer ${accessToken}` }
})
  .then(res => res.json())
  .then(data => console.log('KPI Report:', data));

// Test DriveBot
fetch(`${apiBaseUrl}/bot/chat`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ message: 'Jaké byly pøíjmy tento mìsíc?' })
})
  .then(res => res.json())
  .then(data => console.log('DriveBot Response:', data));
```

### Quick Test: Get Access Token

```javascript
// Step 1: Login to get access token
const apiBaseUrl = 'https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1';

const loginResponse = await fetch(`${apiBaseUrl}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'final-test@carbackrent.cz',
    password: 'Test123!'
  })
});

const loginData = await loginResponse.json();
console.log('Login successful!');
console.log('Access Token:', loginData.tokens.access.token);

// Step 2: Use the token
const accessToken = loginData.tokens.access.token;

const kpiResponse = await fetch(`${apiBaseUrl}/stats/kpi-investor?period=month`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});

const kpiData = await kpiResponse.json();
console.log('KPI Data:', kpiData);

```

---

## Environment Configuration

### React (.env file)
```bash
# Production
REACT_APP_API_BASE_URL=https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1

# Development
# REACT_APP_API_BASE_URL=http://localhost:8080/v1
```

### Next.js (.env.local)
```bash
# Production
NEXT_PUBLIC_API_BASE_URL=https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1

# Development
# NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/v1
```

### Usage in Code
```typescript
// React
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Next.js
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Fallback for plain JavaScript
const API_BASE_URL = window.ENV?.API_BASE_URL || 
  'https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1';
