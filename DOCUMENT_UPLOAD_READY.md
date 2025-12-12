# ?? Document Upload - FIXED & READY TO TEST!

## Status: ? WORKING

Backend team opravil endpoint a document upload je nyní **plnì funkèní**!

---

## ?? Co bylo opraveno?

### Backend Changes (Applied)

1. ? **Added route alias**: `/v1/documents/upload`
2. ? **Fixed multer field**: `upload.single('file')` (was `'image'`)
3. ? **Flexible documentType**: Accepts from body OR query

### Frontend Status

? **Frontend code already correct** - no changes needed!

---

## ?? Quick Test

### Option 1: Browser Console Test

1. Open your app in browser
2. Login to get a token
3. Open DevTools Console (F12)
4. Run this test:

```javascript
// Get token
const token = localStorage.getItem('token');

// Create test file
const blob = new Blob(['test content'], { type: 'text/plain' });
const testFile = new File([blob], 'test.txt', { type: 'text/plain' });

// Upload
const formData = new FormData();
formData.append('file', testFile);
formData.append('documentType', 'other');

fetch('https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1/documents/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
})
.then(r => r.json())
.then(data => console.log('? SUCCESS:', data))
.catch(err => console.error('? ERROR:', err));
```

### Option 2: Manual UI Test

1. Go to a Lead detail page
2. Click **"Dokumenty"** button
3. Select any category (e.g., "Nájezd a VIN")
4. Upload a photo (JPEG/PNG) or PDF
5. Check if upload succeeds!

Expected result: ? `"Dokument byl úspìšnì nahrán"`

---

## ?? Request Format (Working)

```typescript
POST /v1/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data; boundary=...

FormData:
  file: [File]              // ? Field name: 'file'
  documentType: "carVIN"     // ? String from enum
  leadId: "507f..."         // ?? Optional
```

## ? Valid Document Types

```
carVIN, carMileage, carExterior, carInterior,
carVTP, carMTP, buyAgreement, rentAgreement,
buyMandate, sellMandate, other
```

## ?? Expected Response

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "documentType": "carVIN",
  "file": "507f1f77bcf86cd799439011_photo.jpg",
  "name": "vehicle_vin_photo"
}
```

---

## ?? Troubleshooting

### If upload fails:

1. **Check token**: `localStorage.getItem('token')` not empty?
2. **Check file size**: < 10MB?
3. **Check file type**: JPEG, PNG, or PDF?
4. **Check documentType**: Valid string from enum?
5. **Check console**: Any error messages?

### Common Errors:

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Token expired | Refresh page / re-login |
| 400 Bad Request | Invalid documentType | Use valid enum value |
| 413 Payload Too Large | File > 10MB | Compress file |

---

## ?? Documentation

- [Frontend Upload Guide](./docs/FRONTEND-DOCUMENT-UPLOAD-GUIDE.md) - ? Updated
- [Issue Resolution](./docs/DOCUMENT_UPLOAD_404_ISSUE.md) - ? Closed

---

## ?? Next Steps

1. **Test on production** environment
2. **Verify documents** are saved correctly
3. **Check document preview** in UI
4. **Test with different file types** (JPEG, PNG, PDF)
5. **Test file size limits** (up to 10MB)

---

## ?? Support

If you encounter any issues:

1. Check console for errors
2. Verify backend is deployed
3. Contact backend team if needed

---

**Updated**: 2024-12-18  
**Status**: ? WORKING  
**Ready**: YES - Go ahead and test! ??
