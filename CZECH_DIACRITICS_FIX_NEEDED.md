# Czech Diacritics Removal - Action Items

## Issue
Czech characters with diacritics (ø, š, è, , ı, á, í, é, ù, ú, ï, , ò, ì) are displaying as ? (diamond with question mark) in production due to encoding/font issues.

## Solution
Replace ALL Czech diacritics with plain ASCII characters in ALL user-facing strings.

## Character Replacement Map
- ì ? e
- š ? s  
- è ? c
- ø ? r
-  ? z
- ı ? y
- á ? a
- í ? i
- é ? e
- ù ? u
- ú ? u
- ò ? n
-  ? t
- ï ? d

## Files to Fix (in priority order)

### ? DONE
1. src/pages/ReportsCars.tsx - COMPLETED

### ?? HIGH PRIORITY (Most Visible)
2. src/pages/ReportsCC.tsx - Contains funnel report labels
3. src/pages/ReportsCCFunnel1.tsx - Main funnel with status labels
4. src/pages/ReportsTechnik.tsx - Technician reports
5. src/pages/ReportsCCFunnelTechnik.tsx - Tech funnel
6. src/pages/ReportsOS.tsx - OS reports
7. src/pages/ReportsMarketing.tsx - Marketing reports

### ?? MEDIUM PRIORITY (Dashboard & Forms)
8. src/pages/Dashboard.tsx - Main dashboard labels
9. src/pages/Leads.tsx - Lead filters and status labels
10. src/pages/LeadDetail.tsx - Form labels
11. src/pages/NewLead.tsx - Form labels

### ?? LOW PRIORITY (Less Frequent)
12. src/pages/Reports2Financial.tsx - Financial reports
13. src/pages/Reports2KPI.tsx - KPI reports
14. src/pages/Reports2FunnelTechnik.tsx - Funnel tech reports  
15. src/pages/Reports2CarStats.tsx - Car stats reports
16. src/pages/LogsPage.tsx - Session logs
17. src/pages/DriveBot.tsx - AI assistant
18. src/pages/ReportsFinancial.tsx - Finance reports
19. src/pages/ReportsKPIInvestor.tsx - Investor KPI
20. src/pages/ReportsCollection.tsx - Collection reports

## Common Patterns to Replace

### Status Labels
```typescript
// BEFORE (with diacritics)
'Schváleno AM' ? 'Schvaleno AM'
'Zamítnuto' ? 'Zamitnuto'
'Pøiøazeno' ? 'Prirazeno'
'Vráceno' ? 'Vraceno'

// Period labels
'Mìsíc' ? 'Mesic'
'Tıden' ? 'Tyden'
'Období' ? 'Obdobi'

// Common words
'Prùmìrná' ? 'Prumerna'
'Celková' ? 'Celkova'
'Náklady' ? 'Naklady'
'Pøíjmy' ? 'Prijmy'
'ádost' ? 'Zadost'
'Nájezd' ? 'Najezd'
'Znaèka' ? 'Znacka'
'Poèet' ? 'Pocet'
```

### Search & Replace Examples
Use your IDE's find & replace with these patterns:

```
Find: Mìsíc
Replace: Mesic

Find: Prùmìrn
Replace: Prumern

Find: Celkov
Replace: Celkov

Find: Nákla
Replace: Nakla

Find: Pøíjm
Replace: Prijm

Find: ádost
Replace: Zadost

Find: Nájezd
Replace: Najezd

Find: Znaèk
Replace: Znack

Find: Poèet
Replace: Pocet

Find: Schválen
Replace: Schvalen

Find: Zamítnut
Replace: Zamitnut

Find: Pøiøazen
Replace: Prirazen

Find: Vrácen
Replace: Vracen

Find: Období
Replace: Obdobi

Find: Tıden
Replace: Tyden
```

## Testing After Changes
1. Run `npm run build` to verify no syntax errors
2. Test in browser (especially the Reports/Cars page from the screenshot)
3. Check that diamond symbols (?) are gone
4. Verify all labels are readable

## Notes
- Keep code comments in English or without diacritics
- Only change user-facing strings
- Don't change variable names or code logic
- Test each file after editing

## Expected Result
All text should display properly without ? symbols, even if Czech words look "wrong" (missing diacritics). This is acceptable since the alternative (broken encoding) is worse.
