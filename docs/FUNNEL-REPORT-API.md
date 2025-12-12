# Funnel 1 Report - Frontend Documentation

## Endpoint

**URL:** `GET /v1/stats/funnel`  
**Auth:** Required (Bearer token)  
**Permission:** `getStats`

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `period` | string | No | Pre-defined period: `day`, `week`, `month` (default), `year` |
| `dateFrom` | string | No | Custom start date (ISO format: `2024-01-01`) |
| `dateTo` | string | No | Custom end date (ISO format: `2024-01-31`) |

**Note:** If `dateFrom` and `dateTo` are provided, they override the `period` parameter.

## Response Format

```typescript
interface IFunnelStageData {
  stage: string;                    // Stage name in Czech
  count: number;                    // Number of leads at this stage
  percentage: number;               // Percentage of total leads
  declinedReasons?: Array<{         // Top decline reasons for this stage
    reason: string;                 // Translated decline reason
    count: number;                  // Count of this reason
    percentage: number;             // Percentage of declined at this stage
  }>;
  notes?: Array<{                   // Sample notes from leads at this stage
    text: string;                   // Note text
    date: Date;                     // Note creation date
    author: string;                 // Note author name
  }>;
}

interface IFunnelReportData {
  dateFrom: Date;                   // Filter start date
  dateTo: Date;                     // Filter end date
  stages: IFunnelStageData[];       // Funnel stages data
  totalLeads: number;               // Total leads in period
  convertedLeads: number;           // Successfully converted leads
  conversionRate: number;           // Conversion rate (percentage)
  declinedLeads: number;            // Total declined leads
  declinedReasons: Array<{          // Overall decline reasons
    reason: string;                 // Translated decline reason
    count: number;                  // Count
    percentage: number;             // Percentage of all declined
  }>;
  averageTimeInStages: Record<string, number>;  // Average days in each stage
}
```

## Example Response

```json
{
  "dateFrom": "2024-01-01T00:00:00.000Z",
  "dateTo": "2024-01-31T23:59:59.999Z",
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
          "date": "2024-01-15T10:30:00.000Z",
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
      "stage": "P¯ed·no technikovi (Awaiting Documents)",
      "count": 50,
      "percentage": 33.3,
      "declinedReasons": [
        {
          "reason": "ZAMÕTNUTO TECHNIKEM",
          "count": 3,
          "percentage": 6.0
        }
      ],
      "notes": [
        {
          "text": "»ek· na technickou kontrolu",
          "date": "2024-01-20T14:00:00.000Z",
          "author": "Petr Svoboda"
        }
      ]
    },
    {
      "stage": "Konvertov·no",
      "count": 30,
      "percentage": 20,
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
    "P¯ed·no technikovi (Awaiting Documents)": 7.8,
    "Konvertov·no": 12.1
  }
}
```

## Funnel Stages

The funnel tracks leads through these stages:

1. **Nov˝ lead** - New lead created
2. **Schv·len AM** - Approved by Area Manager (Supervisor)
3. **P¯ed·no technikovi** - Handed over to technician (awaiting documents)
4. **Konvertov·no** - Successfully converted to lease

## Decline Reasons (Translated)

Common decline reasons you'll see in Czech:
- `NEDOVOL¡NO 1X` - Not reached 1x
- `NEDOVOL¡NO 2X` - Not reached 2x
- `NEDOVOL¡NO 3X` - Not reached 3x
- `NEDOVOL¡NO 4X` - Not reached 4x
- `NEDOVOL¡NO OPAKOVANÃ` - Not reached repeatedly
- `NEM¡ Z¡JEM` - Not interested
- `NÕZKA HODNOTA AUTA` - Low car value
- `ST¡ÿÕ VOZU` - Car too old
- `ZAMÕTNUTO TECHNIKEM` - Denied by technician
- `äPATN› TECHNICK› STAV VOZU` - Bad technical condition
- `VYSOK› N¡JEZD` - High mileage
- `AUTO NEVLASTNÕ` - Does not own car
- `AUTO NA LEASING` - Car on lease
- `AUTO ZAçÕéENO Z¡VAZKY` - Car burdened with obligations
- `NESPL“UJE PODMÕNKY` - Does not meet conditions
- `NEV›HODN¡ NABÕDKA/CENA` - Disadvantageous offer/price
- `PENÕZE JIé NEPOTÿEBUJE, VYÿEäENO JINAK` - Money no longer needed, solved elsewhere
- `OSTATNÕ` - Other

## Usage Examples

### Get current month funnel:
```javascript
const response = await fetch('/v1/stats/funnel', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
```

### Get funnel for specific date range:
```javascript
const response = await fetch('/v1/stats/funnel?dateFrom=2024-01-01&dateTo=2024-01-31', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
```

### Get this week's funnel:
```javascript
const response = await fetch('/v1/stats/funnel?period=week', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
```

## Visualization Suggestions

### Funnel Chart
Display the stages as a funnel visualization showing:
- Stage name
- Count of leads
- Percentage of total
- Conversion rate between stages

### Decline Reasons Chart
Show top decline reasons as:
- Pie chart or bar chart
- With counts and percentages
- Color-coded by severity

### Time in Stages
Display average time spent in each stage:
- Bar chart showing days
- Helps identify bottlenecks

### Notes Display
Show sample notes for context:
- Recent notes from leads at each stage
- Helps understand why leads are stuck

## Frontend Implementation Notes

1. **Date Filter**: Add date picker with pre-defined periods (Today, This Week, This Month, etc.)

2. **Funnel Visualization**: Use a funnel chart library (e.g., Chart.js, Recharts, D3.js)

3. **Decline Reasons**: Display as expandable sections per stage + overall summary

4. **Notes Section**: Show in expandable cards or tooltips

5. **Conversion Rate**: Highlight the overall conversion rate prominently

6. **Time Analysis**: Show average time in stages to identify bottlenecks

7. **Export**: Consider adding CSV/Excel export functionality

## Error Handling

```javascript
try {
  const response = await fetch('/v1/stats/funnel?dateFrom=2024-01-01&dateTo=2024-01-31', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      // Handle unauthorized - redirect to login
    } else if (response.status === 403) {
      // Handle forbidden - user doesn't have permission
    } else {
      // Handle other errors
    }
  }
  
  const data = await response.json();
  // Use data
} catch (error) {
  // Handle network errors
  console.error('Failed to fetch funnel stats:', error);
}
```

## Permission Requirements

User must have the `getStats` permission. This is typically granted to:
- `ADMIN`
- `FINANCE_DIRECTOR`
- `SUPERVISOR`

Sales representatives (`SALES`, `OS`) and customers (`CUSTOMER`) **do not** have access to this endpoint.
