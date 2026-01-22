import { inngest } from './client';
import { db } from '@/lib/prisma';
import { resend, FROM_EMAIL } from '@/lib/resend';
import { render } from '@react-email/render';
import { DocumentProcessedEmail } from '@/lib/email-templates/document-processed';

/**
 * Event-driven function that sends document processing notifications
 * Triggered when a document finishes processing
 */
export const sendDocumentProcessed = inngest.createFunction(
  {
    id: 'send-document-processed',
    name: 'Send Document Processed Notification',
  },
  { event: 'notification/document-processed' },
  async ({ event, step }) => {
    const { documentId, userId, email, status } = event.data;

    const document = await step.run('fetch-document-details', async () => {
      return await db.document.findUnique({
        where: { id: documentId },
        include: {
          grant: {
            include: {
              funder: true,
            },
          },
          sourceCommitments: true,
        },
      });
    });

    if (!document) {
      throw new Error(`Document ${documentId} not found`);
    }

    await step.run('send-email', async () => {
      try {
        const warnings: string[] = [];
        if (document.parseWarnings && typeof document.parseWarnings === 'object') {
          const warningsObj = document.parseWarnings as Record<string, unknown>;
          if (Array.isArray(warningsObj)) {
            warnings.push(...warningsObj.map(String));
          }
        }

        const emailHtml = await render(
          DocumentProcessedEmail({
            documentName: document.name,
            documentType: document.type,
            grantTitle: document.grant?.funder?.name,
            processingStatus: document.status as 'COMPLETED' | 'NEEDS_REVIEW' | 'FAILED',
            confidenceScore: document.confidenceScore || undefined,
            extractedCommitments: document.sourceCommitments.length,
            warnings: warnings.length > 0 ? warnings : undefined,
            documentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/documents`,
          }) as any
        );

        const statusEmoji =
          document.status === 'COMPLETED' ? '✅' :
          document.status === 'NEEDS_REVIEW' ? '⚠️' :
          '❌';

        await resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: `${statusEmoji} Document Processed: ${document.name}`,
          html: emailHtml,
        });

        // Log the notification
        await db.notificationLog.create({
          data: {
            userId,
            type: 'DOCUMENT_PROCESSED',
            subject: `Document Processed: ${document.name}`,
            metadata: { documentId, status: document.status },
            success: true,
          },
        });

        return { success: true };
      } catch (error) {
        console.error(`Failed to send document processed notification to ${email}:`, error);

        // Log the failed notification
        await db.notificationLog.create({
          data: {
            userId,
            type: 'DOCUMENT_PROCESSED',
            subject: `Document Processed: ${document.name}`,
            metadata: { documentId, status: document.status },
            success: false,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        });

        throw error;
      }
    });

    return { documentId, sent: true };
  }
);
