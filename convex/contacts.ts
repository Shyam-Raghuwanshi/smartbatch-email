import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

// Create contact
export const createContact = mutation({
  args: {
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    tags: v.array(v.string()),
    isActive: v.optional(v.boolean()),
    metadata: v.optional(v.object({
      source: v.optional(v.string()),
      lastEngagement: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
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

    const contactId = await ctx.db.insert("contacts", {
      ...args,
      userId: user._id,
      isActive: args.isActive ?? true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return contactId;
  },
});

// Get contacts by user (authenticated)
export const getContactsByUser = query({
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

    return await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

// Get user contacts with pagination (alias for dashboard compatibility)
export const getUserContacts = query({
  args: {
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
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

    const page = args.page || 0;
    const limit = args.limit || 50;

    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate({
        numItems: limit,
        cursor: null,
      });

    return contacts;
  },
});

// Get contact by ID
export const getContactById = query({
  args: { id: v.id("contacts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const contact = await ctx.db.get(args.id);
    if (!contact) {
      return null;
    }
    
    // Verify user owns this contact
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user || contact.userId !== user._id) {
      throw new Error("Unauthorized");
    }
    
    return contact;
  },
});

// Get contact by email
export const getContactByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
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

    return await ctx.db
      .query("contacts")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .unique();
  },
});

// Update contact
export const updateContact = mutation({
  args: {
    id: v.id("contacts"),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
    metadata: v.optional(v.object({
      source: v.optional(v.string()),
      lastEngagement: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const contact = await ctx.db.get(args.id);
    if (!contact) {
      throw new Error("Contact not found");
    }
    
    // Verify user owns this contact
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user || contact.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

// Delete contact
export const deleteContact = mutation({
  args: { id: v.id("contacts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const contact = await ctx.db.get(args.id);
    if (!contact) {
      throw new Error("Contact not found");
    }
    
    // Verify user owns this contact
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user || contact.userId !== user._id) {
      throw new Error("Unauthorized");
    }
    
    await ctx.db.delete(args.id);
  },
});

// Get contacts by tags
export const getContactsByTags = query({
  args: { tags: v.array(v.string()) },
  handler: async (ctx, args) => {
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

    const allContacts = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    
    // Filter contacts that have any of the specified tags
    return allContacts.filter(contact => 
      args.tags.some(tag => contact.tags.includes(tag))
    );
  },
});

// Add tags to contact
export const addTagsToContact = mutation({
  args: {
    id: v.id("contacts"),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const contact = await ctx.db.get(args.id);
    if (!contact) {
      throw new Error("Contact not found");
    }
    
    // Verify user owns this contact
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user || contact.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const existingTags = contact.tags || [];
    const newTags = Array.from(new Set([...existingTags, ...args.tags]));

    await ctx.db.patch(args.id, { tags: newTags });
    return args.id;
  },
});

// Remove tags from contact
export const removeTagsFromContact = mutation({
  args: {
    id: v.id("contacts"),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const contact = await ctx.db.get(args.id);
    if (!contact) {
      throw new Error("Contact not found");
    }
    
    // Verify user owns this contact
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user || contact.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const updatedTags = contact.tags.filter(tag => !args.tags.includes(tag));
    await ctx.db.patch(args.id, { tags: updatedTags });
    return args.id;
  },
});

// Bulk import contacts
export const bulkImportContacts = mutation({
  args: {
    contacts: v.array(v.object({
      email: v.string(),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      tags: v.array(v.string()),
    })),
  },
  handler: async (ctx, args) => {
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

    const contactIds = [];
    for (const contact of args.contacts) {
      const contactId = await ctx.db.insert("contacts", {
        ...contact,
        userId: user._id,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      contactIds.push(contactId);
    }
    
    // Create notification for contact import
    if (contactIds.length > 0) {
      await ctx.runMutation(internal.notifications.createNotification, {
        userId: user._id,
        title: "Contacts Imported",
        message: `${contactIds.length} new contacts were imported successfully`,
        type: "success",
        category: "contact",
        data: {
          contactCount: contactIds.length,
        },
      });
    }
    
    return contactIds;
  },
});

// Get active contacts
export const getActiveContacts = query({
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

    return await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});
