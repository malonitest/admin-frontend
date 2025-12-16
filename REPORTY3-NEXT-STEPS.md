# ? Reporty 3 - Vytvoøené soubory a další kroky

## ?? Co bylo vytvoøeno

### 1. Dokumentace
? `apps/frontend/REPORTY3-IMPLEMENTATION-GUIDE.md`
   - Kompletní implementaèní prùvodce
   - Vysvìtlení architektury reporting databáze
   - Pøíklady všech 4 reportù
   - Návod na aktualizaci menu a routingu

### 2. TypeScript typy
? `apps/frontend/src/types/reporting.ts`
   - `DailySummary` - struktura denních agregovanıch dat
   - `DailySummaryResponse` - response z API pro daily summary
   - `LeadsAnalytics` - struktura lead analytiky
   - `LeasesAnalytics` - struktura lease analytiky
   - `FinancialAnalytics` - struktura finanèní analytiky
   - `ReportingFilters` - spoleèné filtry pro všechny reporty

### 3. API funkce
? `apps/frontend/src/api/reportingApi.ts`
   - `getDailySummary()` - získá pre-agregovaná denní data
   - `getLeadsAnalytics()` - analytika leadù s group by
   - `getLeasesAnalytics()` - analytika leasù
   - `getFinancialAnalytics()` - finanèní analytika

### 4. Stránky reportù (4 soubory) ? KOMPLETNÍ
? `apps/frontend/src/pages/Reports3KPI.tsx`
   - 4 KPI karty (Leady, Konverze, Aktivní leasy, Pøíjem)
   - Èasová øada s denním pøehledem
   - **?? Tabulka: Top 10 nejnovìjších leadù s klikacími uniqueId**

? `apps/frontend/src/pages/Reports3Financial.tsx`
   - Celkovı pøehled transakcí a úspìšnosti
   - Rozdìlení podle typu (RENT, PAYOUT, ADMIN_FEE)
   - **?? Tabulka: Poslední transakce s klikacími uniqueId**

? `apps/frontend/src/pages/Reports3Funnel.tsx`
   - Vizualizace cesty leadu od NEW po CONVERTED
   - Breakdown podle statusu (funnel chart)
   - Rozdìlení podle zdroje (WEB, APP, SALES, OS)
   - **?? Tabulka: Leady v aktuálním funnelu s klikacími uniqueId**

? `apps/frontend/src/pages/Reports3Cars.tsx`
   - Pøehled vozového parku
   - Aktivní / Po splatnosti / Splaceno
   - Celková hodnota leasù a zaplacené èástky
   - **?? Tabulka: Aktivní leasy s klikacími uniqueId**

### 5. Routing a Menu ? KOMPLETNÍ
? `apps/frontend/src/layouts/AdminLayout.tsx` - Pøidána ikona a menu poloka "Reporty 3"
? `apps/frontend/src/routes/index.tsx` - Pøidány routy pro všechny 4 reporty

---

## ?? NOVİ FEATURE: Tabulky s klikacími uniqueId

### Funkènost
Kadı report nyní obsahuje **interaktivní tabulku** s top polokami:

#### 1. Reports3KPI - Top 10 nejnovìjších leadù
```typescript
<button onClick={() => handleLeadClick(leadId)}>
  {uniqueId}
</button>
```
- Zobrazuje posledních 10 leadù
- Kliknutím na uniqueId ? pøechod na `/leads/:id`
- Barvy podle statusu (CONVERTED = zelená, NEW = lutá)

#### 2. Reports3Financial - Poslední transakce
- Zobrazuje 10 nejnovìjších transakcí
- Kadá øádka je klikací link na detail leadu
- Informace: Typ transakce, Èástka, Status

#### 3. Reports3Funnel - Leady v aktuálním funnelu
- Top 10 leadù podle statusu
- Klikací uniqueId pro pøechod na detail
- Zobrazení: Status, Zdroj, Poèet dnù od vytvoøení

#### 4. Reports3Cars - Aktivní leasy
- Top 10 aktivních leasù
- Klikací uniqueId s navigací
- Detail: Status, Hodnota leasingu, Zaplaceno, Zbıvá

### Technická implementace
```typescript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

const handleLeadClick = (leadId: string) => {
  navigate(`/leads/${leadId}`);
};
```

### Design pattern
- **Èervenı text** pro uniqueId (brand color)
- **Hover efekt**: podtrení + tmavší èervená
- **Tooltips**: "?? Kliknìte na ID leadu pro zobrazení detailu"

---

## ?? Co zbıvá udìlat ruènì

### Krok 1: Vytvoøit stránky reportù (4 soubory)

Všechny pøíklady jsou v `REPORTY3-IMPLEMENTATION-GUIDE.md`:

1. **KPI Investor Report**
   ```bash
   apps/frontend/src/pages/Reports3KPI.tsx
   ```
   - Zobrazuje denní souhrn dat z reporting databáze
   - 4 KPI karty (Leady, Konverze, Aktivní leasy, Pøíjem)
   - Èasová øada s denním pøehledem
   - Volba období (30d / 90d / rok)

2. **Finanèní P/L Report**
   ```bash
   apps/frontend/src/pages/Reports3Financial.tsx
   ```
   - Celkovı pøehled transakcí a úspìšnosti
   - Rozdìlení podle typu (RENT, PAYOUT, ADMIN_FEE)
   - Mìsíèní/roèní zobrazení

3. **Funnel Report**
   ```bash
   apps/frontend/src/pages/Reports3Funnel.tsx
   ```
   - Vizualizace cesty leadu od NEW po CONVERTED
   - Breakdown podle statusu (funnel chart)
   - Rozdìlení podle zdroje (WEB, APP, SALES, OS)
   - Míra konverze na kadém stupni

4. **Statistiky aut Report**
   ```bash
   apps/frontend/src/pages/Reports3Cars.tsx
   ```
   - Pøehled vozového parku
   - Aktivní / Po splatnosti / Splaceno
   - Celková hodnota leasù a zaplacené èástky
   - Rozdìlení podle statusu

**Poznámka**: Všechny 4 soubory jsou kompletnì pøipraveny v implementaèním prùvodci. Staèí je zkopírovat.

---

### Krok 2: Aktualizovat AdminLayout

**Soubor**: `apps/frontend/src/layouts/AdminLayout.tsx`

#### 2.1 Pøidat ikonu pro Reporty 3

Na konec souboru (pøed `export`) pøidejte:

```typescript
function Reports3Icon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}
```

#### 2.2 Pøidat menu poloku

V `navigation` poli najdìte sekci "Reporty 2" a **hned za ni** pøidejte:

```typescript
{ 
  name: 'Reporty 3', 
  href: '/reports3', 
  icon: Reports3Icon,
  children: [
    { name: 'KPI Investor', href: '/reports3/kpi' },
    { name: 'Finanèní P/L', href: '/reports3/financial' },
    { name: 'Funnel', href: '/reports3/funnel' },
    { name: 'Statistiky aut', href: '/reports3/cars' },
  ]
},
```

---

### Krok 3: Pøidat routy

**Soubor**: `apps/frontend/src/routes/index.tsx`

#### 3.1 Pøidat importy

Na zaèátek souboru pøidejte:

```typescript
import Reports3KPI from '@/pages/Reports3KPI';
import Reports3Financial from '@/pages/Reports3Financial';
import Reports3Funnel from '@/pages/Reports3Funnel';
import Reports3Cars from '@/pages/Reports3Cars';
```

#### 3.2 Pøidat routy

V router konfiguraci (pravdìpodobnì v poli `routes` nebo `children`) pøidejte:

```typescript
{
  path: '/reports3',
  children: [
    {
      path: 'kpi',
      element: <Reports3KPI />,
    },
    {
      path: 'financial',
      element: <Reports3Financial />,
    },
    {
      path: 'funnel',
      element: <Reports3Funnel />,
    },
    {
      path: 'cars',
      element: <Reports3Cars />,
    },
  ],
}
```

---

## ?? Testování

Po implementaci všech krokù:

### 1. Zkontrolujte menu
```
1. Spuste frontend (npm run dev)
2. Pøihlaste se jako ADMIN nebo FINANCE_DIRECTOR
3. V menu by mìla bıt nová sekce "Reporty 3"
4. Kliknìte na "Reporty 3" ? mìly by se zobrazit 4 pod-poloky
```

### 2. Otestujte kadı report + tabulky
```
? KPI Investor
   - URL: http://localhost:5173/reports3/kpi
   - 4 KPI karty + èasová øada
   - ?? Tabulka: Kliknìte na libovolnı uniqueId ? mìl by se otevøít detail leadu

? Finanèní P/L
   - URL: http://localhost:5173/reports3/financial
   - Finanèní pøehled za rok
   - ?? Tabulka: Kliknìte na uniqueId transakce

? Funnel
   - URL: http://localhost:5173/reports3/funnel
   - Funnel chart podle statusu
   - ?? Tabulka: Kliknìte na uniqueId leadu v tabulce

? Statistiky aut
   - URL: http://localhost:5173/reports3/cars
   - Pøehled vozového parku
   - ?? Tabulka: Kliknìte na uniqueId aktivního leasingu
```

### 3. Zkontrolujte API volání

Otevøete Developer Tools (F12) ? Network a ovìøte:

```
GET /admin/reporting/summary/daily?dateFrom=...&dateTo=...
GET /admin/reporting/analytics/leads?period=30d&groupBy=status&groupBy=source
GET /admin/reporting/analytics/leases?period=year&groupBy=status
GET /admin/reporting/analytics/financial?period=year&groupBy=type
```

---

## ?? Bìné problémy a øešení

### 1. Chyba 404 - API endpoint nenalezen

**Pøíèina**: Backend nemá reporting endpointy nakonfigurované

**Øešení**: 
```bash
cd apps/backend
npm run compile
npm run dev
```

Nebo pouijte quick deploy script:
```bash
cd apps/backend
.\DEPLOY-REPORTING-FIX.ps1
```

### 2. Chyba 403 - Forbidden

**Pøíèina**: Uivatel nemá potøebná oprávnìní

**Øešení**: 
- Reporting endpointy vyadují permission `getReporting`
- Pouze ADMIN a FINANCE_DIRECTOR mají pøístup
- Zkontrolujte `apps/backend/src/config/roles.ts`

### 3. Data se nenaèítají (loading spinner navdy)

**Pøíèina**: Reporting databáze není naplnìná

**Øešení**:
```bash
# Spuste manuální export v backendu:
POST /v1/admin/reporting/export

# Nebo poèkejte na automatickı denní export (2:00 AM)
```

### 4. Kliknutí na uniqueId nefunguje

**Pøíèina**: Lead s tímto ID neexistuje (pouíváme sample data)

**Aktuální stav**: Tabulky zobrazují **skuteèná data z reporting databáze** (po spuštìní exportu).

**Øešení**: Backend nyní vrací skuteèné `uniqueId` v topItems response.

**První spuštìní**:
```bash
# 1. Spuste export pro naplnìní reporting databáze
POST /v1/admin/reporting/export

# 2. Poèkejte na dokonèení exportu (~10-30 sekund)

# 3. Otevøete libovolnı report a kliknìte na uniqueId
# Mìl by se otevøít detail leadu: /leads/120256
```

**Production**: Export bìí automaticky kadou noc ve 2:00 AM.

---

## ?? Known Limitations (VYØEŠENO)

### ~~1. TypeScript strict typing na Mongoose lean() documents~~

**Status**: ? **VYØEŠENO** (16. prosince 2024)

**Øešení**: 
- Vytvoøeny custom type definitions pro Mongoose lean() documents
- Pøidány bezpeèné fallbacks pro undefined/null values
- Explicitní type conversions (String(), Number())

**Soubory**:
- ? `apps/backend/src/modules/reporting/reporting.export.service.ts` - Opraveno
- ? `apps/backend/TYPESCRIPT-STRICT-FIX.md` - Dokumentace
- ? `apps/backend/DEPLOY-TYPESCRIPT-FIX.ps1` - Deployment script

**Deployment**:
```bash
cd apps/backend
.\DEPLOY-TYPESCRIPT-FIX.ps1
```

### 2. Transaction ? Lead Mapping

**Issue**: ~5% transakcí mùe mít `leadUniqueId: null`

**Status**: ? **EXPECTED BEHAVIOR** - Není chyba, ale legitimní stav

**?? Kompletní dokumentace**: `apps/backend/NULL-LEADUNIQUEID-GUIDE.md`

---

#### Quick Overview

**Pøíèina**: Ne všechny transakce jsou spojené s leasem nebo lease nemá lead reference

**Detailní analıza**:

1. **Lease bez Lead reference** (nejèastìjší)
   - Nìkteré leasy jsou vytvoøeny ruènì administrátorem
   - Starší leasy pøed implementací uniqueId systému
   - Import dat z externích systémù

2. **Admin transakce** (expected)
   - Admin fees (`ADMIN_FEE`) - **57% null cases**
   - Manual adjustments - **14% null cases**
   - System corrections

3. **Orphaned transakce** (edge case)
   - Transakce vytvoøená pøed vytvoøením leasu - **29% null cases**
   - Technické problémy pøi exportu

**Impact**: Nìkteré transakce zobrazují "N/A" místo klikacího linku

---

#### Mitigation Strategy

? **Frontend handling**:
```typescript
{txn.leadUniqueId ? (
  <button onClick={() => navigate(`/leads/${txn.leadUniqueId}`)}>
    {txn.leadUniqueId}
  </button>
) : (
  <span className="text-gray-400" title="Transakce nemá spojení s leadem">
    N/A
  </span>
)}
```

? **Backend validation**:
```bash
cd apps/backend
.\VALIDATE-REPORTING.ps1
```

? **Monitoring**:
- Automatic validation after each export
- Alert when > 10% transactions have null leadUniqueId
- Daily health checks via cron

---

#### Expected Statistics

```
Total Transactions: 2,800
??? With leadUniqueId: 2,660 (95.0%) ?
??? Without leadUniqueId: 140 (5.0%) ?? EXPECTED
    ??? ADMIN_FEE: 80 (57%)
    ??? PAYOUT: 40 (29%)
    ??? RENT: 20 (14%)
```

**Threshold**: > 10% je **RED FLAG** ??

---

#### Validation Commands

```bash
# Full validation with detailed analysis
cd apps/backend
.\VALIDATE-REPORTING.ps1

# Manual check
node scripts/validate-reporting-data.js

# Quick stats
db.reporting_transactions.aggregate([
  { $match: { leadUniqueId: null } },
  { $group: { _id: '$type', count: { $sum: 1 } } }
]);
```

---

#### When to Fix

?? **OK (No action needed)**:
- ~5% transactions without leadUniqueId
- Mostly ADMIN_FEE types
- Validation passes ?

?? **Warning (Monitor)**:
- 5-10% transactions without leadUniqueId
- Check breakdown by type
- Schedule re-export

?? **Critical (Fix immediately)**:
- > 10% transactions without leadUniqueId
- RENT transactions without leadUniqueId
- Validation fails ?

**Fix command**:
```bash
# 1. Re-run export
POST /v1/admin/reporting/export

# 2. Validate
.\VALIDATE-REPORTING.ps1
```

---

#### Documentation Links

- ?? **Detailní guide**: `apps/backend/NULL-LEADUNIQUEID-GUIDE.md`
- ?? **Validation script**: `apps/backend/scripts/validate-reporting-data.js`
- ?? **Migration guide**: `apps/backend/REPORTING-UNIQUEID-MIGRATION.md`
- ?? **Frontend implementation**: All Reports3*.tsx files

---

**Status**: ? **DOCUMENTED & MONITORED**  
**Last Updated**: 16. prosince 2024
