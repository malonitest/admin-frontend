# Frontend Complete Guide – CashNdrive Platform

_Last updated: 2024-12-09_

This document contains everything a frontend engineer needs to integrate with the CashNdrive backend: authentication, environment setup, endpoints (CRUD, reporting, DriveBot), dealer hierarchy, data model reference, and best practices for reading/writing data.

---

## 1. Environments & Base URLs

| Environment | Base URL | Notes |
|-------------|----------|-------|
| **Production** | `https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1` | Azure Container Apps. All endpoints documented below are relative to this URL. |
| **Local (dev)** | `http://localhost:3000/v1` | Requires backend running locally (`npm run dev`). |

**Important:** `backrent-api-prod.azurewebsites.net` is obsolete. Use only the URL above.

---

## 2. Authentication Flow

1. **Login**
   ```http
   POST /auth/login
   Content-Type: application/json

   {
     "email": "user@example.com",
     "password": "********"
   }
   ```
   Response contains user profile + access & refresh tokens.

2. **Headers for all requests**
   ```json
   {
     "Authorization": "Bearer <accessToken>",
     "Content-Type": "application/json"
   }
   ```

3. **Token refresh** – call `POST /auth/refresh-tokens` with refresh token when access token expires.

4. **Logout** – `POST /auth/logout` with refresh token to invalidate it.

See `docs/AUTHENTICATION-GUIDE.md` for the full workflow (password reset, email verification, etc.).

---

## 3. Roles & Permissions

| Role | Description | Typical Permissions |
|------|-------------|---------------------|
| `ADMIN` | Full control of system | `getUsers`, `manageUsers`, `getStats`, ... |
| `FINANCE_DIRECTOR` | Same as admin, finance oversight | All stats, invoices, leases |
| `SUPERVISOR` | Area manager (CC or OS team) | approve leads, view stats |
| `SALES` | Call center agent | leads they created/assigned |
| `OS` | Field sales agent | leads under their supervisor |
| `CUSTOMER` | Portal customer | limited, mostly lease self-service |

Permission strings are defined in `src/config/roles.ts` (referenced in routes via `auth('permission')`). Frontend should hide/disable UI based on `user.role` and `user.permissions` returned from login.

---

## 4. Dealer Hierarchy & Business Logic

- **Dealer document** (`src/modules/dealer/`): links a `User` to dealer info, team (`CC` or `OS`), supervisor, permissions.
- **Lead visibility**:
  - Admin / Finance Director: all leads.
  - Supervisor (CC team): all CC leads except fully declined unless `declinedType = ASSIGNED_TO_TECHNICIAN`.
  - Supervisor (OS team): only leads where they are supervisor/dealer/original author.
  - Sales/OS: only own leads (dealer or originalAuthor).

**Lead lifecycle (simplified)**
```
CONCEPT ? NEW ? SUPERVISOR_APPROVED ? CUSTOMER_APPROVED ? ASSIGNED ? SENT_TO_OZ ?
SALES_APPROVED ? UPLOAD_DOCUMENTS ? FINAL_APPROVAL ? CONVERTED
                    ? DECLINED
                    ? RETURNED_TO_SALES
```

**Lease lifecycle**: `AWAITS_PAYOUT ? AWAITS_PAYMENT_METHOD ? OPEN ? LATE ? PAIDBACK (? SELL if repossessed)`.

---

## 5. Data Model Cheatsheet

Primary schemas live in `src/modules/**` (use `docs/DATA-MODELS.md` for full detail). Key references:

| Entity | Key Fields |
|--------|------------|
| Lead (`lead.model.ts`) | `customer`, `car`, `status`, `declinedType`, `note[]`, `documents` |
| Lease (`lease.model.ts`) | `customer`, `car`, `status`, `nextPayment`, `documents`, `debtCollectionStatus` |
| Customer (`customer.model.ts`) | `user`, `dealer`, `address`, `bankAccount`, `cars[]` |
| Car (`car.model.ts`) | `customer`, `VIN`, `carSPZ`, `documents`, `estimatedValue` |
| Dealer (`dealer.model.ts`) | `user`, `team`, `dealerType`, `supervisor`, `isActive` |
| Document (`document.model.ts`) | shared schema for uploaded/generated files |

All models use `toJSON` plugin (transforms `_id` to `id`, removes `__v`) and `paginate` plugin for list endpoints.

---

## 6. Core Endpoints

### 6.1 Auth & Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Authenticate user |
| POST | `/auth/logout` | Revoke refresh token |
| POST | `/auth/refresh-tokens` | Issue new tokens |
| POST | `/auth/forgot-password` | Send reset email |
| POST | `/auth/reset-password` | Finish reset |
| GET | `/users/me` | Current user profile |
| PATCH | `/users/me` | Update profile |
| GET | `/users` | (Admins) list users |

### 6.2 Leads
| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/leads` | Query with filters (`status`, `dealer`, pagination) |
| POST | `/leads` | Create lead (sales) |
| GET | `/leads/:id` | Detail |
| PATCH | `/leads/:id` | Update (state transitions etc.) |
| DELETE | `/leads/:id` | Remove (admin) |
| POST | `/leads/:id/notes` | Add note |
| POST | `/leads/:id/documents` | Upload doc |

### 6.3 Leases
| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/leases` | List with filters |
| GET | `/leases/:id` | Detail |
| PATCH | `/leases/:id` | Update |
| POST | `/leases/:id/extend` | Extend lease |
| POST | `/leases/:id/payback` | Payback |

### 6.4 Documents & Storage
| Endpoint | Notes |
|----------|-------|
| `/documents/download/:documentId` | Use for fetching stored files |
| `/documents/upload` | Multipart upload |

### 6.5 Reports / Stats
_All require `getStats` permission (Admin / Finance Director / Supervisor)._ More detail in section 7.

### 6.6 DriveBot (AI assistant)
| Method | Endpoint | Notes |
|--------|----------|-------|
| POST | `/drivebot/chat` | Body `{ message, conversationHistory? }`. Returns AI response with DB context. |

### 6.7 Miscellaneous
- `/transactions`, `/invoices`, `/cars`, `/customers`, `/dealers`, `/stripe`, `/messages` – each module has RESTful routes. See `docs/API-ENDPOINTS-REFERENCE.md` for full list.

---

## 7. Reporting Endpoints (Frontend Dashboards)

### 7.1 Funnel Report (CC conversion funnel)
```
GET /stats/funnel?period=month
GET /stats/funnel?dateFrom=2024-01-01&dateTo=2024-01-31
```
Response conforms to `IFunnelReportData` (see `docs/FUNNEL-REPORT-API.md`). Stages: `Nový lead`, `Schválen AM`, `Pøedáno technikovi`, `Konvertováno`. Includes decline reasons (overall + per stage) and sample notes.

### 7.2 CC Report
```
GET /stats/cc-report
```
Filters available: `status`, `subStatus`, `dealer`, `source`, `period`, `dateFrom`, `dateTo`. Response contains breakdowns by status, substatus, dealer, source, day etc.

### 7.3 OS Report
```
GET /stats/os-report
```
Aggregates requests per field salesperson (originalAuthor/dealer), conversions, success rate.

### 7.4 Marketing Report
```
GET /stats/marketing-report
```
Adds referral URL breakdown, conversions per channel.

### 7.5 Dashboard Stats
```
GET /stats/dashboard
```
General metrics for overall app dashboard.

### 7.6 Admin Dashboard Stats
```
GET /stats/admin-dashboard?period=month
```
Supports `period` or custom `dateFrom/dateTo`. Returns leads, conversions, comparisons to previous period, recent leads list etc.

### 7.7 Sales Stats
```
GET /stats/sales?filterFrom=timestamp&filterTo=timestamp
```
Aggregates stats per indicator (NEW_LEAD_SALES/OS etc.) with conversions and amounts.

### 7.8 KPI Investor Report
```
GET /stats/kpi-report?period=month
GET /stats/kpi-report?dateFrom=2024-01-01&dateTo=2024-03-31
```
See `docs/KPI-REPORT-API.md` for `IKPIInvestorReportData` structure (summary, highlights, financials, funnel, technician, fleet, risk sections).

### 7.9 Technician Funnel (DriveBot / Docs)
```
GET /stats/funnel-technician
```
Described in `docs/FUNNEL-TECHNIK-API.md`.

---

## 8. Database Access Tips for Frontend

While the frontend communicates via REST, understanding DB structure helps when building forms:

1. **IDs** – Always stored as strings in API responses (thanks to `toJSON`). Use them directly in requests.
2. **Dates** – ISO strings. Use `date-fns` or similar for formatting. Always send timezone-aware ISO (UTC) back.
3. **File uploads** – Use `multipart/form-data` (document type selection is required; see DocumentType enum in `src/modules/document/document.types.ts`).
4. **Notes** – Most entities have `note` arrays (`Lead.note` includes `message`, `author`, `createdAt`).
5. **Paginated endpoints** – Response shape: `{ results: [], page, limit, totalPages, totalResults }`.

---

## 9. Frontend Utilities & Patterns

### 9.1 API Helper (example)
```typescript
const API_BASE_URL = 'https://.../v1';

async function apiFetch<T>(endpoint: string, token: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });

  if (response.status === 401) {
    // token expired ? redirect to login / refresh flow
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(err.message || `HTTP ${response.status}`);
  }

  return response.json();
}
```

### 9.2 Date Range Picker Patterns
The backend accepts either `period` or `dateFrom` + `dateTo`. Use preset ranges but allow custom selection. (See pattern snippet in `docs/FRONTEND-INSTRUCTIONS.md`).

### 9.3 Charts
- Recharts or Chart.js both work; key is to map API data into `labels` + series.
- For funnel: horizontal stacked bars or custom funnel component.
- For decline reasons: pie/donut chart + table.

---

## 10. DriveBot (AI) Integration

DriveBot can fetch aggregated context (leads, leases, cars, etc.). Endpoint:
```
POST /drivebot/chat
Body: {
  "message": "text",
  "conversationHistory": [{ role: 'user'|'assistant'|'system', content: '' }]
}
```

If Azure OpenAI credentials are missing, backend falls back to deterministic info retrieval (still useful). Frontend should handle `response` string + optional `context.dataType`.

---

## 11. Storage & Document Handling

- When uploading files, call `POST /documents/upload` (category required). Response contains document metadata and saved file path.
- Generated documents (agreements) saved in `/home/storage/documents` and accessible via document endpoints.
- `USE_AZURE_STORAGE` governs whether files go to Azure Blob or filesystem (already abstracted in backend). Frontend just consumes API responses.

---

## 12. Troubleshooting

| Symptom | Diagnosis |
|---------|-----------|
| 401 Unauthorized | Token expired/missing ? redirect to login or refresh |
| 403 Forbidden | Role lacks permission ? hide UI and show message |
| 404 Not Found | Endpoint typo or resource missing ? inspect request path |
| CORS error | Ensure frontend domain added to backend CORS config (see `CORS-*.md` guides) |
| File upload fails | Verify `multipart/form-data`, field name `file`, document type parameter |
| Chart data incorrect | Confirm date filters/periods, inspect API response via dev tools |

---

## 13. Useful Scripts / Docs

- `docs/FRONTEND-INSTRUCTIONS.md` – Base URL & quick examples (this doc extends it)
- `docs/FUNNEL-REPORT-API.md` – Detailed funnel response
- `docs/KPI-REPORT-API.md` – Complex investor dashboard structure
- Batch/PowerShell scripts in repo help deploy/test stats endpoints:
  - `TEST-ALL-STATS-ENDPOINTS.ps1`
  - `DEPLOY-FUNNEL-TECHNIK.ps1`
  - etc.

---

## 14. Contact / Support

- Backend repo: `https://github.com/malonitest/car-backrent-api-test`
- For access issues (credentials, roles), see `FINAL-WORKING-CREDENTIALS.txt` or contact backend team.
- For DriveBot/Azure deployment: see `docs/DRIVEBOT-IMPLEMENTATION.md` and deployment scripts.

---

_This document should be kept in sync with backend changes. When new modules or endpoints are added, update this guide + linked docs._
