# Email Service Configuration

This document outlines the configuration needed for the Resend email service integration.

## Environment Variables

Add these environment variables to your `.env.local` file:

```env
# Resend Configuration
RESEND_API_KEY=your_resend_api_key_here
CONVEX_SITE_URL=http://localhost:3000

# Production URLs (update for production)
# CONVEX_SITE_URL=https://your-domain.com
```

## Resend Setup

1. **Get Resend API Key:**
   - Sign up at [resend.com](https://resend.com)
   - Navigate to API Keys section
   - Create a new API key
   - Copy the key to your environment variables

2. **Configure Webhook URL:**
   - In Resend dashboard, go to Webhooks
   - Add webhook URL: `https://your-domain.com/resend-webhook`
   - For local development: Use ngrok or similar tool to expose localhost

3. **Verify Domain (Optional but Recommended):**
   - Add your sending domain in Resend
   - Configure DNS records as instructed
   - This improves deliverability

## Convex Configuration

The Resend component is configured in `convex/convex.config.ts`:

```typescript
import { defineApp } from "convex/server";
import resend from "@convex-dev/resend/convex.config";

const app = defineApp();
app.use(resend);

export default app;
```

## Email Service Features

### 1. Single Email Sending
```typescript
// Send a single email
const emailId = await sendEmail({
  recipient: "user@example.com",
  subject: "Welcome!",
  htmlContent: "<h1>Welcome to our service!</h1>",
  fromEmail: "hello@yourdomain.com",
  fromName: "Your Company",
  templateId: "template_id", // optional
  variables: { name: "John" }, // optional
  campaignId: "campaign_id", // optional
});
```

### 2. Batch Email Sending
```typescript
// Send batch emails with rate limiting
const result = await sendBatchEmails({
  emails: [
    {
      recipient: "user1@example.com",
      subject: "Newsletter",
      htmlContent: "<h1>Monthly Newsletter</h1>",
      variables: { name: "John" },
    },
    // ... more emails
  ],
  fromEmail: "newsletter@yourdomain.com",
  batchName: "Monthly Newsletter",
  templateId: "newsletter_template",
});
```

### 3. Email Scheduling
```typescript
// Schedule email for future sending
await sendEmail({
  recipient: "user@example.com",
  subject: "Scheduled Email",
  htmlContent: "<h1>This was scheduled!</h1>",
  fromEmail: "hello@yourdomain.com",
  scheduledAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours from now
});
```

### 4. Template Processing
```typescript
// Process email template with variables
const processed = await processEmailTemplate({
  templateId: "welcome_template",
  recipient: "user@example.com",
  variables: {
    firstName: "John",
    company: "Acme Corp",
    activationLink: "https://app.com/activate/xyz",
  },
  baseUrl: "https://your-domain.com",
});
```

## Rate Limiting

The system includes built-in rate limiting based on subscription plans:

- **Free Plan:** 50 emails/hour, 100 emails/day
- **Pro Plan:** 500 emails/hour, 2,000 emails/day  
- **Enterprise Plan:** 2,000 emails/hour, 10,000 emails/day

Rate limits are automatically enforced and optimal batch configurations are calculated.

## Email Tracking

### Open Tracking
Automatic tracking pixel injection tracks email opens:
- Unique opens per recipient
- Total opens count
- Geographic data (when available)

### Click Tracking
All links are automatically converted to tracking links:
- Individual click tracking
- URL destination tracking
- User agent and IP logging

### Unsubscribe Handling
Automatic unsubscribe link injection:
- One-click unsubscribe
- Reason capture (optional)
- Automatic suppression list management

## Webhook Events

The system handles these Resend webhook events:
- `sent` - Email was sent
- `delivered` - Email was delivered
- `bounced` - Email bounced
- `complained` - Spam complaint
- `opened` - Email was opened (if tracking enabled)
- `clicked` - Link was clicked (if tracking enabled)

## Analytics & Reporting

### Dashboard Metrics
- Email delivery rates
- Open and click rates
- Bounce and complaint rates
- Campaign performance comparison
- Hourly/daily trend analysis

### Campaign Analytics
- Individual campaign performance
- Recipient engagement tracking
- A/B testing support (via multiple campaigns)
- Real-time status monitoring

## Error Handling

### Retry Logic
- Failed emails are automatically retried (up to 3 attempts)
- Exponential backoff: 1min, 5min, 15min
- Failed emails can be manually retried

### Error Types
- Rate limit exceeded
- Invalid recipient email
- Template processing errors
- Resend API errors
- Unsubscribed recipients

## Data Cleanup

Automatic cleanup runs daily at 2 AM UTC:
- Removes email records older than 7 days
- Keeps tracking data for analytics
- Preserves unsubscribe records indefinitely

## Production Considerations

1. **Domain Verification:**
   - Verify your sending domain with Resend
   - Set up SPF, DKIM, and DMARC records

2. **IP Warming:**
   - Start with smaller volumes
   - Gradually increase sending volume
   - Monitor reputation metrics

3. **List Hygiene:**
   - Regularly clean your contact lists
   - Remove bounced emails
   - Honor unsubscribe requests immediately

4. **Monitoring:**
   - Set up alerts for high bounce rates
   - Monitor delivery rates
   - Track reputation metrics

## Testing

For testing, the system includes:
- Test mode configuration
- Email preview functionality
- Template validation
- Dry run capabilities for batch sends

## Support

For issues with:
- **Resend Integration:** Check Resend documentation and status page
- **Convex Functions:** Review Convex logs and error messages
- **Rate Limiting:** Check subscription plan and current usage
- **Template Processing:** Validate template syntax and variables
