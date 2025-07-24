# API Documentation

## GDPR Compliance API

### Overview

The GDPR Compliance API provides endpoints for managing data protection, consent, and subject rights in accordance with GDPR regulations.

## Authentication

All API endpoints require authentication. Use Clerk authentication tokens:

```javascript
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

## Endpoints

### Consent Management

#### Record Consent

**Mutation**: `recordConsent`

Records a new consent or updates an existing one for a contact.

```typescript
const consentId = await convex.mutation(api.gdprCompliance.recordConsent, {
  contactId: "contact_123",
  consentType: "marketing",
  consentSource: "website-form",
  legalBasis: "consent",
  details: {
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0...",
    timestamp: Date.now()
  }
});
```

**Parameters:**
- `contactId` (Id<"contacts">): The contact's unique identifier
- `consentType` ("marketing" | "analytics" | "functional" | "necessary"): Type of consent
- `consentSource` (string): Where the consent was obtained (e.g., "website-form", "email", "phone")
- `legalBasis` (string): Legal basis for processing (e.g., "consent", "legitimate-interest")
- `details` (optional object): Additional metadata

**Returns:** Consent record ID

#### Withdraw Consent

**Mutation**: `withdrawConsent`

Withdraws an existing consent for a contact.

```typescript
const result = await convex.mutation(api.gdprCompliance.withdrawConsent, {
  contactId: "contact_123",
  consentType: "marketing",
  reason: "User requested withdrawal via email"
});
```

**Parameters:**
- `contactId` (Id<"contacts">): The contact's unique identifier
- `consentType` ("marketing" | "analytics" | "functional" | "necessary"): Type of consent to withdraw
- `reason` (optional string): Reason for withdrawal

#### Get Consent Status

**Query**: `getConsentStatus`

Retrieves the current consent status for a contact.

```typescript
const status = await convex.query(api.gdprCompliance.getConsentStatus, {
  contactId: "contact_123"
});
```

**Returns:**
```typescript
{
  contactId: string;
  contactEmail: string;
  consents: Array<{
    type: string;
    status: boolean;
    date: number;
    source: string;
    legalBasis: string;
  }>;
  hasMarketingConsent: boolean;
  lastUpdated: number;
}
```

### Data Subject Rights

#### Process Data Access Request

**Mutation**: `processDataAccessRequest`

Submits a data subject access request.

```typescript
const requestId = await convex.mutation(api.gdprCompliance.processDataAccessRequest, {
  contactEmail: "user@example.com",
  requestType: "access",
  requestDetails: "I need access to all my personal data"
});
```

**Parameters:**
- `contactEmail` (string): Email address of the data subject
- `requestType` ("access" | "portability" | "rectification" | "deletion"): Type of request
- `requestDetails` (optional string): Additional details about the request

#### Process GDPR Request

**Mutation**: `processGdprRequest`

Updates the status of a GDPR request.

```typescript
await convex.mutation(api.gdprCompliance.processGdprRequest, {
  requestId: "request_123",
  status: "completed",
  notes: "Data export generated and sent to user"
});
```

**Parameters:**
- `requestId` (Id<"gdprRequests">): The request's unique identifier
- `status` ("processing" | "completed" | "rejected"): New status
- `notes` (optional string): Processing notes

#### Generate Data Export

**Action**: `generateDataExport`

Generates a data export for a portability request.

```typescript
const result = await convex.action(api.gdprCompliance.generateDataExport, {
  requestId: "request_123"
});
```

**Returns:**
```typescript
{
  success: boolean;
  downloadUrl: string;
  expiresAt: number;
}
```

### Dashboard and Reporting

#### Get GDPR Dashboard

**Query**: `getGDPRDashboard`

Retrieves compliance dashboard data.

```typescript
const dashboard = await convex.query(api.gdprCompliance.getGDPRDashboard, {
  timeRange: 30 // days
});
```

**Returns:**
```typescript
{
  consentStats: {
    total: number;
    active: number;
    withdrawn: number;
    byType: Record<string, { given: number; withdrawn: number }>;
  };
  requestStats: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    rejected: number;
    byType: Record<string, number>;
  };
  complianceScore: number;
  recommendations: string[];
}
```

## Error Handling

All API endpoints return structured errors:

```typescript
{
  error: {
    code: "UNAUTHORIZED" | "NOT_FOUND" | "VALIDATION_ERROR" | "INTERNAL_ERROR";
    message: string;
    details?: any;
  }
}
```

### Common Error Codes

- `UNAUTHORIZED`: User not authenticated or insufficient permissions
- `NOT_FOUND`: Resource not found (contact, request, etc.)
- `VALIDATION_ERROR`: Invalid input parameters
- `INTERNAL_ERROR`: Server-side error

## Rate Limiting

API calls are rate-limited to prevent abuse:
- 100 requests per minute per user
- 1000 requests per hour per user

## Data Retention

All API operations are logged for audit purposes. Logs are retained according to GDPR requirements:
- Consent records: 7 years after withdrawal
- Request logs: 7 years
- Audit logs: 7 years

## Webhooks

Subscribe to GDPR events using webhooks:

```typescript
// Webhook payload example
{
  event: "consent.given" | "consent.withdrawn" | "request.submitted" | "request.completed";
  timestamp: number;
  data: {
    contactEmail: string;
    requestId?: string;
    consentType?: string;
    // ... other relevant data
  }
}
```

## Testing

Use the test environment for development:

```javascript
// Set test mode
process.env.NODE_ENV = 'test';
process.env.CONVEX_URL = 'https://test.convex.cloud';
```

## Examples

### Complete Consent Flow

```typescript
// 1. Record initial consent
const consentId = await convex.mutation(api.gdprCompliance.recordConsent, {
  contactId: "contact_123",
  consentType: "marketing",
  consentSource: "signup-form",
  legalBasis: "consent"
});

// 2. Check consent status
const status = await convex.query(api.gdprCompliance.getConsentStatus, {
  contactId: "contact_123"
});

// 3. Withdraw consent if needed
if (userWantsToOptOut) {
  await convex.mutation(api.gdprCompliance.withdrawConsent, {
    contactId: "contact_123",
    consentType: "marketing",
    reason: "User opted out via preference center"
  });
}
```

### Data Subject Request Flow

```typescript
// 1. Submit access request
const requestId = await convex.mutation(api.gdprCompliance.processDataAccessRequest, {
  contactEmail: "user@example.com",
  requestType: "access"
});

// 2. Process the request
await convex.mutation(api.gdprCompliance.processGdprRequest, {
  requestId,
  status: "processing",
  notes: "Starting data collection"
});

// 3. Complete the request
await convex.mutation(api.gdprCompliance.processGdprRequest, {
  requestId,
  status: "completed",
  notes: "Data provided to user"
});
```
