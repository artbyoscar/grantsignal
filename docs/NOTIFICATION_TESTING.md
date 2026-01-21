# Email Notification Testing Guide

This guide provides step-by-step instructions for testing the email notification system.

## Prerequisites

1. Resend API key configured in `.env`
2. Development server running (`pnpm dev`)
3. Inngest Dev Server running (`npx inngest-cli dev`)
4. User account with email in Clerk
5. Organization with at least one grant

## Test Checklist

### ✅ Setup Verification

- [ ] Environment variables set correctly
- [ ] Database migrations applied
- [ ] Inngest functions registered
- [ ] Can access `/settings/notifications`
- [ ] Preferences load without errors

### ✅ User Preferences

1. Navigate to `/settings/notifications`
2. Verify your email address is displayed
3. Test each toggle:
   - [ ] Deadline reminders ON/OFF
   - [ ] Weekly digest ON/OFF
   - [ ] Compliance alerts ON/OFF
   - [ ] Document processed ON/OFF

4. Test reminder thresholds:
   - [ ] Select/deselect 7 days
   - [ ] Select/deselect 3 days
   - [ ] Select/deselect 1 day

5. Test digest frequency:
   - [ ] Set to Daily
   - [ ] Set to Weekly
   - [ ] Set to None

6. Verify settings persist after page reload

### ✅ Test Emails

For each notification type, click "Send Test Email" and verify:

#### Deadline Reminder
- [ ] Email received
- [ ] Subject includes deadline countdown
- [ ] Grant details displayed
- [ ] "View Grant Details" link works
- [ ] Responsive design on mobile

#### Weekly Digest
- [ ] Email received
- [ ] Stats are accurate
- [ ] Upcoming deadlines listed
- [ ] Recent activity shown
- [ ] "View Full Dashboard" link works

#### Compliance Alert
- [ ] Email received
- [ ] Alert severity displayed
- [ ] Affected grants listed
- [ ] Action required section shown
- [ ] "Review in Compliance Dashboard" link works

#### Document Processed
- [ ] Email received
- [ ] Document details correct
- [ ] Status badge displayed
- [ ] Warnings shown (if any)
- [ ] "View Document Details" link works

### ✅ Scheduled Jobs (Manual Trigger)

Test scheduled jobs using Inngest dashboard:

#### Deadline Reminders (Daily at 8 AM)

1. Create grants with deadlines:
   - One grant due in 7 days
   - One grant due in 3 days
   - One grant due tomorrow

2. Enable deadline reminders with all thresholds selected

3. Manually trigger `send-deadline-reminders` in Inngest

4. Verify:
   - [ ] 3 emails received (one per deadline)
   - [ ] Each email has correct countdown
   - [ ] NotificationLog entries created
   - [ ] Inngest function succeeded

#### Weekly Digest (Monday at 8 AM)

1. Ensure your organization has:
   - Several grants in pipeline
   - Some awarded grants
   - At least one upcoming deadline

2. Enable weekly digest (set to Weekly)

3. Manually trigger `send-weekly-digest` in Inngest

4. Verify:
   - [ ] Email received
   - [ ] Stats match dashboard
   - [ ] All sections populated
   - [ ] NotificationLog entry created
   - [ ] Inngest function succeeded

### ✅ Event-Driven Notifications

#### Compliance Alert (Conflict Detection)

1. Create conflicting commitments:
   ```
   Grant A: Deliver 100 meals by Dec 31
   Grant B: Deliver 200 meals by Dec 31
   Total: 300 meals (capacity conflict)
   ```

2. Run conflict detection:
   - Navigate to `/compliance`
   - Click "Scan for Conflicts"

3. Verify:
   - [ ] Compliance alert email received
   - [ ] Conflict details shown
   - [ ] Severity badge displayed
   - [ ] Suggested resolution included
   - [ ] NotificationLog entry created

#### Document Processed

1. Upload a document:
   - Navigate to `/documents`
   - Upload a PDF or DOCX file
   - Enable document processing notifications

2. Wait for processing to complete

3. Verify:
   - [ ] Document processed email received
   - [ ] Processing status correct
   - [ ] Confidence score displayed
   - [ ] Extracted commitments count shown
   - [ ] NotificationLog entry created

### ✅ Notification History

1. Navigate to `/settings/notifications` → History tab

2. Verify:
   - [ ] Recent notifications listed
   - [ ] Timestamps accurate
   - [ ] Success/failure badges shown
   - [ ] Can filter by type
   - [ ] Failed notifications show error messages

### ✅ Edge Cases

#### User with No Email
- [ ] Error message shown in preferences
- [ ] Cannot enable notifications
- [ ] Graceful fallback

#### User with Notifications Disabled
- [ ] No emails sent
- [ ] Scheduled jobs skip user
- [ ] No NotificationLog entries

#### Failed Email Send
- [ ] Error logged in NotificationLog
- [ ] User can see failure in history
- [ ] Inngest retries (check retry count)

#### Multiple Users in Organization
- [ ] Each user receives their own emails
- [ ] Preferences are per-user
- [ ] Notification logs are separate

#### Organization with No Grants
- [ ] Weekly digest shows empty state
- [ ] No deadline reminders sent
- [ ] Email still sent with "no activity" message

### ✅ Production Readiness

Before deploying to production:

- [ ] Resend domain verified
- [ ] Production environment variables set
- [ ] Inngest deployed to production
- [ ] Cron jobs scheduled correctly
- [ ] Test emails sent from production
- [ ] Monitor first 24 hours of notifications
- [ ] Check email deliverability rates
- [ ] Verify emails not going to spam

## Manual Testing Scripts

### Create Test Data

```typescript
// Create grants with various deadlines
const today = new Date();
const deadlines = [1, 3, 7, 14, 30].map(days => {
  const deadline = new Date(today);
  deadline.setDate(deadline.getDate() + days);
  return deadline;
});

// Create test conflicts
const conflicts = [
  { type: 'METRIC_MISMATCH', severity: 'HIGH' },
  { type: 'TIMELINE_OVERLAP', severity: 'CRITICAL' },
  { type: 'BUDGET_DISCREPANCY', severity: 'MEDIUM' },
];
```

### Trigger Notifications Programmatically

```typescript
import { inngest } from '@/inngest/client';

// Test deadline reminder
await inngest.send({
  name: 'notification/deadline-reminder',
  data: {
    grantId: 'grant_123',
    userId: 'user_123',
    email: 'test@example.com',
  },
});

// Test compliance alert
await inngest.send({
  name: 'notification/compliance-alert',
  data: {
    conflictId: 'conflict_123',
    userId: 'user_123',
    email: 'test@example.com',
    severity: 'CRITICAL',
  },
});
```

### Query Notification Logs

```sql
-- Check recent sends
SELECT
  type,
  subject,
  "sentAt",
  success,
  "errorMessage"
FROM "NotificationLog"
WHERE "userId" = 'user_123'
ORDER BY "sentAt" DESC
LIMIT 20;

-- Check success rate
SELECT
  type,
  COUNT(*) as total,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
  ROUND(AVG(CASE WHEN success THEN 100 ELSE 0 END), 2) as success_rate
FROM "NotificationLog"
GROUP BY type;
```

## Common Issues

### Email Not Received

1. Check spam/junk folder
2. Verify email in Clerk profile
3. Check NotificationLog for send status
4. Verify Resend API key
5. Check Inngest function logs

### Wrong Email Content

1. Check email template files
2. Verify data passed to template
3. Test with sample data
4. Check for template rendering errors

### Notifications Not Triggering

1. Verify user preferences enabled
2. Check Inngest function is deployed
3. Verify event name matches
4. Check Inngest dashboard for errors
5. Verify cron schedule syntax

### Performance Issues

1. Check batch size for bulk sends
2. Monitor Resend rate limits
3. Check database query performance
4. Optimize Inngest function execution

## Automated Testing

Future: Add automated tests for notifications

```typescript
// Example test structure
describe('Email Notifications', () => {
  it('sends deadline reminders', async () => {
    // Create grant with deadline in 7 days
    // Enable user preferences
    // Trigger function
    // Assert email sent
    // Verify log created
  });

  it('respects user preferences', async () => {
    // Disable notifications
    // Trigger function
    // Assert no email sent
  });

  it('handles email failures gracefully', async () => {
    // Mock Resend error
    // Trigger function
    // Assert error logged
    // Verify retry behavior
  });
});
```

## Sign-off Checklist

Before marking notifications as complete:

- [ ] All notification types tested
- [ ] User preferences working
- [ ] Scheduled jobs triggering correctly
- [ ] Event-driven notifications working
- [ ] Error handling tested
- [ ] Logs capturing all sends
- [ ] Email templates rendering correctly
- [ ] Links in emails working
- [ ] Responsive design verified
- [ ] Production deployment ready
- [ ] Documentation complete
- [ ] Team trained on troubleshooting

## Next Steps

After testing:

1. Document any issues found
2. Create tickets for improvements
3. Set up monitoring alerts
4. Schedule follow-up review in 1 week
5. Gather user feedback
6. Optimize based on usage patterns
