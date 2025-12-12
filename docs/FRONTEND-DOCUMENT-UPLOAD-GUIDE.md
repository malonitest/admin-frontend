# Frontend Developer Guide: Document Upload System

## ?? Pøehled Systému

Tento guide poskytuje kompletní návod pro implementaci uploadu dokumentù ve frontendové aplikaci s napojením na Car Back-Rent API.

## ? STATUS: **WORKING** - Backend endpoint je funkèní (2024-12-18)

---

## ?? Obsah

1. [Backend Architektura](#backend-architektura)
2. [Podporované Typy Dokumentù](#podporované-typy-dokumentù)
3. [API Endpoints](#api-endpoints)
4. [Frontend Implementace](#frontend-implementace)
5. [CSS Styling](#css-styling)
6. [Backend API Contract](#backend-api-contract)
7. [Validaèní Pravidla](#validaèní-pravidla)
8. [Bezpeènostní Opatøení](#bezpeènostní-opatøení)
9. [Kompletní Upload Flow](#kompletní-upload-flow)
10. [Pøíklady Použití](#pøíklady-použití)
11. [Checklist](#checklist)

---

## Backend Architektura

### ? Working Endpoint (VERIFIED)

```typescript
POST /v1/documents/upload  // ? WORKING
POST /v1/documents/uploadDocument  // ?? Original (still works)
```

**Use:** `/v1/documents/upload` (recommended)

### Storage Konfigurace

```typescript
storage: {
  baseDir: '/home/storage/',                    // Základní cesta pro storage
  tempDir: '/home/storage/temp',                // Doèasné soubory
  documentsStorageDir: 'documents/',            // Trvalé dokumenty
  tempDocumentsStorageDir: 'temp_documents/',   // Generované dokumenty pøed finalizací
  invoicesStorageDir: 'invoices/'               // PDF faktury
}
```

---

## Podporované Typy Dokumentù

Definováno v `src/modules/document/document.types.ts`:

```typescript
// ? VERIFIED - These values work with backend
export enum DocumentType {
  // VIN & Nájezd
  CAR_VIN = 'carVIN',           // ?
  CAR_MILEAGE = 'carMileage',   // ?
  
  // Fotky vozidla
  CAR_EXTERIOR = 'carExterior', // ?
  CAR_INTERIOR = 'carInterior', // ?
  
  // Technické prùkazy
  CAR_VTP = 'carVTP',           // ?
  CAR_MTP = 'carMTP',           // ?
  
  // Smlouvy
  BUY_AGREEMENT = 'buyAgreement',     // ?
  RENT_AGREEMENT = 'rentAgreement',   // ?
  
  // Plné moci
  BUY_MANDATE = 'buyMandate',     // ?
  SELL_MANDATE = 'sellMandate',   // ?
  
  // Ostatní
  OTHER = 'other'  // ?
}
```

---

## API Endpoints

### Base URL

```typescript
// Production (VERIFIED WORKING)
const API_BASE_URL = 'https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1';

// Development
const API_BASE_URL = 'http://localhost:8080/v1';
```

### Upload Endpoint ?

```
POST /v1/documents/upload
```

### Required Headers

```typescript
{
  'Authorization': `Bearer ${accessToken}`,
  // ?? DON'T set Content-Type manually!
  // Axios/browser will set it automatically with boundary
}
```

### Request Format (FormData)

```typescript
const formData = new FormData();
formData.append('file', fileObject);           // ? Field name: 'file'
formData.append('documentType', 'carVIN');     // ? String value
formData.append('leadId', lead.id);            // ?? Optional

await axiosClient.post('/documents/upload', formData);
// Axios automatically sets: Content-Type: multipart/form-data; boundary=...
```

---

## Backend API Contract

### ? Upload Request (VERIFIED)

```typescript
POST /v1/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...

FormData:
  file: [File Object]              // ? REQUIRED - field name must be 'file'
  documentType: "carVIN"           // ? REQUIRED - string from enum
  leadId: "507f1f77..."           // ?? OPTIONAL
```

### ? Upload Response (VERIFIED)

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "documentType": "carVIN",
  "file": "507f1f77bcf86cd799439011_vehicle_photo.jpg",
  "name": "vehicle_vin_photo"
}
```

### ? Error Response

```json
{
  "code": 400,
  "message": "Invalid document type"
}
```

---

## Validaèní Pravidla

### Velikost Souboru

- **Maximum**: 10MB na soubor
- **Backend config**: `config.storage.maxFileSize`

### Typy Souborù

- **Obrázky**: `image/jpeg`, `image/png`, `image/jpg`
- **Dokumenty**: `application/pdf`
- **Backend validace**: Multer file filter

---

## Bezpeènostní Opatøení

### 1. Autentizace ?

```typescript
headers: {
  'Authorization': `Bearer ${accessToken}`  // ? REQUIRED
}
```

### 2. Validace Souborù

```typescript
const validateFile = (file: File): boolean => {
  // Kontrola velikosti
  if (file.size > 10 * 1024 * 1024) {
    return false;
  }
  
  // Kontrola typu
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (!validTypes.includes(file.type)) {
    return false;
  }
  
  return true;
};
```

---

## ? Kompletní Working Example

```typescript
import { axiosClient } from '@/api/axiosClient';

async function uploadDocument(
  file: File,
  documentType: string,
  leadId?: string
) {
  try {
    // Create FormData
    const formData = new FormData();
    formData.append('file', file);              // ? Must be 'file'
    formData.append('documentType', documentType);
    if (leadId) {
      formData.append('leadId', leadId);
    }

    // Upload (axios auto-sets Content-Type with boundary)
    const response = await axiosClient.post('/documents/upload', formData);
    
    console.log('? Upload successful:', response.data);
    return response.data;

  } catch (error: any) {
    console.error('? Upload failed:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
const file = document.querySelector('input[type="file"]').files[0];
await uploadDocument(file, 'carVIN', 'lead-id-123');
```

---

## Troubleshooting

### ? Fixed Issues

#### 1. ~~404 Not Found~~ - **FIXED** ?
- **Was**: Endpoint didn't exist
- **Now**: `/v1/documents/upload` works

#### 2. ~~Wrong field name~~ - **FIXED** ?
- **Was**: Backend expected `image`
- **Now**: Backend expects `file`

#### 3. ~~Content-Type header~~ - **FIXED** ?
- **Was**: Manually setting caused issues
- **Now**: Axios auto-sets with boundary

---

## ?? Testing

### Quick Test

```typescript
// Open browser console on your app
const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });

const formData = new FormData();
formData.append('file', testFile);
formData.append('documentType', 'other');

// Get token from localStorage
const token = localStorage.getItem('token');

fetch('https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1/documents/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
.then(r => r.json())
.then(data => console.log('? Success:', data))
.catch(err => console.error('? Error:', err));
```

---

## ?? Implementation Status

- ? Backend endpoint working
- ? Field names correct
- ? Document types supported
- ? Authorization working
- ? FormData format correct
- ? Frontend integration pending test

---

**Poslední aktualizace**: 2024-12-18  
**Status**: ? WORKING  
**Backend Version**: Fixed (uploadDocument + upload alias)
