# ?? User Creation & Login Issue - URGENT

**Datum:** 9.12.2024  
**Status:** ? NEØEŠENO - Blokuje produkèní provoz  
**Priority:** CRITICAL

---

## ?? Problém

Backend API vrací **HTTP 500 Internal Server Error** pøi pokusu o:
1. ? Registraci nového uživatele - **FAILS**
2. ? Login existujícího uživatele - **FAILS**

Frontend je **plnì funkèní a pøipravený**, ale **nemùže se pøipojit** kvùli problémùm na backendu.

---

## ?? Tested Requests

### 1. Registration Test

```bash
POST https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1/auth/register

Content-Type: application/json

{
  "email": "maloni@outlook.com",
  "password": "SIkora1976",
  "name": "Rostislav Sikora",
  "social": "none"
}
```

**Response:**
```json
Status: 500 Internal Server Error
{
  "code": 500,
  "message": "Internal Server Error"
}
```

### 2. Login Test

```bash
POST https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1/auth/login

Content-Type: application/json

{
  "email": "maloni@outlook.com",
  "password": "SIkora1976"
}
```

**Response:**
```json
Status: 500 Internal Server Error
{
  "code": 500,
  "message": "Internal Server Error"
}
```

### 3. Backend Health Check

? **Backend bìží** - Health endpoint funguje:
```bash
GET https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/health

Status: 200 OK
{
  "status": "ok",
  "timestamp": "2025-12-09T13:00:16.049Z",
  "uptime": 1381.196100277,
  "environment": "production"
}
```

---

## ?? Analýza

### Co FUNGUJE ?

1. ? Backend API je dostupný (health check OK)
2. ? Frontend je deployen a bìží
3. ? Frontend správnì komunikuje s backendem
4. ? API URL je správnì nakonfigurováno
5. ? CORS není problém (requesty procházejí)
6. ? Network connectivity OK

### Co NEFUNGUJE ?

1. ? `/auth/register` vrací 500
2. ? `/auth/login` vrací 500
3. ? Nelze vytvoøit uživatele
4. ? Nelze se pøihlásit do aplikace

### Pravdìpodobné pøíèiny

1. **Databáze není pøipojená nebo není dostupná**
   - Connection string chybí nebo je neplatný
   - Firewall blokuje pøístup z Container Apps
   - Databáze neexistuje nebo není inicializovaná

2. **Chybí kritické environment variables**
   - `JWT_SECRET` - Pro generování JWT tokenù
   - `JWT_ACCESS_EXPIRATION_MINUTES` - Expiraèní doba access tokenu
   - `JWT_REFRESH_EXPIRATION_DAYS` - Expiraèní doba refresh tokenu
   - `DATABASE_URL` - Connection string k databázi
   - `BCRYPT_ROUNDS` - Pro hashování hesel (výchozí: 10)

3. **Databázové migrace/seed neprobìhly**
   - Tabulky/collections neexistují
   - Schema není aktuální
   - Indexes chybí

4. **Auth service má bug nebo chybí dependencies**
   - bcryptjs není nainstalovaný
   - jsonwebtoken není nainstalovaný
   - Mongoose/Prisma connection error

---

## ?? AKCE PRO BACKEND TEAM - URGENT

### 1. Zkontrolujte LOGY (NEJVYŠŠÍ PRIORITA)

```bash
Azure Portal ? Container Apps ? backrent-itx754fut5nry-app 
? Monitoring ? Log stream
```

**Hledejte:**
- Error stack traces
- Database connection errors
- "Cannot connect to database"
- "JWT_SECRET is not defined"
- "User model not found"
- Jakékoliv error messages pøi POST /auth/register nebo /auth/login

**Pak pošlete logy frontendu!**

### 2. Zkontrolujte Environment Variables

```bash
Azure Portal ? Container Apps ? backrent-itx754fut5nry-app 
? Settings ? Secrets & Environment variables
```

**Required variables:**

| Variable | Example | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `mongodb://...` nebo `postgresql://...` | Connection string |
| `JWT_SECRET` | `your-super-secret-key-min-32-chars` | JWT signing key |
| `JWT_ACCESS_EXPIRATION_MINUTES` | `30` | Access token expiry |
| `JWT_REFRESH_EXPIRATION_DAYS` | `30` | Refresh token expiry |
| `NODE_ENV` | `production` | Environment |

**Zkontrolujte:**
- ? Všechny required variables jsou nastaveny
- ? DATABASE_URL je validní connection string
- ? JWT_SECRET má minimálnì 32 znakù
- ? Žádné typy nebo extra spaces v hodnotách

### 3. Testujte Databázové Pøipojení

#### Možnost A: Z Azure Portal

```bash
Azure Portal ? Container Apps ? backrent-itx754fut5nry-app 
? Console

# Pro MongoDB
mongosh "$DATABASE_URL"

# Pro PostgreSQL
psql "$DATABASE_URL"
```

#### Možnost B: Z lokálního prostøedí

```bash
# Získejte DATABASE_URL z Azure
# Zkuste se pøipojit lokálnì

# MongoDB
mongosh "mongodb://..."

# PostgreSQL
psql "postgresql://..."
```

**Pokud pøipojení selže:**
- ? Zkontrolujte firewall rules
- ? Povolte pøístup z Azure Container Apps subnet
- ? Ovìøte credentials v connection string

### 4. Zkontrolujte Databázový Stav

```sql
-- PostgreSQL
\dt  -- List tables
SELECT * FROM users LIMIT 1;

-- MongoDB
show collections
db.users.findOne()
```

**Pokud tabulky/collections neexistují:**
- ? Spuste migrace: `npm run migrate` nebo `npx prisma migrate deploy`
- ? Nebo vytvoøte schema ruènì

### 5. Vytvoøte Prvního Uživatele RUÈNÌ

Pokud je problém pouze s auth endpointem, vytvoøte uživatele pøímo v databázi:

#### MongoDB:

```javascript
// Pøipojte se k databázi a spuste:
const bcrypt = require('bcryptjs');

// Vygenerujte hash hesla
const password = 'SIkora1976';
const hashedPassword = bcrypt.hashSync(password, 10);
console.log('Hashed password:', hashedPassword);

// Vložte uživatele
db.users.insertOne({
  email: "maloni@outlook.com",
  password: hashedPassword,  // Použijte hash z pøedchozího kroku
  name: "Rostislav Sikora",
  role: "ADMIN",
  social: "none",
  isEmailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
});
```

#### PostgreSQL:

```sql
-- Vygenerujte bcrypt hash hesla "SIkora1976" online: https://bcrypt-generator.com/
-- Nebo použijte Node.js:
-- const bcrypt = require('bcryptjs'); 
-- console.log(bcrypt.hashSync('SIkora1976', 10));

INSERT INTO users (
  email, 
  password, 
  name, 
  role, 
  social, 
  is_email_verified, 
  created_at, 
  updated_at
)
VALUES (
  'maloni@outlook.com',
  '$2a$10$YOUR_GENERATED_HASH_HERE',  -- Nahraïte skuteèným hashem
  'Rostislav Sikora',
  'ADMIN',
  'none',
  true,
  NOW(),
  NOW()
);
```

#### Bcrypt Hash Generator (Online)

1. Jdìte na: https://bcrypt-generator.com/
2. Zadejte heslo: `SIkora1976`
3. Použijte výchozí rounds: 10
4. Zkopírujte vygenerovaný hash
5. Použijte ho v SQL/MongoDB insert pøíkazu výše

### 6. Alternativa - Seed Script v Backendu

Vytvoøte seed script v backendu:

```javascript
// scripts/seed-admin.js
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
// nebo pro Prisma: const { PrismaClient } = require('@prisma/client');

async function seedAdmin() {
  try {
    // Pøipojte se k databázi
    await mongoose.connect(process.env.DATABASE_URL);
    
    // Získejte User model
    const User = require('../src/models/user.model');
    
    // Vytvoøte hash hesla
    const hashedPassword = await bcrypt.hash('SIkora1976', 10);
    
    // Zkontrolujte, jestli uživatel už neexistuje
    const existingUser = await User.findOne({ email: 'maloni@outlook.com' });
    if (existingUser) {
      console.log('? User already exists');
      process.exit(0);
    }
    
    // Vytvoøte admin uživatele
    const admin = await User.create({
      email: 'maloni@outlook.com',
      password: hashedPassword,
      name: 'Rostislav Sikora',
      role: 'ADMIN',
      social: 'none',
      isEmailVerified: true
    });
    
    console.log('? Admin user created successfully!');
    console.log('Email:', admin.email);
    console.log('Role:', admin.role);
    
    process.exit(0);
  } catch (error) {
    console.error('? Error creating admin user:', error);
    process.exit(1);
  }
}

seedAdmin();
```

**Spuste:**
```bash
# Z Azure Container Apps Console nebo lokálnì
node scripts/seed-admin.js
```

### 7. Debug Mode - Zapnìte Detailní Logging

Pøidejte do backendu:

```javascript
// src/middlewares/errorHandler.js
app.use((err, req, res, next) => {
  console.error('? ERROR:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body
  });
  
  res.status(err.statusCode || 500).json({
    code: err.statusCode || 500,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : err.message,  // V debug módu ukažte konkrétní error
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});
```

**Temporarily** zmìòte `NODE_ENV` na `development` pro detailnìjší error messages.

---

## ?? Checklist pro Backend Team

- [ ] Zkontrolovány LOGY v Azure Container Apps
- [ ] Ovìøeny všechny environment variables
- [ ] Otestováno databázové pøipojení
- [ ] Zkontrolován stav databáze (tables/collections)
- [ ] Spuštìny migrace (pokud potøeba)
- [ ] Vytvoøen první admin uživatel (ruènì nebo seed scriptem)
- [ ] Otestován login endpoint po vytvoøení uživatele
- [ ] Zaslán screenshot/log konkrétní error message frontendu

---

## ?? Po Vyøešení - Testovací Checklist

Po vyøešení problému otestujte:

### 1. Login Test

```bash
curl -X POST "https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "maloni@outlook.com",
    "password": "SIkora1976"
  }'
```

**Expected Response:**
```json
{
  "user": {
    "id": "...",
    "email": "maloni@outlook.com",
    "name": "Rostislav Sikora",
    "role": "ADMIN"
  },
  "tokens": {
    "access": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires": "2025-12-09T14:30:00.000Z"
    },
    "refresh": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires": "2026-01-08T13:30:00.000Z"
    }
  }
}
```

### 2. Frontend Login Test

1. Otevøete: https://happy-pebble-041ffdb03.3.azurestaticapps.io/login
2. Pøihlaste se:
   - Email: `maloni@outlook.com`
   - Password: `SIkora1976`
3. Mìlo by pøesmìrovat na dashboard

### 3. Token Refresh Test

```bash
curl -X POST "https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1/auth/refresh-tokens" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

---

## ?? Kontakt

### Frontend Team

- **Email:** maloni@outlook.com
- **Frontend URL:** https://happy-pebble-041ffdb03.3.azurestaticapps.io
- **Repository:** https://github.com/malonitest/admin-frontend

### Backend Team

- **Repository:** https://github.com/malonitest/car-backrent-api-test
- **Branch:** `develop`
- **API Docs:** https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1/docs

---

## ?? Timeline

| Datum | Èas | Akce | Status |
|-------|-----|------|--------|
| 9.12.2024 | 12:00 | Frontend deployment dokonèen | ? |
| 9.12.2024 | 12:30 | Objevení HTTP 500 pøi registraci | ? |
| 9.12.2024 | 13:00 | Objevení HTTP 500 pøi loginu | ? |
| 9.12.2024 | 13:30 | Dokumentace problému vytvoøena | ? |
| 9.12.2024 | 14:00 | Issue eskalován na backend team | ? |

---

## ?? Expected Resolution

Po vyøešení problému:

1. ? Login endpoint vrací 200 OK s tokeny
2. ? Frontend umožòuje pøihlášení
3. ? Token refresh funguje
4. ? Dashboard se naète

**Odhadovaný èas øešení:** 1-2 hodiny (pokud je to config issue)

---

**PROSÍM PRIORITIZUJTE - Frontend team èeká na vyøešení pro dokonèení integrace!** ??

---

**API Documentation:** https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1/docs  
**Health Check:** https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/health
