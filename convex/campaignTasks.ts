import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Internal function to update campaign status based on email queue state
 */
export const updateCampaignStatus = internalMutation({
  args: {
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${args.campaignId} not found`);
    }

    // Don't update status for cancelled or paused campaigns
    if (campaign.status === "cancelled" || campaign.status === "paused") {
      return;
    }

    // Get all emails for this campaign
    const allEmails = await ctx.db
      .query("emailQueue")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    const totalEmails = allEmails.length;
    if (totalEmails === 0) return;

    const sentEmails = allEmails.filter(e => e.status === "sent").length;
    const failedEmails = allEmails.filter(e => e.status === "failed").length;
    const queuedEmails = allEmails.filter(e => e.status === "queued").length;
    const processingEmails = allEmails.filter(e => e.status === "processing").length;
    const pendingEmails = queuedEmails + processingEmails;
    
    // Determine new status
    let newStatus = campaign.status;
    
    console.log("Campaign Status Check:", {
      campaignId: args.campaignId,
      currentStatus: campaign.status,
      totalEmails,
      sentEmails,
      failedEmails,
      queuedEmails,
      processingEmails,
      pendingEmails
    });

    // Force status update based on email states
    if (pendingEmails === 0 && (sentEmails > 0 || failedEmails > 0)) {
      newStatus = "sent";
    } else if (sentEmails > 0 || failedEmails > 0) {
      newStatus = "sending";
    } else if (queuedEmails > 0 || processingEmails > 0) {
      newStatus = "sending";
    }

    console.log("Status Update Decision:", {
      campaignId: args.campaignId,
      oldStatus: campaign.status,
      newStatus,
      willUpdate: newStatus !== campaign.status
    });

    // Update only the status since updatedAt is not in the schema
    await ctx.db.patch(args.campaignId, {
      status: newStatus
    });
  },
});
