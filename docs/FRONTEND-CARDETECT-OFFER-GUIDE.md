# Frontend Developer Guide: CarDetect Offer Generation

## ?? Pøehled

Tento guide poskytuje kompletní návod pro implementaci generování CarDetect nabídek (offer documents) ve frontendové aplikaci s napojením na Car Back-Rent API.

---

## ?? Obsah

1. [Co je CarDetect Offer](#co-je-cardetect-offer)
2. [Backend Architektura](#backend-architektura)
3. [API Endpoints](#api-endpoints)
4. [Frontend Implementace](#frontend-implementace)
5. [Data Models](#data-models)
6. [Validaèní Pravidla](#validaèní-pravidla)
7. [Pøíklady Použití](#pøíklady-použití)
8. [Error Handling](#error-handling)
9. [Troubleshooting](#troubleshooting)

---

## Co je CarDetect Offer

**CarDetect Offer** je oficiální nabídkový dokument, který je generován automaticky z dat leadu a obsahuje:

- ?? Informace o zákazníkovi (jméno, adresa, kontakty)
- ?? Detaily vozidla (znaèka, model, rok, VIN, nájezd, SPZ)
- ?? Nabídnutou èástku (offer)
- ?? Délku leasingu
- ?? Mìsíèní splátku (rent)
- ?? Datum vytvoøení nabídky
- ?? Unikátní ID leadu

Dokument je generován ve formátu **PDF** nebo **DOCX** a mùže být:
- Stažen pro lokální zobrazení
- Odeslán zákazníkovi emailem
- Vytisknut
- Pøipojen k leadu jako dokument

---

## Backend Architektura

### Document Service

**Umístìní:** `src/modules/document/document.service.ts`

**Klíèové funkce:**

```typescript
export const gemerateOfferDocument = async (
  offerDocumentTemplate: IOfferDocumentTemplate
): Promise<IDocument>
```

### Template System

**Šablona:** `/home/templates/offer.docx`

Šablona používá **placeholder syntax** s `{}`:

```
{customerName}
{customerAddress}
{carBrand} {carModel}
{offer} Kè
{rent} Kè/mìsíc
```

### Konverzní Flow

```
DOCX šablona + Data ? docx-templates ? DOCX soubor ? LibreOffice ? PDF soubor
```

---

## API Endpoints

### Base URL

```typescript
// Production
const API_BASE_URL = 'https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1';

// Development
const API_BASE_URL = 'http://localhost:8080/v1';
```

### Generate Offer Endpoint

```
POST /v1/document/generateOfferDocument
```

### Required Headers

```typescript
{
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
}
```

### Required Permission

```typescript
'generateDocuments'  // Role: ADMIN, FINANCE_DIRECTOR, SUPERVISOR, SALES, OS
```

---

## Data Models

### IOfferDocumentTemplate

```typescript
interface IOfferDocumentTemplate {
  // Identifikátory
  uniqueId: number;                    // Lead ID (napø. 100123)
  
  // Zákazník - Fyzická osoba
  customerName?: string;               // Jméno a pøíjmení (napø. "Jan Novák")
  
  // Zákazník - Firma (alternativa)
  customerCompanyName?: string;        // Název firmy (napø. "ACME s.r.o.")
  
  // Kontaktní údaje zákazníka
  customerAddress: string;             // Celá adresa (ulice + èíslo popisné)
  customerEmail?: string;              // Email
  customerPhone?: string;              // Telefon
  
  // Vozidlo
  carBrand: string;                    // Znaèka (napø. "Škoda")
  carModel: string;                    // Model (napø. "Octavia")
  carRegistration?: number;            // Rok registrace (napø. 2018)
  carSPZ?: string;                     // SPZ (napø. "1AB 2345")
  carVIN?: string;                     // VIN kód
  carMileage?: number;                 // Nájezd v km (napø. 85000)
  
  // Finanèní podmínky
  offer: number;                       // Nabídnutá èástka (napø. 120000)
  leaseLength: number;                 // Délka leasingu v mìsících (napø. 6)
  rent: number;                        // Mìsíèní splátka (napø. 5000)
  
  // Nastavení generování
  generatePDF: boolean;                // true = PDF, false = DOCX
}
```

### Request Body Example

```typescript
{
  "uniqueId": 100123,
  "customerName": "Jan Novák",
  "customerAddress": "Hlavní 123, 110 00 Praha 1",
  "customerEmail": "jan.novak@email.cz",
  "customerPhone": "+420 777 123 456",
  "carBrand": "Škoda",
  "carModel": "Octavia",
  "carRegistration": 2018,
  "carSPZ": "1AB 2345",
  "carVIN": "TMBJB6NE7J0123456",
  "carMileage": 85000,
  "offer": 120000,
  "leaseLength": 6,
  "rent": 5000,
  "generatePDF": true
}
```

### Response Structure

```typescript
interface IDocument {
  _id: string;                         // Document ID
  documentType: DocumentType;          // 'offer'
  file: string;                        // Název souboru (napø. "507f1f77bcf86cd799439011.pdf")
  name?: string;                       // Volitelný popisný název
}
```

### Response Example

```typescript
{
  "_id": "507f1f77bcf86cd799439011",
  "documentType": "offer",
  "file": "507f1f77bcf86cd799439011.pdf"
}
```

---

## Frontend Implementace

### React Component - Offer Generator

```typescript
import React, { useState } from 'react';
import moment from 'moment';

interface OfferGeneratorProps {
  leadId: string;
  leadData: any;  // Lead object from API
  apiBaseUrl: string;
  accessToken: string;
  onSuccess?: (document: IDocument) => void;
}

const OfferGenerator: React.FC<OfferGeneratorProps> = ({
  leadId,
  leadData,
  apiBaseUrl,
  accessToken,
  onSuccess
}) => {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedDocument, setGeneratedDocument] = useState<IDocument | null>(null);

  const generateOffer = async (generatePDF: boolean = true) => {
    setGenerating(true);
    setError(null);

    try {
      // Prepare request body from lead data
      const requestBody = {
        uniqueId: leadData.uniqueId,
        customerName: leadData.customer?.name,
        customerCompanyName: leadData.customer?.companyName,
        customerAddress: leadData.customer?.address,
        customerEmail: leadData.customer?.email,
        customerPhone: leadData.customer?.phone,
        carBrand: leadData.car?.brand,
        carModel: leadData.car?.model,
        carRegistration: leadData.car?.registration,
        carSPZ: leadData.car?.carSPZ,
        carVIN: leadData.car?.VIN,
        carMileage: leadData.car?.mileage,
        offer: leadData.lease?.offer,
        leaseLength: leadData.lease?.rentDuration || 6,
        rent: leadData.lease?.monthlyPayment,
        generatePDF: generatePDF
      };

      const response = await fetch(
        `${apiBaseUrl}/document/generateOfferDocument`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate offer');
      }

      const document = await response.json();
      setGeneratedDocument(document);
      onSuccess?.(document);

    } catch (err) {
      console.error('Offer generation error:', err);
      setError(err instanceof Error ? err.message : 'Chyba pøi generování nabídky');
    } finally {
      setGenerating(false);
    }
  };

  const downloadOffer = () => {
    if (!generatedDocument) return;
    
    const downloadUrl = `${apiBaseUrl}/document/template/download/${generatedDocument.file}`;
    window.open(downloadUrl, '_blank');
  };

  const previewOffer = () => {
    if (!generatedDocument) return;
    
    const previewUrl = `${apiBaseUrl}/document/template/download/${generatedDocument.file}`;
    window.open(previewUrl, '_blank');
  };

  return (
    <div className="offer-generator">
      <h3>Generování nabídky</h3>

      {/* Lead Info Summary */}
      <div className="lead-summary">
        <p><strong>Lead ID:</strong> {leadData.uniqueId}</p>
        <p><strong>Zákazník:</strong> {leadData.customer?.name || leadData.customer?.companyName}</p>
        <p><strong>Vozidlo:</strong> {leadData.car?.brand} {leadData.car?.model}</p>
        <p><strong>Nabídka:</strong> {leadData.lease?.offer?.toLocaleString('cs-CZ')} Kè</p>
        <p><strong>Mìsíèní splátka:</strong> {leadData.lease?.monthlyPayment?.toLocaleString('cs-CZ')} Kè</p>
        <p><strong>Délka leasingu:</strong> {leadData.lease?.rentDuration || 6} mìsícù</p>
      </div>

      {/* Generation Buttons */}
      <div className="generation-actions">
        <button
          className="btn-generate-pdf"
          onClick={() => generateOffer(true)}
          disabled={generating}
        >
          {generating ? 'Generuji PDF...' : 'Vygenerovat PDF'}
        </button>

        <button
          className="btn-generate-docx"
          onClick={() => generateOffer(false)}
          disabled={generating}
        >
          {generating ? 'Generuji DOCX...' : 'Vygenerovat DOCX'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          ?? {error}
        </div>
      )}

      {/* Success - Document Actions */}
      {generatedDocument && (
        <div className="document-actions">
          <div className="success-message">
            ? Nabídka byla úspìšnì vygenerována!
          </div>

          <div className="action-buttons">
            <button className="btn-preview" onClick={previewOffer}>
              ??? Zobrazit náhled
            </button>
            <button className="btn-download" onClick={downloadOffer}>
              ?? Stáhnout dokument
            </button>
          </div>

          <div className="document-info">
            <p><strong>ID dokumentu:</strong> {generatedDocument._id}</p>
            <p><strong>Soubor:</strong> {generatedDocument.file}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfferGenerator;
```

### CSS Styling

```css
.offer-generator {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.offer-generator h3 {
  margin-bottom: 20px;
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.lead-summary {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 20px;
}

.lead-summary p {
  margin: 8px 0;
  font-size: 14px;
  color: #555;
}

.lead-summary strong {
  color: #333;
  margin-right: 8px;
}

.generation-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.btn-generate-pdf,
.btn-generate-docx {
  flex: 1;
  background: #e62e2d;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px 20px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-generate-pdf:hover:not(:disabled),
.btn-generate-docx:hover:not(:disabled) {
  background: #c62524;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(230, 46, 45, 0.3);
}

.btn-generate-pdf:disabled,
.btn-generate-docx:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
}

.document-actions {
  border-top: 1px solid #e0e0e0;
  padding-top: 20px;
}

.success-message {
  background: #d4edda;
  color: #155724;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.btn-preview,
.btn-download {
  flex: 1;
  background: white;
  color: #333;
  border: 2px solid #e62e2d;
  border-radius: 6px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-preview:hover,
.btn-download:hover {
  background: #e62e2d;
  color: white;
  transform: translateY(-2px);
}

.document-info {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 12px;
}

.document-info p {
  margin: 6px 0;
  font-size: 13px;
  color: #666;
}

.document-info strong {
  color: #333;
}
```

---

## Validaèní Pravidla

### Povinná Pole

```typescript
const requiredFields = {
  uniqueId: 'number',        // Lead ID
  customerAddress: 'string', // Adresa zákazníka
  carBrand: 'string',        // Znaèka vozu
  carModel: 'string',        // Model vozu
  offer: 'number',           // Nabídnutá èástka
  leaseLength: 'number',     // Délka leasingu
  rent: 'number',            // Mìsíèní splátka
  generatePDF: 'boolean'     // Formát dokumentu
};
```

### Validaèní Funkce

```typescript
const validateOfferData = (data: any): string[] => {
  const errors: string[] = [];

  // Kontrola povinných polí
  if (!data.uniqueId || typeof data.uniqueId !== 'number') {
    errors.push('Lead ID je povinné a musí být èíslo');
  }

  if (!data.customerAddress || data.customerAddress.trim().length === 0) {
    errors.push('Adresa zákazníka je povinná');
  }

  // Kontrola zákazníka - buï jméno nebo název firmy
  if (!data.customerName && !data.customerCompanyName) {
    errors.push('Je nutné zadat jméno zákazníka nebo název firmy');
  }

  if (!data.carBrand || data.carBrand.trim().length === 0) {
    errors.push('Znaèka vozidla je povinná');
  }

  if (!data.carModel || data.carModel.trim().length === 0) {
    errors.push('Model vozidla je povinný');
  }

  // Validace finanèních èástek
  if (!data.offer || data.offer <= 0) {
    errors.push('Nabídka musí být kladné èíslo');
  }

  if (!data.rent || data.rent <= 0) {
    errors.push('Mìsíèní splátka musí být kladné èíslo');
  }

  if (!data.leaseLength || data.leaseLength <= 0) {
    errors.push('Délka leasingu musí být kladné èíslo');
  }

  // Validace logiky
  if (data.rent && data.offer && data.leaseLength) {
    const totalPayments = data.rent * data.leaseLength;
    if (totalPayments < data.offer * 0.5) {
      errors.push('Celková suma splátek je pøíliš nízká vzhledem k nabídce');
    }
  }

  return errors;
};
```

---

## Pøíklady Použití

### Pøíklad 1: Základní Použití

```typescript
import React from 'react';
import OfferGenerator from './components/OfferGenerator';

const LeadDetailPage: React.FC = () => {
  const [lead, setLead] = useState(null);
  const accessToken = localStorage.getItem('accessToken');

  const handleOfferSuccess = (document: IDocument) => {
    console.log('Offer generated:', document);
    // Aktualizovat lead s vygenerovaným dokumentem
    updateLeadWithOffer(lead.id, document);
  };

  if (!lead) return <div>Loading...</div>;

  return (
    <div className="lead-detail">
      <h1>Lead #{lead.uniqueId}</h1>
      
      {/* ... další obsah ... */}

      <OfferGenerator
        leadId={lead._id}
        leadData={lead}
        apiBaseUrl="https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1"
        accessToken={accessToken}
        onSuccess={handleOfferSuccess}
      />
    </div>
  );
};
```

### Pøíklad 2: Custom Hook pro Offer Generation

```typescript
import { useState, useCallback } from 'react';

interface UseOfferGeneratorOptions {
  apiBaseUrl: string;
  accessToken: string;
}

export const useOfferGenerator = (options: UseOfferGeneratorOptions) => {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [document, setDocument] = useState<IDocument | null>(null);

  const generateOffer = useCallback(async (
    leadData: any,
    generatePDF: boolean = true
  ) => {
    setGenerating(true);
    setError(null);
    setDocument(null);

    try {
      // Validace dat
      const errors = validateOfferData(leadData);
      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }

      const requestBody = {
        uniqueId: leadData.uniqueId,
        customerName: leadData.customer?.name,
        customerCompanyName: leadData.customer?.companyName,
        customerAddress: leadData.customer?.address,
        customerEmail: leadData.customer?.email,
        customerPhone: leadData.customer?.phone,
        carBrand: leadData.car?.brand,
        carModel: leadData.car?.model,
        carRegistration: leadData.car?.registration,
        carSPZ: leadData.car?.carSPZ,
        carVIN: leadData.car?.VIN,
        carMileage: leadData.car?.mileage,
        offer: leadData.lease?.offer,
        leaseLength: leadData.lease?.rentDuration || 6,
        rent: leadData.lease?.monthlyPayment,
        generatePDF
      };

      const response = await fetch(
        `${options.apiBaseUrl}/document/generateOfferDocument`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${options.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Chyba pøi generování nabídky');
      }

      const generatedDoc = await response.json();
      setDocument(generatedDoc);
      return generatedDoc;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Neznámá chyba';
      setError(errorMessage);
      throw err;
    } finally {
      setGenerating(false);
    }
  }, [options.apiBaseUrl, options.accessToken]);

  const downloadDocument = useCallback((doc: IDocument) => {
    const downloadUrl = `${options.apiBaseUrl}/document/template/download/${doc.file}`;
    window.open(downloadUrl, '_blank');
  }, [options.apiBaseUrl]);

  const previewDocument = useCallback((doc: IDocument) => {
    const previewUrl = `${options.apiBaseUrl}/document/template/download/${doc.file}`;
    window.open(previewUrl, '_blank');
  }, [options.apiBaseUrl]);

  return {
    generating,
    error,
    document,
    generateOffer,
    downloadDocument,
    previewDocument
  };
};
```

### Pøíklad 3: Bulk Offer Generation

```typescript
const BulkOfferGenerator: React.FC<{ leads: any[] }> = ({ leads }) => {
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const { generateOffer } = useOfferGenerator({
    apiBaseUrl: API_BASE_URL,
    accessToken: localStorage.getItem('accessToken') || ''
  });

  const generateOffers = async () => {
    setProgress(0);
    setResults([]);

    for (let i = 0; i < leads.length; i++) {
      try {
        const doc = await generateOffer(leads[i], true);
        setResults(prev => [...prev, { leadId: leads[i]._id, success: true, document: doc }]);
      } catch (error) {
        setResults(prev => [...prev, { leadId: leads[i]._id, success: false, error }]);
      }
      setProgress(Math.round(((i + 1) / leads.length) * 100));
    }
  };

  return (
    <div className="bulk-generator">
      <h3>Hromadné generování nabídek</h3>
      <p>Poèet leadù: {leads.length}</p>
      <button onClick={generateOffers}>Vygenerovat všechny nabídky</button>
      
      {progress > 0 && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
          <span>{progress}%</span>
        </div>
      )}

      {results.length > 0 && (
        <div className="results">
          <p>Úspìšných: {results.filter(r => r.success).length}</p>
          <p>Chybných: {results.filter(r => !r.success).length}</p>
        </div>
      )}
    </div>
  );
};
```

---

## Error Handling

### Bìžné Chyby

| Status Code | Význam | Øešení |
|-------------|--------|--------|
| 400 | Chybná data | Zkontrolovat požadovaná pole |
| 401 | Neplatný token | Znovu se pøihlásit |
| 403 | Nedostateèná oprávnìní | Kontaktovat administrátora |
| 404 | Šablona nenalezena | Kontaktovat backend team |
| 500 | Serverová chyba | Zkusit znovu, kontaktovat support |

### Error Response Format

```typescript
interface ErrorResponse {
  code: number;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
```

### Error Handling Component

```typescript
const ErrorDisplay: React.FC<{ error: string | null }> = ({ error }) => {
  if (!error) return null;

  return (
    <div className="error-display">
      <div className="error-icon">??</div>
      <div className="error-content">
        <h4>Chyba pøi generování nabídky</h4>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Zkusit znovu
        </button>
      </div>
    </div>
  );
};
```

---

## Troubleshooting

### Problém 1: Dokument se nevygeneruje

**Pøíznaky:**
- Request vrací 500 error
- Timeout pøi generování

**Možné pøíèiny:**
1. LibreOffice není nainstalován na serveru
2. Šablona chybí nebo je poškozená
3. Nedostatek pamìti na serveru

**Øešení:**
```bash
# Na serveru zkontrolovat LibreOffice
which libreoffice

# Zkontrolovat šablonu
ls -la /home/templates/offer.docx

# Zkontrolovat logy
tail -f /var/log/app/app.log
```

### Problém 2: Nesprávná data v dokumentu

**Pøíznaky:**
- Dokument je vygenerován, ale obsahuje prázdná pole
- Data se nezobrazují správnì

**Možné pøíèiny:**
1. Chybìjící data v request body
2. Nesprávné názvy promìnných v šablonì
3. Problém s formátováním dat

**Øešení:**
```typescript
// Pøed generováním provést validaci
const validateBeforeGenerate = (leadData: any) => {
  console.log('Lead data:', JSON.stringify(leadData, null, 2));
  
  const required = ['uniqueId', 'customer', 'car', 'lease'];
  const missing = required.filter(key => !leadData[key]);
  
  if (missing.length > 0) {
    throw new Error(`Chybìjící data: ${missing.join(', ')}`);
  }
};
```

### Problém 3: PDF/DOCX se nestahuje

**Pøíznaky:**
- Dokument je vygenerován, ale download selhává
- 404 error pøi pokusu o stažení

**Možné pøíèiny:**
1. Nesprávná cesta k dokumentu
2. Soubor byl smazán (temp cleanup)
3. Nedostateèná oprávnìní k souboru

**Øešení:**
```typescript
// Ovìøit existenci dokumentu pøed stažením
const verifyDocumentExists = async (documentId: string) => {
  try {
    const response = await fetch(
      `${apiBaseUrl}/document/template/download/${documentId}`,
      { method: 'HEAD' }
    );
    return response.ok;
  } catch {
    return false;
  }
};
```

### Problém 4: Pomalé generování

**Pøíznaky:**
- Generování trvá více než 10 sekund
- Timeout errors

**Možné pøíèiny:**
1. LibreOffice konverze je pomalá
2. Velká šablona
3. Vysoké zatížení serveru

**Øešení:**
```typescript
// Pøidat timeout a retry logiku
const generateOfferWithRetry = async (
  leadData: any,
  maxRetries = 3,
  timeout = 30000
) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(
        `${apiBaseUrl}/document/generateOfferDocument`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(leadData),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

---

## Best Practices

### 1. Vždy validovat data pøed odesláním

```typescript
if (!leadData.customer?.name && !leadData.customer?.companyName) {
  showError('Je nutné zadat jméno zákazníka nebo název firmy');
  return;
}
```

### 2. Používat loading states

```typescript
const [generating, setGenerating] = useState(false);

// Zakázat tlaèítko bìhem generování
<button disabled={generating}>
  {generating ? 'Generuji...' : 'Vygenerovat nabídku'}
</button>
```

### 3. Implementovat error recovery

```typescript
try {
  await generateOffer(leadData);
} catch (error) {
  // Log error pro debugging
  console.error('Generation failed:', error);
  
  // Nabídnout retry
  if (confirm('Generování selhalo. Zkusit znovu?')) {
    await generateOffer(leadData);
  }
}
```

### 4. Cache vygenerované dokumenty

```typescript
const documentCache = new Map<string, IDocument>();

const getCachedOrGenerate = async (leadId: string) => {
  if (documentCache.has(leadId)) {
    return documentCache.get(leadId);
  }
  
  const doc = await generateOffer(leadData);
  documentCache.set(leadId, doc);
  return doc;
};
```

---

## Další Zdroje

### Související Dokumentace

- [Document Upload Guide](./FRONTEND-DOCUMENT-UPLOAD-GUIDE.md)
- [Complete Frontend Guide](./FRONTEND-COMPLETE-GUIDE.md)
- [API Endpoints Reference](./API-ENDPOINTS-REFERENCE.md)

### Backend Kód

- `src/modules/document/document.service.ts` - Document generation logic
- `src/modules/document/document.controller.ts` - API endpoints
- `src/routes/v1/document.route.ts` - Route definitions

### Šablony

- `/home/templates/offer.docx` - Šablona pro nabídku

---

## Checklist Implementace

- [ ] Získat data z leadu
- [ ] Validovat povinná pole
- [ ] Implementovat loading state
- [ ] Volat API endpoint s správnými daty
- [ ] Zpracovat response
- [ ] Implementovat download funkci
- [ ] Implementovat preview funkci
- [ ] Pøidat error handling
- [ ] Testovat s rùznými typy zákazníkù (fyzická osoba vs firma)
- [ ] Testovat generování PDF i DOCX
- [ ] Ovìøit funkènost na production prostøedí

---

**Poslední aktualizace:** 2024  
**Verze:** 1.0.0
