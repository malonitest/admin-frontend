# ?? URGENT: Backend API vrací 500 pøi /v1/dealers po migraci

**Datum:** 9.12.2024 16:30  
**Priority:** CRITICAL  
**Affected Endpoint:** `/v1/dealers`  
**Status:** 500 Internal Server Error

---

## ?? **Problem Description:**

Po migraci z **Forpsi MongoDB** na **Azure Cosmos DB**, endpoint `/v1/dealers` vrací **HTTP 500 Internal Server Error**.

### **Frontend Console Error:**

```
GET https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1/dealers
500 (Internal Server Error)

Response:
{
  "code": 500,
  "message": "Internal Server Error"
}
```

---

## ?? **Expected Behavior:**

```
GET /v1/dealers
Authorization: Bearer <valid-admin-token>

Expected Response: 200 OK
{
  "results": [...],
  "page": 1,
  "limit": 10,
  "totalPages": X,
  "totalResults": X
}
```

---

## ?? **How to Reproduce:**

### **1. Login jako ADMIN:**

```bash
POST /v1/auth/login
{
  "email": "maloni@outlook.com",
  "password": "SIkora1976"
}
```

### **2. Získat access token z response**

### **3. Volat dealers endpoint:**

```bash
GET /v1/dealers
Authorization: Bearer <access-token>
```

### **4. Result: 500 Error**

---

## ?? **Possible Root Causes:**

### **1. Schema Mismatch po migraci**

Cosmos DB mùže mít jiné schema requirements než MongoDB:
- Case-sensitivity v field names
- Required fields
- Index configuration

### **2. Dealers Collection problém**

```javascript
// Check if dealers collection exists:
db.dealers.find().limit(1)

// Check schema:
db.dealers.findOne()
```

### **3. Missing Index**

Cosmos DB vyžaduje indexy pro efektivní querying.

### **4. Dealer Reference v Users**

Users mají `dealer: ObjectId(...)` - možná jsou neplatné reference.

---

## ?? **Database State Check:**

### **V Azure Cosmos DB (MongoDB API):**

```javascript
// 1. Check dealers collection exists
show collections
// Should see: dealers

// 2. Count dealers
db.dealers.count()

// 3. Sample dealer document
db.dealers.findOne()

// 4. Check for invalid references
db.users.find({ dealer: { $exists: true } }).limit(5)
```

---

## ??? **Debugging Steps for Backend:**

### **Step 1: Check Backend Logs**

```bash
# Azure Portal ? Container Apps ? backrent-itx754fut5nry-app
# ? Monitoring ? Log stream

# Look for:
# - Stack traces
# - "dealers" errors
# - MongoDB/Cosmos DB connection errors
```

### **Step 2: Test Dealers Endpoint Locally**

```bash
# Set MONGODB_URL to Azure Cosmos DB
MONGODB_URL="mongodb://backrent-itx754fut5nry-cosmos.mongo.cosmos.azure.com:10255/carbackrent?ssl=true&..."

# Run backend locally
npm run dev

# Test endpoint
curl -X GET "http://localhost:3000/v1/dealers" \
  -H "Authorization: Bearer <token>"
```

### **Step 3: Check Dealer Model**

```typescript
// src/modules/dealer/dealer.model.ts
// Verify schema is compatible with Cosmos DB
```

### **Step 4: Validate Data**

```javascript
// In dealers collection, check for:
// - Missing required fields
// - Invalid ObjectIds
// - Schema violations

db.dealers.find({
  $or: [
    { name: { $exists: false } },
    { email: { $exists: false } }
  ]
})
```

---

## ?? **Expected Fix:**

### **Option A: Schema Update**

```typescript
// If schema needs updating for Cosmos DB compatibility
const dealerSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  // ... ensure all fields are Cosmos DB compatible
});
```

### **Option B: Data Migration**

```javascript
// If dealers have invalid data:
db.dealers.updateMany(
  { /* filter */ },
  { $set: { /* fix invalid fields */ } }
)
```

### **Option C: Index Creation**

```javascript
// If missing indexes:
db.dealers.createIndex({ email: 1 }, { unique: true })
db.dealers.createIndex({ name: 1 })
```

---

## ?? **Temporary Workaround for Frontend:**

Frontend can display graceful error message:

```typescript
try {
  const dealers = await getDealers();
} catch (error) {
  if (error.response?.status === 500) {
    showError('Dealers data is temporarily unavailable. Our team is working on it.');
    // Log to error tracking
    console.error('Dealers 500 error:', error);
  }
}
```

---

## ? **Verification After Fix:**

### **1. Test dealers endpoint:**

```bash
curl -X GET "https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1/dealers" \
  -H "Authorization: Bearer <admin-token>"

# Expected: 200 OK with dealers array
```

### **2. Test on Frontend:**

```
1. Login jako ADMIN
2. Navigate to /leads or /dealers
3. Verify dealers dropdown loads
4. Verify no 500 errors in console
```

---

## ?? **Contact:**

### **Frontend Team:**
- Email: maloni@outlook.com
- Repo: https://github.com/malonitest/admin-frontend
- **Frontend is waiting for fix!**

### **Backend Team:**
- Repo: https://github.com/malonitest/car-backrent-api-test
- **Please prioritize - blocking production!**

---

## ?? **Impact:**

- **? Users cannot view dealers**
- **? Leads page shows error**
- **? Cannot assign leads to dealers**
- **? Admin functions broken**

**Severity:** CRITICAL - Blocks core functionality

---

## ?? **Related Issues:**

- ? Users migration - FIXED
- ? Authentication - WORKING
- ? **Dealers endpoint - BROKEN** ? Current issue
- ? Other endpoints - Unknown

---

## ?? **Action Items:**

### **For Backend Team:**

- [ ] Check backend logs for dealers endpoint error
- [ ] Verify dealers collection in Azure Cosmos DB
- [ ] Test dealers model compatibility with Cosmos DB
- [ ] Fix schema/data issues
- [ ] Deploy fix
- [ ] Verify with frontend team

### **For DevOps:**

- [ ] Monitor backend logs
- [ ] Check Cosmos DB performance metrics
- [ ] Verify connection string

---

**PLEASE PRIORITIZE - Frontend is blocked waiting for this fix!** ??

---

**Created:** 9.12.2024 16:30  
**Reported By:** Frontend Team (maloni@outlook.com)  
**Severity:** CRITICAL  
**ETA:** ASAP

---

## ?? **Attachments:**

- Frontend Console Screenshot: See error above
- Backend Endpoint: `/v1/dealers`
- Expected Behavior: 200 OK with dealers array
- Actual Behavior: 500 Internal Server Error
