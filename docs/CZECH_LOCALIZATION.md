# Èeská Lokalizace - Guidelines

## ? Kompletní implementace èeské diakritiky

### ?? Provedené zmìny (10.12.2024)

#### 1. **Globální CSS styly**
- Inter font nastaven jako výchozí pro všechny elementy
- Font-face s `latin-ext` subsety pro plnou podporu èeské diakritiky
- Explicitní nastavení pro SVG elementy (grafy Recharts)
- Optimalizace renderování textu (`text-rendering`, `font-feature-settings`)

#### 2. **HTML Meta tagy**
- `charset=UTF-8` - explicitní UTF-8 encoding
- `Content-Type` header s UTF-8
- `Content-Language: cs` - oznaèení èeštiny jako primárního jazyka
- `lang="cs"` na `<html>` elementu

#### 3. **Font Stack**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 
             'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 
             'Droid Sans', 'Helvetica Neue', sans-serif;
```

### ?? Checklist pro nové komponenty

Pøi vytváøení nových komponent vždy:

? Používejte pouze èeské texty s diakritikou
? Testujte zobrazení ve všech prohlížeèích
? Zkontrolujte font v grafech a tabulkách
? Ovìøte mobile zobrazení

### ?? Èasto používaná èeská slova s diakritikou

| Bez diakritiky | S diakritikou | Použití |
|----------------|---------------|---------|
| Mesic | Mìsíc | Èasové období |
| Prumerna | Prùmìrná | Statistiky |
| Naklady | Náklady | Finance |
| Prijmy | Pøíjmy | Finance |
| Zisk | Zisk | ? OK |
| Celkem | Celkem | ? OK |
| Pocet | Poèet | Statistiky |
| Nalez | Nález | - |
| Najezd | Nájezd | Auta |
| Znacka | Znaèka | Auta |
| Odhadovana | Odhadovaná | Hodnoty |
| Technik | Technik | ? OK |
| Schvaleno | Schváleno | Workflow |
| Zamitnuto | Zamítnuto | Workflow |
| Financni | Finanèní | Finance |

### ?? Správné zobrazení v grafech (Recharts)

Grafy automaticky používají Inter font díky CSS pravidlu:
```css
text,
tspan,
.recharts-text,
.recharts-cartesian-axis-tick {
  font-family: 'Inter', ... !important;
}
```

### ?? Testování

```bash
# Build pro ovìøení
npm run build

# Ovìøení v prohlížeèi
npm run preview
```

### ?? Pøíklady správného použití

**? SPRÁVNÌ:**
```tsx
<h1>Statistiky aut</h1>
<p>Prùmìrná cena</p>
<span>Celková hodnota odkupu</span>
<button>Filtrovat</button>
```

**? ŠPATNÌ:**
```tsx
<h1>Statistiky aut</h1> // chybí haèky
<p>Prumerna cena</p> // mìlo by být "Prùmìrná"
<span>Celkova hodnota odkupu</span> // mìlo by být "Celková"
<button>Filtrovat</button> // OK
```

### ?? Browser Support

Testováno a funkèní na:
- ? Chrome/Edge (Chromium)
- ? Firefox
- ? Safari
- ? Mobile browsers (iOS Safari, Chrome Mobile)

### ?? Troubleshooting

**Problém:** Diakritika se nezobrazuje správnì
**Øešení:**
1. Zkontrolujte, že soubor je uložen v UTF-8
2. Ovìøte, že Inter font je naèten (DevTools ? Network)
3. Zkontrolujte CSS cascade (mùže být pøepsán jiným pravidlem)

**Problém:** Fonty v grafech jsou jiné
**Øešení:**
1. Ovìøte, že `src/index.css` obsahuje pravidla pro `.recharts-*`
2. Použijte `!important` pokud je nutné pøepsat inline styles

### ?? Reference

- Inter Font: https://fonts.google.com/specimen/Inter
- Unicode Latin Extended: https://en.wikipedia.org/wiki/Latin_Extended-A
- Czech Typography: https://www.pravidla.cz/

---

**Poslední aktualizace:** 10.12.2024
**Status:** ? Plnì implementováno
