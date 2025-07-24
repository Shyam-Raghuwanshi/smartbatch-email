# Testing Guide

This guide covers the comprehensive testing strategy for SmartBatch Email Marketing.

## Testing Philosophy

Our testing strategy follows the testing pyramid:
- **Unit Tests** (70%): Fast, isolated tests for individual functions
- **Integration Tests** (20%): Tests for component interactions
- **End-to-End Tests** (10%): Full user journey tests

## Test Categories

### 1. Unit Tests

Located in `tests/unit/`, these test individual functions and utilities.

```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

**Example Unit Test:**
```typescript
// tests/unit/gdpr-utils.test.ts
import { describe, it, expect } from 'vitest'
import { validateEmail, maskEmail } from '@/lib/gdpr-utils'

describe('GDPR Utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('invalid')).toBe(false)
    })
  })

  describe('maskEmail', () => {
    it('should mask email for privacy', () => {
      expect(maskEmail('john.doe@example.com')).toBe('j*****e@example.com')
    })
  })
})
```

### 2. Integration Tests

Located in `tests/integration/`, these test Convex functions and database operations.

```bash
# Run integration tests
npm run test:integration
```

**Example Integration Test:**
```typescript
// tests/integration/gdpr-convex.test.ts
import { describe, it, expect, vi } from 'vitest'

describe('GDPR Convex Functions', () => {
  it('should record consent with audit logging', async () => {
    // Mock context and database operations
    const mockCtx = {
      db: {
        insert: vi.fn().mockResolvedValue('consent-123'),
        query: vi.fn(),
      },
      auth: {
        getUserIdentity: vi.fn().mockResolvedValue({ subject: 'user-123' })
      }
    }

    // Test consent recording logic
    // Assert expected database calls
    expect(mockCtx.db.insert).toHaveBeenCalledWith('gdprConsents', expect.objectContaining({
      consentType: 'marketing',
      consentStatus: true
    }))
  })
})
```

### 3. Component Tests

Located in `tests/components/`, these test React components in isolation.

```bash
# Run component tests
npm run test:components
```

**Example Component Test:**
```typescript
// tests/components/gdpr-dashboard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { GDPRDashboard } from '@/components/gdpr/dashboard'

describe('GDPR Dashboard', () => {
  it('should display consent statistics', () => {
    const mockStats = {
      total: 100,
      active: 80,
      withdrawn: 20
    }

    render(<GDPRDashboard consentStats={mockStats} />)

    expect(screen.getByText('Total Consents: 100')).toBeInTheDocument()
    expect(screen.getByText('Active: 80')).toBeInTheDocument()
  })
})
```

### 4. End-to-End Tests

Located in `e2e/`, these test complete user workflows using Playwright.

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run specific test file
npx playwright test gdpr-compliance
```

**Example E2E Test:**
```typescript
// e2e/gdpr-compliance.spec.ts
import { test, expect } from '@playwright/test'

test('should record and withdraw consent', async ({ page }) => {
  await page.goto('/dashboard/contacts')
  
  // Select contact
  await page.click('[data-testid="contact-row"]')
  
  // Record consent
  await page.click('[data-testid="manage-consent-button"]')
  await page.selectOption('[data-testid="consent-type"]', 'marketing')
  await page.click('[data-testid="record-consent"]')
  
  // Verify success message
  await expect(page.locator('[data-testid="success-message"]'))
    .toContainText('Consent recorded successfully')
})
```

## Testing Utilities

### Mock Data Factory

```typescript
// tests/utils/factories.ts
export const createMockContact = (overrides = {}) => ({
  _id: 'contact_123',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  userId: 'user_123',
  isActive: true,
  createdAt: Date.now(),
  ...overrides
})

export const createMockConsent = (overrides = {}) => ({
  _id: 'consent_123',
  userId: 'user_123',
  contactEmail: 'test@example.com',
  consentType: 'marketing',
  consentStatus: true,
  consentDate: Date.now(),
  source: 'website_form',
  legalBasis: 'consent',
  ...overrides
})
```

### Test Helpers

```typescript
// tests/utils/helpers.ts
export const mockConvexQuery = (mockData: any) => {
  return vi.fn().mockResolvedValue(mockData)
}

export const mockConvexMutation = () => {
  return vi.fn().mockResolvedValue('success')
}

export const waitForAsyncUpdate = () => {
  return new Promise(resolve => setTimeout(resolve, 0))
}
```

## Test Coverage Requirements

### Coverage Thresholds

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        // Specific requirements for critical modules
        'convex/gdprCompliance.ts': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        }
      }
    }
  }
})
```

### Critical Code Paths

These areas require 90%+ test coverage:
- GDPR compliance functions
- Data validation utilities
- Authentication logic
- Email sending functionality
- Database mutations

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:coverage
      - run: npm run test:e2e
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

## Testing Best Practices

### 1. Test Organization

```
tests/
├── unit/
│   ├── utils/
│   ├── validation/
│   └── gdpr/
├── integration/
│   ├── convex/
│   └── api/
├── components/
│   ├── ui/
│   └── gdpr/
└── e2e/
    ├── auth/
    ├── campaigns/
    └── gdpr/
```

### 2. Naming Conventions

- Test files: `*.test.ts` or `*.spec.ts`
- E2E tests: `*.spec.ts` in `e2e/` directory
- Mock files: `*.mock.ts`
- Factories: `factories.ts`

### 3. Test Structure

Follow the AAA pattern:
```typescript
test('should validate email format', () => {
  // Arrange
  const email = 'test@example.com'
  
  // Act
  const result = validateEmail(email)
  
  // Assert
  expect(result).toBe(true)
})
```

### 4. Mock Strategy

- Mock external dependencies
- Use factories for test data
- Mock time-dependent functions
- Avoid mocking the code under test

### 5. Async Testing

```typescript
test('should handle async operations', async () => {
  const mockMutation = vi.fn().mockResolvedValue({ success: true })
  
  const result = await recordConsent(mockData)
  
  expect(result).toEqual({ success: true })
  expect(mockMutation).toHaveBeenCalledTimes(1)
})
```

## Performance Testing

### Load Testing with k6

```javascript
// tests/performance/load-test.js
import http from 'k6/http'
import { check } from 'k6'

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
}

export default function () {
  const response = http.get('https://your-app.com/api/health')
  
  check(response, {
    'response time < 500ms': (r) => r.timings.duration < 500,
    'status is 200': (r) => r.status === 200,
  })
}
```

### Memory Leak Testing

```typescript
// tests/performance/memory-test.ts
test('should not leak memory during bulk operations', async () => {
  const initialMemory = process.memoryUsage().heapUsed
  
  // Perform bulk operations
  for (let i = 0; i < 1000; i++) {
    await createContact(mockContactData)
  }
  
  // Force garbage collection
  if (global.gc) global.gc()
  
  const finalMemory = process.memoryUsage().heapUsed
  const memoryIncrease = finalMemory - initialMemory
  
  // Memory increase should be reasonable
  expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // 50MB
})
```

## Accessibility Testing

### Automated Accessibility Tests

```typescript
// tests/a11y/accessibility.test.ts
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { GDPRDashboard } from '@/components/gdpr/dashboard'

expect.extend(toHaveNoViolations)

test('should have no accessibility violations', async () => {
  const { container } = render(<GDPRDashboard />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

## Security Testing

### Input Validation Tests

```typescript
// tests/security/validation.test.ts
describe('Input Validation', () => {
  test('should reject malicious email inputs', () => {
    const maliciousInputs = [
      '<script>alert("xss")</script>@example.com',
      'user@<script>alert("xss")</script>.com',
      'user@example.com<script>alert("xss")</script>',
    ]
    
    maliciousInputs.forEach(input => {
      expect(validateEmail(input)).toBe(false)
    })
  })
})
```

## Database Testing

### Test Data Management

```typescript
// tests/utils/db-setup.ts
export const setupTestData = async () => {
  // Create test users
  const testUser = await createTestUser()
  
  // Create test contacts
  const testContacts = await createTestContacts(testUser.id)
  
  // Create test consents
  await createTestConsents(testContacts)
  
  return { testUser, testContacts }
}

export const cleanupTestData = async () => {
  // Clean up test data after tests
  await deleteTestData()
}
```

## Debugging Tests

### Debug Configuration

```json
// .vscode/launch.json
{
  "configurations": [
    {
      "name": "Debug Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run", "--reporter=verbose"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Test Debugging Commands

```bash
# Debug specific test
npm run test -- --reporter=verbose gdpr-utils

# Debug with Chrome DevTools
npm run test -- --inspect-brk

# Run tests in isolation
npm run test -- --run --isolate
```

## Test Maintenance

### Regular Tasks

1. **Update test dependencies monthly**
2. **Review and update test coverage thresholds**
3. **Clean up obsolete tests**
4. **Update mock data to match schema changes**
5. **Review and optimize slow tests**

### Test Metrics

Track these metrics:
- Test execution time
- Test coverage percentage
- Number of flaky tests
- Test maintenance overhead
