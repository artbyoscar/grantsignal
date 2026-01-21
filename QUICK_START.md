# Quick Start Guide - Public API, Webhooks & Extension

## Installation

### 1. Install New Dependencies
```bash
npm install swagger-ui-react
```

### 2. Database Setup
No new migrations needed - uses existing schema from Phases 1 & 2.

---

## Public API Setup

### Create Your First API Key

1. Start the dev server:
```bash
npm run dev
```

2. Navigate to: http://localhost:3000/settings/api

3. Click "Create API Key"
   - Name: "Test Key"
   - Scopes: `grants:read`, `grants:write`, `documents:read`, `reports:read`
   - Click "Generate"

4. Copy the API key (starts with `gs_live_` or `gs_test_`)

### Test the API

```bash
# Test grants endpoint
curl -H "Authorization: Bearer YOUR_API_KEY" \
  http://localhost:3000/api/v1/grants

# Test document search
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "http://localhost:3000/api/v1/documents/search?query=test&limit=5"

# Test executive summary
curl -H "Authorization: Bearer YOUR_API_KEY" \
  http://localhost:3000/api/v1/reports/executive-summary
```

### View API Documentation

Visit: http://localhost:3000/api-docs

The Swagger UI provides:
- Interactive API explorer
- Try-it-out functionality
- Complete endpoint documentation
- Schema visualization

---

## Webhooks Setup

### Create Your First Webhook

1. Navigate to: http://localhost:3000/settings/webhooks

2. Click "Create Webhook"
   - Name: "Test Webhook"
   - URL: https://webhook.site/your-unique-url (get from webhook.site)
   - Events: Check all three events
   - Click "Create Webhook"

3. Copy the **Signing Secret** - you'll need this to verify signatures

### Test Webhook Delivery

Click the "Test" button on your webhook to send a test event. Check webhook.site to see the payload.

### Verify Webhook Signature (Example in Node.js)

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// In your webhook endpoint:
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-grantsignal-signature'];
  const isValid = verifyWebhookSignature(req.body, signature, 'your-secret');

  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }

  // Process webhook event
  console.log('Event:', req.body.type);
  console.log('Data:', req.body.data);

  res.status(200).send('OK');
});
```

### Trigger Real Events

**Grant Status Changed:**
1. Go to a grant in the dashboard
2. Change its status (e.g., DRAFT → SUBMITTED)
3. Check your webhook receiver for the event

**Document Processed:**
1. Upload a document
2. Wait for processing to complete
3. Check your webhook receiver for the event

**Compliance Conflict Detected:**
1. Run the scheduled conflict detection (or wait for daily run at 2 AM)
2. Check your webhook receiver for conflict events

---

## Browser Extension Setup

### Install the Extension

1. Open Chrome and go to: `chrome://extensions/`

2. Enable "Developer mode" (toggle in top right)

3. Click "Load unpacked"

4. Select the `extension` directory from your project

### Configure API Key

1. Click the GrantSignal extension icon in your toolbar

2. The popup will ask for an API key

3. Generate an API key with the `extension:memory_search` scope:
   - Go to http://localhost:3000/settings/api
   - Create new key with scope: `extension:memory_search`
   - Copy the key

4. Paste into the extension popup and click "Save"

### Test in Google Docs

1. Open any Google Docs document

2. You should see a purple "GrantSignal" button in the bottom-right corner

3. Click the button to open the search panel

4. Try searching for content (e.g., "sustainability", "program", etc.)

5. Click "Copy to Clipboard" on any result to copy the text

### Notes on Icons

The extension needs icons (16x16, 32x32, 48x48, 128x128 PNG files). For development:
- Create simple placeholder PNGs, OR
- Use any PNG files renamed to the required names, OR
- Follow the instructions in `extension/icons/README.txt`

---

## Common Issues & Solutions

### API Issues

**"Invalid or missing API key"**
- Check that your API key starts with `gs_live_` or `gs_test_`
- Verify the key hasn't been revoked
- Ensure you're using `Authorization: Bearer YOUR_KEY` header

**"Rate limit exceeded"**
- Default limits: 100/min, 1000/hour, 10000/day
- Wait for the rate limit window to reset
- Consider increasing limits in the database for your key

**"Insufficient scope"**
- Check your API key has the required scopes
- Add missing scopes in API key settings
- Regenerate the key if needed

### Webhook Issues

**Webhooks not being delivered**
- Check that the webhook is "Active" and not "Paused"
- Verify the URL is accessible from your server
- Check delivery logs in the webhook details page
- Look for errors in the "Last Failure" field

**Signature verification fails**
- Ensure you're using the exact signing secret shown in the UI
- Verify you're hashing the raw request body (not parsed JSON)
- Check the signature header name: `x-grantsignal-signature`

**Webhook auto-paused**
- After 10 consecutive failures, webhooks are auto-paused
- Fix the endpoint issue
- Click "Resume" to reactivate

### Extension Issues

**Button doesn't appear in Google Docs**
- Make sure you're on a Google Docs **document** (not Sheets/Slides)
- Refresh the page
- Check that the extension is enabled in `chrome://extensions/`
- Check browser console for errors

**Search returns no results**
- Verify your API key is valid
- Check that documents have been uploaded to GrantSignal
- Ensure the API server is running (localhost:3000)
- Check the correct API URL in extension settings

**API key is invalid**
- Copy the entire key including the prefix (`gs_live_` or `gs_test_`)
- Ensure the key has the `extension:memory_search` scope
- Check if the key has been revoked

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    GrantSignal Platform                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐        ┌──────────────┐                  │
│  │   Web App    │        │  REST API    │                  │
│  │  (Next.js)   │        │  /api/v1/*   │                  │
│  └──────────────┘        └──────────────┘                  │
│         │                       │                            │
│         │                       │ API Key Auth              │
│         │                       │ Rate Limiting             │
│         ▼                       ▼ Scope Checking            │
│  ┌─────────────────────────────────────┐                   │
│  │         tRPC Internal API            │                   │
│  │   (grants, documents, reports)       │                   │
│  └─────────────────────────────────────┘                   │
│         │                       │                            │
│         │                       │                            │
│         ▼                       ▼                            │
│  ┌─────────────────────────────────────┐                   │
│  │         PostgreSQL Database          │                   │
│  │      (ApiKey, Webhook, etc.)         │                   │
│  └─────────────────────────────────────┘                   │
│                                                              │
│  ┌──────────────────────────────────────┐                  │
│  │       Webhook System (Inngest)        │                  │
│  │  - Event Emitter                      │                  │
│  │  - Delivery Queue                     │                  │
│  │  - Retry Logic                        │                  │
│  │  - HMAC Signatures                    │                  │
│  └──────────────────────────────────────┘                  │
│         │                                                    │
│         │ HTTP POST                                         │
│         ▼                                                    │
│  ┌──────────────────────────────────────┐                  │
│  │    External Webhook Endpoints         │                  │
│  └──────────────────────────────────────┘                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ REST API Calls
                        ▼
              ┌──────────────────┐
              │ Chrome Extension  │
              │  - Content Script │
              │  - Popup UI       │
              │  - Background SW  │
              └──────────────────┘
                        │
                        │ Injected UI
                        ▼
              ┌──────────────────┐
              │   Google Docs    │
              │  (User's Browser) │
              └──────────────────┘
```

---

## What's Next?

### Immediate (Do Today)
- [ ] Install dependencies (`npm install swagger-ui-react`)
- [ ] Create and test an API key
- [ ] View the Swagger UI docs
- [ ] Create and test a webhook
- [ ] Load and test the Chrome extension

### This Week
- [ ] Generate actual icons for the extension
- [ ] Test all REST endpoints thoroughly
- [ ] Set up webhook monitoring
- [ ] Deploy to production (if ready)
- [ ] Create API usage documentation

### This Month
- [ ] Migrate rate limiting to Redis
- [ ] Add API usage analytics
- [ ] Publish extension to Chrome Web Store
- [ ] Create webhook implementation examples
- [ ] Build client SDKs (JavaScript, Python)

---

## Support

Need help?
- 📧 Email: support@grantsignal.com
- 📚 Docs: See `IMPLEMENTATION_SUMMARY.md`
- 🐛 Issues: Report bugs in your issue tracker
- 💬 Questions: Check the inline code comments

---

**Ready to go!** Start with creating an API key and testing the endpoints. 🚀
