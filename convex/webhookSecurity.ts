import { createHmac, timingSafeEqual } from "crypto";

/**
 * Webhook Security and Signature Validation
 * Provides secure webhook handling with signature verification
 */

export interface WebhookConfig {
  secret: string;
  tolerance?: number; // Time tolerance in seconds (default: 300 = 5 minutes)
  signatureHeader?: string; // Header containing the signature
  timestampHeader?: string; // Header containing the timestamp
}

export interface WebhookPayload {
  timestamp: number;
  signature: string;
  body: string;
}

/**
 * Generate HMAC signature for webhook payload
 */
export function generateWebhookSignature(
  payload: string,
  secret: string,
  timestamp: number
): string {
  const signedPayload = `${timestamp}.${payload}`;
  const signature = createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");
  
  return `v1=${signature}`;
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  timestamp: number,
  tolerance: number = 300
): boolean {
  try {
    // Check timestamp tolerance
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > tolerance) {
      console.warn("Webhook timestamp outside tolerance window");
      return false;
    }

    // Extract signature version and hash
    const signatureParts = signature.split("=");
    if (signatureParts.length !== 2 || signatureParts[0] !== "v1") {
      console.warn("Invalid webhook signature format");
      return false;
    }

    // Generate expected signature
    const expectedSignature = generateWebhookSignature(payload, secret, timestamp);
    const expectedHash = expectedSignature.split("=")[1];
    const receivedHash = signatureParts[1];

    // Use timing-safe comparison
    if (expectedHash.length !== receivedHash.length) {
      return false;
    }

    return timingSafeEqual(
      Buffer.from(expectedHash, "hex"),
      Buffer.from(receivedHash, "hex")
    );
  } catch (error) {
    console.error("Error verifying webhook signature:", error);
    return false;
  }
}

/**
 * Parse webhook headers and extract signature components
 */
export function parseWebhookHeaders(headers: Record<string, string>): {
  timestamp: number;
  signature: string;
} | null {
  try {
    const timestampHeader = headers["x-webhook-timestamp"];
    const signatureHeader = headers["x-webhook-signature"];

    if (!timestampHeader || !signatureHeader) {
      console.warn("Missing required webhook headers");
      return null;
    }

    const timestamp = parseInt(timestampHeader, 10);
    if (isNaN(timestamp)) {
      console.warn("Invalid timestamp in webhook headers");
      return null;
    }

    return {
      timestamp,
      signature: signatureHeader,
    };
  } catch (error) {
    console.error("Error parsing webhook headers:", error);
    return null;
  }
}

/**
 * Middleware for webhook signature validation
 */
export function createWebhookValidator(config: WebhookConfig) {
  return (
    payload: string,
    headers: Record<string, string>
  ): boolean => {
    const webhookData = parseWebhookHeaders(headers);
    if (!webhookData) {
      return false;
    }

    return verifyWebhookSignature(
      payload,
      webhookData.signature,
      config.secret,
      webhookData.timestamp,
      config.tolerance
    );
  };
}

/**
 * Secure webhook endpoint configuration
 */
export const WEBHOOK_ENDPOINTS = {
  EMAIL_DELIVERY: {
    path: "/api/webhooks/email/delivery",
    methods: ["POST"],
    requireSignature: true,
    rateLimit: {
      requests: 1000,
      window: 60 * 1000, // 1 minute
    },
  },
  EMAIL_BOUNCE: {
    path: "/api/webhooks/email/bounce",
    methods: ["POST"],
    requireSignature: true,
    rateLimit: {
      requests: 500,
      window: 60 * 1000,
    },
  },
  EMAIL_COMPLAINT: {
    path: "/api/webhooks/email/complaint",
    methods: ["POST"],
    requireSignature: true,
    rateLimit: {
      requests: 100,
      window: 60 * 1000,
    },
  },
  UNSUBSCRIBE: {
    path: "/api/webhooks/email/unsubscribe",
    methods: ["POST", "GET"],
    requireSignature: false, // Unsubscribe links use tokens instead
    rateLimit: {
      requests: 200,
      window: 60 * 1000,
    },
  },
} as const;

/**
 * Webhook event types and their schemas
 */
export const WEBHOOK_EVENT_SCHEMAS = {
  "email.delivered": {
    required: ["messageId", "recipient", "timestamp"],
    properties: {
      messageId: { type: "string" },
      recipient: { type: "string", format: "email" },
      timestamp: { type: "number" },
      campaignId: { type: "string", optional: true },
      metadata: { type: "object", optional: true },
    },
  },
  "email.bounced": {
    required: ["messageId", "recipient", "bounceType", "bounceReason", "timestamp"],
    properties: {
      messageId: { type: "string" },
      recipient: { type: "string", format: "email" },
      bounceType: { type: "string", enum: ["soft", "hard"] },
      bounceReason: { type: "string" },
      bounceCode: { type: "string", optional: true },
      diagnosticCode: { type: "string", optional: true },
      timestamp: { type: "number" },
      campaignId: { type: "string", optional: true },
    },
  },
  "email.complained": {
    required: ["messageId", "recipient", "complaintType", "timestamp"],
    properties: {
      messageId: { type: "string" },
      recipient: { type: "string", format: "email" },
      complaintType: { type: "string", enum: ["abuse", "fraud", "virus", "other"] },
      feedbackType: { type: "string", optional: true },
      userAgent: { type: "string", optional: true },
      timestamp: { type: "number" },
      campaignId: { type: "string", optional: true },
    },
  },
  "email.opened": {
    required: ["messageId", "recipient", "timestamp"],
    properties: {
      messageId: { type: "string" },
      recipient: { type: "string", format: "email" },
      timestamp: { type: "number" },
      userAgent: { type: "string", optional: true },
      ipAddress: { type: "string", optional: true },
      campaignId: { type: "string", optional: true },
    },
  },
  "email.clicked": {
    required: ["messageId", "recipient", "url", "timestamp"],
    properties: {
      messageId: { type: "string" },
      recipient: { type: "string", format: "email" },
      url: { type: "string", format: "url" },
      timestamp: { type: "number" },
      userAgent: { type: "string", optional: true },
      ipAddress: { type: "string", optional: true },
      campaignId: { type: "string", optional: true },
    },
  },
  "email.unsubscribed": {
    required: ["recipient", "timestamp"],
    properties: {
      recipient: { type: "string", format: "email" },
      timestamp: { type: "number" },
      source: { type: "string", optional: true },
      campaignId: { type: "string", optional: true },
      listId: { type: "string", optional: true },
    },
  },
} as const;

/**
 * Validate webhook event payload against schema
 */
export function validateWebhookEvent(
  eventType: string,
  payload: any
): { valid: boolean; errors: string[] } {
  const schema = WEBHOOK_EVENT_SCHEMAS[eventType as keyof typeof WEBHOOK_EVENT_SCHEMAS];
  if (!schema) {
    return { valid: false, errors: [`Unknown event type: ${eventType}`] };
  }

  const errors: string[] = [];

  // Check required fields
  for (const field of schema.required) {
    if (!(field in payload)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate field types and formats
  for (const [field, config] of Object.entries(schema.properties)) {
    if (field in payload) {
      const value = payload[field];
      
      // Type validation
      if (config.type === "string" && typeof value !== "string") {
        errors.push(`Field ${field} must be a string`);
      } else if (config.type === "number" && typeof value !== "number") {
        errors.push(`Field ${field} must be a number`);
      } else if (config.type === "object" && typeof value !== "object") {
        errors.push(`Field ${field} must be an object`);
      }

      // Format validation
      if (config.format === "email" && typeof value === "string") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(`Field ${field} must be a valid email address`);
        }
      } else if (config.format === "url" && typeof value === "string") {
        try {
          new URL(value);
        } catch {
          errors.push(`Field ${field} must be a valid URL`);
        }
      }

      // Enum validation
      if (config.enum && !config.enum.includes(value)) {
        errors.push(`Field ${field} must be one of: ${config.enum.join(", ")}`);
      }
    } else if (!config.optional) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Webhook retry configuration
 */
export const WEBHOOK_RETRY_CONFIG = {
  maxRetries: 3,
  backoffMultiplier: 2,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  timeoutMs: 10000, // 10 seconds
};

/**
 * Calculate retry delay with exponential backoff
 */
export function calculateRetryDelay(attempt: number): number {
  const delay = WEBHOOK_RETRY_CONFIG.initialDelay * 
    Math.pow(WEBHOOK_RETRY_CONFIG.backoffMultiplier, attempt - 1);
  
  return Math.min(delay, WEBHOOK_RETRY_CONFIG.maxDelay);
}

/**
 * Webhook security headers
 */
export const WEBHOOK_SECURITY_HEADERS = {
  "Content-Type": "application/json",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Referrer-Policy": "strict-origin-when-cross-origin",
} as const;
