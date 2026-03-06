# Production Environment Configuration

This document outlines the production environment setup for GrantSignal.

## Required Environment Variables

All environment variables are documented in `.env.example`. Copy this file and fill in your production values.

## External Services Configuration

### 1. Clerk Authentication

**Production Setup:**
1. Create a production instance at [dashboard.clerk.com](https://dashboard.clerk.com)
2. Configure allowed domains: `grantsignal.com`, `www.grantsignal.com`
3. Set up OAuth providers (Google, GitHub) with production credentials
4. Configure webhook endpoint: `https://grantsignal.com/api/webhooks/clerk`

**Required Variables:**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
```

**Verification:**
- Test sign-up flow on production domain
- Verify OAuth redirects work correctly
- Confirm webhook events are received

---

### 2. Neon PostgreSQL Database

**Production Setup:**
1. Create a production project at [console.neon.tech](https://console.neon.tech)
2. Enable connection pooling (recommended for serverless)
3. Set up branch protection for main branch
4. Configure IP allowlisting if needed

**Required Variables:**
```
DATABASE_URL="postgresql://user:pass@ep-xxx.us-west-2.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:pass@ep-xxx.us-west-2.aws.neon.tech/neondb?sslmode=require"
```

**Verification:**
- Run `pnpm prisma db push` to sync schema
- Verify connection with `pnpm prisma studio`
- Test read/write operations from application

---

### 3. Pinecone Vector Database

**Production Setup:**
1. Create production index at [app.pinecone.io](https://app.pinecone.io)
2. Index configuration:
   - **Name:** `grantsignal`
   - **Dimensions:** 1536 (for OpenAI ada-002 embeddings)
   - **Metric:** cosine
   - **Pod type:** p1.x1 or higher for production
3. Enable metadata indexing for filtering

**Required Variables:**
```
PINECONE_API_KEY=xxx
PINECONE_INDEX=grantsignal
```

**Verification:**
- Test vector upsert and query operations
- Monitor index statistics in Pinecone console

---

### 4. AWS S3 Document Storage

**Production Setup:**
1. Create S3 bucket: `grantsignal-documents`
2. Configure bucket policy for private access
3. Set up IAM user with minimal permissions:

**IAM Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::grantsignal-documents",
        "arn:aws:s3:::grantsignal-documents/*"
      ]
    }
  ]
}
```

**CORS Configuration:**
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://grantsignal.com", "https://www.grantsignal.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

**Required Variables:**
```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=us-west-2
AWS_S3_BUCKET=grantsignal-documents
```

**Verification:**
- Test file upload from application
- Verify files are accessible (with proper auth)
- Check bucket is not publicly accessible

---

### 5. Inngest Background Jobs

**Production Setup:**
1. Create production app at [app.inngest.com](https://app.inngest.com)
2. Configure signing key for webhook verification
3. Set up the app URL: `https://grantsignal.com/api/inngest`

**Required Variables:**
```
INNGEST_EVENT_KEY=xxx
INNGEST_SIGNING_KEY=signkey-xxx
```

**Verification:**
- Deploy and verify Inngest detects your functions
- Test event triggering via Inngest dashboard
- Monitor function execution in Inngest console

---

### 6. Sentry Error Tracking

**Production Setup:**
1. Create production project at [sentry.io](https://sentry.io)
2. Configure source maps upload in CI/CD
3. Set up release tracking
4. Configure alert rules for critical errors

**Required Variables:**
```
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=grantsignal
SENTRY_AUTH_TOKEN=sntrys_xxx  # For source maps in CI
```

**Verification:**
- Trigger a test error and verify it appears in Sentry
- Confirm source maps are working (readable stack traces)
- Test alerting configuration

---

### 7. Resend Email

**Production Setup:**
1. Create account at [resend.com](https://resend.com)
2. Verify sending domain: `grantsignal.com`
3. Add required DNS records (SPF, DKIM, DMARC)

**Required Variables:**
```
RESEND_API_KEY=re_xxx
```

**Verification:**
- Send test email from application
- Check email deliverability
- Verify emails don't land in spam

---

## Security Headers

The following security headers are configured in `next.config.ts`:

| Header | Value | Purpose |
|--------|-------|---------|
| X-Frame-Options | DENY | Prevents clickjacking |
| X-Content-Type-Options | nosniff | Prevents MIME sniffing |
| Referrer-Policy | origin-when-cross-origin | Controls referrer information |
| X-XSS-Protection | 1; mode=block | XSS filter (legacy browsers) |
| Permissions-Policy | camera=(), microphone=(), geolocation=() | Restricts browser features |
| Strict-Transport-Security | max-age=31536000; includeSubDomains | Enforces HTTPS |

---

## Pre-Deployment Checklist

### Environment Variables
- [ ] All required variables are set in deployment platform
- [ ] No sensitive values are committed to repository
- [ ] Production API keys are used (not development/test)

### Database
- [ ] Production database is provisioned
- [ ] Schema is synced (`prisma db push`)
- [ ] Backups are configured
- [ ] Connection pooling is enabled

### External Services
- [ ] Clerk production instance configured
- [ ] Pinecone production index created
- [ ] S3 bucket with proper permissions
- [ ] Inngest production app connected
- [ ] Sentry project configured
- [ ] Email domain verified

### Security
- [ ] Security headers are active
- [ ] HTTPS is enforced
- [ ] API rate limiting is configured
- [ ] Sensitive routes are protected

### Monitoring
- [ ] Error tracking is active (Sentry)
- [ ] Application logs are accessible
- [ ] Uptime monitoring is configured
- [ ] Performance metrics are tracked

---

## Deployment Platforms

### Vercel (Recommended)

1. Connect GitHub repository
2. Set environment variables in Vercel dashboard
3. Configure production domain
4. Enable Vercel Analytics (optional)

### Other Platforms

For non-Vercel deployments, ensure:
- Node.js 18+ is available
- `pnpm build` produces standalone output
- Environment variables are properly injected
- Health check endpoint is accessible

---

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` format
- Check IP allowlisting on Neon
- Ensure SSL mode is enabled

### Authentication Issues
- Verify Clerk keys match production instance
- Check allowed domains in Clerk dashboard
- Verify webhook signatures

### File Upload Issues
- Check S3 bucket permissions
- Verify CORS configuration
- Ensure IAM credentials have correct permissions

### Background Job Issues
- Verify Inngest signing key
- Check function registration in Inngest dashboard
- Review function logs for errors
