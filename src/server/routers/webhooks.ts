import { z } from 'zod';
import { router, orgProcedure } from '@/server/trpc';
import { db } from '@/server/db';
import crypto from 'crypto';
import { WEBHOOK_EVENTS } from '@/server/services/webhooks/emitter';

/**
 * Generate a cryptographically secure signing secret
 */
function generateSigningSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

export const webhooksRouter = router({
  /**
   * List all webhooks for the organization
   */
  list: orgProcedure.query(async ({ ctx }) => {
    const webhooks = await db.webhook.findMany({
      where: {
        organizationId: ctx.organizationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            deliveries: true,
          },
        },
      },
    });

    return webhooks;
  }),

  /**
   * Get a specific webhook by ID
   */
  byId: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const webhook = await db.webhook.findFirst({
        where: {
          id: input.id,
          organizationId: ctx.organizationId,
        },
        include: {
          deliveries: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 10,
          },
        },
      });

      if (!webhook) {
        throw new Error('Webhook not found');
      }

      return webhook;
    }),

  /**
   * Create a new webhook
   */
  create: orgProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Name is required'),
        url: z.string().url('Must be a valid URL'),
        subscribedEvents: z
          .array(z.enum([
            WEBHOOK_EVENTS.GRANT_STATUS_CHANGED,
            WEBHOOK_EVENTS.DOCUMENT_PROCESSED,
            WEBHOOK_EVENTS.COMPLIANCE_CONFLICT_DETECTED,
          ] as const))
          .min(1, 'At least one event must be selected'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const webhook = await db.webhook.create({
        data: {
          organizationId: ctx.organizationId,
          name: input.name,
          url: input.url,
          subscribedEvents: input.subscribedEvents,
          signingSecret: generateSigningSecret(),
          isActive: true,
          isPaused: false,
          failureCount: 0,
          createdBy: ctx.auth.userId || 'system',
        },
      });

      return webhook;
    }),

  /**
   * Update a webhook
   */
  update: orgProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        url: z.string().url().optional(),
        subscribedEvents: z
          .array(z.enum([
            WEBHOOK_EVENTS.GRANT_STATUS_CHANGED,
            WEBHOOK_EVENTS.DOCUMENT_PROCESSED,
            WEBHOOK_EVENTS.COMPLIANCE_CONFLICT_DETECTED,
          ] as const))
          .min(1)
          .optional(),
        isActive: z.boolean().optional(),
        isPaused: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const webhook = await db.webhook.findFirst({
        where: {
          id,
          organizationId: ctx.organizationId,
        },
      });

      if (!webhook) {
        throw new Error('Webhook not found');
      }

      const updated = await db.webhook.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      return updated;
    }),

  /**
   * Pause a webhook
   */
  pause: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const webhook = await db.webhook.findFirst({
        where: {
          id: input.id,
          organizationId: ctx.organizationId,
        },
      });

      if (!webhook) {
        throw new Error('Webhook not found');
      }

      const updated = await db.webhook.update({
        where: { id: input.id },
        data: { isPaused: true },
      });

      return updated;
    }),

  /**
   * Resume a webhook
   */
  resume: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const webhook = await db.webhook.findFirst({
        where: {
          id: input.id,
          organizationId: ctx.organizationId,
        },
      });

      if (!webhook) {
        throw new Error('Webhook not found');
      }

      const updated = await db.webhook.update({
        where: { id: input.id },
        data: {
          isPaused: false,
          failureCount: 0,
          lastFailureAt: null,
          lastFailureReason: null,
        },
      });

      return updated;
    }),

  /**
   * Regenerate webhook signing secret
   */
  regenerateSecret: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const webhook = await db.webhook.findFirst({
        where: {
          id: input.id,
          organizationId: ctx.organizationId,
        },
      });

      if (!webhook) {
        throw new Error('Webhook not found');
      }

      const updated = await db.webhook.update({
        where: { id: input.id },
        data: {
          signingSecret: generateSigningSecret(),
        },
      });

      return updated;
    }),

  /**
   * Delete a webhook
   */
  delete: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const webhook = await db.webhook.findFirst({
        where: {
          id: input.id,
          organizationId: ctx.organizationId,
        },
      });

      if (!webhook) {
        throw new Error('Webhook not found');
      }

      await db.webhook.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Get webhook delivery logs
   */
  deliveries: orgProcedure
    .input(
      z.object({
        webhookId: z.string(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const webhook = await db.webhook.findFirst({
        where: {
          id: input.webhookId,
          organizationId: ctx.organizationId,
        },
      });

      if (!webhook) {
        throw new Error('Webhook not found');
      }

      const [deliveries, total] = await Promise.all([
        db.webhookDelivery.findMany({
          where: {
            webhookId: input.webhookId,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: input.limit,
          skip: input.offset,
        }),
        db.webhookDelivery.count({
          where: {
            webhookId: input.webhookId,
          },
        }),
      ]);

      return {
        deliveries,
        total,
      };
    }),

  /**
   * Test a webhook by sending a test event
   */
  test: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const webhook = await db.webhook.findFirst({
        where: {
          id: input.id,
          organizationId: ctx.organizationId,
        },
      });

      if (!webhook) {
        throw new Error('Webhook not found');
      }

      // Create a test event
      const testEvent = {
        id: crypto.randomUUID(),
        type: 'webhook.test',
        timestamp: new Date().toISOString(),
        organizationId: ctx.organizationId,
        data: {
          message: 'This is a test webhook event',
          webhookId: webhook.id,
        },
      };

      const payloadString = JSON.stringify(testEvent);
      const signature = crypto
        .createHmac('sha256', webhook.signingSecret)
        .update(payloadString)
        .digest('hex');

      // Send test request
      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-GrantSignal-Signature': signature,
            'X-GrantSignal-Event': 'webhook.test',
            'User-Agent': 'GrantSignal-Webhooks/1.0',
          },
          body: payloadString,
          signal: AbortSignal.timeout(10000),
        });

        const responseBody = await response.text().catch(() => '');

        return {
          success: response.ok,
          status: response.status,
          statusText: response.statusText,
          body: responseBody,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),
});
