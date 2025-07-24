# Developer Setup Guide

## Prerequisites

Before setting up the development environment, ensure you have:

- **Node.js** 18.0 or later
- **npm** 8.0 or later (or **yarn**/**pnpm**)
- **Git** for version control
- **VS Code** (recommended) with suggested extensions

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/smartbatch-email.git
cd smartbatch-email

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

## Detailed Setup

### 1. Environment Configuration

Create `.env.local` in the root directory:

```env
# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_secret_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Database (Convex)
NEXT_PUBLIC_CONVEX_URL=https://your-dev-deployment.convex.cloud
CONVEX_DEPLOY_KEY=your_deploy_key_here

# Email Service (Resend)
RESEND_API_KEY=re_your_api_key_here

# Development
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Setting up Convex

1. **Install Convex CLI**:
   ```bash
   npm install -g convex
   ```

2. **Login to Convex**:
   ```bash
   npx convex login
   ```

3. **Initialize Convex project**:
   ```bash
   npx convex dev
   ```

4. **Deploy initial schema**:
   ```bash
   npx convex deploy
   ```

### 3. Setting up Clerk Authentication

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application
3. Copy the API keys to your `.env.local`
4. Configure OAuth providers (optional)
5. Set up webhooks for user management

### 4. Setting up Email Service (Resend)

1. Go to [Resend Dashboard](https://resend.com/dashboard)
2. Create an API key
3. Add the API key to your `.env.local`
4. Verify your domain (for production)

## Development Workflow

### Starting the Development Server

```bash
# Start Next.js development server
npm run dev

# Start Convex in development mode (separate terminal)
npx convex dev

# Open the application
# Navigate to http://localhost:3000
```

### Project Structure

```
smartbatch-email/
├── app/                    # Next.js 13+ app directory
│   ├── (dashboard)/       # Dashboard routes
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── forms/            # Form components
│   └── layout/           # Layout components
├── convex/               # Backend functions and schema
│   ├── _generated/       # Generated types
│   ├── schema.ts         # Database schema
│   └── *.ts             # Convex functions
├── lib/                  # Utility functions
├── types/               # TypeScript type definitions
├── docs/                # Documentation
├── tests/               # Test files
└── e2e/                 # End-to-end tests
```

### Code Style and Formatting

We use ESLint and Prettier for code formatting:

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### TypeScript

This project uses TypeScript with strict mode enabled. Key configuration:

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

## Testing

### Unit Tests

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Open test UI
npm run test:ui
```

### Integration Tests

```bash
# Run integration tests
npm run test:integration
```

### End-to-End Tests

```bash
# Install Playwright browsers
npx playwright install

# Run e2e tests
npm run test:e2e

# Run e2e tests with UI
npm run test:e2e:ui

# Run specific test file
npx playwright test gdpr-compliance.spec.ts
```

### Component Testing

```bash
# Test specific component
npm run test -- components/gdpr

# Test with React Testing Library
npm run test -- --testNamePattern="GDPR"
```

## Database Schema Development

### Schema Changes

1. **Modify schema** in `convex/schema.ts`:
   ```typescript
   // Example: Adding a new table
   export default defineSchema({
     // ...existing tables
     newTable: defineTable({
       field1: v.string(),
       field2: v.number(),
       createdAt: v.number(),
     }).index("by_field1", ["field1"]),
   })
   ```

2. **Create migration** in `convex/migrations/`:
   ```typescript
   // convex/migrations/001_add_new_table.ts
   import { internalMutation } from "./_generated/server"
   
   export const addNewTable = internalMutation({
     handler: async (ctx) => {
       // Migration logic
     }
   })
   ```

3. **Deploy changes**:
   ```bash
   npx convex deploy
   ```

### Seeding Data

Create seed functions for development:

```typescript
// convex/seed.ts
import { internalMutation } from "./_generated/server"

export const seedDevelopmentData = internalMutation({
  handler: async (ctx) => {
    // Create test users, contacts, etc.
  }
})
```

Run seeding:
```bash
npx convex run seed:seedDevelopmentData
```

## GDPR Development Guidelines

### Data Handling

1. **Always encrypt sensitive data**:
   ```typescript
   import { encrypt, decrypt } from "@/lib/encryption"
   
   const encryptedData = encrypt(sensitiveInfo)
   ```

2. **Log all GDPR-related actions**:
   ```typescript
   await ctx.db.insert("auditLogs", {
     userId: user._id,
     eventType: "gdpr_action",
     resource: "contact",
     action: "data_access",
     timestamp: Date.now(),
   })
   ```

3. **Implement consent checks**:
   ```typescript
   const hasConsent = await checkMarketingConsent(contactId)
   if (!hasConsent) {
     throw new Error("No marketing consent")
   }
   ```

### Testing GDPR Features

1. **Test consent flows**:
   ```typescript
   test("should record marketing consent", async () => {
     const consentId = await recordConsent({
       contactId: "test_contact",
       consentType: "marketing",
       source: "test",
       legalBasis: "consent"
     })
     expect(consentId).toBeDefined()
   })
   ```

2. **Test data subject rights**:
   ```typescript
   test("should process data deletion request", async () => {
     const requestId = await processDataDeletionRequest({
       contactEmail: "test@example.com"
     })
     expect(requestId).toBeDefined()
   })
   ```

## Development Tools

### Recommended VS Code Extensions

Create `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-typescript.vscode-typescript-next",
    "ms-playwright.playwright",
    "vitest.explorer"
  ]
}
```

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  }
}
```

### Git Hooks

Set up pre-commit hooks with Husky:

```bash
# Install husky
npm install --save-dev husky

# Set up git hooks
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run test"
```

## Debugging

### Browser DevTools

1. **Enable React DevTools**
2. **Use Convex DevTools** for backend debugging
3. **Network tab** for API requests
4. **Console** for error tracking

### VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### Logging

Use structured logging:

```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(JSON.stringify({ level: 'info', message, meta, timestamp: new Date().toISOString() }))
  },
  error: (message: string, error?: Error, meta?: any) => {
    console.error(JSON.stringify({ level: 'error', message, error: error?.message, stack: error?.stack, meta, timestamp: new Date().toISOString() }))
  }
}
```

## Performance Optimization

### Development Build Analysis

```bash
# Analyze bundle size
npm run build
npm run analyze

# Check for unused dependencies
npx depcheck

# Audit dependencies
npm audit
```

### Performance Monitoring

```typescript
// lib/performance.ts
export const measurePerformance = (name: string) => {
  const start = performance.now()
  
  return {
    end: () => {
      const duration = performance.now() - start
      console.log(`${name} took ${duration.toFixed(2)}ms`)
    }
  }
}
```

## Common Development Tasks

### Adding a New GDPR Feature

1. **Define the requirement** in documentation
2. **Write tests** first (TDD approach)
3. **Create backend functions** in Convex
4. **Build frontend components**
5. **Add API routes** if needed
6. **Update documentation**
7. **Test thoroughly**

### Creating a New Component

```typescript
// components/gdpr/NewComponent.tsx
import React from 'react'
import { cn } from '@/lib/utils'

interface NewComponentProps {
  // Define props
}

export const NewComponent: React.FC<NewComponentProps> = ({
  // Props
}) => {
  return (
    <div className={cn("base-styles")}>
      {/* Component content */}
    </div>
  )
}
```

### Adding a New Convex Function

```typescript
// convex/newFunction.ts
import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

export const newMutation = mutation({
  args: {
    // Define arguments
  },
  handler: async (ctx, args) => {
    // Implementation
  }
})
```

## Troubleshooting

### Common Issues

1. **Convex connection errors**:
   - Check CONVEX_URL in .env.local
   - Verify Convex deployment is running
   - Check network connectivity

2. **Authentication issues**:
   - Verify Clerk configuration
   - Check redirect URLs
   - Clear browser cache/cookies

3. **Build errors**:
   - Clear .next directory
   - Delete node_modules and reinstall
   - Check TypeScript errors

4. **Test failures**:
   - Update test snapshots: `npm run test -- -u`
   - Check test database state
   - Verify mock configurations

### Getting Help

- **Documentation**: Check the docs/ directory
- **GitHub Issues**: Create an issue for bugs
- **Discord/Slack**: Join the development channel
- **Code Review**: Request review from team members

## Contributing

### Branching Strategy

```bash
# Create feature branch
git checkout -b feature/gdpr-enhancement

# Create bug fix branch
git checkout -b fix/consent-validation

# Create documentation branch
git checkout -b docs/api-updates
```

### Commit Messages

Follow conventional commits:

```bash
git commit -m "feat(gdpr): add data portability export"
git commit -m "fix(consent): validate consent type enum"
git commit -m "docs(api): update GDPR endpoints"
git commit -m "test(integration): add consent flow tests"
```

### Pull Request Process

1. **Create feature branch** from main
2. **Implement changes** with tests
3. **Update documentation** if needed
4. **Run full test suite**
5. **Create pull request** with description
6. **Address review feedback**
7. **Merge after approval**
