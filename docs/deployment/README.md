# Deployment Guide

## Overview

This guide covers deploying the SmartBatch Email Marketing Platform with GDPR compliance features to various environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Vercel Deployment](#vercel-deployment)
4. [Docker Deployment](#docker-deployment)
5. [Database Setup](#database-setup)
6. [Security Configuration](#security-configuration)
7. [Monitoring Setup](#monitoring-setup)
8. [GDPR Compliance Checklist](#gdpr-compliance-checklist)

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Convex account
- Clerk account for authentication
- Domain name (for production)
- SSL certificate (handled by hosting provider)

## Environment Configuration

### Required Environment Variables

Create `.env.local` for local development and configure the following in your deployment environment:

```bash
# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Database
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOY_KEY=your-deploy-key

# Email Service (Resend)
RESEND_API_KEY=re_...

# Security
NEXTAUTH_SECRET=your-secret-key-here
ENCRYPTION_KEY=your-encryption-key-32-chars

# Analytics (Optional)
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id

# GDPR Compliance
GDPR_DPO_EMAIL=dpo@yourcompany.com
GDPR_COMPANY_NAME=Your Company Name
GDPR_RETENTION_PERIOD_DAYS=2555  # 7 years in days
```

### Environment-Specific Configuration

#### Development
```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
LOG_LEVEL=debug
```

#### Staging
```bash
NODE_ENV=staging
NEXT_PUBLIC_APP_URL=https://staging.yourdomain.com
LOG_LEVEL=info
```

#### Production
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
LOG_LEVEL=error
```

## Vercel Deployment

### 1. Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Configure project settings

### 2. Environment Variables

Add all required environment variables in Vercel dashboard:
- Go to Project Settings → Environment Variables
- Add each variable with appropriate scope (Development/Preview/Production)

### 3. Build Configuration

Create `vercel.json`:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["iad1"],
  "functions": {
    "app/api/**/*": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}
```

### 4. Deploy

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

## Docker Deployment

### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### 2. Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_CONVEX_URL=${CONVEX_URL}
      - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${CLERK_PUBLISHABLE_KEY}
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  redis_data:
```

### 3. Build and Deploy

```bash
# Build the image
docker build -t smartbatch-email .

# Run with docker-compose
docker-compose up -d

# Check logs
docker-compose logs -f app
```

## Database Setup

### 1. Convex Configuration

Set up your Convex backend:

```bash
# Install Convex CLI
npm install -g convex

# Login to Convex
npx convex login

# Deploy your functions
npx convex deploy --prod
```

### 2. Database Schema Migration

Run initial schema setup:

```bash
# Run migrations
npx convex run migrations:initial

# Seed initial data (if needed)
npx convex run seed:initialData
```

## Security Configuration

### 1. SSL/TLS Setup

- Use HTTPS in production (handled by Vercel/hosting provider)
- Configure security headers (see vercel.json example)
- Set up Content Security Policy (CSP)

### 2. Environment Security

```bash
# Generate secure secrets
openssl rand -base64 32  # For NEXTAUTH_SECRET
openssl rand -base64 32  # For ENCRYPTION_KEY
```

### 3. Rate Limiting

Configure rate limiting for API endpoints:

```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
})
```

## Monitoring Setup

### 1. Error Tracking

Set up Sentry for error tracking:

```bash
npm install @sentry/nextjs
```

```javascript
// sentry.client.config.js
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
})
```

### 2. Performance Monitoring

Configure performance monitoring:

```typescript
// lib/analytics.ts
export const trackEvent = (event: string, properties?: any) => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    // Track events with your analytics provider
    console.log('Event tracked:', event, properties)
  }
}
```

### 3. Health Checks

Create health check endpoints:

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check database connection
    // Check external services
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    })
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: error.message },
      { status: 503 }
    )
  }
}
```

## GDPR Compliance Checklist

### Pre-Deployment

- [ ] Data encryption configured
- [ ] Audit logging implemented
- [ ] Consent management system active
- [ ] Data retention policies configured
- [ ] Privacy policy updated
- [ ] Cookie policy implemented
- [ ] Data processing agreements signed

### Post-Deployment

- [ ] SSL certificate installed
- [ ] Security headers configured
- [ ] GDPR dashboard accessible
- [ ] Data subject request forms working
- [ ] Email notifications configured
- [ ] Backup and recovery tested
- [ ] Incident response plan documented

### Ongoing Compliance

- [ ] Regular security audits scheduled
- [ ] Data retention policies automated
- [ ] Staff training completed
- [ ] Third-party vendor assessments
- [ ] Compliance monitoring active
- [ ] Documentation updated

## Deployment Scripts

### Automated Deployment

```bash
#!/bin/bash
# deploy.sh

set -e

echo "Starting deployment..."

# Run tests
npm run test
npm run test:e2e

# Build application
npm run build

# Deploy to Convex
npx convex deploy --prod

# Deploy to Vercel
vercel --prod

echo "Deployment completed successfully!"
```

### Rollback Script

```bash
#!/bin/bash
# rollback.sh

set -e

echo "Rolling back deployment..."

# Rollback Convex functions
npx convex rollback --prod

# Rollback Vercel deployment
vercel rollback --prod

echo "Rollback completed!"
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check environment variables
   - Verify Node.js version
   - Clear node_modules and reinstall

2. **Database Connection Issues**
   - Verify Convex URL and deploy key
   - Check network connectivity
   - Review Convex dashboard logs

3. **Authentication Problems**
   - Verify Clerk configuration
   - Check redirect URLs
   - Validate environment variables

4. **Performance Issues**
   - Enable caching
   - Optimize images
   - Review bundle size

### Logs and Debugging

```bash
# View Vercel logs
vercel logs

# View Convex logs
npx convex logs

# Local debugging
npm run dev -- --debug
```

## Support

For deployment support:
- Documentation: [docs.smartbatch.com](https://docs.smartbatch.com)
- Support: support@smartbatch.com
- Status: [status.smartbatch.com](https://status.smartbatch.com)
