# ?? BACKEND DOMAIN ISSUE

**Date:** 9.12.2024  
**Status:** ? BLOCKED  
**Priority:** HIGH  

---

## ?? **Problem:**

The new production backend domain **DOES NOT EXIST**:

```
? https://backrent-api-prod.azurewebsites.net
DNS Error: ERR_NAME_NOT_RESOLVED
```

**Error:**
```
curl: (6) Could not resolve host: backrent-api-prod.azurewebsites.net
```

---

## ?? **Timeline:**

| Time | Action | Result |
|------|--------|--------|
| 16:00 | Received backend instructions | ? |
| 16:30 | Updated frontend to use new URL | ? |
| 17:00 | Deployed frontend | ? |
| 17:05 | **DNS resolution fails** | ? |

---

## ?? **Fallback Solution:**

**Reverted to OLD backend (working):**

```
? https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1
```

**Status:** This backend is working and accessible.

---

## ?? **Action Required - Backend Team:**

### **Option 1: Verify domain exists**

Check if Azure App Service is deployed:
```bash
az webapp show --name backrent-api-prod --resource-group <resource-group>
```

### **Option 2: Provide correct production URL**

If the domain name is different, please provide the correct URL:
- Azure Container Apps: `https://<app-name>.<unique-id>.<region>.azurecontainerapps.io`
- Azure App Service: `https://<app-name>.azurewebsites.net`
- Custom domain: `https://api.yourdomain.com`

### **Option 3: Keep using old backend**

If migration is not complete, frontend can continue using:
```
https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1
```

---

## ?? **What Frontend Needs:**

1. **Valid backend URL** that resolves via DNS
2. **CORS configured** for frontend domains:
   - `https://happy-pebble-041ffdb03.3.azurestaticapps.net`
   - `https://happy-pebble-041ffdb03.3.azurestaticapps.io`
3. **All endpoints working**, especially:
   - `POST /auth/login`
   - `GET /stats/funnel`
   - `GET /stats/cc-report`
   - `GET /stats/os-report`
   - `GET /leads`
   - `GET /dealers`

---

## ?? **Current Status:**

| Backend | Status | URL |
|---------|--------|-----|
| **OLD** (Container Apps) | ? Working | `backrent-itx754fut5nry-app...azurecontainerapps.io` |
| **NEW** (App Service) | ? DNS Error | `backrent-api-prod.azurewebsites.net` |

---

## ? **Frontend Actions Taken:**

- [x] Reverted to old backend URL
- [x] Updated deployment config
- [x] Tested old backend (working)
- [x] Documented issue
- [x] Waiting for backend team response

---

## ?? **Contact:**

**Backend Team:**
- Repository: https://github.com/malonitest/car-backrent-api-test
- Please verify Azure App Service deployment
- Confirm correct production URL

**Frontend Team:**
- Repository: https://github.com/malonitest/admin-frontend
- Ready to update once correct URL is provided

---

## ? **ETA:**

**Waiting for backend team to:**
1. Verify deployment exists
2. Provide correct production URL
3. Test DNS resolution
4. Confirm CORS configuration

---

**Created:** 9.12.2024  
**Status:** ?? WAITING FOR BACKEND TEAM  
**Impact:** Blocked - Cannot use new backend
