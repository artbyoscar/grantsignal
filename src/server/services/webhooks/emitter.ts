import { db } from '@/server/db';
import { inngest } from '@/inngest/client';
import crypto from 'crypto';

/**
 * Supported webhook event types
 */
export const WEBHOOK_EVENTS = {
  GRANT_STATUS_CHANGED: 'grant.status_changed',
  DOCUMENT_PROCESSED: 'document.processed',
  COMPLIANCE_CONFLICT_DETECTED: 'compliance.conflict_detected',
} as const;

export type WebhookEventType = (typeof WEBHOOK_EVENTS)[keyof typeof WEBHOOK_EVENTS];

/**
 * Base webhook event payload interface
 */
export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  timestamp: string;
  organizationId: string;
  data: unknown;
}

/**
 * Grant status changed event payload
 */
export interface GrantStatusChangedEvent extends WebhookEvent {
  type: typeof WEBHOOK_EVENTS.GRANT_STATUS_CHANGED;
  data: {
    grantId: string;
    oldStatus: string;
    newStatus: string;
    grant: {
      id: string;
      title: string | null;
      amountRequested: number | null;
      amountAwarded: number | null;
      deadline: Date | null;
    };
  };
}

/**
 * Document processed event payload
 */
export interface DocumentProcessedEvent extends WebhookEvent {
  type: typeof WEBHOOK_EVENTS.DOCUMENT_PROCESSED;
  data: {
    documentId: string;
    status: string;
    confidenceScore: number | null;
    hasWarnings: boolean;
    document: {
      id: string;
      name: string;
      type: string;
      size: number;
      grantId: string | null;
    };
  };
}

/**
 * Compliance conflict detected event payload
 */
export interface ComplianceConflictDetectedEvent extends WebhookEvent {
  type: typeof WEBHOOK_EVENTS.COMPLIANCE_CONFLICT_DETECTED;
  data: {
    conflictId: string;
    commitmentId: string;
    conflictType: string;
    severity: string;
    conflict: {
      id: string;
      conflictType: string;
      severity: string;
      description: string;
      resolutionAction: string | null;
    };
  };
}

/**
 * Union type of all webhook events
 */
export type AnyWebhookEvent =
  | GrantStatusChangedEvent
  | DocumentProcessedEvent
  | ComplianceConflictDetectedEvent;

/**
 * Generate a unique webhook signature for verification
 */
export function generateWebhookSignature(
  payload: string,
  secret: string
): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verify a webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Emit a webhook event to all subscribed webhooks
 */
export async function emitWebhookEvent(
  event: AnyWebhookEvent
): Promise<void> {
  try {
    // Find all active webhooks subscribed to this event type
    const webhooks = await db.webhook.findMany({
      where: {
        organizationId: event.organizationId,
        isActive: true,
        isPaused: false,
        subscribedEvents: {
          has: event.type,
        },
      },
    });

    if (webhooks.length === 0) {
      console.log(`No webhooks subscribed to event: ${event.type}`);
      return;
    }

    // Create webhook deliveries for each subscribed webhook
    const deliveries = await Promise.all(
      webhooks.map(async (webhook) => {
        const delivery = await db.webhookDelivery.create({
          data: {
            webhookId: webhook.id,
            eventType: event.type,
            payload: event as any,
            status: 'pending',
            attempts: 0,
            maxAttempts: 5,
            scheduledFor: new Date(),
          },
        });

        // Trigger Inngest function to deliver webhook
        await inngest.send({
          name: 'webhook/deliver',
          data: {
            deliveryId: delivery.id,
            webhookId: webhook.id,
            event,
          },
        });

        return delivery;
      })
    );

    console.log(`Created ${deliveries.length} webhook deliveries for event: ${event.type}`);
  } catch (error) {
    console.error('Failed to emit webhook event:', error);
    throw error;
  }
}

/**
 * Emit a grant status changed event
 */
export async function emitGrantStatusChanged(
  organizationId: string,
  grantId: string,
  oldStatus: string,
  newStatus: string,
  grant: GrantStatusChangedEvent['data']['grant']
): Promise<void> {
  const event: GrantStatusChangedEvent = {
    id: crypto.randomUUID(),
    type: WEBHOOK_EVENTS.GRANT_STATUS_CHANGED,
    timestamp: new Date().toISOString(),
    organizationId,
    data: {
      grantId,
      oldStatus,
      newStatus,
      grant,
    },
  };

  await emitWebhookEvent(event);
}

/**
 * Emit a document processed event
 */
export async function emitDocumentProcessed(
  organizationId: string,
  documentId: string,
  status: string,
  confidenceScore: number | null,
  hasWarnings: boolean,
  document: DocumentProcessedEvent['data']['document']
): Promise<void> {
  const event: DocumentProcessedEvent = {
    id: crypto.randomUUID(),
    type: WEBHOOK_EVENTS.DOCUMENT_PROCESSED,
    timestamp: new Date().toISOString(),
    organizationId,
    data: {
      documentId,
      status,
      confidenceScore,
      hasWarnings,
      document,
    },
  };

  await emitWebhookEvent(event);
}

/**
 * Emit a compliance conflict detected event
 */
export async function emitComplianceConflictDetected(
  organizationId: string,
  conflictId: string,
  commitmentId: string,
  conflictType: string,
  severity: string,
  conflict: ComplianceConflictDetectedEvent['data']['conflict']
): Promise<void> {
  const event: ComplianceConflictDetectedEvent = {
    id: crypto.randomUUID(),
    type: WEBHOOK_EVENTS.COMPLIANCE_CONFLICT_DETECTED,
    timestamp: new Date().toISOString(),
    organizationId,
    data: {
      conflictId,
      commitmentId,
      conflictType,
      severity,
      conflict,
    },
  };

  await emitWebhookEvent(event);
}
