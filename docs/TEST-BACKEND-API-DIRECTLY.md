# ?? Backend API Direct Test

## Test Financial Report Endpoint

Run this in your browser console on the app page to test the backend directly:

```javascript
// 1. Get your auth token from localStorage
const token = localStorage.getItem('token');
console.log('Token:', token ? 'Found ?' : 'Missing ?');

// 2. Test the endpoint
fetch('https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1/stats/financial-report?period=year', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('Response Status:', response.status);
  return response.json();
})
.then(data => {
  console.log('=== FULL API RESPONSE ===');
  console.log('Stats:', data.stats);
  console.log('Monthly Data Count:', data.monthlyData?.length);
  console.log('Invoices Count:', data.invoices?.length);
  
  // Check first invoice
  if (data.invoices && data.invoices.length > 0) {
    const firstInvoice = data.invoices[0];
    console.log('\n=== FIRST INVOICE ===');
    console.log('Customer Name:', firstInvoice.customerName);
    console.log('Amount:', firstInvoice.amount);
    console.log('Invoice Number:', firstInvoice.invoiceNumber);
    console.log('Type:', firstInvoice.type);
    
    // Validation
    console.log('\n=== VALIDATION ===');
    console.log('Customer Name is "Neuvedeno":', firstInvoice.customerName === 'Neuvedeno' ? '? FAIL' : '? PASS');
    console.log('Amount is 0:', firstInvoice.amount === 0 ? '? FAIL' : '? PASS');
    
    // Show all unique customer names
    const uniqueNames = [...new Set(data.invoices.map(inv => inv.customerName))];
    console.log('\n=== UNIQUE CUSTOMER NAMES ===');
    console.log(uniqueNames);
    
    // Show amounts distribution
    const amounts = data.invoices.map(inv => inv.amount);
    const nonZeroAmounts = amounts.filter(a => a > 0);
    console.log('\n=== AMOUNTS STATS ===');
    console.log('Total invoices:', amounts.length);
    console.log('Non-zero amounts:', nonZeroAmounts.length);
    console.log('Zero amounts:', amounts.length - nonZeroAmounts.length);
    
    if (nonZeroAmounts.length > 0) {
      console.log('Sample amounts:', nonZeroAmounts.slice(0, 5));
    }
  } else {
    console.log('? No invoices in response');
  }
  
  // Full data for inspection
  console.log('\n=== SAMPLE INVOICES (first 3) ===');
  console.log(JSON.stringify(data.invoices?.slice(0, 3), null, 2));
})
.catch(error => {
  console.error('? Error:', error);
});
```

## Expected Output

### ? If Backend Fix is Applied:
```
Response Status: 200
Stats: {...}
Monthly Data Count: 12
Invoices Count: 475

=== FIRST INVOICE ===
Customer Name: Jan Novák
Amount: 5000
Invoice Number: 123456
Type: RENT

=== VALIDATION ===
Customer Name is "Neuvedeno": ? PASS
Amount is 0: ? PASS

=== UNIQUE CUSTOMER NAMES ===
["Jan Novák", "Petr Svoboda", "Eva Horáková", ...]

=== AMOUNTS STATS ===
Total invoices: 475
Non-zero amounts: 475
Zero amounts: 0
Sample amounts: [5000, 3500, 4200, 6000, 3800]
```

### ? If Backend Fix is NOT Applied (Current State):
```
Response Status: 200
Stats: {...}
Monthly Data Count: 12
Invoices Count: 475

=== FIRST INVOICE ===
Customer Name: Neuvedeno
Amount: 0
Invoice Number: 689a3865...
Type: RENT

=== VALIDATION ===
Customer Name is "Neuvedeno": ? FAIL
Amount is 0: ? FAIL

=== UNIQUE CUSTOMER NAMES ===
["Neuvedeno"]

=== AMOUNTS STATS ===
Total invoices: 475
Non-zero amounts: 0
Zero amounts: 475
```

## How to Run

1. **Open your app**: https://happy-pebble-041ffdb03.3.azurestaticapps.net/reports2/financial
2. **Open Developer Console**: Press `F12`
3. **Go to Console tab**
4. **Copy and paste the test script above**
5. **Press Enter**
6. **Check the output**

## What to Look For

### ?? Key Indicators:

**Backend fix IS applied if:**
- ? Customer names are NOT "Neuvedeno"
- ? Amounts are NOT 0
- ? Multiple unique customer names exist
- ? Non-zero amounts exist

**Backend fix is NOT applied if:**
- ? All customer names are "Neuvedeno"
- ? All amounts are 0
- ? Only one unique customer name: "Neuvedeno"
- ? Zero non-zero amounts

## Alternative: Test with curl

If you prefer command line:

```bash
# Get your token from browser localStorage first
TOKEN="your-token-here"

# Test endpoint
curl -X GET \
  "https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1/stats/financial-report?period=year" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  | jq '.invoices[0] | {customerName, amount, invoiceNumber}'
```

**Expected output (if fixed):**
```json
{
  "customerName": "Jan Novák",
  "amount": 5000,
  "invoiceNumber": "123456"
}
```

**Current output (not fixed):**
```json
{
  "customerName": "Neuvedeno",
  "amount": 0,
  "invoiceNumber": "689a3865..."
}
```

## Next Steps Based on Results

### If Test Shows Backend IS Fixed ?
1. Clear browser cache: `Ctrl + Shift + R`
2. Try incognito/private mode
3. Wait 5-10 minutes for CDN cache
4. Contact backend team about cache clearing

### If Test Shows Backend NOT Fixed ?
1. Backend deployment didn't work
2. Wrong environment deployed
3. Code not in correct branch
4. Container needs restart
5. **Send results to backend team**

---

**Created:** 2024-12-10  
**Purpose:** Direct API testing to verify backend deployment
