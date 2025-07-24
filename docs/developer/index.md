# Developer Setup Guide

This guide will help you set up the SmartBatch Email Marketing platform for local development.

## Prerequisites

- **Node.js** 18.0 or higher
- **npm** 9.0 or higher
- **Git** for version control
- **Docker** (optional, for database)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/smartbatch-email.git
   cd smartbatch-email
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Configure the following variables:
   ```env
   # Convex
   CONVEX_DEPLOYMENT=dev:your-deployment
   NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...

   # Email Service
   RESEND_API_KEY=re_...

   # Optional: External Integrations
   HUBSPOT_API_KEY=your-hubspot-key
   SALESFORCE_CLIENT_ID=your-salesforce-id
   ```

4. **Initialize Convex**
   ```bash
   npx convex dev
   ```

5. **Seed the database** (optional)
   ```bash
   npx convex run seed:seedDatabase
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

## Development Workflow

### Running Tests

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e

# All tests
npm run test:all

# Coverage report
npm run test:coverage
```

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Format code
npm run format
```

### Database Operations

```bash
# Run migrations
npx convex run migrations:runMigrations

# Seed test data
npx convex run seed:seedTestData

# Clear database
npx convex run seed:clearDatabase
```

## Project Structure

```
smartbatch-email/
├── app/                    # Next.js app directory
│   ├── (dashboard)/       # Dashboard pages
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── gdpr/             # GDPR-specific components
│   └── campaigns/        # Campaign components
├── convex/               # Convex backend functions
│   ├── schema.ts         # Database schema
│   ├── gdprCompliance.ts # GDPR functions
│   └── campaigns.ts      # Campaign functions
├── lib/                  # Utility functions
├── types/                # TypeScript type definitions
├── tests/                # Test files
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   └── e2e/            # End-to-end tests
└── docs/                # Documentation
```

## Architecture Overview

### Frontend (Next.js)
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React hooks + Convex real-time subscriptions
- **Authentication**: Clerk for user management

### Backend (Convex)
- **Database**: Convex's built-in document database
- **API**: Convex functions for queries, mutations, and actions
- **Real-time**: WebSocket connections for live updates
- **File Storage**: Convex file storage for email attachments

### Key Features
- **GDPR Compliance**: Consent management, data subject rights
- **Email Campaigns**: Template engine, scheduling, analytics
- **Contact Management**: Segmentation, import/export
- **Integrations**: HubSpot, Salesforce, Zapier connections

## Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for code formatting
- Write meaningful commit messages

### Testing Strategy
- Unit tests for utility functions
- Integration tests for Convex functions
- Component tests for React components
- E2E tests for critical user journeys

### Security Considerations
- Never commit secrets to version control
- Use environment variables for configuration
- Implement proper error handling
- Follow OWASP security guidelines

## Debugging

### Common Issues

**Convex connection errors**
```bash
# Check deployment status
npx convex dashboard

# Restart Convex dev server
npx convex dev --once
```

**Authentication issues**
```bash
# Verify Clerk configuration
echo $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
echo $CLERK_SECRET_KEY
```

**Build errors**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Contributing

1. Create a feature branch from `main`
2. Make your changes with tests
3. Run the test suite
4. Submit a pull request with a clear description

### Pull Request Guidelines
- Include tests for new features
- Update documentation as needed
- Follow the existing code style
- Write clear commit messages

## Getting Help

- **Documentation**: Check the docs folder
- **Issues**: Search existing GitHub issues
- **Discord**: Join our developer community
- **Email**: developers@smartbatch.com

## Performance Tips

- Use React.memo for expensive components
- Implement proper loading states
- Optimize database queries
- Use Convex's built-in caching
- Monitor bundle size with `npm run analyze`
