# Backend API Documentation

## Base URL

### Production (Azure)
```
https://backrent-simple-app.wonderfulstone-7bd2a01f.westeurope.azurecontainerapps.io
```

### Local Development
```
http://localhost:8080
```

## Authentication

All authenticated requests require JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### Token Storage
- Access Token: `localStorage.getItem('token')`
- Refresh Token: `localStorage.getItem('refreshToken')`
- User Info: `localStorage.getItem('user')`

## Main Endpoints

### Authentication (`/v1/auth`)
- `POST /v1/auth/register` - Register new user
- `POST /v1/auth/login` - Login
- `POST /v1/auth/logout` - Logout
- `POST /v1/auth/refresh-tokens` - Refresh access token
- `POST /v1/auth/forgot-password` - Request password reset
- `POST /v1/auth/reset-password` - Reset password
- `POST /v1/auth/send-verification-email` - Send email verification
- `POST /v1/auth/verify-email` - Verify email

### Users (`/v1/users`)
- `GET /v1/users` - Get all users (admin)
- `GET /v1/users/:userId` - Get user by ID
- `PATCH /v1/users/:userId` - Update user
- `DELETE /v1/users/:userId` - Delete user

### Leads (`/v1/leads`)
- `GET /v1/leads` - Get all leads (with filters)
- `POST /v1/leads` - Create new lead
- `GET /v1/leads/:leadId` - Get lead by ID
- `PATCH /v1/leads/:leadId` - Update lead
- `DELETE /v1/leads/:leadId` - Delete lead
- `POST /v1/leads/:leadId/convert` - Convert lead to lease

### Leases (`/v1/leases`)
- `GET /v1/leases` - Get all leases
- `POST /v1/leases` - Create new lease
- `GET /v1/leases/:leaseId` - Get lease by ID
- `PATCH /v1/leases/:leaseId` - Update lease
- `DELETE /v1/leases/:leaseId` - Delete lease

### Customers (`/v1/customers`)
- `GET /v1/customers` - Get all customers
- `POST /v1/customers` - Create customer
- `GET /v1/customers/:customerId` - Get customer
- `PATCH /v1/customers/:customerId` - Update customer
- `DELETE /v1/customers/:customerId` - Delete customer

### Cars (`/v1/cars`)
- `GET /v1/cars` - Get all cars
- `POST /v1/cars` - Create car
- `GET /v1/cars/:carId` - Get car
- `PATCH /v1/cars/:carId` - Update car
- `DELETE /v1/cars/:carId` - Delete car

### Dealers (`/v1/dealers`)
- `GET /v1/dealers` - Get all dealers
- `POST /v1/dealers` - Create dealer
- `GET /v1/dealers/:dealerId` - Get dealer
- `PATCH /v1/dealers/:dealerId` - Update dealer
- `DELETE /v1/dealers/:dealerId` - Delete dealer

### Statistics (`/v1/stats`)
- `GET /v1/stats/dashboard` - Get dashboard statistics
- `GET /v1/stats/sales` - Get sales statistics
- `GET /v1/stats/admin-dashboard` - Get admin dashboard stats
- `GET /v1/stats/cc-report` - Get CC report
- `GET /v1/stats/os-report` - Get OS report
- `GET /v1/stats/marketing-report` - Get marketing report

### Documents (`/v1/documents`)
- `POST /v1/documents/upload` - Upload document
- `GET /v1/documents/:documentId` - Download document
- `DELETE /v1/documents/:documentId` - Delete document

### Payments (Stripe) (`/v1/pay`)
- `POST /v1/pay/create-customer` - Create Stripe customer
- `POST /v1/pay/create-payment-method` - Add payment method
- `POST /v1/pay/create-payment-intent` - Create payment intent
- `GET /v1/pay/payment-methods/:customerId` - Get customer payment methods

## Response Format

### Success Response
```json
{
  "results": [...],
  "page": 1,
  "limit": 10,
  "totalPages": 5,
  "totalResults": 50
}
```

### Error Response
```json
{
  "code": 400,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

## Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (no token or invalid) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 500 | Internal Server Error |

## User Roles

- **ADMIN** - Full access to all resources
- **FINANCE_DIRECTOR** - Same as admin (financial oversight)
- **SUPERVISOR** - Manage team, approve leads, view reports
- **SALES** - Create/view own leads, limited access
- **OS** - Field sales, manage assigned leads
- **CUSTOMER** - View own lease, make payments

## Pagination

All list endpoints support pagination:
```typescript
{
  page: 1,           // Current page (default: 1)
  limit: 10,         // Items per page (default: 10)
  sortBy: 'createdAt:desc',  // Sort field and order
  projectBy: 'name,email'    // Fields to include
}
```

## API Documentation (Swagger)

Interactive API documentation available at:
```
https://backrent-simple-app.wonderfulstone-7bd2a01f.westeurope.azurecontainerapps.io/v1/docs
```

## Health Check

```
GET /health
```
Returns API health status.

---

**Last Updated**: 2024-12-08  
**Backend Version**: 3.0.11
