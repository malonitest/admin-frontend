# Funnel 1 Report - Frontend Documentation

**Datum:** 9.12.2024  
**Status:** ? IMPLEMENTED  
**URL:** `/reports/cc/funnel1`

---

## ?? **Overview:**

Funnel 1 Report poskytuje detailní analýzu konverzního trychtýøe (conversion funnel) pro Call Centrum team. Report zobrazuje:

1. **Konverzní trychtýø** - Prùchod leadù jednotlivými fázemi
2. **Dùvody zamítnutí** - Analýza proè leady nekonvertovaly
3. **Prùmìrný èas ve fázích** - Jak dlouho leady setrvávají v každé fázi
4. **Summary metriky** - Celkový pøehled konverzí

---

## ?? **Funnel Stages:**

Report sleduje leady v tìchto fázích:

1. **Nový lead** - Lead byl právì vytvoøen
2. **Schválen AM** - Lead schválen Area Managerem (Supervisor)
3. **Pøedáno technikovi** - Lead pøedán technikovi (èeká na dokumenty)
4. **Konvertováno** - Lead úspìšnì konvertován na pronájem

---

## ?? **Backend API:**

### **Endpoint:**
```
GET /v1/stats/funnel
```

### **Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `period` | string | No | `day`, `week`, `month` (default), `year` |
| `dateFrom` | string | No | Custom start date (ISO: `2024-01-01`) |
| `dateTo` | string | No | Custom end date (ISO: `2024-01-31`) |

### **Response Example:**
```json
{
  "dateFrom": "2024-01-01T00:00:00.000Z",
  "dateTo": "2024-01-31T23:59:59.999Z",
  "stages": [
    {
      "stage": "Nový lead",
      "count": 150,
      "percentage": 100,
      "declinedReasons": [
        {
          "reason": "NEDOVOLÁNO 1X",
          "count": 12,
          "percentage": 8.0
        }
      ],
      "notes": [
        {
          "text": "Zákazník chce osobní schùzku",
          "date": "2024-01-15T10:30:00.000Z",
          "author": "Jan Novák"
        }
      ]
    }
  ],
  "totalLeads": 150,
  "convertedLeads": 30,
  "conversionRate": 20.0,
  "declinedLeads": 45,
  "declinedReasons": [
    {
      "reason": "NEDOVOLÁNO OPAKOVANÌ",
      "count": 15,
      "percentage": 33.3
    }
  ],
  "averageTimeInStages": {
    "Nový lead": 2.5,
    "Schválen AM": 5.3
  }
}
```

---

## ?? **Frontend Features:**

### **1. Period Filter**

Uživatel mùže vybrat období:
- **Den** - Dnešní data
- **Týden** - Aktuální týden (pondìlí-nedìle)
- **Mìsíc** - Aktuální mìsíc (default)
- **Rok** - Aktuální rok
- **Vlastní** - Vlastní rozsah dat s date pickery

### **2. Summary Cards**

Ètyøi karty zobrazující:
- **Celkem leadù** - Celkový poèet leadù v období
- **Konvertováno** - Úspìšnì konvertované leady
- **Zamítnuto** - Zamítnuté leady
- **Konverzní pomìr** - Procento úspìšnosti (color-coded: zelená ?20%, oranžová ?10%, èervená <10%)

### **3. Charts**

#### **Konverzní trychtýø (Funnel Chart)**
- Horizontální bar chart
- Zobrazuje poèet leadù v každé fázi
- Percentage z celkového poètu

#### **Dùvody zamítnutí (Pie Chart)**
- Pie chart s top 10 dùvody
- Barevnì odlišené segmenty
- Zobrazuje count a procento

#### **Prùmìrný èas ve fázích (Bar Chart)**
- Vertikální bar chart
- Zobrazuje prùmìrný poèet dní v každé fázi
- Pomáhá identifikovat úzká místa (bottlenecks)

### **4. Detail Tables**

#### **Detaily jednotlivých fází**
- Tabulka s detailem každé fáze
- Zobrazuje:
  - Název fáze
  - Poèet leadù
  - Procento z celku
  - Top dùvody zamítnutí v této fázi

#### **Celkový pøehled dùvodù zamítnutí**
- Tabulka se všemi dùvody zamítnutí
- Seøazeno od nejèastìjšího
- Zobrazuje poèet a procento

---

## ?? **UI Components:**

### **File:** `src/pages/ReportsCCFunnel1.tsx`

**Použité komponenty:**
- `BarChart`, `PieChart` from `recharts`
- Custom period filter buttons
- Date pickers pro vlastní období
- Summary cards s ikonami
- Responsive tables
- Loading spinner
- Error handling

---

## ?? **Styling:**

### **Color Scheme:**
- **Primary:** Red (#DC2626) - Consistent s CashNDrive brand
- **Success:** Green (#10B981) - Konvertované leady
- **Danger:** Red (#EF4444) - Zamítnuté leady
- **Info:** Blue (#3B82F6) - Obecné metriky
- **Purple:** (#8B5CF6) - Konverzní pomìr

### **Cards:**
- Blue card: Total leads
- Green card: Converted leads
- Red card: Declined leads
- Purple card: Conversion rate

---

## ?? **Navigation:**

### **Access Points:**

1. **Z hlavní CC reportù stránky:**
   - URL: `/reports/cc`
   - Button: "Funnel 1 - Konverzní trychtýø" (top right)

2. **Z menu:**
   - Reporty ? CC ? (na stránce button Funnel 1)

3. **Direct URL:**
   - `/reports/cc/funnel1`

---

## ?? **Testing:**

### **Test Scenarios:**

1. **Load page** - Should display period filter and summary
2. **Change period** - Should reload data
3. **Custom date range** - Should filter correctly
4. **Charts rendering** - All charts should display
5. **Responsive design** - Should work on mobile/tablet
6. **Error handling** - Should show error message if API fails
7. **Loading state** - Should show spinner while loading

---

## ?? **Decline Reasons (Translated):**

| Backend Value | Czech Label |
|--------------|-------------|
| `NOT_REACHED_1` | Nedovoláno 1x |
| `NOT_REACHED_2` | Nedovoláno 2x |
| `NOT_REACHED_3` | Nedovoláno 3x |
| `NOT_REACHED_4` | Nedovoláno 4x |
| `NOT_REACHED_X` | Nedovoláno opakovanì |
| `NOT_INTERESTED` | Nemá zájem |
| `CAR_LOW_VALUE` | Nízká hodnota auta |
| `CAR_OLD` | Stáøí vozu |
| `CAR_DENIED_BY_TECHNICIAN` | Zamítnuto technikem |
| `CAR_BAD_TECHNICAL_STATE` | Špatný technický stav |
| `CAR_HIGH_MILEAGE` | Vysoký nájezd |
| `CAR_NOT_OWNED` | Auto nevlastní |
| `CAR_LEASED` | Auto na leasing |
| `CAR_BURDENED` | Auto zatíženo závazky |
| `CUSTOMER_NOT_ELIGIBLE` | Nesplòuje podmínky |
| `CUSTOMER_PRICE_DISADVANTAGEOUS` | Nevýhodná cena |
| `CUSTOMER_SOLVED_ELSEWHERE` | Vyøešeno jinak |
| `OTHER` | Ostatní |

---

## ?? **Deployment:**

### **Files Created:**
- ? `src/pages/ReportsCCFunnel1.tsx` - Main component
- ? `src/routes/index.tsx` - Route added
- ? `docs/FUNNEL1_REPORT_DOCUMENTATION.md` - This file

### **Modified Files:**
- ? `src/pages/ReportsCC.tsx` - Added navigation button

### **Dependencies:**
- `recharts` - Already installed
- `@/api/axiosClient` - Already configured
- No new dependencies needed ?

---

## ?? **Future Improvements:**

1. **Export functionality** - CSV/Excel export
2. **Drill-down** - Click on chart to see detailed leads
3. **Comparison mode** - Compare two periods side by side
4. **Notes expansion** - Show all notes, not just samples
5. **Custom funnel stages** - Allow customization of stages
6. **Real-time updates** - Auto-refresh every X minutes
7. **Email reports** - Schedule automated email reports

---

## ?? **Permissions:**

**Required permission:** `getStats`

**Allowed roles:**
- ? `ADMIN`
- ? `FINANCE_DIRECTOR`
- ? `SUPERVISOR`
- ? `SALES` (no access)
- ? `OS` (no access)
- ? `CUSTOMER` (no access)

---

## ?? **Support:**

### **Frontend Issues:**
- Repository: https://github.com/malonitest/admin-frontend
- Contact: maloni@outlook.com

### **Backend API Issues:**
- Repository: https://github.com/malonitest/car-backrent-api-test
- Endpoint: `/v1/stats/funnel`

---

## ? **Status:**

- [x] Component created
- [x] Route added
- [x] Navigation added
- [x] Charts implemented
- [x] Period filter working
- [x] Responsive design
- [x] Error handling
- [x] Documentation complete

**Status:** ? READY FOR PRODUCTION

---

**Created:** 9.12.2024  
**Last Updated:** 9.12.2024  
**Version:** 1.0.0
