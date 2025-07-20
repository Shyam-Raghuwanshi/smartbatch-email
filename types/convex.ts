// TypeScript types for Convex data models
import { Doc, Id } from "../convex/_generated/dataModel";

// Database document types
export type User = Doc<"users">;
export type Campaign = Doc<"campaigns">;
export type Email = Doc<"emails">;
export type Template = Doc<"templates">;
export type Contact = Doc<"contacts">;
export type Analytics = Doc<"analytics">;

// ID types
export type UserId = Id<"users">;
export type CampaignId = Id<"campaigns">;
export type EmailId = Id<"emails">;
export type TemplateId = Id<"templates">;
export type ContactId = Id<"contacts">;
export type AnalyticsId = Id<"analytics">;

// Enum types
export type CampaignStatus = 
  | "draft"
  | "scheduled"
  | "sending"
  | "sent"
  | "paused"
  | "cancelled";

export type EmailStatus = 
  | "pending"
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "bounced"
  | "failed";

export type AnalyticsMetric = 
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "bounced"
  | "unsubscribed";

// Form types for creating/updating records
export type CreateUserData = {
  clerkId: string;
  email: string;
  name: string;
  subscription: {
    plan: string;
    status: string;
    expiresAt?: number;
  };
};

export type CreateCampaignData = {
  name: string;
  status: CampaignStatus;
  scheduledAt?: number;
  settings: {
    subject: string;
    templateId?: TemplateId;
    customContent?: string;
    targetTags: string[];
    sendDelay?: number;
    trackOpens: boolean;
    trackClicks: boolean;
  };
};

export type CreateTemplateData = {
  name: string;
  subject: string;
  content: string;
  isDefault?: boolean;
  variables?: string[];
};

export type CreateContactData = {
  email: string;
  firstName?: string;
  lastName?: string;
  tags: string[];
  isActive?: boolean;
  metadata?: {
    source?: string;
    lastEngagement?: number;
  };
};

export type CreateEmailData = {
  campaignId: CampaignId;
  recipient: string;
  status: EmailStatus;
  sentAt?: number;
  openedAt?: number;
  clickedAt?: number;
  errorMessage?: string;
};

// Analytics summary type
export type CampaignSummary = {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
};

// Bulk operations
export type BulkContactImport = {
  email: string;
  firstName?: string;
  lastName?: string;
  tags: string[];
}[];

// API response types
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Subscription types
export type SubscriptionPlan = "free" | "pro" | "enterprise";
export type SubscriptionStatus = "active" | "cancelled" | "expired" | "trial";

export type Subscription = {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  expiresAt?: number;
};

// Filter and pagination types
export type PaginationOptions = {
  page: number;
  limit: number;
};

export type FilterOptions = {
  status?: CampaignStatus | EmailStatus;
  tags?: string[];
  dateRange?: {
    start: number;
    end: number;
  };
  search?: string;
};

// Chart data types for analytics
export type ChartDataPoint = {
  date: string;
  value: number;
  metric: AnalyticsMetric;
};

export type TimeSeriesData = ChartDataPoint[];

// Email template variables
export type TemplateVariable = {
  name: string;
  description: string;
  defaultValue?: string;
  required: boolean;
};

// Campaign settings extended type
export type CampaignSettings = {
  subject: string;
  templateId?: TemplateId;
  customContent?: string;
  targetTags: string[];
  sendDelay?: number;
  trackOpens: boolean;
  trackClicks: boolean;
  sendingRate?: number; // emails per minute
  timezone?: string;
  personalizeFrom?: boolean;
  replyTo?: string;
};
