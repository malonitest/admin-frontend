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
| `period` | string | No | `day`, `week`, `month` (default), `year` |
| `dateFrom` | string | No | ISO date: `2024-01-01` |
| `dateTo` | string | No | ISO date: `2024-01-31` |

**Note:** If `dateFrom` and `dateTo` provided, they override `period`.

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

## ?? **Priority:**

**HIGH** - Frontend Funnel 1 Report is implemented and deployed but cannot function without this endpoint.

---

**Created:** 9.12.2024  
**Status:** ? MISSING ENDPOINT  
**Assigned To:** Backend Team  
**Blocks:** Funnel 1 Report feature
