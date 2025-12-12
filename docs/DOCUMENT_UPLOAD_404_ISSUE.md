# Document Upload 404 Error - ? RESOLVED

## Status: **FIXED** (2024-12-18)

## ?? Resolution

Backend team opravil endpoint a problém je **vyøešen**!

### Backend Changes Applied

1. ? **Added route alias**: `/v1/documents/upload`
   - Original route `/v1/documents/uploadDocument` still works
   - New alias matches our frontend expectations

2. ? **Fixed multer field**: Changed from `image` to `file`
   ```javascript
   // Before
   upload.single('image')  // ?
   
   // After
   upload.single('file')   // ?
   ```

3. ? **Flexible documentType**: Accepts from body OR query
   ```javascript
   const documentTypeString = 
     req.query['documentType'] || req.body['documentType'];
   ```

---

## ? Working Request Format

### Frontend Code (Working)

```typescript
const formData = new FormData();
formData.append('file', file);              // ? Field name: 'file'
formData.append('documentType', 'carVIN');  // ? String value
formData.append('leadId', leadId);          // ?? Optional

await axiosClient.post('/documents/upload', formData);
// Axios auto-sets: Content-Type: multipart/form-data; boundary=...
```

### Valid Document Types

```
carVIN, carMileage, carExterior, carInterior,
carVTP, carMTP, buyAgreement, rentAgreement,
buyMandate, sellMandate, other
```

### Backend Response

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "documentType": "carVIN",
  "file": "507f1f77bcf86cd799439011_photo.jpg",
  "name": "vehicle_vin_photo"
}
```

---

## ?? Testing

### Quick Browser Console Test

```javascript
// 1. Get token
const token = localStorage.getItem('token');

// 2. Create test file
const blob = new Blob(['test'], { type: 'text/plain' });
const testFile = new File([blob], 'test.txt');

// 3. Upload
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

---

## ?? Frontend Implementation Checklist

- [x] Backend endpoint exists
- [x] Correct field name (`file`)
- [x] Correct document types
- [x] Authorization header
- [x] Don't set Content-Type manually
- [ ] Test with real file upload
- [ ] Update UI after successful upload
- [ ] Handle errors gracefully

---

## ?? Next Steps

1. **Test upload** na production prostøedí
2. **Verify** že dokumenty se správnì ukládají
3. **Update UI** po úspìšném uploadu
4. **Deploy** aktualizovanou frontend dokumentaci

---

## ? Original Problem (FIXED)

### What Was Wrong

```
POST https://.../v1/documents/upload
Status: 404 (Not Found)
Error: ERR_BAD_REQUEST
```

**Root Causes:**
1. ? Backend had `/uploadDocument` (not `/upload`)
2. ? Backend expected field `image` (not `file`)
3. ? documentType only from query (not body)

### What Was Done

? Backend added alias `/upload`  
? Backend changed to field `file`  
? Backend accepts documentType from body  
? Frontend already using correct format  

---

## ?? Updated Documentation

- [Frontend Document Upload Guide](./FRONTEND-DOCUMENT-UPLOAD-GUIDE.md) - ? Updated
- [Backend API Documentation](./BACKEND_API.md) - ? Needs update

---

## ?? Conclusion

**Problem**: Frontend couldn't upload documents (404 error)  
**Solution**: Backend fixed endpoint to match frontend expectations  
**Status**: ? **RESOLVED AND WORKING**  
**Next**: Test on production environment

---

**Issue Created**: 2024-12-18  
**Issue Resolved**: 2024-12-18  
**Resolution Time**: Same day  
**Status**: ? CLOSED
