import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Seed sample data for testing
export const seedSampleData = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user) {
      throw new Error("User not found");
    }

    // Create sample templates
    const template1 = await ctx.db.insert("templates", {
      userId: user._id,
      name: "Welcome Email",
      subject: "Welcome to our platform!",
      content: "Hi {name},\n\nWelcome to our platform! We're excited to have you on board.\n\nBest regards,\nThe Team",
      category: "Welcome",
      tags: ["welcome", "onboarding"],
      variables: ["name"],
      isDefault: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0,
    });

    const template2 = await ctx.db.insert("templates", {
      userId: user._id,
      name: "Newsletter",
      subject: "Weekly Newsletter - {date}",
      content: "Hi {name},\n\nHere's what's new this week:\n\n- Feature updates\n- Community highlights\n- Tips and tricks\n\nSee you next week!\n\nBest,\nThe Team",
      category: "Newsletter",
      tags: ["newsletter", "updates"],
      variables: ["name", "date"],
      isDefault: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0,
    });

    // Create sample contacts
    const contacts = [
      {
        email: "john@example.com",
        firstName: "John",
        lastName: "Doe",
        tags: ["customers", "newsletter"],
        isActive: true,
        createdAt: Date.now(),
        userId: user._id,
      },
      {
        email: "jane@example.com",
        firstName: "Jane",
        lastName: "Smith",
        tags: ["prospects", "newsletter"],
        isActive: true,
        createdAt: Date.now(),
        userId: user._id,
      },
      {
        email: "bob@example.com",
        firstName: "Bob",
        lastName: "Johnson",
        tags: ["customers", "vip"],
        isActive: true,
        createdAt: Date.now(),
        userId: user._id,
      },
      {
        email: "alice@example.com",
        firstName: "Alice",
        lastName: "Williams",
        tags: ["prospects"],
        isActive: true,
        createdAt: Date.now(),
        userId: user._id,
      },
      {
        email: "charlie@example.com",
        firstName: "Charlie",
        lastName: "Brown",
        tags: ["newsletter", "vip"],
        isActive: true,
        createdAt: Date.now(),
        userId: user._id,
      },
    ];

    const contactIds = [];
    for (const contact of contacts) {
      const contactId = await ctx.db.insert("contacts", contact);
      contactIds.push(contactId);
    }

    // Create sample campaigns
    const campaign1 = await ctx.db.insert("campaigns", {
      userId: user._id,
      name: "Welcome Campaign",
      status: "sent",
      createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
      settings: {
        subject: "Welcome to SmartBatch!",
        templateId: template1,
        targetTags: ["customers"],
        sendDelay: 5,
        trackOpens: true,
        trackClicks: true,
      },
    });

    const campaign2 = await ctx.db.insert("campaigns", {
      userId: user._id,
      name: "Weekly Newsletter #1",
      status: "scheduled",
      scheduledAt: Date.now() + 24 * 60 * 60 * 1000, // Tomorrow
      createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
      settings: {
        subject: "Your Weekly Newsletter",
        templateId: template2,
        targetTags: ["newsletter"],
        sendDelay: 10,
        trackOpens: true,
        trackClicks: true,
      },
    });

    const campaign3 = await ctx.db.insert("campaigns", {
      userId: user._id,
      name: "VIP Exclusive Offer",
      status: "draft",
      createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000, // Yesterday
      settings: {
        subject: "Exclusive offer just for you!",
        customContent: "Hi {name},\n\nAs a VIP customer, you get early access to our new features.\n\nClaim your exclusive discount now!\n\nBest,\nThe Team",
        targetTags: ["vip"],
        sendDelay: 5,
        trackOpens: true,
        trackClicks: true,
      },
    });

    return {
      message: "Sample data created successfully!",
      data: {
        templates: [template1, template2],
        contacts: contactIds,
        campaigns: [campaign1, campaign2, campaign3],
      },
    };
  },
});
