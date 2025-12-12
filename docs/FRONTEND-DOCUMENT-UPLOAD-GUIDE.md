# Frontend Developer Guide: Document Upload System

## ?? Pøehled Systému

Tento guide poskytuje kompletní návod pro implementaci uploadu dokumentù ve frontendové aplikaci s napojením na Car Back-Rent API.

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

### Document Service Funkce

Umístìní: `src/modules/document/document.service.ts`

**Klíèové funkce:**
- **Template Generation**: Použití `docx-templates` pro vyplnìní DOCX šablon, konverze do PDF pøes LibreOffice
- **Templates location**: `/home/templates/` (buy_agreement, rent_agreement, sell_mandate, buy_mandate, offer)
- **Upload**: `uploadDocument(documentType, file)` ukládá do `documentsStorageDir`
- **Download**: `downloadDocument(documentFile)` vrací absolutní cestu
- **URL Import**: `createDocumentFromUrl()` stahuje externí obrázky (fotky leadù)

---

## Podporované Typy Dokumentù

Definováno v `src/modules/document/document.types.ts`:

```typescript
export enum DocumentType {
  // VIN & Nájezd
  CAR_VIN = 'carVIN',
  CAR_MILEAGE = 'carMileage',
  
  // Fotky vozidla
  CAR_EXTERIOR = 'carExterior',
  CAR_INTERIOR = 'carInterior',
  
  // Technické prùkazy
  CAR_VTP = 'carVTP',           // Velký technický prùkaz
  CAR_MTP = 'carMTP',           // Malý technický prùkaz
  
  // Smlouvy
  BUY_AGREEMENT = 'buyAgreement',
  RENT_AGREEMENT = 'rentAgreement',
  
  // Plné moci
  BUY_MANDATE = 'buyMandate',
  SELL_MANDATE = 'sellMandate',
  
  // Evidence & Pojištìní
  EVIDENCE = 'evidence',
  INSURANCE = 'insurance',
  GREEN_CARD = 'greenCard',
  
  // Reporty
  CAR_DETECT_REPORT = 'carDetectReport',
  
  // Ostatní
  OTHER = 'other'
}
```

### Kategorie Dokumentù pro UI

```typescript
const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  { id: 'vin', label: 'Nájezd a VIN', documentType: 'carVIN', multiple: true },
  { id: 'evidence', label: 'Evidenèní kontrola', documentType: 'carVTP', multiple: true },
  { id: 'technical', label: 'Technické prùkazy', documentType: 'carMTP', multiple: true },
  { id: 'physical', label: 'Fyzická kontrola', documentType: 'carExterior', multiple: true },
  { id: 'contracts', label: 'Smlouvy', documentType: 'buyAgreement', multiple: true },
  { id: 'green-card', label: 'Zelená karta', documentType: 'greenCard', multiple: false },
  { id: 'full-power', label: 'Plná moc', documentType: 'buyMandate', multiple: true },
  { id: 'sale', label: 'Pøi prodeji', documentType: 'sellMandate', multiple: true },
  { id: 'insurance', label: 'Pojištìní', documentType: 'insurance', multiple: true },
  { id: 'other', label: 'Ostatní dokumenty', documentType: 'other', multiple: true },
  { id: 'cardetect', label: 'Cebia a CarDetect', documentType: 'carDetectReport', multiple: false }
];
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

### Upload Endpoint

```
POST /v1/documents/upload
```

### Required Headers

```typescript
{
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'multipart/form-data'
}
```

---

## Frontend Implementace

### React Component s Multiple File Upload

```typescript
import React, { useState } from 'react';

interface DocumentCategory {
  id: string;
  label: string;
  documentType: string;
  multiple?: boolean;  // Nìkteré kategorie podporují více souborù
}

const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  { id: 'vin', label: 'Nájezd a VIN', documentType: 'carVIN', multiple: true },
  { id: 'evidence', label: 'Evidenèní kontrola', documentType: 'carVTP', multiple: true },
  { id: 'technical', label: 'Technické prùkazy', documentType: 'carMTP', multiple: true },
  { id: 'physical', label: 'Fyzická kontrola', documentType: 'carExterior', multiple: true },
  { id: 'contracts', label: 'Smlouvy', documentType: 'buyAgreement', multiple: true },
  { id: 'green-card', label: 'Zelená karta', documentType: 'greenCard', multiple: false },
  { id: 'full-power', label: 'Plná moc', documentType: 'buyMandate', multiple: true },
  { id: 'sale', label: 'Pøi prodeji', documentType: 'sellMandate', multiple: true },
  { id: 'insurance', label: 'Pojištìní', documentType: 'insurance', multiple: true },
  { id: 'other', label: 'Ostatní dokumenty', documentType: 'other', multiple: true },
  { id: 'cardetect', label: 'Cebia a CarDetect', documentType: 'carDetectReport', multiple: false }
];

interface DocumentUploadProps {
  leadId: string;
  apiBaseUrl: string;
  accessToken: string;
  onUploadComplete?: (category: string, files: UploadedFile[]) => void;
}

interface UploadedFile {
  documentType: string;
  filename: string;
  url: string;
  uploadedAt: Date;
}

const DocumentUploadModal: React.FC<DocumentUploadProps> = ({
  leadId,
  apiBaseUrl,
  accessToken,
  onUploadComplete
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedFiles([]);
    setError(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const category = DOCUMENT_CATEGORIES.find(cat => cat.id === selectedCategory);
    
    if (category && !category.multiple && files.length > 1) {
      setError('Tato kategorie podporuje pouze jeden soubor');
      return;
    }

    // Validace formátù
    const validFormats = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    const invalidFiles = files.filter(file => !validFormats.includes(file.type));
    
    if (invalidFiles.length > 0) {
      setError('Podporované formáty: JPG, PNG, PDF');
      return;
    }

    // Validace velikosti (max 10MB per file)
    const maxSize = 10 * 1024 * 1024;
    const oversizedFiles = files.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      setError('Maximální velikost souboru je 10MB');
      return;
    }

    setSelectedFiles(files);
    setError(null);
  };

  const uploadFiles = async () => {
    if (!selectedCategory || selectedFiles.length === 0) {
      return;
    }

    const category = DOCUMENT_CATEGORIES.find(cat => cat.id === selectedCategory);
    if (!category) return;

    setUploading(true);
    setError(null);

    try {
      const uploadedFiles: UploadedFile[] = [];

      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', category.documentType);
        formData.append('leadId', leadId);

        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: percentComplete
            }));
          }
        });

        // Upload file
        const uploadPromise = new Promise<UploadedFile>((resolve, reject) => {
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const response = JSON.parse(xhr.responseText);
              resolve({
                documentType: category.documentType,
                filename: file.name,
                url: response.url,
                uploadedAt: new Date()
              });
            } else {
              reject(new Error(`Upload failed: ${xhr.statusText}`));
            }
          });

          xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'));
          });

          xhr.open('POST', `${apiBaseUrl}/documents/upload`);
          xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
          xhr.send(formData);
        });

        const uploadedFile = await uploadPromise;
        uploadedFiles.push(uploadedFile);
      }

      // Success
      onUploadComplete?.(selectedCategory, uploadedFiles);
      setSelectedFiles([]);
      setSelectedCategory(null);
      setUploadProgress({});
      
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Chyba pøi nahrávání dokumentù');
    } finally {
      setUploading(false);
    }
  };

  const currentCategory = DOCUMENT_CATEGORIES.find(cat => cat.id === selectedCategory);

  return (
    <div className="document-upload-modal">
      <div className="modal-header">
        <h2>Dokumenty</h2>
      </div>

      {!selectedCategory ? (
        // Category Selection View
        <div className="category-grid">
          {DOCUMENT_CATEGORIES.map(category => (
            <button
              key={category.id}
              className="category-button"
              onClick={() => handleCategoryClick(category.id)}
            >
              {category.label}
            </button>
          ))}
          <button className="close-button" onClick={() => {}}>
            Zavøít
          </button>
        </div>
      ) : (
        // File Upload View
        <div className="upload-view">
          <div className="upload-header">
            <button 
              className="back-button" 
              onClick={() => setSelectedCategory(null)}
            >
              ? Zpìt
            </button>
            <h3>{currentCategory?.label}</h3>
          </div>

          <div className="file-input-area">
            <input
              type="file"
              multiple={currentCategory?.multiple}
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              onChange={handleFileSelect}
              disabled={uploading}
              id="file-input"
              style={{ display: 'none' }}
            />
            <label htmlFor="file-input" className="file-input-label">
              {selectedFiles.length === 0 ? (
                <div>
                  <p>Kliknìte pro výbìr souborù</p>
                  <p className="hint">
                    Podporované formáty: JPG, PNG, PDF (max 10MB)
                  </p>
                  {currentCategory?.multiple && (
                    <p className="hint">Mùžete vybrat více souborù najednou</p>
                  )}
                </div>
              ) : (
                <div className="selected-files">
                  <p>Vybrané soubory:</p>
                  <ul>
                    {selectedFiles.map((file, idx) => (
                      <li key={idx}>
                        {file.name} ({(file.size / 1024).toFixed(2)} KB)
                        {uploading && uploadProgress[file.name] !== undefined && (
                          <div className="progress-bar">
                            <div 
                              className="progress-fill"
                              style={{ width: `${uploadProgress[file.name]}%` }}
                            />
                            <span>{uploadProgress[file.name].toFixed(0)}%</span>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </label>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="upload-actions">
            <button
              className="upload-button"
              onClick={uploadFiles}
              disabled={selectedFiles.length === 0 || uploading}
            >
              {uploading ? 'Nahrávám...' : `Nahrát ${selectedFiles.length} ${selectedFiles.length === 1 ? 'soubor' : 'souborù'}`}
            </button>
            <button
              className="cancel-button"
              onClick={() => {
                setSelectedCategory(null);
                setSelectedFiles([]);
              }}
              disabled={uploading}
            >
              Zrušit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUploadModal;
```

---

## CSS Styling

```css
.document-upload-modal {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 700px;
  margin: 0 auto;
}

.modal-header h2 {
  text-align: center;
  margin-bottom: 24px;
  font-size: 24px;
  font-weight: 600;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.category-button {
  background: #e62e2d;
  color: white;
  border: none;
  border-radius: 24px;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.category-button:hover {
  background: #c62524;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(230, 46, 45, 0.3);
}

.close-button {
  grid-column: 1 / -1;
  background: #5a6c7d;
  color: white;
  border: none;
  border-radius: 24px;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 12px;
}

.upload-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.upload-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-button {
  background: none;
  border: none;
  color: #e62e2d;
  font-size: 16px;
  cursor: pointer;
  padding: 8px;
}

.file-input-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 32px;
  text-align: center;
  transition: all 0.2s;
}

.file-input-area:hover {
  border-color: #e62e2d;
  background: #fef5f5;
}

.file-input-label {
  cursor: pointer;
  display: block;
}

.file-input-label .hint {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
}

.selected-files ul {
  list-style: none;
  padding: 0;
  margin: 12px 0;
  text-align: left;
}

.selected-files li {
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 8px;
  font-size: 14px;
}

.progress-bar {
  margin-top: 8px;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: #e62e2d;
  transition: width 0.3s ease;
}

.progress-bar span {
  position: absolute;
  right: 8px;
  top: -20px;
  font-size: 12px;
  color: #666;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
}

.upload-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.upload-button {
  background: #e62e2d;
  color: white;
  border: none;
  border-radius: 24px;
  padding: 14px 32px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.upload-button:hover:not(:disabled) {
  background: #c62524;
  box-shadow: 0 4px 12px rgba(230, 46, 45, 0.3);
}

.cancel-button {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 24px;
  padding: 14px 32px;
  font-size: 16px;
  cursor: pointer;
}
```

---

## Backend API Contract

### Upload Request

```typescript
// POST /v1/documents/upload
// Content-Type: multipart/form-data

interface UploadRequest {
  file: File;                    // Soubor k nahrání
  documentType: DocumentType;    // Jedna z hodnot enum
  leadId?: string;              // Volitelné: pøiøazení k leadu
  carId?: string;               // Volitelné: pøiøazení k vozidlu
  leaseId?: string;             // Volitelné: pøiøazení k leasingu
}
```

### Upload Response

```typescript
interface UploadResponse {
  success: boolean;
  document: {
    id: string;
    filename: string;
    originalName: string;
    documentType: string;
    url: string;              // URL pro stažení
    size: number;             // Velikost souboru v bytech
    mimeType: string;
    uploadedAt: Date;
    uploadedBy: string;       // ID uživatele
  };
}
```

### Error Response

```typescript
interface ErrorResponse {
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

## Validaèní Pravidla

### Velikost Souboru

- **Maximum**: 10MB na soubor
- **Backend config**: `config.storage.maxFileSize`

### Typy Souborù

- **Obrázky**: `image/jpeg`, `image/png`, `image/jpg`
- **Dokumenty**: `application/pdf`
- **Backend validace**: Použití multer s file filtrem

### Pojmenování Souborù

- Backend automaticky generuje unikátní názvy souborù
- Formát: `{timestamp}-{randomString}-{originalName}`
- Speciální znaky jsou sanitizovány

---

## Bezpeènostní Opatøení

### 1. Autentizace

```typescript
// Vždy zahrnout access token
headers: {
  'Authorization': `Bearer ${accessToken}`
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
  
  // Kontrola názvu souboru
  if (file.name.length > 255) {
    return false;
  }
  
  return true;
};
```

### 3. CORS Headers

Backend automaticky zpracovává CORS pro production doménu:
```
Access-Control-Allow-Origin: https://your-frontend-domain.com
```

---

## Kompletní Upload Flow

### Krok za krokem

1. **Uživatel klikne na kategorii** ? Otevøe se modal
2. **Uživatel vybere soubor(y)** ? Spustí se validace
3. **Uživatel klikne "Nahrát"** ? API volání s progress barem
4. **Backend zpracovává** ? Ukládá do Azure Blob Storage
5. **Backend vrátí URL** ? Aktualizace UI
6. **Pøiøazení k Lead/Car/Lease** ? Aktualizace databáze

### Flow Diagram

```
???????????????????
?  User Action    ?
?  Select Category?
???????????????????
         ?
         ?
???????????????????
?  File Selection ?
?  Validation     ?
???????????????????
         ?
         ?
???????????????????
?  Upload Start   ?
?  Progress Track ?
???????????????????
         ?
         ?
???????????????????
?  Backend Save   ?
?  Azure Blob     ?
???????????????????
         ?
         ?
???????????????????
?  Return URL     ?
?  Update UI      ?
???????????????????
         ?
         ?
???????????????????
?  Associate with ?
?  Lead/Car/Lease ?
???????????????????
```

---

## Pøíklady Použití

### Základní Použití

```typescript
const App = () => {
  const [accessToken, setAccessToken] = useState<string>('');
  
  useEffect(() => {
    // Získat access token z pøihlášení
    const token = localStorage.getItem('accessToken');
    if (token) setAccessToken(token);
  }, []);

  const handleUploadComplete = (category: string, files: UploadedFile[]) => {
    console.log(`Nahráno ${files.length} souborù do ${category}`);
    
    // Aktualizovat lead s URL dokumentù
    updateLeadDocuments(leadId, category, files);
    
    // Zobrazit úspìšnou zprávu
    alert(`Úspìšnì nahráno ${files.length} souborù`);
  };

  return (
    <DocumentUploadModal
      leadId="64f9a..."
      apiBaseUrl="https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1"
      accessToken={accessToken}
      onUploadComplete={handleUploadComplete}
    />
  );
};
```

### Pokroèilé Použití s Error Handling

```typescript
const AdvancedDocumentUpload: React.FC = () => {
  const [uploads, setUploads] = useState<Map<string, UploadStatus>>(new Map());
  
  const handleUploadWithRetry = async (
    category: string, 
    files: File[], 
    maxRetries = 3
  ) => {
    for (const file of files) {
      let retries = 0;
      let success = false;
      
      while (retries < maxRetries && !success) {
        try {
          await uploadSingleFile(file, category);
          success = true;
        } catch (error) {
          retries++;
          console.error(`Upload failed, attempt ${retries}/${maxRetries}`, error);
          
          if (retries < maxRetries) {
            // Exponential backoff
            await new Promise(resolve => 
              setTimeout(resolve, Math.pow(2, retries) * 1000)
            );
          }
        }
      }
      
      if (!success) {
        console.error(`Failed to upload ${file.name} after ${maxRetries} attempts`);
      }
    }
  };
  
  return (
    <DocumentUploadModal
      leadId={leadId}
      apiBaseUrl={apiBaseUrl}
      accessToken={accessToken}
      onUploadComplete={(category, files) => {
        handleUploadWithRetry(category, files);
      }}
    />
  );
};
```

### Custom Hook pro Document Management

```typescript
import { useState, useCallback } from 'react';

interface UseDocumentUploadOptions {
  apiBaseUrl: string;
  accessToken: string;
  onSuccess?: (files: UploadedFile[]) => void;
  onError?: (error: Error) => void;
}

export const useDocumentUpload = (options: UseDocumentUploadOptions) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  
  const uploadDocuments = useCallback(async (
    files: File[],
    documentType: string,
    leadId?: string
  ) => {
    setUploading(true);
    
    try {
      const uploadedFiles: UploadedFile[] = [];
      
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', documentType);
        if (leadId) formData.append('leadId', leadId);
        
        const response = await fetch(`${options.apiBaseUrl}/documents/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${options.accessToken}`
          },
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }
        
        const result = await response.json();
        uploadedFiles.push({
          documentType,
          filename: result.document.filename,
          url: result.document.url,
          uploadedAt: new Date(result.document.uploadedAt)
        });
      }
      
      options.onSuccess?.(uploadedFiles);
      return uploadedFiles;
      
    } catch (error) {
      options.onError?.(error as Error);
      throw error;
    } finally {
      setUploading(false);
    }
  }, [options]);
  
  return {
    uploadDocuments,
    uploading,
    progress
  };
};
```

---

## Checklist

### ? Implementaèní Checklist

- [ ] Použít správný `documentType` z enum
- [ ] Validovat velikost souboru (max 10MB)
- [ ] Validovat typ souboru (JPG, PNG, PDF)
- [ ] Zahrnout authentication header
- [ ] Zobrazit upload progress
- [ ] Øádnì zpracovat chyby
- [ ] Pøiøadit dokumenty k Lead/Car/Lease
- [ ] Aktualizovat UI po úspìšném uploadu
- [ ] Implementovat retry logiku pro selhané uploady
- [ ] Testovat na production i development prostøedí

### ? UX Checklist

- [ ] Zobrazit progress bar bìhem uploadu
- [ ] Zakázat tlaèítka bìhem uploadu
- [ ] Zobrazit chybové zprávy uživatelsky pøívìtivým zpùsobem
- [ ] Potvrdit úspìšný upload
- [ ] Umožnit uživateli zrušit upload
- [ ] Zobrazit náhled vybraných souborù
- [ ] Podporovat drag & drop (volitelné)

### ? Security Checklist

- [ ] Vždy validovat soubory na frontendu
- [ ] Nikdy nevìøit jen frontend validaci
- [ ] Používat HTTPS pro všechny requesty
- [ ] Uchovávat access token bezpeènì
- [ ] Implementovat token refresh logiku
- [ ] Ovìøit CORS nastavení

---

## Troubleshooting

### Èasté Problémy a Øešení

#### 1. Upload Fails s 401 Error

**Problém**: Token expiroval nebo je neplatný

**Øešení**:
```typescript
// Implementovat token refresh
const refreshToken = async () => {
  const response = await fetch(`${apiBaseUrl}/auth/refresh-tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  
  const { tokens } = await response.json();
  localStorage.setItem('accessToken', tokens.access.token);
  return tokens.access.token;
};
```

#### 2. Upload Fails s 413 Error (Payload Too Large)

**Problém**: Soubor je pøíliš velký

**Øešení**:
```typescript
// Pøidat validaci pøed uploadem
if (file.size > 10 * 1024 * 1024) {
  alert('Soubor je pøíliš velký. Maximální velikost je 10MB.');
  return;
}
```

#### 3. Progress Bar Nefunguje

**Problém**: Použití `fetch()` API místo `XMLHttpRequest`

**Øešení**: Použít `XMLHttpRequest` pro tracking progressu (viz pøíklad v kódu výše)

#### 4. CORS Error

**Problém**: Frontend doména není v CORS whitelist

**Øešení**: Kontaktovat backend team pro pøidání domény do CORS configu

---

## Další Zdroje

### Dokumentace

- [Backend API Reference](./API-ENDPOINTS-REFERENCE.md)
- [Authentication Guide](./AUTHENTICATION-GUIDE.md)
- [Complete Frontend Guide](./FRONTEND-COMPLETE-GUIDE.md)

### Podpora

Pro technické dotazy kontaktujte backend team nebo vytvoøte issue v GitHub repository.

---

**Poslední aktualizace**: 2024
**Verze**: 1.0.0
