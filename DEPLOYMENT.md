# ?? Deployment Notes - Backend Migration

**Datum**: 9.12.2024  
**Verze**: 1.2.0

## ? Provedené zmìny

### 1. **Nový Backend URL**
Aplikace nyní používá nový Azure Container Apps backend:
```
https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1
```

### 2. **Vylepšená Autentizace**
- ? Automatický refresh access tokenu
- ? Lepší error handling pøi 401 chybách
- ? Zachování uživatelské session pøi expiraci tokenu

### 3. **Dokumentace**
- ? `docs/BACKEND_API.md` - Kompletní API reference
- ? `docs/BACKEND_INTEGRATION.md` - Integration guide

## ?? Azure Static Web Apps - Konfigurace

### Environment Variables (Production)

Pøidat v Azure Portal ? Static Web Apps ? Configuration:

```
VITE_API_BASE_URL=https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1
```

### Deployment Steps

1. Push zmìn do `main` branch
2. GitHub Actions automaticky spustí deployment
3. Po deployment zkontrolovat:
   - ? Login funkcionalita
   - ? API komunikace
   - ? Token refresh

## ?? Testing Checklist

Po deployment otestujte:

- [ ] Login stránka funguje
- [ ] Po pøihlášení se zobrazí dashboard
- [ ] API requesty vracejí data
- [ ] Navigation mezi stránkami funguje
- [ ] Logout funguje správnì
- [ ] Token refresh funguje (testovat po 15+ minutách)

## ?? Monitoring

### Health Checks

**Frontend**: 
```
https://happy-pebble-041ffdb03.3.azurestaticapps.net
```

**Backend**:
```
https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/health
```

### Logs

**Frontend Logs**:
- Azure Portal ? Static Web Apps ? Logs
- Browser DevTools ? Console

**Backend Logs**:
- Azure Portal ? Container Apps ? Logs

## ?? Known Issues

### Large Bundle Size
?? Bundle size je 1.2 MB (363 KB gzipped)
- Zvážit code-splitting v budoucí verzi
- Vìtšina velikosti je z recharts knihovny

### Možné problémy po deployment

1. **CORS Error**
   - Backend musí mít whitelistnutou frontend doménu
   - Kontaktovat backend team pokud se vyskytne

2. **Environment Variables**
   - Zkontrolovat, že `VITE_API_BASE_URL` je správnì nastaveno
   - Rebuild je nutný po zmìnì env variables

## ?? Rollback Plan

Pokud deployment selže:

1. Vrátit zmìny v `.env`:
```env
VITE_API_BASE_URL=http://localhost:3000/v1
```

2. Revert git commit:
```bash
git revert HEAD
git push origin main
```

3. Starý backend URL (pokud je stále dostupný):
```
https://backrent-simple-app.wonderfulstone-7bd2a01f.westeurope.azurecontainerapps.io/v1
```

## ?? Support

**API Status**: https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/health  
**API Docs**: https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1/docs  
**Frontend**: https://happy-pebble-041ffdb03.3.azurestaticapps.net

---

**Build Status**: ? Success  
**Tests**: ? Build OK  
**Ready for Deployment**: ? Yes
