import { serve } from 'inngest/next'
import { inngest } from '@/inngest/client'
import { processDocument } from '@/inngest/functions/process-document'
import { parseRfp } from '@/inngest/functions/parse-rfp'
import { analyzeVoice } from '@/inngest/functions/analyze-voice'
import { syncFunder990 } from '@/inngest/functions/sync-funder-990'
import { detectConflictsScheduled } from '@/inngest/functions/detect-conflicts'
import { cleanupStuckDocuments } from '@/inngest/functions/cleanup-stuck-documents'
import { webhookDelivery } from '@/inngest/functions/webhook-delivery'
import { sendDeadlineReminders } from '@/inngest/send-deadline-reminders'
import { sendWeeklyDigest } from '@/inngest/send-weekly-digest'
import { sendComplianceAlert } from '@/inngest/send-compliance-alert'
import { sendDocumentProcessed } from '@/inngest/send-document-processed'

/**
 * Inngest API route handler
 * Serves Inngest functions via Next.js API routes
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processDocument,
    parseRfp,
    analyzeVoice,
    syncFunder990,
    detectConflictsScheduled,
    cleanupStuckDocuments,
    webhookDelivery,
    sendDeadlineReminders,
    sendWeeklyDigest,
    sendComplianceAlert,
    sendDocumentProcessed,
  ],
  // Use the Inngest Cloud for production, local dev server for development
  signingKey: process.env.INNGEST_SIGNING_KEY,
  // In development, Inngest will use the dev server
  // In production, this endpoint will be called by Inngest Cloud
})