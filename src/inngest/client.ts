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
  'rfp/parse-file': {
    data: {
      s3Key: string
      fileName: string
      organizationId: string
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
  'notification/deadline-reminder': {
    data: {
      grantId: string
      userId: string
      email: string
    }
  }
  'notification/compliance-alert': {
    data: {
      conflictId: string
      userId: string
      email: string
      severity: string
    }
  }
  'notification/document-processed': {
    data: {
      documentId: string
      userId: string
      email: string
      status: string
    }
  }
  'notification/test': {
    data: {
      userId: string
      type: string
      email: string
    }
  }
}