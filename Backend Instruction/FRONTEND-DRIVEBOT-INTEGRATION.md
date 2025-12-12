# ?? DriveBot Frontend Integration Guide

## ?? Overview
DriveBot (Carvex AI) is a business-analytics copilot exposed via the backend `/v1/bot/*` APIs. This guide explains how to wire the existing frontend (React/Next/Vue/Angular) to the new endpoints, manage authentication, and deliver a chat-style UX that surfaces analytics, reports, and document insights.

---

## ? Prerequisites
- User must have `useDriveBot` permission (`ADMIN`, `FINANCE_DIRECTOR`, or `SUPERVISOR`).
- Frontend already authenticates against the API and stores access/refresh tokens.
- Base API URL configured (see `FRONTEND-INTEGRATION-GUIDE.md`).
- DriveBot feature flag or menu entry available only after `/v1/bot/status` confirms access.

---

## ?? Environment Variables
Add the DriveBot route prefix next to existing API vars.

```env
NEXT_PUBLIC_BOT_BASE_URL=https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1/bot
```

Angular example:
```typescript
export const environment = {
  // ...existing fields
  botBaseUrl: 'https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1/bot',
};
```

---

## ??? API Surface (Frontend Usage)
| Endpoint | Method | Purpose | Notes |
|----------|--------|---------|-------|
| `/v1/bot/status` | GET | Check availability, allowed roles, model info | Guard the UI; 403 ? hide entry point. |
| `/v1/bot/message` | POST | Send user prompt, receive AI response | Body `{ message: string }`; response includes timestamp. |
| `/v1/bot/history` | GET | Load stored conversation for signed-in user | Returns `history[]` array (user + assistant messages). |
| `/v1/bot/clear` | POST | Reset stored conversation | Call when user clicks "Clear chat". |

> All calls require `Authorization: Bearer <accessToken>` and inherit standard API error format.

---

## ?? Frontend Flow
1. **Entry load**: call `GET /v1/bot/status`.
   - If `enabled === false` ? show maintenance banner.
   - If `userHasAccess === false` ? show tooltip "Contact admin for DriveBot access" and disable chat.
2. **Initial history**: fetch `/v1/bot/history` and seed UI with previous dialogue.
3. **Send message**:
   - Optimistically append a `pending` assistant bubble.
   - POST `/v1/bot/message` with `{ message }`.
   - Replace the pending bubble with the returned text or show error state.
4. **Clear**: POST `/v1/bot/clear`, then reset UI list.
5. **Errors**: map HTTP codes ? UI state (see below).

---

## ?? UI Recommendations
- **Layout**: chat panel with alternating bubbles, timestamp badges, sticky input bar.
- **Message formatting**: the bot returns Czech prose plus emojis; render markdown lightly (bold, lists) to keep insights readable.
- **Loading feedback**: show typing dots while awaiting the POST response (avg 2.5s).
- **Pills / chips**: expose shortcuts like "Aktivní pronájmy", "Lead report", "Porovnat období" that prefill prompt templates.
- **History persistence**: backend already stores per-user history; no local storage needed beyond optimistic updates.
- **Download/share**: allow copying the last bot response or exporting as text for reports.

---

## ?? Error Handling Matrix
| Status | Cause | UI Action |
|--------|-------|-----------|
| `401` | Token expired | Trigger refresh-token flow, retry once. |
| `403` | Missing `useDriveBot` permission | Hide chat, show access warning. |
| `503` | Bot disabled | Show maintenance state with retry button. |
| `>=500` | Backend/OpenAI failure | Display toast "DriveBot momentálnì neodpovídá" and keep input enabled. |

Also catch string errors thrown by `/v1/bot/message` (e.g., `DriveBot error: ...`) and surface them inline.

---

## ?? React Service Example
```typescript
import axios from 'axios';

const botClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BOT_BASE_URL,
});

botClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const botApi = {
  getStatus: () => botClient.get('/status'),
  getHistory: () => botClient.get('/history'),
  sendMessage: (message: string) => botClient.post('/message', { message }),
  clearHistory: () => botClient.post('/clear'),
};
```

Hook usage:
```typescript
import { useState, useEffect } from 'react';
import { botApi } from '@/services/botApi';

type ChatMessage = { role: 'user' | 'assistant'; content: string; pending?: boolean };

export function useDriveBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      const status = await botApi.getStatus();
      if (!status.data.userHasAccess || !status.data.enabled) return;
      const history = await botApi.getHistory();
      setMessages(history.data.history);
    };
    bootstrap();
  }, []);

  const send = async (text: string) => {
    setMessages((prev) => [...prev, { role: 'user', content: text }, { role: 'assistant', content: '', pending: true }]);
    setLoading(true);
    try {
      const res = await botApi.sendMessage(text);
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: 'assistant', content: res.data.response };
        return next;
      });
    } catch (error: any) {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: 'assistant', content: error.response?.data?.message ?? 'Chyba pøi získávání odpovìdi.' };
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  const clear = async () => {
    await botApi.clearHistory();
    setMessages([]);
  };

  return { messages, loading, send, clear };
}
```

---

## ?? Manual Test Checklist
1. **Status check** – ensure `/v1/bot/status` renders role info.
2. **History load** – open DriveBot page with existing conversation.
3. **Happy path** – send "Kolik máme aktivních pronájmù?", verify positive response.
4. **Role guard** – log in as `SALES` and confirm UI hides DriveBot.
5. **Clear history** – send message, clear, reload page ? history empty.
6. **Error path** – temporarily disable network to confirm fallback UI.

Use provided script: `TEST-DRIVEBOT.bat` to verify backend readiness before frontend deployment.

---

## ?? Deployment Notes
- Bundle DriveBot assets behind a feature flag so you can toggle visibility without redeploying backend.
- Flush Service Worker cache (if applicable) after releasing the new UI; route includes `/drivebot`.
- Monitor first-run errors via your existing logging (Sentry, AppInsights JS SDK) to catch permission issues quickly.

---

## ?? Need Help?
- Backend repo: `https://github.com/malonitest/car-backrent-api-test` (branch `develop`).
- API docs: `https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1/docs`.
- Contact: `maloni@outlook.com`.

DriveBot is production-ready—connect the frontend and unlock instant business insights for admins and finance leaders. ??
