# Car Statistics Report - Frontend Documentation

## ? READY TO IMPLEMENT

**Status:**
- ? Backend implementován
- ? Endpoint `/v1/stats/car-stats` pøipraven
- ? **PØIPRAVENO K TESTOVÁNÍ A NASAZENÍ**

**Production URL:**
```
https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1
```

---

## Endpoint

**URL:** `GET /v1/stats/car-stats`  
**Full Endpoint:** `https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1/stats/car-stats`  
**Auth:** Required (Bearer token)  
**Permission:** `getStats`

## Popis

Tento endpoint poskytuje **kompletní pøehled o autech v systému** s možností filtrování. Zobrazuje:
- ?? Seznam všech konvertovaných aut
- ?? Odkupní cenu a odhadovanou hodnotu
- ?? Detaily vozidel (znaèka, model, rok, nájezd)
- ?? Statistiky podle znaèky, roku výroby a nájezdu
- ?? Možnost filtrování podle data, znaèky, modelu, roku a km

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `period` | string | No | Pre-defined period: `day`, `week`, `month` (default), `year` |
| `dateFrom` | string | No | Custom start date (ISO format: `2024-01-01`) |
| `dateTo` | string | No | Custom end date (ISO format: `2024-01-31`) |
| `brand` | string | No | Filter by car brand (partial match, case-insensitive) |
| `model` | string | No | Filter by car model (partial match, case-insensitive) |
| `yearFrom` | number | No | Filter by year from (e.g., 2015) |
| `yearTo` | number | No | Filter by year to (e.g., 2023) |
| `mileageFrom` | number | No | Filter by mileage from (km) |
| `mileageTo` | number | No | Filter by mileage to (km) |

**Note:** If `dateFrom` and `dateTo` are provided, they override the `period` parameter.

## Response Format

```typescript
interface ICarStatsItem {
  carId: string;                     // MongoDB ID auta
  leadId?: string;                   // MongoDB ID leadu (pokud existuje)
  leaseId?: string;                  // MongoDB ID lease (pokud existuje)
  customerName: string;              // Jméno zákazníka
  customerPhone: string;             // Telefon zákazníka
  carBrand: string;                  // Znaèka auta
  carModel: string;                  // Model auta
  carVIN: string;                    // VIN èíslo vozidla
  carSPZ: string;                    // SPZ (registraèní znaèka)
  carYear: number;                   // Rok výroby
  carMileage: number;                // Poèet najetých km
  purchasePrice: number;             // Odkupní cena (Kè)
  estimatedValue: number;            // Odhadovaná hodnota (Kè)
  convertedDate: Date;               // Datum konverze
  currentStatus: string;             // Aktuální status auta
  hasPhotos: boolean;                // Má fotky?
  hasDocuments: boolean;             // Má dokumenty?
  monthlyPayment?: number;           // Mìsíèní splátka (pokud lease)
  leaseDuration?: number;            // Délka leasingu v mìsících
  notes: string;                     // Poznámky k autu
}

interface ICarStats {
  totalCars: number;                 // Celkem aut v systému
  totalPurchaseValue: number;        // Celková odkupní hodnota (Kè)
  totalEstimatedValue: number;       // Celková odhadovaná hodnota (Kè)
  averagePurchasePrice: number;      // Prùmìrná odkupní cena
  averageEstimatedValue: number;     // Prùmìrná odhadovaná hodnota
  averageMileage: number;            // Prùmìrný nájezd (km)
  averageAge: number;                // Prùmìrné stáøí vozidel (roky)
}

interface ICarStatsReportData {
  dateFrom: Date;                    // Filtr od data
  dateTo: Date;                      // Filtr do data
  stats: ICarStats;                  // Souhrnné statistiky
  cars: ICarStatsItem[];             // Seznam aut
  byBrand: Array<{                   // Statistika podle znaèky
    brand: string;                   // Znaèka
    count: number;                   // Poèet aut
    totalValue: number;              // Celková hodnota
    avgPrice: number;                // Prùmìrná cena
    percentage: number;              // Procento z celku
  }>;
  byYear: Array<{                    // Statistika podle roku výroby
    year: number;                    // Rok výroby
    count: number;                   // Poèet aut
    avgMileage: number;              // Prùmìrný nájezd
    avgPrice: number;                // Prùmìrná cena
  }>;
  byMileageRange: Array<{            // Statistika podle nájezdu
    range: string;                   // Rozsah (0-50k, 50-100k, atd.)
    count: number;                   // Poèet aut
    percentage: number;              // Procento
  }>;
}
```

## Example Response

```json
{
  "dateFrom": "2024-01-01T00:00:00.000Z",
  "dateTo": "2024-12-31T23:59:59.999Z",
  "stats": {
    "totalCars": 125,
    "totalPurchaseValue": 18750000,
    "totalEstimatedValue": 21500000,
    "averagePurchasePrice": 150000,
    "averageEstimatedValue": 172000,
    "averageMileage": 95000,
    "averageAge": 5.2
  },
  "cars": [
    {
      "carId": "60d0fe4f5311236168a109ca",
      "leaseId": "60d0fe4f5311236168a109db",
      "customerName": "Jan Novák",
      "customerPhone": "+420 777 123 456",
      "carBrand": "Škoda",
      "carModel": "Octavia 2.0 TDI",
      "carVIN": "TMBJJ7NE8J0123456",
      "carSPZ": "1AB 2345",
      "carYear": 2018,
      "carMileage": 125000,
      "purchasePrice": 180000,
      "estimatedValue": 220000,
      "convertedDate": "2024-03-15T10:00:00.000Z",
      "currentStatus": "ACTIVE",
      "hasPhotos": true,
      "hasDocuments": true,
      "monthlyPayment": 5000,
      "leaseDuration": 36,
      "notes": "Vozidlo v dobrém stavu, servisní kniha kompletní"
    },
    {
      "carId": "60d0fe4f5311236168a109cb",
      "leaseId": "60d0fe4f5311236168a109dc",
      "customerName": "Marie Svobodová",
      "customerPhone": "+420 603 987 654",
      "carBrand": "Volkswagen",
      "carModel": "Passat Combi",
      "carVIN": "WVWZZZ3CZKE123456",
      "carSPZ": "2CD 6789",
      "carYear": 2019,
      "carMileage": 95000,
      "purchasePrice": 250000,
      "estimatedValue": 280000,
      "convertedDate": "2024-04-20T14:30:00.000Z",
      "currentStatus": "ACTIVE",
      "hasPhotos": true,
      "hasDocuments": true,
      "monthlyPayment": 6500,
      "leaseDuration": 48,
      "notes": "Pravidelný servis, bez nehod"
    }
  ],
  "byBrand": [
    {
      "brand": "Škoda",
      "count": 45,
      "totalValue": 7200000,
      "avgPrice": 160000,
      "percentage": 36.0
    },
    {
      "brand": "Volkswagen",
      "count": 32,
      "totalValue": 5800000,
      "avgPrice": 181250,
      "percentage": 25.6
    },
    {
      "brand": "BMW",
      "count": 18,
      "totalValue": 4500000,
      "avgPrice": 250000,
      "percentage": 14.4
    },
    {
      "brand": "Audi",
      "count": 15,
      "totalValue": 3900000,
      "avgPrice": 260000,
      "percentage": 12.0
    },
    {
      "brand": "Ostatní",
      "count": 15,
      "totalValue": 2100000,
      "avgPrice": 140000,
      "percentage": 12.0
    }
  ],
  "byYear": [
    {
      "year": 2022,
      "count": 8,
      "avgMileage": 35000,
      "avgPrice": 320000
    },
    {
      "year": 2021,
      "count": 15,
      "avgMileage": 55000,
      "avgPrice": 280000
    },
    {
      "year": 2020,
      "count": 22,
      "avgMileage": 75000,
      "avgPrice": 240000
    },
    {
      "year": 2019,
      "count": 28,
      "avgMileage": 95000,
      "avgPrice": 200000
    },
    {
      "year": 2018,
      "count": 25,
      "avgMileage": 115000,
      "avgPrice": 160000
    },
    {
      "year": 2017,
      "count": 18,
      "avgMileage": 135000,
      "avgPrice": 130000
    },
    {
      "year": 2016,
      "count": 9,
      "avgMileage": 155000,
      "avgPrice": 100000
    }
  ],
  "byMileageRange": [
    {
      "range": "0-50k",
      "count": 15,
      "percentage": 12.0
    },
    {
      "range": "50-100k",
      "count": 45,
      "percentage": 36.0
    },
    {
      "range": "100-150k",
      "count": 38,
      "percentage": 30.4
    },
    {
      "range": "150-200k",
      "count": 20,
      "percentage": 16.0
    },
    {
      "range": "200k+",
      "count": 7,
      "percentage": 5.6
    }
  ]
}
```

## Usage Examples

### Get current month cars:
```javascript
const response = await fetch('/v1/stats/car-stats', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
```

### Get cars for specific date range:
```javascript
const response = await fetch(
  '/v1/stats/car-stats?dateFrom=2024-01-01&dateTo=2024-12-31',
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);
const data = await response.json();
```

### Filter by brand and year:
```javascript
const response = await fetch(
  '/v1/stats/car-stats?brand=Škoda&yearFrom=2018&yearTo=2022',
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);
const data = await response.json();
```

### Filter by mileage range:
```javascript
const response = await fetch(
  '/v1/stats/car-stats?mileageFrom=50000&mileageTo=150000',
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);
const data = await response.json();
```

## Frontend Implementation Examples

### React Component Example

```typescript
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface CarStatsData {
  dateFrom: Date;
  dateTo: Date;
  stats: {
    totalCars: number;
    totalPurchaseValue: number;
    totalEstimatedValue: number;
    averagePurchasePrice: number;
    averageEstimatedValue: number;
    averageMileage: number;
    averageAge: number;
  };
  cars: Array<{
    carId: string;
    customerName: string;
    customerPhone: string;
    carBrand: string;
    carModel: string;
    carVIN: string;
    carSPZ: string;
    carYear: number;
    carMileage: number;
    purchasePrice: number;
    estimatedValue: number;
    convertedDate: Date;
    hasPhotos: boolean;
    hasDocuments: boolean;
    monthlyPayment?: number;
    notes: string;
  }>;
  byBrand: Array<{
    brand: string;
    count: number;
    totalValue: number;
    avgPrice: number;
    percentage: number;
  }>;
  byYear: Array<{
    year: number;
    count: number;
    avgMileage: number;
    avgPrice: number;
  }>;
  byMileageRange: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
}

const CarStatsReport: React.FC<{ token: string }> = ({ token }) => {
  const [data, setData] = useState<CarStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    period: 'month',
    brand: '',
    yearFrom: '',
    yearTo: '',
    mileageFrom: '',
    mileageTo: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.period) params.append('period', filters.period);
      if (filters.brand) params.append('brand', filters.brand);
      if (filters.yearFrom) params.append('yearFrom', filters.yearFrom);
      if (filters.yearTo) params.append('yearTo', filters.yearTo);
      if (filters.mileageFrom) params.append('mileageFrom', filters.mileageFrom);
      if (filters.mileageTo) params.append('mileageTo', filters.mileageTo);

      const response = await axios.get(
        `https://backrent-api-prod.azurewebsites.net/v1/stats/car-stats?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setData(response.data);
    } catch (error) {
      console.error('Error fetching car stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters.period]);

  if (loading) return <div>Naèítám...</div>;
  if (!data) return <div>Žádná data</div>;

  return (
    <div className="car-stats-report">
      <header>
        <h1>Statistiky Aut</h1>
        
        {/* Filters */}
        <div className="filters">
          <select 
            value={filters.period} 
            onChange={(e) => setFilters({...filters, period: e.target.value})}
          >
            <option value="day">Dnes</option>
            <option value="week">Tento týden</option>
            <option value="month">Tento mìsíc</option>
            <option value="year">Tento rok</option>
          </select>

          <input
            type="text"
            placeholder="Znaèka (napø. Škoda)"
            value={filters.brand}
            onChange={(e) => setFilters({...filters, brand: e.target.value})}
          />

          <input
            type="number"
            placeholder="Rok od"
            value={filters.yearFrom}
            onChange={(e) => setFilters({...filters, yearFrom: e.target.value})}
          />

          <input
            type="number"
            placeholder="Rok do"
            value={filters.yearTo}
            onChange={(e) => setFilters({...filters, yearTo: e.target.value})}
          />

          <button onClick={fetchData}>Filtrovat</button>
        </div>
      </header>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <StatCard
          title="Celkem aut"
          value={data.stats.totalCars}
          icon="??"
        />
        <StatCard
          title="Celková hodnota odkupu"
          value={`${data.stats.totalPurchaseValue.toLocaleString('cs-CZ')} Kè`}
          icon="??"
        />
        <StatCard
          title="Prùmìrná cena"
          value={`${data.stats.averagePurchasePrice.toLocaleString('cs-CZ')} Kè`}
          icon="??"
        />
        <StatCard
          title="Prùmìrný nájezd"
          value={`${data.stats.averageMileage.toLocaleString('cs-CZ')} km`}
          icon="??"
        />
        <StatCard
          title="Prùmìrné stáøí"
          value={`${data.stats.averageAge} let`}
          icon="?"
        />
      </div>

      {/* Brand Distribution Chart */}
      <div className="brand-stats">
        <h2>Rozložení podle znaèky</h2>
        <BarChart data={data.byBrand} />
      </div>

      {/* Year Distribution Chart */}
      <div className="year-stats">
        <h2>Rozložení podle roku výroby</h2>
        <LineChart data={data.byYear} />
      </div>

      {/* Mileage Distribution Chart */}
      <div className="mileage-stats">
        <h2>Rozložení podle nájezdu</h2>
        <PieChart data={data.byMileageRange} />
      </div>

      {/* Cars Table */}
      <div className="cars-table">
        <h2>Seznam aut ({data.cars.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Znaèka & Model</th>
              <th>Rok</th>
              <th>Nájezd</th>
              <th>SPZ</th>
              <th>VIN</th>
              <th>Odkupní cena</th>
              <th>Odhad. hodnota</th>
              <th>Zákazník</th>
              <th>Datum</th>
              <th>Foto</th>
              <th>Dok.</th>
            </tr>
          </thead>
          <tbody>
            {data.cars.map((car) => (
              <tr key={car.carId}>
                <td>
                  <div className="car-name">
                    {car.carBrand} {car.carModel}
                  </div>
                </td>
                <td>{car.carYear}</td>
                <td>{car.carMileage.toLocaleString('cs-CZ')} km</td>
                <td>{car.carSPZ}</td>
                <td className="vin">{car.carVIN}</td>
                <td className="price">
                  {car.purchasePrice.toLocaleString('cs-CZ')} Kè
                </td>
                <td className="price">
                  {car.estimatedValue.toLocaleString('cs-CZ')} Kè
                </td>
                <td>
                  <div>{car.customerName}</div>
                  <div className="phone">{car.customerPhone}</div>
                </td>
                <td>{new Date(car.convertedDate).toLocaleDateString('cs-CZ')}</td>
                <td>
                  {car.hasPhotos ? '?' : '?'}
                </td>
                <td>
                  {car.hasDocuments ? '?' : '?'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Helper Components
const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon?: string;
}> = ({ title, value, icon }) => (
  <div className="stat-card">
    {icon && <div className="icon">{icon}</div>}
    <h3>{title}</h3>
    <div className="value">{value}</div>
  </div>
);

export default CarStatsReport;
```

## CSS Styling Examples

```css
/* Statistics Cards */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
}

.stat-card .icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.stat-card h3 {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.stat-card .value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #111827;
}

/* Filters */
.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.filters input,
.filters select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

.filters button {
  padding: 0.5rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.filters button:hover {
  background: #2563eb;
}

/* Table */
.cars-table {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow-x: auto;
}

.cars-table table {
  width: 100%;
  border-collapse: collapse;
}

.cars-table th {
  background: #f9fafb;
  padding: 0.75rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  border-bottom: 2px solid #e5e7eb;
}

.cars-table td {
  padding: 1rem 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;
}

.cars-table .vin {
  font-family: monospace;
  font-size: 0.75rem;
  color: #6b7280;
}

.cars-table .price {
  font-weight: 600;
  color: #059669;
}

.cars-table .phone {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.cars-table tr:hover {
  background: #f9fafb;
}
```

## Permission Requirements

User must have the `getStats` permission. This is typically granted to:
- ? `ADMIN`
- ? `FINANCE_DIRECTOR`
- ? `SUPERVISOR`

---

**Production URL**: `https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1/stats/car-stats`  
**API Version**: v1  
**Last Updated**: 2024
