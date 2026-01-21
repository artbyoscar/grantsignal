# Email Notifications - Quick Start Guide

A complete email notification system has been implemented for GrantSignal. Here's everything you need to know to get started.

## 🎉 What's Been Built

### Database Schema
✅ Added `NotificationPreferences` table for user settings
✅ Added `NotificationLog` table for tracking sent emails
✅ Added enums for notification types and frequencies
✅ Database migrations applied successfully

### Email Templates (React Email)
✅ Deadline Reminder - Beautiful countdown alerts
✅ Weekly Digest - Pipeline summary with stats
✅ Compliance Alert - Conflict detection notifications
✅ Document Processed - Processing status updates

### User Interface
✅ Notification preferences page at `/settings/notifications`
✅ Toggle controls for each notification type
✅ Reminder threshold configuration (7, 3, 1 days)
✅ Digest frequency selector (daily/weekly/none)
✅ Test email buttons for each type
✅ Notification history viewer with filtering

### Backend API (tRPC)
✅ `getPreferences` - Fetch user settings
✅ `updatePreferences` - Update notification settings
✅ `getNotificationLogs` - View notification history
✅ `sendTestNotification` - Test email delivery

### Inngest Functions (Background Jobs)

**Scheduled Functions:**
✅ `send-deadline-reminders` - Runs daily at 8 AM UTC
✅ `send-weekly-digest` - Runs Monday at 8 AM UTC

**Event-Driven Functions:**
✅ `send-compliance-alert` - Triggered by conflict detection
✅ `send-document-processed` - Triggered after document processing

### Integrations
✅ Integrated with existing conflict detection system
✅ Integrated with document processing pipeline
✅ Connected to Clerk for user email addresses
✅ Respects user preferences and organization membership

## 🚀 Quick Setup (5 Minutes)

### Step 1: Get Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Create a new API key
3. Copy the key (starts with `re_`)

### Step 2: Configure Environment Variables

Add to your `.env` file:

```bash
# Email Notifications
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL="GrantSignal <notifications@grantsignal.com>"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Start Development

```bash
# Start Next.js dev server
pnpm dev

# In another terminal, start Inngest dev server
npx inngest-cli dev
```

### Step 4: Test It Out

1. Open [http://localhost:3000/settings/notifications](http://localhost:3000/settings/notifications)
2. Enable notification types
3. Click "Send Test Email" buttons
4. Check your inbox!

## 📧 Notification Types Explained

### 1. Deadline Reminders
**When:** Daily at 8 AM UTC
**Who:** Users with grants that have upcoming deadlines
**Why:** Never miss an important grant deadline

**Configuration:**
- Enable/disable in settings
- Choose reminder days: 7, 3, 1 day(s) before deadline
- Applies to grants in PROSPECT through PENDING status

**Example:**
```
Subject: Deadline Reminder: National Science Foundation (3 days left)

Your grant application is due soon!

Funder: National Science Foundation
Deadline: January 23, 2026
Status: WRITING
Days Remaining: 3
```

### 2. Weekly Digest
**When:** Every Monday at 8 AM UTC (or daily if configured)
**Who:** All users who opt in
**Why:** Stay informed on pipeline health and upcoming work

**Contains:**
- Total grants, awarded amount, active grants
- Upcoming deadlines (next 7 days)
- Recent activity (updated grants)
- Quick pipeline stats

**Configuration:**
- Enable/disable in settings
- Choose frequency: Daily, Weekly, or None

### 3. Compliance Alerts
**When:** Immediately after conflict detection
**Who:** Users with HIGH or CRITICAL conflicts
**Why:** Prevent commitment overlaps and conflicts

**Triggers:**
- New HIGH severity conflicts detected
- New CRITICAL severity conflicts detected
- Scheduled daily scan (2 AM UTC)
- Manual conflict detection

**Contains:**
- Conflict type and severity
- Affected grants
- Suggested resolution
- Action items

### 4. Document Processing
**When:** After document upload and processing completes
**Who:** Users who enable this notification
**Why:** Know when documents are ready or need review

**Contains:**
- Processing status (Success/Review Needed/Failed)
- Confidence score
- Number of extracted commitments
- Warnings or errors
- Link to view document

## 🎨 Email Template Customization

Templates are located in `src/lib/email-templates/`:

- `deadline-reminder.tsx`
- `weekly-digest.tsx`
- `compliance-alert.tsx`
- `document-processed.tsx`

Each template is a React component that accepts props for dynamic content. They use inline styles for maximum email client compatibility.

**To customize:**
1. Edit the TSX file
2. Restart dev server
3. Send test email to preview changes

## 🔧 Troubleshooting

### Emails not sending?

**Check Resend API key:**
```bash
# In .env file
RESEND_API_KEY=re_...  # Must start with re_
```

**Check Inngest is running:**
```bash
# Terminal 1: Next.js
pnpm dev

# Terminal 2: Inngest
npx inngest-cli dev
```

**Verify in Inngest dashboard:**
- Go to [http://localhost:8288](http://localhost:8288)
- Check that all 4 notification functions are registered
- Try manually triggering a function

### Emails going to spam?

For development (Resend sandbox):
- Check spam/junk folder
- Whitelist notifications@resend.dev

For production:
- Verify your domain in Resend
- Add SPF/DKIM DNS records
- Use your verified domain in RESEND_FROM_EMAIL

### Preferences not saving?

1. Check browser console for errors
2. Verify Clerk user has an email address
3. Check database for NotificationPreferences record
4. Try refreshing the page

### No notification history showing?

- History only shows notifications sent after implementation
- Try sending a test email to create first log entry
- Check NotificationLog table in database

## 📊 Monitoring

### Inngest Dashboard
- Local: [http://localhost:8288](http://localhost:8288)
- Production: [https://app.inngest.com](https://app.inngest.com)

**What to monitor:**
- Function execution success rate
- Failed function runs (will auto-retry)
- Scheduled job execution times
- Event volume

### Resend Dashboard
- [https://resend.com/dashboard](https://resend.com/dashboard)

**What to monitor:**
- Emails sent vs. rate limits
- Delivery rates
- Bounce rates
- Domain verification status

### Application
- `/settings/notifications` - View user's notification history
- Database: Query `NotificationLog` table for analytics

## 🚢 Production Deployment

### Before Deploying

1. **Verify Resend domain:**
   ```
   1. Add your domain in Resend dashboard
   2. Add DNS records (SPF, DKIM)
   3. Wait for verification
   4. Update RESEND_FROM_EMAIL with verified domain
   ```

2. **Set environment variables in hosting platform:**
   ```bash
   RESEND_API_KEY=re_live_...  # Use production key
   RESEND_FROM_EMAIL="GrantSignal <notifications@yourdomain.com>"
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

3. **Deploy Inngest functions:**
   - Inngest will auto-discover functions on deployment
   - Verify in Inngest dashboard that functions are registered
   - Check that cron jobs are scheduled

### After Deploying

1. **Test all notification types** using test email buttons
2. **Monitor first 24 hours** for any issues
3. **Check deliverability** - emails not going to spam?
4. **Review logs** - any failed sends?
5. **Gather feedback** - users receiving notifications?

## 📈 Usage Analytics

Query notification logs for insights:

```sql
-- Notifications sent by type (last 30 days)
SELECT
  type,
  COUNT(*) as total,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
  ROUND(AVG(CASE WHEN success THEN 100 ELSE 0 END)::numeric, 2) as success_rate
FROM "NotificationLog"
WHERE "sentAt" >= NOW() - INTERVAL '30 days'
GROUP BY type
ORDER BY total DESC;

-- Most active users (by notifications received)
SELECT
  "userId",
  COUNT(*) as notifications_received,
  COUNT(DISTINCT type) as notification_types
FROM "NotificationLog"
WHERE "sentAt" >= NOW() - INTERVAL '30 days'
GROUP BY "userId"
ORDER BY notifications_received DESC
LIMIT 10;

-- Failed notifications requiring attention
SELECT *
FROM "NotificationLog"
WHERE success = false
  AND "sentAt" >= NOW() - INTERVAL '7 days'
ORDER BY "sentAt" DESC;
```

## 🎯 Next Steps

Now that notifications are set up:

1. **Test thoroughly** - Use the testing guide in `NOTIFICATION_TESTING.md`
2. **Get user feedback** - Are notifications helpful? Too frequent?
3. **Monitor usage** - Which notifications are most valuable?
4. **Iterate** - Adjust frequencies, add new types, improve templates

## 📚 Additional Resources

- [Full Setup Guide](./EMAIL_NOTIFICATIONS.md) - Detailed technical documentation
- [Testing Guide](./NOTIFICATION_TESTING.md) - Comprehensive testing checklist
- [Resend Docs](https://resend.com/docs) - Email provider documentation
- [Inngest Docs](https://www.inngest.com/docs) - Background job documentation
- [React Email](https://react.email) - Email template documentation

## 💡 Tips & Best Practices

1. **Start conservative** - Users can always enable more notifications
2. **Test before announcing** - Ensure everything works smoothly
3. **Monitor rate limits** - Resend free tier has limits
4. **Provide value** - Each notification should be actionable
5. **Easy unsubscribe** - Respect user preferences
6. **Track metrics** - Use logs to improve notification quality

## ✅ Quick Checklist

Before considering notifications "done":

- [ ] Resend API key configured
- [ ] All 4 email templates rendering correctly
- [ ] Settings page accessible and functional
- [ ] Test emails received successfully
- [ ] Inngest functions registered and running
- [ ] Scheduled jobs tested (manual trigger)
- [ ] Event-driven notifications tested
- [ ] Notification logs being created
- [ ] Error handling tested
- [ ] Documentation reviewed
- [ ] Team trained on troubleshooting
- [ ] Production deployment plan ready

---

**Questions?** Check the detailed guides in the `docs/` folder or review the implementation in:
- `src/inngest/send-*.ts` - Notification functions
- `src/lib/email-templates/` - Email templates
- `src/server/routers/notifications.ts` - API endpoints
- `src/app/(dashboard)/settings/notifications/` - UI components
