# ?? DriveBot AI - Business Analytics Implementation

## ?? **Overview**

DriveBot (Carvex AI) je AI-powered business analytik integrovaný do CashNDrive backendu. Poskytuje pokroèilé analýzy dat, generování reportù a odpovìdi na business dotazy v èeštinì.

---

## ? **Co bylo implementováno:**

### **1. Bot Configuration** (`src/config/bot.config.ts`)
- OpenAI integration settings
- System prompt pro business analytics
- Function definitions pro database queries
- Permission model (ADMIN, FINANCE_DIRECTOR, SUPERVISOR)

### **2. Data Access Layer** (`src/services/botDataAccess.service.ts`)
- `getLeadsStats()` - Statistiky leadù (konverze, podle období)
- `getActiveLeases()` - Seznam aktivních pronájmù
- `getDocumentsByLead()` - Dokumenty pro lead
- `compareData()` - Porovnání metrik mezi obdobími
- `searchCustomer()` - Vyhledávání zákazníkù
- `getCarsInventory()` - Inventáø aut

### **3. AI Bot Service** (`src/services/aiBot.service.ts`)
- OpenAI GPT-4 integration
- Function calling pro database queries
- Conversation history management
- Error handling

### **4. API Endpoints** (`src/routes/v1/bot.route.ts`)
- `POST /v1/bot/message` - Send message to bot
- `GET /v1/bot/history` - Get conversation history
- `POST /v1/bot/clear` - Clear history
- `GET /v1/bot/status` - Bot status & config

### **5. Permissions** (`src/config/roles.ts`)
- Added `useDriveBot` permission
- Restricted to: ADMIN, FINANCE_DIRECTOR, SUPERVISOR

---

## ?? **Environment Variables**

Add these to your `.env` file and Azure Container App secrets:

```env
# DriveBot AI Configuration
BOT_ENABLED=true
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4
BOT_TEMPERATURE=0.7
BOT_MAX_CONTEXT_LENGTH=4000
```

### **Azure Container App Secrets:**

```powershell
# Add secrets to Azure
az containerapp secret set `
    --name backrent-itx754fut5nry-app `
    --resource-group backrent-dev-rg `
    --secrets `
        "openai-api-key=YOUR-OPENAI-API-KEY"

# Update environment variables
az containerapp update `
    --name backrent-itx754fut5nry-app `
    --resource-group backrent-dev-rg `
    --set-env-vars `
        BOT_ENABLED=true `
        OPENAI_API_KEY=secretref:openai-api-key `
        OPENAI_MODEL=gpt-4 `
        BOT_TEMPERATURE=0.7 `
        BOT_MAX_CONTEXT_LENGTH=4000
```

---

## ?? **Example Queries**

### **Business Analytics:**
```
User: "Kolik máme aktivních pronájmù?"
Bot: "?? Aktuálnì máte 45 aktivních pronájmù. Z toho 12 konèí do konce mìsíce."

User: "Jaká je celková hodnota aktivních leasingù?"
Bot: "?? Celková hodnota všech aktivních leasingù je 12 500 000 Kè."

User: "Který obchodník má nejvíc leadù?"
Bot: "?? Martin Dyntar má 28 leadù, což je nejvíce ze všech obchodníkù."
```

### **Report Generation:**
```
User: "Vytvoø report aktivních pronájmù"
Bot: "?? Report aktivních pronájmù:
- Celkem: 45 smluv
- Prùmìrná mìsíèní splátka: 15 000 Kè
- Nejstarší smlouva: 12.3.2023
- Nejnovìjší smlouva: 5.12.2024
- Top 3 auta: Škoda Octavia (8x), VW Golf (5x), Ford Focus (4x)"
```

### **Document Analysis:**
```
User: "Ukaž mi detaily klienta s jménem Novák"
Bot: "?? Našel jsem 2 klienty:
1. Jan Novák - Lead ID 12345, stav: Schváleno, auto: Škoda Octavia 2020
2. Petr Novák - Lead ID 12346, stav: Èeká na dokumenty, auto: VW Golf 2019"
```

### **Data Comparison:**
```
User: "Porovnej pronájmy tento mìsíc vs. minulý mìsíc"
Bot: "?? Porovnání pronájmù:
Tento mìsíc (prosinec): 12 nových smluv
Minulý mìsíc (listopad): 8 nových smluv
Rozdíl: +4 smlouvy (+50%)
Trend: Rostoucí ?"
```

---

## ?? **Deployment Steps**

### **1. Install OpenAI Package**
```bash
npm install openai
```

### **2. Build & Push Docker Image**
```powershell
.\BUILD-AND-PUSH-IMAGE.bat
```

### **3. Update Azure Secrets**
```powershell
# Add OpenAI API key
az containerapp secret set `
    --name backrent-itx754fut5nry-app `
    --resource-group backrent-dev-rg `
    --secrets "openai-api-key=YOUR-OPENAI-API-KEY"
```

### **4. Update Environment Variables**
```powershell
az containerapp update `
    --name backrent-itx754fut5nry-app `
    --resource-group backrent-dev-rg `
    --set-env-vars `
        BOT_ENABLED=true `
        OPENAI_API_KEY=secretref:openai-api-key `
        OPENAI_MODEL=gpt-4
```

### **5. Restart Container App**
```powershell
az containerapp revision restart `
    --name backrent-itx754fut5nry-app `
    --resource-group backrent-dev-rg
```

---

## ?? **Testing**

### **Manual Test (PowerShell):**
```powershell
.\TEST-DRIVEBOT.bat
```

### **cURL Test:**
```bash
# Login first
curl -X POST https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"final-test@carbackrent.cz","password":"Test123!"}'

# Use token for bot queries
curl -X POST https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1/bot/message \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Kolik máme aktivních pronájmù?"}'
```

---

## ?? **API Documentation**

### **POST /v1/bot/message**
Send message to DriveBot.

**Request:**
```json
{
  "message": "Kolik máme aktivních pronájmù?"
}
```

**Response:**
```json
{
  "success": true,
  "response": "?? Aktuálnì máte 45 aktivních pronájmù...",
  "timestamp": "2024-12-09T20:30:00.000Z"
}
```

### **GET /v1/bot/history**
Get conversation history.

**Response:**
```json
{
  "success": true,
  "history": [
    {
      "role": "user",
      "content": "Kolik máme aktivních pronájmù?"
    },
    {
      "role": "assistant",
      "content": "?? Aktuálnì máte 45 aktivních pronájmù..."
    }
  ],
  "count": 10
}
```

### **POST /v1/bot/clear**
Clear conversation history.

**Response:**
```json
{
  "success": true,
  "message": "Conversation history cleared"
}
```

### **GET /v1/bot/status**
Get bot status and configuration.

**Response:**
```json
{
  "enabled": true,
  "model": "gpt-4",
  "allowedRoles": ["ADMIN", "FINANCE_DIRECTOR", "SUPERVISOR"],
  "userHasAccess": true
}
```

---

## ?? **Permissions**

Only these roles can use DriveBot:
- ? **ADMIN** - Full access
- ? **FINANCE_DIRECTOR** - Full access
- ? **SUPERVISOR** - Full access
- ? **SALES** - No access
- ? **OS** - No access
- ? **CUSTOMER** - No access

---

## ?? **Troubleshooting**

### **Bot returns "Bot is not configured"**
- Check `OPENAI_API_KEY` is set in environment variables
- Verify `BOT_ENABLED=true`

### **403 Forbidden**
- User role must be ADMIN, FINANCE_DIRECTOR, or SUPERVISOR
- Check JWT token is valid

### **Bot gives incorrect data**
- Verify Azure Cosmos DB connection is working
- Check database has data in collections
- Review bot logs in Azure Container Apps

### **Function call errors**
- Ensure all MongoDB models are properly imported
- Verify database queries in `botDataAccess.service.ts`

---

## ?? **Database Requirements**

DriveBot requires these MongoDB collections:
- ? `leads` - Lead/offer data
- ? `leases` - Active leases
- ? `cars` - Car inventory
- ? `customers` - Customer data
- ? `dealers` - Sales representatives
- ? `documents` - Document metadata

All collections must be in **Azure Cosmos DB** (`carbackrent` database).

---

## ?? **Frontend Integration**

Frontend can integrate DriveBot UI at:
```
https://happy-pebble-041ffdb03.3.azurestaticapps.net/drivebot
```

**API Endpoint:**
```
https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1/bot
```

**Example Frontend Code:**
```typescript
const sendMessage = async (message: string) => {
  const response = await fetch('/v1/bot/message', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });
  
  const data = await response.json();
  return data.response;
};
```

---

## ?? **Support**

**Backend Repository:** https://github.com/malonitest/car-backrent-api-test  
**Branch:** `develop`  
**API Docs:** https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1/docs  
**Contact:** maloni@outlook.com

---

## ? **Implementation Complete!**

DriveBot AI Business Analytics is ready for deployment! ??

**Status:** ? Ready for Production  
**Priority:** HIGH  
**Estimated Time:** 4-6 hours (COMPLETED)  
**Dependencies:** Azure Cosmos DB ? | OpenAI API Key ?

---

**Created:** 9.12.2024  
**Updated:** 9.12.2024  
**Version:** 1.0.0
