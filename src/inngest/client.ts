import { Inngest } from 'inngest'

/**
 * Inngest client for GrantSignal background jobs
 */
export const inngest = new Inngest({
  id: 'grantsignal',
  name: 'GrantSignal',
})

/**
 * Event types for type-safe Inngest events
 */
export type Events = {
  'document/uploaded': {
    data: {
      documentId: string
      organizationId: string
      s3Key: string
      mimeType: string
    }
  }
  'voice/analyze': {
    data: {
      organizationId: string
      forceRefresh?: boolean
    }
  }
  'funder/sync-990': {
    data: {
      funderId: string
      ein: string
    }
  }
}