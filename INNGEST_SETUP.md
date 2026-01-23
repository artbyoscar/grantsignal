# Inngest Setup Guide

## The Problem

Documents were getting stuck in "PROCESSING" or "PENDING" status because the **Inngest dev server was not running**.

### How It Works

1. User uploads a document → File goes to S3 → Database record created with status `PENDING`
2. Frontend calls `confirmUpload` → Status changes to `PROCESSING`
3. Backend sends Inngest event `document/uploaded` → **This requires Inngest to be running!**
4. Inngest processes the event → Document is parsed, vectorized, and status updated to `COMPLETED`

**Without Inngest running, Step 3 fails silently**, leaving documents stuck in `PROCESSING` forever.

## The Solution

You need to run **both** the Next.js dev server AND the Inngest dev server simultaneously during development.

### Option 1: Use the Startup Script (Recommended)

#### Windows PowerShell:
```powershell
.\dev.ps1
```

#### Windows Command Prompt:
```cmd
dev.bat
```

This will open two terminal windows:
- **Window 1**: Next.js dev server (http://localhost:3000)
- **Window 2**: Inngest dev server (http://localhost:8288)

### Option 2: Manual Startup

Open two terminal windows and run:

**Terminal 1:**
```bash
pnpm dev
```

**Terminal 2:**
```bash
npx inngest-cli@latest dev
```

### Option 3: Using package.json scripts

You can also run them individually:

```bash
# Terminal 1
pnpm run dev

# Terminal 2
pnpm run dev:inngest
```

## Verifying Inngest is Working

1. Start both servers using one of the methods above
2. Visit http://localhost:8288 - you should see the Inngest Dev UI
3. Upload a test document in your app
4. Check the Inngest UI - you should see the `document/uploaded` event being processed

## Cleaning Up Stuck Documents

If you have documents stuck in `PENDING` or `PROCESSING` status from before Inngest was running, you can clean them up:

### Using the Frontend (Recommended)

The app has a built-in cleanup function. You can trigger it via the Documents page or by calling the tRPC endpoint:

```typescript
// In browser console or via API
await fetch('/api/trpc/documents.cleanupStuckDocuments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
})
```

### Manual Database Cleanup

Alternatively, you can manually update stuck documents in the database:

```sql
-- Mark PENDING documents (older than 2 hours) as FAILED
UPDATE "Document"
SET
  status = 'FAILED',
  "parseWarnings" = '["Document stuck in PENDING status. Inngest was not running.", "Please re-upload the document."]',
  "processedAt" = NOW()
WHERE
  status = 'PENDING'
  AND "createdAt" < NOW() - INTERVAL '2 hours';

-- Mark PROCESSING documents (older than 1 hour) as FAILED
UPDATE "Document"
SET
  status = 'FAILED',
  "parseWarnings" = '["Document stuck in PROCESSING status. Inngest was not running.", "Please re-upload the document."]',
  "processedAt" = NOW()
WHERE
  status = 'PROCESSING'
  AND "updatedAt" < NOW() - INTERVAL '1 hour';
```

## Production Deployment

In production, you don't need to run the Inngest dev server. Instead:

1. Your app connects to **Inngest Cloud** (configured via `INNGEST_SIGNING_KEY` in `.env`)
2. Inngest Cloud calls your `/api/inngest` endpoint to execute functions
3. No local Inngest server needed - it's all handled by Inngest's infrastructure

### Environment Variables for Production

Make sure these are set in your production environment:

```bash
INNGEST_EVENT_KEY=your_event_key_here
INNGEST_SIGNING_KEY=your_signing_key_here
```

These are already configured in your `.env.local` file.

## Troubleshooting

### "Upload failed" errors

**Symptom**: Documents show "Upload failed" immediately after upload

**Cause**: Inngest dev server is not running

**Fix**: Start Inngest using one of the methods above

### Documents stuck in "Processing" forever

**Symptom**: Documents stay in PROCESSING status indefinitely

**Cause**:
1. Inngest dev server stopped or crashed
2. Background job failed silently

**Fix**:
1. Check that Inngest dev server is still running
2. Look at Inngest Dev UI (http://localhost:8288) for error logs
3. Re-upload the document or trigger reprocessing

### "Document processing failed" with errors in parseWarnings

**Symptom**: Document status changes to FAILED with detailed error messages

**Cause**: Actual processing error (S3 download failed, parsing error, etc.)

**Fix**:
1. Check the `parseWarnings` field in the database for specific error details
2. Common issues:
   - S3 credentials not configured
   - File format not supported
   - File corrupted during upload
3. Try re-uploading the document

### Cannot access Inngest Dev UI

**Symptom**: http://localhost:8288 doesn't load

**Cause**: Inngest dev server not running or using a different port

**Fix**:
1. Ensure Inngest is running: `npx inngest-cli@latest dev`
2. Check if another service is using port 8288
3. If needed, specify a different port: `npx inngest-cli@latest dev -p 8289`

## Development Workflow

**Always** start both servers when developing features that involve:
- Document uploads
- Background jobs
- Email notifications (uses Inngest)
- Scheduled tasks
- Webhook deliveries

The recommended workflow:

1. Run `.\dev.ps1` (or `dev.bat`) to start both servers
2. Develop your features
3. Monitor the Inngest Dev UI for job execution
4. Stop both servers when done (Ctrl+C in each terminal)

## Additional Resources

- [Inngest Documentation](https://www.inngest.com/docs)
- [Inngest Dev Server CLI](https://www.inngest.com/docs/cli/dev)
- [Next.js + Inngest Guide](https://www.inngest.com/docs/guides/next-js)
