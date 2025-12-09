# ?? URGENT REQUEST - Change User Role to ADMIN

**Date:** 9.12.2024  
**Priority:** HIGH  
**User:** maloni@outlook.com

---

## ?? Request Details

**Please change the role of the following user to ADMIN:**

```
Email: maloni@outlook.com
User ID: 69382e4818c06603d21fd095
Current Role: CUSTOMER
Requested Role: ADMIN
```

---

## ?? Reason

The user needs **ADMIN** access to use the admin frontend application:
- **Frontend URL:** https://happy-pebble-041ffdb03.3.azurestaticapps.io
- **Current Issue:** Getting 403 Forbidden errors on all admin endpoints

**Affected Endpoints:**
- `/v1/stats` - Dashboard statistics
- `/v1/leads` - Leads management
- `/v1/dealers` - Dealers management
- `/v1/users` - User management

---

## ??? How to Change Role

### Option 1: Azure Portal (Recommended)

1. Open Azure Portal: https://portal.azure.com
2. Navigate to: **Cosmos DB ? backrent-db ? Data Explorer**
3. Select: **Database: 'backrent' ? Collection: 'users'**
4. Find user document with email: `maloni@outlook.com`
5. Click **"Edit"**
6. Change: `"role": "CUSTOMER"` ? `"role": "ADMIN"`
7. Click **"Update"**

### Option 2: MongoDB Shell Command

```javascript
db.users.updateOne(
  { email: "maloni@outlook.com" },
  { $set: { role: "ADMIN" } }
)
```

### Option 3: API Update (if admin endpoint exists)

```bash
PATCH /v1/users/69382e4818c06603d21fd095
Authorization: Bearer <ADMIN_TOKEN>

{
  "role": "ADMIN"
}
```

---

## ? Verification Steps

After changing the role:

1. User will logout and login again
2. New JWT token will contain ADMIN role
3. All admin endpoints should be accessible
4. Dashboard statistics should load correctly

---

## ?? Contact

**User:** maloni@outlook.com  
**Frontend Repository:** https://github.com/malonitest/admin-frontend  
**Backend Repository:** https://github.com/malonitest/car-backrent-api-test

---

## ? Timeline

- **Request Created:** 9.12.2024 15:45
- **Expected Completion:** ASAP (blocking frontend usage)
- **User Will Verify:** After role change

---

**Please confirm when the role has been changed. Thank you!** ??
