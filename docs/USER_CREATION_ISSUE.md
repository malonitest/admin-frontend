# ? User Creation & Login Issue - VYØEŠENO!

**Datum:** 9.12.2024  
**Status:** ? **VYØEŠENO** - API plnì funkèní  
**Vyøešeno:** 9.12.2024 14:15  
**Trvalo:** ~1.5 hodiny

---

## ?? PROBLÉM VYØEŠEN!

Backend API je **plnì funkèní** a pøipravený k použití!

### ? Co funguje

1. ? **Registration endpoint** - HTTP 201 Created
2. ? **Login endpoint** - HTTP 200 OK + Tokens
3. ? **Token Refresh** - Funguje
4. ? **Health Check** - OK

---

## ?? Testovací Pøihlašovací Údaje

```
Email: maloni@outlook.com
Password: SIkora1976
Role: CUSTOMER
User ID: 69382e4818c06603d21fd095
```

**?? Poznámka:** Role je `CUSTOMER`. Pro ADMIN pøístup je potøeba zmìnit v databázi.

---

## ??? Co bylo opraveno

### Root Cause
Backend API vracelo HTTP 500 kvùli **Mongoose validation error**:
- Problém: `role: 'customer' is not a valid enum value`
- Oèekáváno: Uppercase enum hodnoty (`CUSTOMER`, `ADMIN`, atd.)

### Øešení
1. Opraveno v `src/modules/user/user.model.ts`
2. Zmìna: `default: 'customer'` ? `default: 'CUSTOMER'`
3. Docker image rebuilden a redeployen
4. Testy probìhly úspìšnì ?

---

## ?? Jak zmìnit roli na ADMIN

### MongoDB pøíkaz:

```javascript
db.users.updateOne(
  { email: "maloni@outlook.com" },
  { $set: { role: "ADMIN" } }
)
```

### Nebo Azure Portal:
1. Cosmos DB ? Data Explorer
2. Database: `backrent` ? Collection: `users`
3. Najít user s emailem `maloni@outlook.com`
4. Edit ? Zmìnit `role: "CUSTOMER"` na `role: "ADMIN"`
5. Save

---

## ?? Frontend Integration - Quick Start

### 1. Login Test (Okamžitì dostupné!)

```javascript
const response = await fetch(
  'https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1/auth/login',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'maloni@outlook.com',
      password: 'SIkora1976'
    })
  }
);

const { user, tokens } = await response.json();
// Status: 200 OK ?
// tokens.access.token - Use for authenticated requests
// tokens.refresh.token - Use to refresh access token
```

### 2. Registration (Nový uživatel)

```javascript
const response = await fetch(
  'https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1/auth/register',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      name: 'New User',
      social: 'none'  // ? REQUIRED field!
    })
  }
);

const { user, tokens } = await response.json();
// Status: 201 Created ?
// user.role: "CUSTOMER" (default)
```

### 3. Authenticated Request

```javascript
const accessToken = localStorage.getItem('accessToken');

const response = await fetch(
  'https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1/leads?page=1&limit=10',
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  }
);

const data = await response.json();
```

---

## ?? DÙLEŽITÉ - Field Requirements

### Registration Payload

? **Required fields**:
- `email` (string, email format)
- `password` (string, min 8 chars)
- `name` (string)
- `social` (string, one of: `'none'`, `'facebook'`, `'google'`, `'apple'`)

? **NOT allowed**:
- `role` - Nastaveno automaticky backendem
- `isEmailVerified` - Nastaveno automaticky
- `id` - Generováno automaticky

---

## ?? Testovací Checklist

### Backend (Hotovo ?)
- [x] ? Health endpoint works
- [x] ? Registration works
- [x] ? Login works
- [x] ? Token generation works
- [x] ? Database connection works

### Frontend (K implementaci)
- [ ] ? Test login na frontendu
- [ ] ? Implementovat token storage
- [ ] ? Implementovat token refresh
- [ ] ? Test authenticated requests
- [ ] ? Error handling
- [ ] ? Role-based access control

---

## ?? Response Format

### Successful Login (200 OK):

```json
{
  "user": {
    "id": "69382e4818c06603d21fd095",
    "email": "maloni@outlook.com",
    "name": "Rostislav Sikora",
    "role": "CUSTOMER"
  },
  "tokens": {
    "access": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires": "2025-12-09T14:43:36.000Z"
    },
    "refresh": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires": "2026-01-08T13:43:36.000Z"
    }
  }
}
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
| 9.12.2024 | 14:15 | **Problém vyøešen backendem** | ? |
| 9.12.2024 | 14:30 | Frontend ready pro testování | ? |

---

## ?? Next Steps

1. **? Otestovat login na frontendu**
   - URL: https://happy-pebble-041ffdb03.3.azurestaticapps.io/login
   - Email: maloni@outlook.com
   - Password: SIkora1976

2. **? Požádat backend team o zmìnu role na ADMIN**
   - Pro plný pøístup k admin funkcím

3. **? Dokonèit implementaci**
   - Token storage
   - Token refresh
   - Error handling

---

## ?? SUCCESS!

**Problem**: FIXED ?  
**Status**: PRODUCTION READY ?  
**Frontend**: CAN USE NOW ?

---

**API Documentation:** https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1/docs  
**Health Check:** https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/health

**MÙŽETE SE PØIHLÁSIT!** ??
