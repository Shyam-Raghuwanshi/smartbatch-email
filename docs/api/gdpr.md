# API Reference

## Authentication

All API requests require authentication using JWT tokens provided by Clerk.

```http
Authorization: Bearer <your-jwt-token>
```

## GDPR Endpoints

### Record Consent

Record or update consent for a contact.

```http
POST /api/gdpr/consent
```

**Request Body:**
```json
{
  "contactId": "contact_123",
  "consentType": "marketing",
  "consentSource": "website_form",
  "legalBasis": "consent",
  "details": {
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "consentId": "consent_456",
  "message": "Consent recorded successfully"
}
```

### Withdraw Consent

Withdraw existing consent for a contact.

```http
DELETE /api/gdpr/consent
```

**Request Body:**
```json
{
  "contactId": "contact_123",
  "consentType": "marketing",
  "reason": "User requested withdrawal"
}
```

### Submit Data Subject Request

Submit a data subject request (access, portability, rectification, deletion).

```http
POST /api/gdpr/requests
```

**Request Body:**
```json
{
  "contactEmail": "user@example.com",
  "requestType": "access",
  "requestDetails": "I want to see what data you have about me"
}
```

**Response:**
```json
{
  "success": true,
  "requestId": "request_789",
  "estimatedCompletion": "2024-02-15T10:00:00Z"
}
```

### Get Consent Status

Retrieve consent status for a contact.

```http
GET /api/gdpr/consent/:contactId
```

**Response:**
```json
{
  "contactId": "contact_123",
  "contactEmail": "user@example.com",
  "consents": [
    {
      "type": "marketing",
      "status": true,
      "date": 1640995200000,
      "source": "website_signup",
      "legalBasis": "consent"
    }
  ],
  "hasMarketingConsent": true,
  "lastUpdated": 1640995200000
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CONSENT_TYPE",
    "message": "Invalid consent type provided",
    "details": "Accepted values: marketing, analytics, functional, necessary"
  }
}
```

### Common Error Codes

- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `INVALID_INPUT` - Request validation failed
- `RATE_LIMITED` - Too many requests
- `INTERNAL_ERROR` - Server error

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Standard endpoints**: 100 requests per minute
- **Data export endpoints**: 10 requests per hour
- **Bulk operations**: 50 requests per hour

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Webhooks

Configure webhooks to receive real-time notifications about GDPR events.

### Supported Events

- `consent.given` - New consent recorded
- `consent.withdrawn` - Consent withdrawn
- `request.submitted` - New data subject request
- `request.completed` - Request processing completed
- `data.deleted` - Personal data deleted

### Webhook Payload

```json
{
  "event": "consent.given",
  "timestamp": 1640995200000,
  "data": {
    "contactId": "contact_123",
    "consentType": "marketing",
    "consentSource": "website_form"
  }
}
```

## SDKs and Libraries

We provide official SDKs for popular languages:

- JavaScript/TypeScript
- Python
- PHP
- Ruby
- Go

Install the JavaScript SDK:
```bash
npm install @smartbatch/sdk
```

Example usage:
```javascript
import { SmartBatchClient } from '@smartbatch/sdk'

const client = new SmartBatchClient({
  apiKey: 'your-api-key',
  environment: 'production' // or 'sandbox'
})

// Record consent
const result = await client.gdpr.recordConsent({
  contactId: 'contact_123',
  consentType: 'marketing',
  consentSource: 'website_form',
  legalBasis: 'consent'
})
```
