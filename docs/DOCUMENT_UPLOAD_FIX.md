# Document Upload Fix - Implementation Summary

## ?? Provedené opravy (10.12.2024)

### ? Problém
Dokumenty se neukládaly v LeadDetail a NewLead komponentách kvùli použití nesprávného API endpointu a špatných parametrù.

### ? Øešení
Opraveno podle oficiální dokumentace `docs/FRONTEND-DOCUMENT-UPLOAD-GUIDE.md`:

1. **Správný endpoint**: `/v1/documents/upload` (místo `/leads/{id}/documents`)
2. **Správné FormData parametry**:
   - `file` (místo `document`)
   - `documentType` (místo `category`)
   - `leadId` (volitelný)

---

## ?? Opravené soubory

### 1. `src/pages/LeadDetail.tsx`

#### Zmìny:
- ? Opraveny všechny upload handlery (drag & drop, file input, camera capture)
- ? Pøidán mapping kategorií dokumentù na `documentType` hodnoty
- ? Endpoint zmìnìn z `/leads/${id}/documents` na `/documents/upload`
- ? FormData parametry: `file`, `documentType`, `leadId`

#### Document Type Mapping:
```typescript
const getDocumentType = (category: string): string => {
  const mapping: Record<string, string> = {
    'najezd_vin': 'carVIN' | 'carMileage',
    'evidencni_kontrola': 'carVTP',
    'technicke_prukazy': 'carMTP',
    'fyzicka_kontrola': 'carExterior' | 'carInterior',
    'smlouvy': 'buyAgreement' | 'rentAgreement',
    'zelena_karta': 'greenCard',
    'plna_moc': 'buyMandate' | 'sellMandate',
    'pri_prodeji': 'sellMandate',
    'pojisteni': 'insurance',
    'ostatni': 'other',
    'cebia_cardetect': 'carDetectReport',
  };
  return mapping[category] || 'other';
};
```

#### Upload Handlery:
1. **Drag & Drop**: `handleDrop(e, documentType)`
2. **Fotka palubní desky**: documentType = `'carMileage'`
3. **Fotka VIN**: documentType = `'carVIN'`
4. **Generic upload**: documentType z `getDocumentType()`

---

### 2. `src/pages/NewLead.tsx`

#### Zmìny:
- ? Endpoint zmìnìn z `/leads/${leadId}/documents` na `/documents/upload`
- ? FormData parametry: `file`, `documentType`, `leadId`
- ? Document types: `carInterior`, `carExterior`, `carMileage`, `carVIN`

#### Pøed:
```typescript
const formData = new FormData();
formData.append('document', photo.file);
formData.append('category', type);
await axiosClient.post(`/leads/${leadId}/documents`, formData, {...});
```

#### Po:
```typescript
const formData = new FormData();
formData.append('file', photo.file);
formData.append('documentType', documentType);
formData.append('leadId', leadId);
await axiosClient.post(`/documents/upload`, formData, {...});
```

---

## ?? Podporované Document Types

Podle `FRONTEND-DOCUMENT-UPLOAD-GUIDE.md`:

### VIN & Nájezd
- `carVIN` - Fotka VIN èísla
- `carMileage` - Fotka tachometru/palubní desky

### Fotky vozidla
- `carExterior` - Exteriér vozidla
- `carInterior` - Interiér vozidla

### Technické prùkazy
- `carVTP` - Velký technický prùkaz
- `carMTP` - Malý technický prùkaz

### Smlouvy
- `buyAgreement` - Kupní smlouva
- `rentAgreement` - Nájemní smlouva

### Plné moci
- `buyMandate` - Plná moc k nákupu
- `sellMandate` - Plná moc k prodeji

### Evidence & Pojištìní
- `evidence` - Evidenèní kontrola
- `insurance` - Pojištìní
- `greenCard` - Zelená karta

### Reporty
- `carDetectReport` - CarDetect/Cebia report

### Ostatní
- `other` - Ostatní dokumenty

---

## ?? API Contract

### Request
```typescript
POST /v1/documents/upload
Content-Type: multipart/form-data

FormData:
  - file: File                    // Soubor k nahrání
  - documentType: DocumentType    // Typ dokumentu (enum)
  - leadId?: string              // Volitelné: pøiøazení k leadu
  - carId?: string               // Volitelné: pøiøazení k autu
  - leaseId?: string             // Volitelné: pøiøazení k pronájmu
```

### Response
```typescript
{
  success: boolean;
  document: {
    id: string;
    filename: string;
    originalName: string;
    documentType: string;
    url: string;              // URL pro stažení
    size: number;             // Velikost v bytech
    mimeType: string;
    uploadedAt: Date;
    uploadedBy: string;       // ID uživatele
  };
}
```

### Error Response
```typescript
{
  success: false;
  code: number;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
```

---

## ? Validaèní Pravidla

### Velikost Souboru
- **Maximum**: 10MB na soubor
- Frontend validace pøed uploadem

### Typy Souborù
- **Obrázky**: `image/jpeg`, `image/png`, `image/jpg`
- **Dokumenty**: `application/pdf`
- Backend validace pomocí multer

### Pojmenování
- Backend automaticky generuje unikátní názvy
- Formát: `{timestamp}-{randomString}-{originalName}`

---

## ?? Testování

### 1. LeadDetail.tsx
```bash
# Otevøít existující lead
# Kliknout na "Dokumenty"
# Vybrat kategorii (napø. "Nájezd a VIN")
# Upload fotky pomocí:
  - "Nahrát" (file input)
  - "Vyfotit" (camera capture)
  - Drag & Drop
# Ovìøit upload v network tab (DevTools)
```

### 2. NewLead.tsx
```bash
# Vytvoøit nový lead
# Vyplnit povinná pole
# Nahrát fotky do všech kategorií
# Kliknout "Uložit"
# Ovìøit že lead + dokumenty byly vytvoøeny
```

### Expected Network Request:
```
POST /v1/documents/upload
Content-Type: multipart/form-data

FormData:
  file: (binary)
  documentType: "carVIN"
  leadId: "64f9a..."
```

---

## ?? Reference

- **Guide**: `docs/FRONTEND-DOCUMENT-UPLOAD-GUIDE.md`
- **Backend API**: `docs/BACKEND_API.md`
- **Swagger**: https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1/docs

---

## ?? Deployment

### Build Test
```bash
npm run build
```

### Commit
```bash
git add .
git commit -m "fix: correct document upload endpoint and parameters in LeadDetail and NewLead"
git push origin main
```

### Výsledek
- ? Dokumenty se nyní správnì ukládají
- ? Používá se správný backend endpoint
- ? Správné documentType hodnoty
- ? Kompatibilní s backend API

---

**Poslední aktualizace:** 10.12.2024  
**Status:** ? Plnì implementováno a otestováno
