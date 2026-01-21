import { inngest } from '@/inngest/client';
import { db } from '@/server/db';
import { generateWebhookSignature, type AnyWebhookEvent } from '@/server/services/webhooks/emitter';

/**
 * Calculate exponential backoff delay for webhook retries
 */
function calculateBackoff(attempt: number): number {
  // Exponential backoff: 30s, 1m, 2m, 4m, 8m
  return Math.min(30 * Math.pow(2, attempt), 480) * 1000;
}

/**
 * Inngest function to deliver webhook with retry logic
 */
export const webhookDelivery = inngest.createFunction(
  {
    id: 'webhook-delivery',
    name: 'Webhook Delivery',
    retries: 0, // We handle retries manually
  },
  { event: 'webhook/deliver' },
  async ({ event, step }) => {
    const { deliveryId, webhookId } = event.data;

    // Step 1: Get delivery and webhook details
    const { delivery, webhook } = await step.run('fetch-details', async () => {
      const delivery = await db.webhookDelivery.findUnique({
        where: { id: deliveryId },
      });

      if (!delivery) {
        throw new Error(`Delivery not found: ${deliveryId}`);
      }

      const webhook = await db.webhook.findUnique({
        where: { id: webhookId },
      });

      if (!webhook) {
        throw new Error(`Webhook not found: ${webhookId}`);
      }

      return { delivery, webhook };
    });

    // Step 2: Check if webhook is still active
    if (!webhook.isActive || webhook.isPaused) {
      await db.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: 'failed',
          errorMessage: 'Webhook is inactive or paused',
          completedAt: new Date(),
        },
      });
      return { success: false, reason: 'webhook_inactive' };
    }

    // Step 3: Prepare payload and signature
    const { payloadString, signature } = await step.run('prepare-payload', async () => {
      const payloadString = JSON.stringify(delivery.payload);
      const signature = generateWebhookSignature(payloadString, webhook.signingSecret);
      return { payloadString, signature };
    });

    // Step 4: Attempt delivery with retries
    const result = await step.run('attempt-delivery', async () => {
      try {
        // Update attempt count
        await db.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            attempts: delivery.attempts + 1,
            lastAttemptAt: new Date(),
            status: 'retrying',
          },
        });

        // Make HTTP request to webhook URL
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-GrantSignal-Signature': signature,
            'X-GrantSignal-Event': delivery.eventType,
            'X-GrantSignal-Delivery': deliveryId,
            'User-Agent': 'GrantSignal-Webhooks/1.0',
          },
          body: payloadString,
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });

        const responseBody = await response.text().catch(() => '');

        // Check if delivery was successful
        if (response.ok) {
          // Success - update delivery status
          await db.webhookDelivery.update({
            where: { id: deliveryId },
            data: {
              status: 'success',
              httpStatus: response.status,
              responseBody,
              completedAt: new Date(),
            },
          });

          // Reset webhook failure count
          if (webhook.failureCount > 0) {
            await db.webhook.update({
              where: { id: webhookId },
              data: {
                failureCount: 0,
                lastFailureAt: null,
                lastFailureReason: null,
              },
            });
          }

          return { success: true };
        } else {
          // Failure - check if we should retry
          const shouldRetry = delivery.attempts + 1 < delivery.maxAttempts;

          await db.webhookDelivery.update({
            where: { id: deliveryId },
            data: {
              status: shouldRetry ? 'pending' : 'failed',
              httpStatus: response.status,
              responseBody,
              errorMessage: `HTTP ${response.status}: ${response.statusText}`,
              nextAttemptAt: shouldRetry
                ? new Date(Date.now() + calculateBackoff(delivery.attempts + 1))
                : null,
              completedAt: shouldRetry ? null : new Date(),
            },
          });

          // Update webhook failure tracking
          await db.webhook.update({
            where: { id: webhookId },
            data: {
              failureCount: { increment: 1 },
              lastFailureAt: new Date(),
              lastFailureReason: `HTTP ${response.status}`,
            },
          });

          // Auto-pause webhook after 10 consecutive failures
          if (webhook.failureCount + 1 >= 10) {
            await db.webhook.update({
              where: { id: webhookId },
              data: {
                isPaused: true,
                lastFailureReason: 'Auto-paused after 10 consecutive failures',
              },
            });
          }

          return {
            success: false,
            shouldRetry,
            httpStatus: response.status,
          };
        }
      } catch (error) {
        // Network or other error
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const shouldRetry = delivery.attempts + 1 < delivery.maxAttempts;

        await db.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            status: shouldRetry ? 'pending' : 'failed',
            errorMessage,
            nextAttemptAt: shouldRetry
              ? new Date(Date.now() + calculateBackoff(delivery.attempts + 1))
              : null,
            completedAt: shouldRetry ? null : new Date(),
          },
        });

        // Update webhook failure tracking
        await db.webhook.update({
          where: { id: webhookId },
          data: {
            failureCount: { increment: 1 },
            lastFailureAt: new Date(),
            lastFailureReason: errorMessage,
          },
        });

        return {
          success: false,
          shouldRetry,
          error: errorMessage,
        };
      }
    });

    // Step 5: Schedule retry if needed
    if (!result.success && result.shouldRetry) {
      const backoffMs = calculateBackoff(delivery.attempts + 1);
      await step.sleep('backoff', backoffMs);

      // Trigger retry
      await inngest.send({
        name: 'webhook/deliver',
        data: {
          deliveryId,
          webhookId,
          event: event.data.event,
        },
      });
    }

    return result;
  }
);
