# ?? Admin Frontend - Backend Integration Guide

## ?? Zmìny v integraci backendu (8.12.2024)

### ? Co bylo provedeno:

1. **Aktualizace API URL**
   - Produkèní backend: `https://backrent-simple-app.wonderfulstone-7bd2a01f.westeurope.azurecontainerapps.io/v1`
   - Lokální vývoj: `http://localhost:8080/v1`

2. **Vylepšení autentizace**
   - Pøidána automatická obnova access tokenu pomocí refresh tokenu
   - Pøi expiraci tokenu se automaticky pokusí o refresh místo odhlášení
   - Lepší error handling pøi selhání autentizace

3. **Dokumentace**
   - Kompletní API dokumentace v `docs/BACKEND_API.md`
   - Pøehled všech endpointù, parametrù a response formátù

## ?? Konfigurace

### Environment Variables

Soubor `.env`:
```env
VITE_API_BASE_URL=https://backrent-simple-app.wonderfulstone-7bd2a01f.westeurope.azurecontainerapps.io/v1
```

Pro lokální vývoj s lokálním backendem:
```env
VITE_API_BASE_URL=http://localhost:8080/v1
```

### Azure Static Web Apps

Pro produkèní deployment na Azure je potøeba nastavit environment variable v Azure Portal:

1. Pøejít do: Azure Portal ? Static Web Apps ? admin-frontend-cashandrive
2. Configuration ? Application settings
3. Pøidat:
   - Name: `VITE_API_BASE_URL`
   - Value: `https://backrent-simple-app.wonderfulstone-7bd2a01f.westeurope.azurecontainerapps.io/v1`

## ?? Autentizace

### Token Storage

Aplikace ukládá následující data do localStorage:
- `token` - Access token (JWT)
- `refreshToken` - Refresh token
- `user` - Informace o uživateli (JSON)

### Token Refresh Flow

1. Pøi každém API requestu se pøidává `Authorization: Bearer <token>` header
2. Pokud backend vrátí 401 (Unauthorized):
   - Automaticky se pokusí obnovit token pomocí `/auth/refresh-tokens`
   - Pokud refresh uspìje, pùvodní request se zopakuje s novým tokenem
   - Pokud refresh selže, uživatel je odhlášen a pøesmìrován na login

### Login Example

```typescript
import { authApi } from '@/api/authApi';

const response = await authApi.login({
  email: 'user@example.com',
  password: 'password123'
});

// Tokeny jsou automaticky uloženy v localStorage
// response.user obsahuje informace o uživateli
// response.tokens.access.token - access token
// response.tokens.refresh.token - refresh token
```

## ?? API Endpoints

Všechny endpointy jsou dokumentovány v `docs/BACKEND_API.md`.

Hlavní moduly:
- **Auth** - `/v1/auth/*` - Autentizace, registrace, reset hesla
- **Users** - `/v1/users/*` - Správa uživatelù
- **Leads** - `/v1/leads/*` - Lead management
- **Leases** - `/v1/leases/*` - Správa pronájmù
- **Customers** - `/v1/customers/*` - Správa zákazníkù
- **Cars** - `/v1/cars/*` - Správa vozidel
- **Dealers** - `/v1/dealers/*` - Správa obchodníkù
- **Stats** - `/v1/stats/*` - Statistiky a reporty
- **Documents** - `/v1/documents/*` - Nahrávání dokumentù
- **Payments** - `/v1/pay/*` - Platební integrace (Stripe)

## ?? Testování API

### Swagger UI
Interaktivní dokumentace:
```
https://backrent-simple-app.wonderfulstone-7bd2a01f.westeurope.azurecontainerapps.io/v1/docs
```

### Health Check
```bash
curl https://backrent-simple-app.wonderfulstone-7bd2a01f.westeurope.azurecontainerapps.io/health
```

### Test Login
```bash
curl -X POST \
  https://backrent-simple-app.wonderfulstone-7bd2a01f.westeurope.azurecontainerapps.io/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

## ?? Deployment

### Lokální vývoj
```bash
# Nainstalovat závislosti
npm install

# Spustit dev server
npm run dev

# Projekt bìží na http://localhost:5173
```

### Production Build
```bash
# Build pro produkci
npm run build

# Preview produkèního buildu
npm run preview
```

### Azure Static Web Apps

Automatický deployment pøes GitHub Actions pøi push do `main` branch.

Workflow soubor: `.github/workflows/azure-static-web-apps-happy-pebble-041ffdb03.yml`

## ?? Troubleshooting

### CORS Error
```
Access to fetch at 'https://backrent-simple-app...' has been blocked by CORS policy
```
**Øešení**: Backend má nakonfigurované CORS pro frontend domény. Kontaktujte backend team pro pøidání nové domény.

### 401 Unauthorized
```
{"code":401,"message":"Please authenticate"}
```
**Øešení**: 
1. Zkontrolujte, že token není expirovaný
2. Zkuste se znovu pøihlásit
3. Zkontrolujte, že API URL je správnì nastaveno

### Connection Refused
```
net::ERR_CONNECTION_REFUSED
```
**Øešení**:
1. Zkontrolujte `VITE_API_BASE_URL` v `.env`
2. Ovìøte, že backend bìží a je dostupný
3. Zkuste health check endpoint

## ?? Kontakt

- **Backend API**: https://backrent-simple-app.wonderfulstone-7bd2a01f.westeurope.azurecontainerapps.io
- **Frontend**: https://happy-pebble-041ffdb03.3.azurestaticapps.net
- **Swagger**: https://backrent-simple-app.wonderfulstone-7bd2a01f.westeurope.azurecontainerapps.io/v1/docs

---

**Poslední aktualizace**: 8.12.2024
