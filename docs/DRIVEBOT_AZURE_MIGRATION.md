# ?? DriveBot (Carvex AI) - Migrace na Azure Cosmos DB a Business Analytics

**Datum:** 9.12.2024  
**Priority:** HIGH  
**Typ:** Backend Configuration Change  
**Affected Component:** DriveBot / Carvex AI Assistant

---

## ?? **Požadavek:**

Zmìnit konfiguraci AI bota (DriveBot - Carvex) aby:

1. **Pøipojení k databázi:**
   - ? Pøepnout z Forpsi MongoDB na **Azure Cosmos DB**
   - ? Connection string: Azure Cosmos DB (MongoDB API)
   - ? Database: `carbackrent`

2. **Nová role bota:**
   - ?? **Business Analytik**
   - ?? **Report Generator**
   - ?? **Document Analyzer**
   - ?? **Data Comparator**

---

## ?? **Požadované funkce:**

### **1. Business Analytics**

```javascript
// Bot by mìl umìt odpovídat na dotazy jako:
- "Kolik máme aktivních pronájmù?"
- "Jaká je celková hodnota aktivních leasingù?"
- "Které smlouvy konèí tento mìsíc?"
- "Kolik leadù bylo vytvoøeno tento mìsíc?"
- "Jaká je konverzní míra leadù?"
- "Které auta máme ve skladu?"
```

### **2. Report Generation**

```javascript
// Bot by mìl umìt generovat reporty:
- "Vytvoø report aktivních pronájmù"
- "Ukaž mi statistiky za poslední mìsíc"
- "Jaké auta máme v portfoliu?"
- "Který obchodník má nejvíc leadù?"
```

### **3. Document Analysis**

```javascript
// Bot by mìl umìt èíst dokumenty:
- "Ukaž mi detaily klienta s jménem Novák"
- "Jaké dokumenty má lead ID 12345?"
- "Které smlouvy èekají na schválení?"
```

### **4. Data Comparison**

```javascript
// Bot by mìl umìt porovnávat:
- "Porovnej pronájmy tento mìsíc vs. minulý mìsíc"
- "Která smlouva konèí døív?"
- "Který obchodník má lepší konverzi?"
```

---

## ?? **Backend Configuration Changes:**

### **1. Database Connection**

```typescript
// Backend: Update database connection
// File: src/config/config.ts or similar

const config = {
  // OLD - Forpsi MongoDB
  // mongodb: process.env.MONGODB_URL,

  // NEW - Azure Cosmos DB
  mongodb: {
    url: process.env.AZURE_COSMOS_DB_URL,
    // mongodb://backrent-itx754fut5nry-cosmos.mongo.cosmos.azure.com:10255/carbackrent?ssl=true&...
    database: 'carbackrent',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      ssl: true,
      retryWrites: false, // Cosmos DB requirement
    }
  }
};
```

### **2. AI Bot Configuration**

```typescript
// Backend: Update AI bot configuration
// File: src/services/aiBot.service.ts or similar

const botConfig = {
  model: 'gpt-4', // nebo 'gpt-3.5-turbo'
  systemPrompt: `
    Jsi business analytik pro CashNDrive - systém pro správu zpìtného pronájmu a leasingu aut.
    
    Máš pøístup k celé databázi obsahující:
    - Leady (potenciální zákazníci)
    - Leases (aktivní smlouvy o pronájmu)
    - Cars (auta v portfoliu)
    - Customers (zákazníci)
    - Dealers (obchodníci)
    - Documents (dokumenty k leadùm a smlouvám)
    - Transactions (platby a transakce)
    
    Tvoje role:
    1. Odpovídat na business dotazy o datech
    2. Generovat reporty a statistiky
    3. Analyzovat dokumenty a záznamy
    4. Porovnávat data a trendy
    
    Odpovídej vždy v èeštinì, struènì a pøesnì.
    Když nevíš pøesnou odpovìï, øekni to.
    Když potøebuješ více informací, zeptej se.
  `,
  functions: [
    {
      name: 'getLeadsStats',
      description: 'Získat statistiky leadù (celkem, konverze, podle období)',
      parameters: { /* ... */ }
    },
    {
      name: 'getActiveLeases',
      description: 'Získat seznam aktivních pronájmù',
      parameters: { /* ... */ }
    },
    {
      name: 'getDocumentsByLead',
      description: 'Získat dokumenty pro konkrétní lead',
      parameters: { /* ... */ }
    },
    {
      name: 'compareData',
      description: 'Porovnat data mezi dvìma obdobími',
      parameters: { /* ... */ }
    },
    // ... další funkce
  ]
};
```

### **3. Database Access Functions**

```typescript
// Backend: Implement data access functions for AI bot
// File: src/services/botDataAccess.service.ts

export class BotDataAccessService {
  /**
   * Get leads statistics
   */
  async getLeadsStats(params: {
    dateFrom?: Date;
    dateTo?: Date;
    status?: string;
  }) {
    const query: any = {};
    
    if (params.dateFrom || params.dateTo) {
      query.createdAt = {};
      if (params.dateFrom) query.createdAt.$gte = params.dateFrom;
      if (params.dateTo) query.createdAt.$lte = params.dateTo;
    }
    
    if (params.status) {
      query.status = params.status;
    }
    
    const leads = await Lead.find(query);
    const converted = leads.filter(l => l.status === 'CONVERTED').length;
    
    return {
      total: leads.length,
      converted,
      conversionRate: leads.length > 0 ? (converted / leads.length * 100).toFixed(2) : 0,
      byStatus: this.groupByStatus(leads),
    };
  }

  /**
   * Get active leases
   */
  async getActiveLeases() {
    return await Lease.find({ 
      status: 'ACTIVE',
      endDate: { $gte: new Date() }
    })
    .populate('customer')
    .populate('car')
    .sort({ createdAt: -1 });
  }

  /**
   * Get documents by lead ID
   */
  async getDocumentsByLead(leadId: string) {
    const lead = await Lead.findById(leadId).populate('documents');
    return lead?.documents || [];
  }

  /**
   * Compare data between periods
   */
  async compareData(params: {
    metric: string; // 'leads' | 'leases' | 'revenue'
    period1: { from: Date; to: Date };
    period2: { from: Date; to: Date };
  }) {
    const data1 = await this.getMetricForPeriod(params.metric, params.period1);
    const data2 = await this.getMetricForPeriod(params.metric, params.period2);
    
    return {
      period1: { value: data1, from: params.period1.from, to: params.period1.to },
      period2: { value: data2, from: params.period2.from, to: params.period2.to },
      difference: data1 - data2,
      percentageChange: data2 > 0 ? ((data1 - data2) / data2 * 100).toFixed(2) : 0,
    };
  }

  private groupByStatus(items: any[]) {
    return items.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});
  }

  private async getMetricForPeriod(metric: string, period: { from: Date; to: Date }) {
    switch (metric) {
      case 'leads':
        return await Lead.countDocuments({
          createdAt: { $gte: period.from, $lte: period.to }
        });
      case 'leases':
        return await Lease.countDocuments({
          createdAt: { $gte: period.from, $lte: period.to },
          status: 'ACTIVE'
        });
      case 'revenue':
        const leases = await Lease.find({
          createdAt: { $gte: period.from, $lte: period.to }
        });
        return leases.reduce((sum, lease) => sum + (lease.monthlyPayment || 0), 0);
      default:
        return 0;
    }
  }
}
```

---

## ?? **Environment Variables:**

```bash
# Backend .env file - ADD these variables:

# Azure Cosmos DB connection
AZURE_COSMOS_DB_URL=mongodb://backrent-itx754fut5nry-cosmos.mongo.cosmos.azure.com:10255/carbackrent?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@backrent-itx754fut5nry-cosmos@
AZURE_COSMOS_DB_KEY=<primary-key>

# OpenAI API for bot
OPENAI_API_KEY=<your-openai-api-key>
OPENAI_MODEL=gpt-4 # or gpt-3.5-turbo

# Bot configuration
BOT_ENABLED=true
BOT_MAX_CONTEXT_LENGTH=4000
BOT_TEMPERATURE=0.7
```

---

## ?? **Example Queries for Testing:**

### **Business Analytics:**

```
User: "Kolik máme aktivních pronájmù?"
Bot: "Aktuálnì máte 45 aktivních pronájmù. Z toho 12 konèí do konce mìsíce."

User: "Jaká je celková hodnota aktivních leasingù?"
Bot: "Celková hodnota všech aktivních leasingù je 12 500 000 Kè."

User: "Který obchodník má nejvíc leadù?"
Bot: "Martin Dyntar má 28 leadù, což je nejvíce ze všech obchodníkù."
```

### **Report Generation:**

```
User: "Vytvoø report aktivních pronájmù"
Bot: "Report aktivních pronájmù:
- Celkem: 45 smluv
- Prùmìrná mìsíèní splátka: 15 000 Kè
- Nejstarší smlouva: 12.3.2023
- Nejnovìjší smlouva: 5.12.2024
- Top 3 auta: Škoda Octavia (8x), VW Golf (5x), Ford Focus (4x)"
```

### **Document Analysis:**

```
User: "Ukaž mi detaily klienta s jménem Novák"
Bot: "Našel jsem 2 klienty:
1. Jan Novák - Lead ID 12345, stav: Schváleno, auto: Škoda Octavia 2020
2. Petr Novák - Lead ID 12346, stav: Èeká na dokumenty, auto: VW Golf 2019"

User: "Jaké dokumenty má lead ID 12345?"
Bot: "Lead 12345 má následující dokumenty:
- ? Obèanský prùkaz
- ? Technický prùkaz vozidla
- ? Fotka VIN
- ? Fotka nájezdu
- ? Chybí: Zelená karta pojištìní"
```

### **Data Comparison:**

```
User: "Porovnej pronájmy tento mìsíc vs. minulý mìsíc"
Bot: "Porovnání pronájmù:
Tento mìsíc (prosinec): 12 nových smluv
Minulý mìsíc (listopad): 8 nových smluv
Rozdíl: +4 smlouvy (+50%)
Trend: Rostoucí ?"
```

---

## ?? **Implementation Steps:**

### **Backend Team Tasks:**

1. **Update Database Connection**
   - [ ] Change MongoDB connection string to Azure Cosmos DB
   - [ ] Test database connectivity
   - [ ] Verify all collections are accessible

2. **Update AI Bot Configuration**
   - [ ] Update system prompt for business analytics role
   - [ ] Add database access functions
   - [ ] Implement report generation logic

3. **Create Data Access Layer**
   - [ ] Implement `BotDataAccessService`
   - [ ] Add functions for all required queries
   - [ ] Test with real data

4. **Test Bot Functionality**
   - [ ] Test all example queries
   - [ ] Verify responses are accurate
   - [ ] Test error handling

5. **Deploy Changes**
   - [ ] Update environment variables in Azure
   - [ ] Deploy backend with new configuration
   - [ ] Monitor logs for errors

---

## ?? **Testing Checklist:**

- [ ] Bot can connect to Azure Cosmos DB
- [ ] Bot can query leads statistics
- [ ] Bot can query active leases
- [ ] Bot can retrieve documents
- [ ] Bot can compare data between periods
- [ ] Bot responds in Czech language
- [ ] Bot provides accurate data
- [ ] Bot handles errors gracefully
- [ ] Bot respects user permissions (ADMIN only)

---

## ?? **Contact:**

### **Frontend Team:**
- Email: maloni@outlook.com
- Frontend URL: https://happy-pebble-041ffdb03.3.azurestaticapps.io
- DriveBot UI: https://happy-pebble-041ffdb03.3.azurestaticapps.io/drivebot

### **Backend Team:**
- Repository: https://github.com/malonitest/car-backrent-api-test
- Branch: `develop`
- API Docs: https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1/docs

---

## ?? **Expected Outcome:**

Po implementaci by DriveBot mìl:
1. ? Být pøipojený k Azure Cosmos DB (`carbackrent` database)
2. ? Umìt odpovídat na business dotazy
3. ? Generovat reporty ze skuteèných dat
4. ? Analyzovat a porovnávat dokumenty
5. ? Odpovídat v èeštinì s pøesnými údaji

---

**Priority:** HIGH  
**Estimated Time:** 4-6 hours  
**Dependencies:** Azure Cosmos DB migration completed  
**Risk:** LOW (bot is optional feature)

---

**Created:** 9.12.2024  
**Status:** ?? READY FOR BACKEND IMPLEMENTATION  
**Assigned To:** Backend Team
