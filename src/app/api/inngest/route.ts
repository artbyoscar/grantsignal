import { serve } from 'inngest/next'
import { inngest } from '@/inngest/client'
import { processDocument } from '@/inngest/functions/process-document'
import { analyzeVoice } from '@/inngest/functions/analyze-voice'
import { syncFunder990 } from '@/inngest/functions/sync-funder-990'
import { detectConflictsScheduled } from '@/inngest/functions/detect-conflicts'

/**
 * Inngest API route handler
 * Serves Inngest functions via Next.js API routes
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processDocument, analyzeVoice, syncFunder990, detectConflictsScheduled],
  // Use the Inngest Cloud for production, local dev server for development
  signingKey: process.env.INNGEST_SIGNING_KEY,
  // In development, Inngest will use the dev server
  // In production, this endpoint will be called by Inngest Cloud
})