# Email Notifications Setup Guide

This guide covers the email notification system in GrantSignal, which sends automated alerts and digests to users.

## Features

### 📧 Notification Types

1. **Deadline Reminders**
   - Automatic reminders before grant deadlines
   - Configurable thresholds (7 days, 3 days, 1 day)
   - Sent daily at 8 AM UTC

2. **Weekly Digest**
   - Pipeline summary and statistics
   - Upcoming deadlines in next 7 days
   - Recent activity
   - Sent every Monday at 8 AM UTC
   - Configurable frequency (daily/weekly/none)

3. **Compliance Alerts**
   - Critical conflict detection
   - Commitment due notifications
   - Triggered automatically when conflicts are detected

4. **Document Processing**
   - Success/failure notifications
   - Extracted commitments summary
   - Processing warnings
   - Triggered after document processing completes

## Setup Instructions

### 1. Get a Resend API Key

1. Go to [resend.com](https://resend.com) and sign up
2. Create a new API key in your dashboard
3. Copy the API key (starts with `re_`)

### 2. Configure Environment Variables

Add the following to your `.env` file:

```bash
# Email Notifications (Resend)
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL="GrantSignal <notifications@grantsignal.com>"

# Base URL for email links
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important Notes:**
- Replace `notifications@grantsignal.com` with your verified sending domain in Resend
- For production, set `NEXT_PUBLIC_APP_URL` to your production domain
- Resend requires domain verification for production sending

### 3. Verify Domain in Resend

For production use:

1. Go to Resend dashboard → Domains
2. Add your domain (e.g., `grantsignal.com`)
3. Add the provided DNS records to your domain
4. Wait for verification (usually a few minutes)
5. Update `RESEND_FROM_EMAIL` to use your verified domain

### 4. Test Notifications

1. Start your development server:
   ```bash
   pnpm dev
   ```

2. Navigate to `/settings/notifications` in your app

3. Enable notification types and click "Send Test Email" buttons

4. Check your email inbox (and spam folder)

### 5. Deploy to Production

When deploying:

1. Set environment variables in your hosting platform
2. Ensure Inngest is connected and running
3. Verify cron jobs are scheduled in Inngest dashboard
4. Test all notification types in production

## Architecture

### Database Schema

**NotificationPreferences**
- User-level settings for each notification type
- Reminder thresholds and digest frequency
- Email address from Clerk

**NotificationLog**
- Audit trail of all sent notifications
- Success/failure tracking
- Searchable metadata

### Inngest Functions

Located in `src/inngest/`:

1. **send-deadline-reminders.ts**
   - Cron: `0 8 * * *` (daily at 8 AM)
   - Checks grants with deadlines in next 30 days
   - Sends reminders based on user thresholds

2. **send-weekly-digest.ts**
   - Cron: `0 8 * * 1` (Monday at 8 AM)
   - Aggregates organization statistics
   - Sends digest to users based on frequency preference

3. **send-compliance-alert.ts**
   - Event-driven: `notification/compliance-alert`
   - Triggered by conflict detection
   - Only sends for HIGH/CRITICAL severity

4. **send-document-processed.ts**
   - Event-driven: `notification/document-processed`
   - Triggered after document processing completes
   - Includes extraction results and warnings

### Email Templates

Located in `src/lib/email-templates/`:

- `deadline-reminder.tsx` - Deadline notifications
- `weekly-digest.tsx` - Pipeline summary emails
- `compliance-alert.tsx` - Conflict and commitment alerts
- `document-processed.tsx` - Document processing results

Built with React Email for responsive, accessible HTML emails.

### tRPC API

Located in `src/server/routers/notifications.ts`:

- `getPreferences` - Fetch user notification settings
- `updatePreferences` - Update notification settings
- `getNotificationLogs` - View notification history
- `sendTestNotification` - Send test emails

## User Settings Page

Location: `/settings/notifications`

Features:
- Toggle each notification type
- Configure deadline reminder thresholds
- Set digest frequency
- Send test emails
- View notification history

## Triggering Notifications

### From Code

```typescript
import { inngest } from '@/inngest/client';

// Send compliance alert
await inngest.send({
  name: 'notification/compliance-alert',
  data: {
    conflictId: 'conflict_123',
    userId: 'user_123',
    email: 'user@example.com',
    severity: 'CRITICAL',
  },
});

// Send document processed notification
await inngest.send({
  name: 'notification/document-processed',
  data: {
    documentId: 'doc_123',
    userId: 'user_123',
    email: 'user@example.com',
    status: 'COMPLETED',
  },
});
```

### Scheduled Jobs

Cron jobs are automatically registered with Inngest:
- View in Inngest dashboard under "Functions"
- Monitor execution history and logs
- Manually trigger for testing

## Monitoring

### Inngest Dashboard

1. Go to [app.inngest.com](https://app.inngest.com)
2. View function executions
3. Check for failures and retry attempts
4. Monitor scheduled job runs

### Notification Logs

Users can view their notification history at `/settings/notifications` → History tab:
- Subject and timestamp
- Success/failure status
- Error messages for failed sends

### Database Queries

```sql
-- Recent notifications
SELECT * FROM "NotificationLog"
ORDER BY "sentAt" DESC
LIMIT 100;

-- Failed notifications
SELECT * FROM "NotificationLog"
WHERE success = false
ORDER BY "sentAt" DESC;

-- Notification counts by type
SELECT type, COUNT(*) as count
FROM "NotificationLog"
GROUP BY type;
```

## Troubleshooting

### Emails not sending

1. **Check Resend API key**: Ensure it's valid and has sending permissions
2. **Verify domain**: For production, domain must be verified in Resend
3. **Check Inngest**: Ensure functions are deployed and running
4. **View logs**: Check Inngest dashboard for error messages
5. **Test manually**: Use "Send Test Email" buttons in settings

### Emails going to spam

1. **SPF/DKIM**: Ensure DNS records are properly configured
2. **DMARC**: Add DMARC policy to your domain
3. **Content**: Avoid spam trigger words
4. **Unsubscribe**: Resend automatically adds unsubscribe links

### User not receiving notifications

1. **Check preferences**: User must have notifications enabled
2. **Verify email**: Ensure email address is correct in Clerk
3. **Check logs**: View NotificationLog for that user
4. **Organization access**: User must be part of organization

### Scheduled jobs not running

1. **Inngest connection**: Ensure Inngest is deployed and connected
2. **Environment**: Check INNGEST_SIGNING_KEY and INNGEST_EVENT_KEY
3. **Cron syntax**: Verify cron expressions are correct
4. **Manual trigger**: Test by manually running function in Inngest dashboard

## Rate Limits

### Resend Limits

- **Free tier**: 3,000 emails/month, 100 emails/day
- **Pro tier**: 50,000 emails/month
- **Rate limit**: 10 requests/second

### Best Practices

1. **Batch sending**: Process notifications in batches
2. **Exponential backoff**: Implement retries with delays
3. **Monitor usage**: Track sent emails in Resend dashboard
4. **Upgrade plan**: Scale to Pro tier for production use

## Security

### Email Validation

- Emails are validated from Clerk
- User must be authenticated to receive notifications
- Organization membership is verified

### Privacy

- Users control their notification preferences
- Notification logs are private to each user
- Unsubscribe links are included in all emails

### Data Protection

- No sensitive data in email subjects
- Grant details use generic titles in notifications
- Deep links require authentication to view

## Future Enhancements

Potential improvements:

- [ ] SMS notifications via Twilio
- [ ] In-app notification center
- [ ] Slack/Teams integrations
- [ ] Custom notification templates
- [ ] Notification digest batching
- [ ] A/B testing for email content
- [ ] Advanced analytics and reporting
- [ ] Per-grant notification preferences
- [ ] Notification snoozing/reminders
- [ ] Email template customization UI

## Support

For issues or questions:
- Check [Resend documentation](https://resend.com/docs)
- Check [Inngest documentation](https://www.inngest.com/docs)
- Review notification logs in the app
- Contact support with relevant log entries
