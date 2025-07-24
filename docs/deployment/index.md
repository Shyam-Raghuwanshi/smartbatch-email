# Deployment Guide

This guide covers deploying SmartBatch Email Marketing to various environments.

## Overview

Our deployment strategy uses:
- **Staging Environment**: For testing and validation
- **Production Environment**: For live users
- **Preview Deployments**: For feature branches

## Prerequisites

- Vercel account (recommended) or compatible hosting platform
- Convex account with production deployment
- Domain name configured
- Environment variables configured

## Environment Setup

### 1. Staging Environment

Create a staging environment for testing:

```bash
# Create Convex staging deployment
npx convex deploy --cmd "npm run build" --env staging

# Configure staging environment variables
cp .env.example .env.staging
```

**Staging Environment Variables:**
```env
# Convex
CONVEX_DEPLOYMENT=staging:your-staging-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-staging-deployment.convex.cloud

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_staging...
CLERK_SECRET_KEY=sk_test_staging...

# Email Service (use test API key)
RESEND_API_KEY=re_test_...

# Domain
NEXT_PUBLIC_APP_URL=https://staging.yourdomain.com
```

### 2. Production Environment

Production deployment configuration:

```bash
# Create Convex production deployment
npx convex deploy --cmd "npm run build" --env production

# Configure production environment variables
cp .env.example .env.production
```

**Production Environment Variables:**
```env
# Convex
CONVEX_DEPLOYMENT=production:your-prod-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-prod-deployment.convex.cloud

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Email Service
RESEND_API_KEY=re_live_...

# Domain
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Analytics (optional)
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
```

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Configure Vercel**
   ```bash
   vercel link
   ```

3. **Set Environment Variables**
   ```bash
   # Staging
   vercel env add CONVEX_DEPLOYMENT staging
   vercel env add NEXT_PUBLIC_CONVEX_URL staging
   # ... add all staging variables

   # Production
   vercel env add CONVEX_DEPLOYMENT production
   vercel env add NEXT_PUBLIC_CONVEX_URL production
   # ... add all production variables
   ```

4. **Deploy**
   ```bash
   # Deploy to staging
   vercel --env staging

   # Deploy to production
   vercel --prod
   ```

### Option 2: Docker Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine AS base

   # Install dependencies only when needed
   FROM base AS deps
   WORKDIR /app
   COPY package.json package-lock.json ./
   RUN npm ci --only=production

   # Rebuild the source code only when needed
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   RUN npm run build

   # Production image, copy all the files and run next
   FROM base AS runner
   WORKDIR /app

   ENV NODE_ENV production

   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs

   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

   USER nextjs

   EXPOSE 3000

   ENV PORT 3000
   ENV HOSTNAME "0.0.0.0"

   CMD ["node", "server.js"]
   ```

2. **Build and Deploy**
   ```bash
   # Build Docker image
   docker build -t smartbatch-email .

   # Run container
   docker run -p 3000:3000 --env-file .env.production smartbatch-email
   ```

### Option 3: Railway

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Initialize**
   ```bash
   railway login
   railway init
   ```

3. **Configure Environment**
   ```bash
   railway variables:set CONVEX_DEPLOYMENT=production:your-deployment
   railway variables:set NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
   # ... set all variables
   ```

4. **Deploy**
   ```bash
   railway up
   ```

## Database Migrations

Run database migrations before deployment:

```bash
# Staging
npx convex run migrations:runMigrations --env staging

# Production
npx convex run migrations:runMigrations --env production
```

## Health Checks

Implement health check endpoints:

```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Check database connection
    // Check external services
    
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        email: 'healthy',
        auth: 'healthy'
      }
    })
  } catch (error) {
    return Response.json(
      { status: 'unhealthy', error: error.message },
      { status: 500 }
    )
  }
}
```

## Monitoring Setup

### 1. Application Monitoring

```typescript
// lib/monitoring.ts
import { Analytics } from '@vercel/analytics'

export const trackEvent = (name: string, properties?: Record<string, any>) => {
  if (process.env.NODE_ENV === 'production') {
    Analytics.track(name, properties)
  }
}

export const trackError = (error: Error, context?: Record<string, any>) => {
  console.error('Application Error:', error, context)
  
  // Send to error monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Implement error tracking (Sentry, LogRocket, etc.)
  }
}
```

### 2. Performance Monitoring

```typescript
// lib/performance.ts
export const measurePerformance = (name: string, fn: () => Promise<any>) => {
  return async (...args: any[]) => {
    const start = performance.now()
    try {
      const result = await fn.apply(this, args)
      const duration = performance.now() - start
      
      console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`)
      return result
    } catch (error) {
      const duration = performance.now() - start
      console.error(`Performance: ${name} failed after ${duration.toFixed(2)}ms`, error)
      throw error
    }
  }
}
```

## Security Configuration

### 1. Content Security Policy

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline';
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: https:;
              font-src 'self';
              connect-src 'self' https://*.convex.cloud https://clerk.com;
            `.replace(/\s+/g, ' ').trim()
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ]
  }
}
```

### 2. Rate Limiting

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})

export async function middleware(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous'
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return new NextResponse('Rate limit exceeded', { status: 429 })
  }

  return NextResponse.next()
}
```

## Backup Strategy

### 1. Database Backups

```bash
# Create backup script
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="smartbatch_backup_$TIMESTAMP"

# Export data using Convex
npx convex run backup:exportAllData --env production > "$BACKUP_NAME.json"

# Upload to secure storage
aws s3 cp "$BACKUP_NAME.json" "s3://your-backup-bucket/backups/"
```

### 2. Automated Backups

```yaml
# .github/workflows/backup.yml
name: Database Backup
on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npx convex run backup:exportAllData --env production
        env:
          CONVEX_DEPLOYMENT: ${{ secrets.CONVEX_DEPLOYMENT }}
      - run: # Upload backup to secure storage
```

## Rollback Strategy

### 1. Quick Rollback

```bash
# Rollback to previous deployment
vercel rollback

# Or rollback to specific deployment
vercel rollback <deployment-url>
```

### 2. Database Rollback

```bash
# Restore from backup
npx convex run backup:importData --env production --file backup.json
```

## Performance Optimization

### 1. Build Optimization

```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    optimizeCss: true,
    swcMinify: true,
  },
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  compress: true,
}
```

### 2. Caching Strategy

```typescript
// app/api/cache/route.ts
export async function GET() {
  return Response.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
    }
  })
}
```

## Post-Deployment Checklist

- [ ] Verify all environment variables are set
- [ ] Run database migrations
- [ ] Test critical user journeys
- [ ] Verify GDPR compliance features
- [ ] Check email sending functionality
- [ ] Validate SSL certificates
- [ ] Test monitoring and alerts
- [ ] Verify backup processes
- [ ] Load test critical endpoints
- [ ] Update DNS records (if needed)

## Troubleshooting

### Common Issues

1. **Convex Connection Errors**
   - Verify CONVEX_DEPLOYMENT and NEXT_PUBLIC_CONVEX_URL
   - Check Convex deployment status

2. **Authentication Issues**
   - Verify Clerk keys and domain configuration
   - Check redirect URLs

3. **Email Sending Issues**
   - Verify Resend API key
   - Check DNS records for sending domain

4. **Performance Issues**
   - Enable caching
   - Optimize database queries
   - Use CDN for static assets
