# ?? User Creation Guide

## Problem

Backend API vrací **HTTP 500 Internal Server Error** pøi pokusu o registraci uivatele.

## Tested Request

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
```
Status: 500 Internal Server Error
{
  "code": 500,
  "message": "Internal Server Error"
}
```

## Backend Health Check

? Backend health endpoint funguje:
```
GET /health
Status: 200 OK
```

## Moné pøíèiny

1. **Databáze není pøipojená**
   - Zkontrolujte `DATABASE_URL` environment variable
   - Zkontrolujte connection string k MongoDB/PostgreSQL

2. **Chybí environment variables**
   - `JWT_SECRET`
   - `JWT_ACCESS_EXPIRATION_MINUTES`
   - `JWT_REFRESH_EXPIRATION_DAYS`
   - `DATABASE_URL`
   - `SMTP_*` (pokud je required pro email verification)

3. **Databázové migrace neprobìhly**
   - Zkontrolujte, jestli jsou vytvoøené tabulky/collections
   - Spuste migrace

## Kroky pro backend team

### 1. Zkontrolujte logy v Azure

```bash
Azure Portal ? Container Apps ? backrent-itx754fut5nry-app ? Monitoring ? Log stream
```

Mìli byste vidìt konkrétní error message.

### 2. Zkontrolujte Environment Variables

```bash
Azure Portal ? Container Apps ? backrent-itx754fut5nry-app ? Settings ? Environment variables
```

Ujistìte se, e jsou nastaveny všechny required variables.

### 3. Zkontrolujte databázové pøipojení

Zkuste se pøipojit k databázi z kontejneru:

```bash
# Pro MongoDB
mongosh "mongodb://..."

# Pro PostgreSQL
psql "postgresql://..."
```

### 4. Vytvoøte prvního admin uivatele ruènì

Pokud je problém pouze s registraèním endpointem, vytvoøte uivatele pøímo v databázi:

#### MongoDB:
```javascript
db.users.insertOne({
  email: "maloni@outlook.com",
  password: "$2a$10$...", // bcrypt hash hesla "SIkora1976"
  name: "Rostislav Sikora",
  role: "ADMIN",
  social: "none",
  isEmailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

#### PostgreSQL:
```sql
INSERT INTO users (email, password, name, role, social, is_email_verified, created_at, updated_at)
VALUES (
  'maloni@outlook.com',
  '$2a$10$...', -- bcrypt hash hesla "SIkora1976"
  'Rostislav Sikora',
  'ADMIN',
  'none',
  true,
  NOW(),
  NOW()
);
```

### 5. Alternativní øešení - Seed Script

Vytvoøte seed script v backendu:

```javascript
// scripts/seed-admin.js
const bcrypt = require('bcryptjs');
const { User } = require('../src/models');

async function createAdmin() {
  const hashedPassword = await bcrypt.hash('SIkora1976', 10);
  
  const admin = await User.create({
    email: 'maloni@outlook.com',
    password: hashedPassword,
    name: 'Rostislav Sikora',
    role: 'ADMIN',
    social: 'none',
    isEmailVerified: true
  });
  
  console.log('Admin user created:', admin.email);
}

createAdmin();
```

Spuste:
```bash
node scripts/seed-admin.js
```

## Po vyøešení

Po vytvoøení uivatele (jakımkoliv zpùsobem) by mìlo fungovat pøihlášení:

**Frontend URL:** https://happy-pebble-041ffdb03.3.azurestaticapps.net/login

**Credentials:**
- Email: `maloni@outlook.com`
- Password: `SIkora1976`

---

## Contact

Pokud potøebujete pomoc s debugging, kontaktujte frontend team.

**API Documentation:** https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1/docs
