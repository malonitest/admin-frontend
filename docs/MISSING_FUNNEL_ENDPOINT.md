# ?? MISSING ENDPOINT: /v1/stats/funnel

**Datum:** 9.12.2024  
**Priority:** HIGH  
**Status:** ? BLOCKING FUNNEL 1 REPORT  

---

## ?? **Issue:**

Frontend Funnel 1 Report (/reports/cc/funnel1) vol· endpoint kter˝ **neexistuje**:

```
GET /v1/stats/funnel
404 (Not Found)
```

---

## ?? **Frontend Requirements:**

Frontend oËek·v· tento response format:

```typescript
interface IFunnelReportData {
  dateFrom: Date;
  dateTo: Date;
  stages: Array<{
    stage: string;              // Czech label: "Nov˝ lead", "Schv·len AM", etc.
    count: number;              // Number of leads in this stage
    percentage: number;         // Percentage of total leads
    declinedReasons?: Array<{   // Top decline reasons at this stage
      reason: string;           // Translated reason
      count: number;
      percentage: number;
    }>;
    notes?: Array<{             // Optional sample notes
      text: string;
      date: Date;
      author: string;
    }>;
  }>;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;       // Percentage
  declinedLeads: number;
  declinedReasons: Array<{      // Overall decline reasons
    reason: string;
    count: number;
    percentage: number;
  }>;
  averageTimeInStages: Record<string, number>;  // Days per stage
}
```

---

## ?? **Funnel Stages:**

Report sleduje tyto f·ze:

1. **NEW** ? "Nov˝ lead"
2. **SUPERVISOR_APPROVED** ? "Schv·len AM"
3. **UPLOAD_DOCUMENTS** ? "P¯ed·no technikovi"
4. **CONVERTED** ? "Konvertov·no"

---

## ?? **Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dateFrom` | string | Yes | ISO date: `2024-01-01T00:00:00.000Z` |
| `dateTo` | string | Yes | ISO date: `2024-01-31T23:59:59.999Z` |

**Note:** Both parameters are required. Frontend calculates date range based on selected period and sends ISO datetime strings.

**Example:**
```
GET /v1/stats/funnel?dateFrom=2024-12-01T00:00:00.000Z&dateTo=2024-12-31T23:59:59.999Z
```

---

## ?? **Permissions:**

Required permission: `getStats`

Allowed roles:
- `ADMIN`
- `FINANCE_DIRECTOR`
- `SUPERVISOR`

---

## ?? **Example Response:**

```json
{
  "dateFrom": "2024-12-01T00:00:00.000Z",
  "dateTo": "2024-12-31T23:59:59.999Z",
  "stages": [
    {
      "stage": "Nov˝ lead",
      "count": 150,
      "percentage": 100,
      "declinedReasons": [
        {
          "reason": "NEDOVOL¡NO 1X",
          "count": 12,
          "percentage": 8.0
        },
        {
          "reason": "NEM¡ Z¡JEM",
          "count": 8,
          "percentage": 5.3
        }
      ],
      "notes": [
        {
          "text": "Z·kaznÌk chce osobnÌ sch˘zku",
          "date": "2024-12-15T10:30:00.000Z",
          "author": "Jan Nov·k"
        }
      ]
    },
    {
      "stage": "Schv·len AM",
      "count": 85,
      "percentage": 56.7,
      "declinedReasons": [
        {
          "reason": "NÕZKA HODNOTA AUTA",
          "count": 5,
          "percentage": 5.9
        }
      ],
      "notes": []
    },
    {
      "stage": "P¯ed·no technikovi",
      "count": 50,
      "percentage": 33.3,
      "declinedReasons": [
        {
          "reason": "ZAMÕTNUTO TECHNIKEM",
          "count": 3,
          "percentage": 6.0
        }
      ],
      "notes": []
    },
    {
      "stage": "Konvertov·no",
      "count": 30,
      "percentage": 20.0,
      "declinedReasons": [],
      "notes": []
    }
  ],
  "totalLeads": 150,
  "convertedLeads": 30,
  "conversionRate": 20.0,
  "declinedLeads": 45,
  "declinedReasons": [
    {
      "reason": "NEDOVOL¡NO OPAKOVANÃ",
      "count": 15,
      "percentage": 33.3
    },
    {
      "reason": "NEM¡ Z¡JEM",
      "count": 12,
      "percentage": 26.7
    },
    {
      "reason": "NÕZKA HODNOTA AUTA",
      "count": 8,
      "percentage": 17.8
    },
    {
      "reason": "ZAMÕTNUTO TECHNIKEM",
      "count": 6,
      "percentage": 13.3
    },
    {
      "reason": "OSTATNÕ",
      "count": 4,
      "percentage": 8.9
    }
  ],
  "averageTimeInStages": {
    "Nov˝ lead": 2.5,
    "Schv·len AM": 5.3,
    "P¯ed·no technikovi": 7.8,
    "Konvertov·no": 12.1
  }
}
```

---

## ?? **Implementation Notes:**

### **1. Decline Reason Translations:**

```typescript
const DECLINE_REASON_TRANSLATIONS = {
  'NOT_REACHED_1': 'NEDOVOL¡NO 1X',
  'NOT_REACHED_2': 'NEDOVOL¡NO 2X',
  'NOT_REACHED_3': 'NEDOVOL¡NO 3X',
  'NOT_REACHED_4': 'NEDOVOL¡NO 4X',
  'NOT_REACHED_X': 'NEDOVOL¡NO OPAKOVANÃ',
  'NOT_INTERESTED': 'NEM¡ Z¡JEM',
  'CAR_LOW_VALUE': 'NÕZKA HODNOTA AUTA',
  'CAR_OLD': 'ST¡ÿÕ VOZU',
  'CAR_DENIED_BY_TECHNICIAN': 'ZAMÕTNUTO TECHNIKEM',
  'CAR_BAD_TECHNICAL_STATE': 'äPATN› TECHNICK› STAV VOZU',
  'CAR_HIGH_MILEAGE': 'VYSOK› N¡JEZD',
  'CAR_NOT_OWNED': 'AUTO NEVLASTNÕ',
  'CAR_LEASED': 'AUTO NA LEASING',
  'CAR_BURDENED': 'AUTO ZAçÕéENO Z¡VAZKY',
  'CUSTOMER_NOT_ELIGIBLE': 'NESPL“UJE PODMÕNKY',
  'CUSTOMER_PRICE_DISADVANTAGEOUS': 'NEV›HODN¡ NABÕDKA/CENA',
  'CUSTOMER_SOLVED_ELSEWHERE': 'PENÕZE JIé NEPOTÿEBUJE, VYÿEäENO JINAK',
  'OTHER': 'OSTATNÕ'
};
```

### **2. Average Time Calculation:**

Calculate average days spent in each stage using:
- `lead.statusHistory` array (if available)
- `lead.createdAt` and `lead.statusUpdatedAt` dates

### **3. Decline Reasons Per Stage:**

Track which stage the lead was in when declined:
- Use `lead.lastStatus` or `lead.statusHistory`
- Group decline reasons by stage

---

## ?? **Contact:**

### **Frontend:**
- Repository: https://github.com/malonitest/admin-frontend
- Funnel 1 Page: `/reports/cc/funnel1`
- Component: `src/pages/ReportsCCFunnel1.tsx`

### **Backend (ACTION REQUIRED):**
- Repository: https://github.com/malonitest/car-backrent-api-test
- Need to create: `GET /v1/stats/funnel`

---

## ? **Acceptance Criteria:**

- [ ] Endpoint `/v1/stats/funnel` exists
- [ ] Returns 200 OK with proper data structure
- [ ] Supports `period`, `dateFrom`, `dateTo` query params
- [ ] Respects `getStats` permission
- [ ] Returns data in Czech language
- [ ] Calculates conversion rate correctly
- [ ] Groups decline reasons properly
- [ ] Calculates average time in stages

---

## ?? **Backend Implementation Example:**

Based on the pattern used in `/stats/os-report`, here's the implementation structure:

### **Controller: `src/controllers/stats.controller.ts`**

```typescript
export const getFunnelReport = async (req: Request, res: Response) => {
  try {
    const { dateFrom, dateTo } = req.query;

    if (!dateFrom || !dateTo) {
      return res.status(400).json({
        code: 400,
        message: 'dateFrom and dateTo parameters are required'
      });
    }

    const start = new Date(dateFrom as string);
    const end = new Date(dateTo as string);

    // Define funnel stages (matching Lead status enum)
    const stageConfig = [
      { status: 'NEW', label: 'Nov˝ lead' },
      { status: 'SUPERVISOR_APPROVED', label: 'Schv·len AM' },
      { status: 'UPLOAD_DOCUMENTS', label: 'P¯ed·no technikovi' },
      { status: 'CONVERTED', label: 'Konvertov·no' }
    ];

    // Fetch all leads in date range (CC team only)
    const allLeads = await Lead.find({
      createdAt: { $gte: start, $lte: end },
      team: 'CC'  // Filter by CC team
    }).populate('dealer', 'name email');

    const totalLeads = allLeads.length;
    const convertedLeads = allLeads.filter(l => l.status === 'CONVERTED').length;
    const declinedLeads = allLeads.filter(l => l.status === 'DECLINED').length;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    // Build stages data
    const stages = stageConfig.map(({ status, label }) => {
      const leadsInStage = allLeads.filter(l => l.status === status);
      const count = leadsInStage.length;
      const percentage = totalLeads > 0 ? (count / totalLeads) * 100 : 0;

      // Get decline reasons for leads that were declined at this stage
      const declinedAtStage = allLeads.filter(l => 
        l.status === 'DECLINED' && 
        l.lastStatus === status
      );

      const declinedReasons = getTopDeclineReasons(declinedAtStage, 5);

      // Get sample notes (optional)
      const notes = leadsInStage
        .filter(l => l.notes && l.notes.length > 0)
        .slice(0, 3)
        .map(l => ({
          text: l.notes[0].text,
          date: l.notes[0].createdAt,
          author: l.notes[0].author?.name || 'Unknown'
        }));

      return {
        stage: label,
        count,
        percentage: parseFloat(percentage.toFixed(2)),
        declinedReasons,
        notes
      };
    });

    // Overall decline reasons
    const allDeclined = allLeads.filter(l => l.status === 'DECLINED');
    const overallDeclinedReasons = getTopDeclineReasons(allDeclined, 10);

    // Calculate average time in stages
    const averageTimeInStages = calculateAverageTimeInStages(stageConfig, allLeads);

    res.status(200).json({
      dateFrom: start,
      dateTo: end,
      stages,
      totalLeads,
      convertedLeads,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      declinedLeads,
      declinedReasons: overallDeclinedReasons,
      averageTimeInStages
    });

  } catch (error) {
    console.error('Funnel stats error:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
};

// Helper: Get top decline reasons with translations
function getTopDeclineReasons(leads: any[], limit: number) {
  const reasonCounts: Record<string, number> = {};
  
  leads.forEach(lead => {
    const reason = lead.declinedType || lead.notInterestedStatus || 'OTHER';
    reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
  });

  const total = leads.length;
  
  return Object.entries(reasonCounts)
    .map(([reason, count]) => ({
      reason: DECLINE_REASON_TRANSLATIONS[reason] || reason,
      count,
      percentage: total > 0 ? parseFloat(((count / total) * 100).toFixed(2)) : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// Helper: Calculate average days in each stage
function calculateAverageTimeInStages(stageConfig: any[], leads: any[]): Record<string, number> {
  const result: Record<string, number> = {};
  
  stageConfig.forEach(({ status, label }) => {
    const leadsInStage = leads.filter(l => 
      l.status === status || 
      (l.statusHistory && l.statusHistory.some((h: any) => h.status === status))
    );
    
    if (leadsInStage.length === 0) {
      result[label] = 0;
      return;
    }

    const totalDays = leadsInStage.reduce((sum, lead) => {
      // Find when lead entered this stage
      const stageEntry = lead.statusHistory?.find((h: any) => h.status === status);
      
      if (stageEntry) {
        const entryDate = new Date(stageEntry.date);
        
        // Find when lead left this stage (next status change or current time)
        const nextStatusIndex = lead.statusHistory.findIndex((h: any) => h.status === status) + 1;
        const exitDate = nextStatusIndex < lead.statusHistory.length
          ? new Date(lead.statusHistory[nextStatusIndex].date)
          : lead.status === status ? new Date() : new Date(lead.statusUpdatedAt);
        
        const days = (exitDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
        return sum + days;
      }
      
      return sum;
    }, 0);

    result[label] = parseFloat((totalDays / leadsInStage.length).toFixed(1));
  });

  return result;
}

const DECLINE_REASON_TRANSLATIONS: Record<string, string> = {
  'NOT_REACHED_1': 'NEDOVOL¡NO 1X',
  'NOT_REACHED_2': 'NEDOVOL¡NO 2X',
  'NOT_REACHED_3': 'NEDOVOL¡NO 3X',
  'NOT_REACHED_4': 'NEDOVOL¡NO 4X',
  'NOT_REACHED_X': 'NEDOVOL¡NO OPAKOVANÃ',
  'NOT_INTERESTED': 'NEM¡ Z¡JEM',
  'CAR_LOW_VALUE': 'NÕZKA HODNOTA AUTA',
  'CAR_OLD': 'ST¡ÿÕ VOZU',
  'CAR_DENIED_BY_TECHNICIAN': 'ZAMÕTNUTO TECHNIKEM',
  'CAR_BAD_TECHNICAL_STATE': 'äPATN› TECHNICK› STAV VOZU',
  'CAR_HIGH_MILEAGE': 'VYSOK› N¡JEZD',
  'CAR_NOT_OWNED': 'AUTO NEVLASTNÕ',
  'CAR_LEASED': 'AUTO NA LEASING',
  'CAR_BURDENED': 'AUTO ZAçÕéENO Z¡VAZKY',
  'CUSTOMER_NOT_ELIGIBLE': 'NESPL“UJE PODMÕNKY',
  'CUSTOMER_PRICE_DISADVANTAGEOUS': 'NEV›HODN¡ NABÕDKA/CENA',
  'CUSTOMER_SOLVED_ELSEWHERE': 'PENÕZE JIé NEPOTÿEBUJE, VYÿEäENO JINAK',
  'OTHER': 'OSTATNÕ'
};
```

### **Route: `src/routes/v1/stats.route.ts`**

```typescript
import express from 'express';
import { auth } from '../../middlewares/auth';
import * as statsController from '../../controllers/stats.controller';

const router = express.Router();

// Existing routes
router.get('/cc-report', auth('getStats'), statsController.getCCReport);
router.get('/os-report', auth('getStats'), statsController.getOSReport);

// NEW: Funnel report
router.get('/funnel', auth('getStats'), statsController.getFunnelReport);

export default router;
```

---

## ? **Acceptance Criteria:**

- [ ] Endpoint `/v1/stats/funnel` exists and returns 200 OK
- [ ] Accepts `dateFrom` and `dateTo` in ISO format (required)
- [ ] Filters leads by CC team (`team: 'CC'`)
- [ ] Returns proper data structure matching interface
- [ ] Respects `getStats` permission (ADMIN, FINANCE_DIRECTOR, SUPERVISOR)
- [ ] Translates decline reasons to Czech
- [ ] Calculates conversion rate correctly
- [ ] Groups decline reasons by stage
- [ ] Calculates average time in stages
- [ ] Returns sample notes for each stage (optional)

---

## ?? **Priority:**

**HIGH** - Frontend Funnel 1 Report is implemented and deployed but cannot function without this endpoint.

---

**Created:** 9.12.2024  
**Updated:** 9.12.2024  
**Status:** ? MISSING ENDPOINT  
**Assigned To:** Backend Team  
**Blocks:** Funnel 1 Report feature  
**Pattern:** Based on `/stats/os-report` implementation
