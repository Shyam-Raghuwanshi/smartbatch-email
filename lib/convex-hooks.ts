// Helper functions for Convex client-side integration
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

// Custom hooks for common operations
export const useCurrentUser = () => {
  return useQuery(api.users.getCurrentUser);
};

export const useUserCampaigns = () => {
  return useQuery(api.campaigns.getCampaignsByUser);
};

export const useUserContacts = () => {
  return useQuery(api.contacts.getContactsByUser);
};

export const useUserTemplates = () => {
  return useQuery(api.templates.getTemplatesByUser);
};

export const useUserAnalytics = () => {
  return useQuery(api.analytics.getUserAnalytics);
};

// Mutation hooks
export const useCreateCampaign = () => {
  return useMutation(api.campaigns.createCampaign);
};

export const useCreateContact = () => {
  return useMutation(api.contacts.createContact);
};

export const useCreateTemplate = () => {
  return useMutation(api.templates.createTemplate);
};

export const useEnsureUser = () => {
  return useMutation(api.lib.ensureUser);
};

// Campaign status helpers
export const CAMPAIGN_STATUSES = {
  DRAFT: "draft",
  SCHEDULED: "scheduled", 
  SENDING: "sending",
  SENT: "sent",
  PAUSED: "paused",
  CANCELLED: "cancelled",
} as const;

export const EMAIL_STATUSES = {
  PENDING: "pending",
  SENT: "sent",
  DELIVERED: "delivered",
  OPENED: "opened",
  CLICKED: "clicked",
  BOUNCED: "bounced",
  FAILED: "failed",
} as const;

export const ANALYTICS_METRICS = {
  SENT: "sent",
  DELIVERED: "delivered",
  OPENED: "opened", 
  CLICKED: "clicked",
  BOUNCED: "bounced",
  UNSUBSCRIBED: "unsubscribed",
} as const;
