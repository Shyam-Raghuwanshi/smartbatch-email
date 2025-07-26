import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Test function to manually fix the july cam campaign
export const fixJulyCampaign = mutation({
  args: {},
  handler: async (ctx) => {
    // Get the july cam campaign
    const campaign = await ctx.db
      .query("campaigns")
      .filter((q) => q.eq(q.field("name"), "july cam"))
      .first();

    if (!campaign) {
      throw new Error("July cam campaign not found");
    }

    // Get the user
    const user = await ctx.db.get(campaign.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get contacts matching target tags
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", campaign.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Filter contacts by target tags
    const targetContacts = contacts.filter(contact => {
      if (!campaign.settings?.targetTags || !contact.tags) return false;
      return campaign.settings.targetTags.some(tag => 
        contact.tags.includes(tag)
      );
    });

    console.log(`Found ${targetContacts.length} contacts matching target tags: ${campaign.settings?.targetTags?.join(", ") || "none"}`);
    console.log("Target contacts:", targetContacts.map(c => ({ email: c.email, tags: c.tags })));

    // Create email queue entries
    const emailQueueIds: string[] = [];
    
    for (const contact of targetContacts) {
      // Check if contact is unsubscribed
      const unsubscribe = await ctx.db
        .query("unsubscribes")
        .filter((q) => q.eq(q.field("email"), contact.email))
        .filter((q) => q.eq(q.field("userId"), campaign.userId))
        .first();

      if (unsubscribe) {
        console.log(`Skipping unsubscribed contact: ${contact.email}`);
        continue;
      }

      // Generate unsubscribe token
      const unsubscribeToken = crypto.randomUUID();
      
      let htmlContent = campaign.settings?.customContent || "Hello {name}, this is a test email.";
      let textContent = campaign.settings?.customContent || "Hello {name}, this is a test email.";
      let subject = campaign.settings?.subject || "Test Subject";

      // Replace variables
      const name = `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || contact.email;
      htmlContent = htmlContent.replace(/{name}/g, name);
      textContent = textContent.replace(/{name}/g, name);
      subject = subject.replace(/{name}/g, name);

      const emailQueueId = await ctx.db.insert("emailQueue", {
        userId: campaign.userId,
        campaignId: campaign._id,
        recipient: contact.email,
        subject,
        htmlContent,
        textContent,
        fromEmail: user.email,
        fromName: user.name,
        status: "queued",
        priority: 5,
        scheduledAt: Date.now(),
        attemptCount: 0,
        maxAttempts: 3,
        metadata: {
          templateId: campaign.settings?.templateId,
          variables: {
            name,
            email: contact.email,
            firstName: contact.firstName,
            lastName: contact.lastName,
          },
          trackOpens: campaign.settings?.trackOpens ?? true,
          trackClicks: campaign.settings?.trackClicks ?? true,
          unsubscribeToken,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      emailQueueIds.push(emailQueueId);
      console.log(`Created email queue entry for ${contact.email}: ${emailQueueId}`);
    }

    return { 
      campaignId: campaign._id,
      campaignName: campaign.name,
      emailsQueued: emailQueueIds.length, 
      targetContacts: targetContacts.length,
      emailQueueIds,
      campaignSettings: campaign.settings,
    };
  },
});
