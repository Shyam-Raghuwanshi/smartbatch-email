import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new segment
export const createSegment = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    filters: v.object({
      tags: v.optional(v.array(v.string())),
      companies: v.optional(v.array(v.string())),
      engagementRange: v.optional(v.object({
        min: v.optional(v.number()),
        max: v.optional(v.number()),
      })),
      customFieldFilters: v.optional(v.array(v.object({
        field: v.string(),
        operator: v.string(),
        value: v.string(),
      }))),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Check if segment name already exists
    const existingSegment = await ctx.db
      .query("contactSegments")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (existingSegment) {
      throw new Error("Segment with this name already exists");
    }

    const now = Date.now();
    const segmentId = await ctx.db.insert("contactSegments", {
      userId: user._id,
      name: args.name,
      description: args.description,
      filters: args.filters,
      createdAt: now,
      updatedAt: now,
    });

    return segmentId;
  },
});

// Get all segments for a user
export const getSegments = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    return await ctx.db
      .query("contactSegments")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

// Get a single segment by ID
export const getSegment = query({
  args: { segmentId: v.id("contactSegments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const segment = await ctx.db.get(args.segmentId);
    if (!segment) throw new Error("Segment not found");

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || segment.userId !== user._id) {
      throw new Error("Segment not found");
    }

    return segment;
  },
});

// Update a segment
export const updateSegment = mutation({
  args: {
    segmentId: v.id("contactSegments"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    filters: v.optional(v.object({
      tags: v.optional(v.array(v.string())),
      companies: v.optional(v.array(v.string())),
      engagementRange: v.optional(v.object({
        min: v.optional(v.number()),
        max: v.optional(v.number()),
      })),
      customFieldFilters: v.optional(v.array(v.object({
        field: v.string(),
        operator: v.string(),
        value: v.string(),
      }))),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const segment = await ctx.db.get(args.segmentId);
    if (!segment) throw new Error("Segment not found");

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || segment.userId !== user._id) {
      throw new Error("Segment not found");
    }

    // Check for duplicate name if name is being updated
    if (args.name && args.name !== segment.name) {
      const existingSegment = await ctx.db
        .query("contactSegments")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("name"), args.name))
        .first();

      if (existingSegment) {
        throw new Error("Segment with this name already exists");
      }
    }

    await ctx.db.patch(args.segmentId, {
      ...args,
      updatedAt: Date.now(),
    });
  },
});

// Delete a segment
export const deleteSegment = mutation({
  args: { segmentId: v.id("contactSegments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const segment = await ctx.db.get(args.segmentId);
    if (!segment) throw new Error("Segment not found");

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || segment.userId !== user._id) {
      throw new Error("Segment not found");
    }

    await ctx.db.delete(args.segmentId);
  },
});

// Get contacts that match a segment's filters
export const getContactsBySegment = query({
  args: { segmentId: v.id("contactSegments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const segment = await ctx.db.get(args.segmentId);
    if (!segment) throw new Error("Segment not found");

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || segment.userId !== user._id) {
      throw new Error("Segment not found");
    }

    // Get all contacts for the user
    const allContacts = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Apply segment filters
    const filteredContacts = allContacts.filter(contact => {
      const filters = segment.filters;

      // Filter by tags
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => contact.tags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      // Filter by companies
      if (filters.companies && filters.companies.length > 0) {
        if (!contact.company || !filters.companies.includes(contact.company)) {
          return false;
        }
      }

      // Filter by engagement range
      if (filters.engagementRange) {
        const lastEngagement = contact.lastEngagement || 0;
        const now = Date.now();
        const daysSinceEngagement = (now - lastEngagement) / (24 * 60 * 60 * 1000);

        if (filters.engagementRange.min !== undefined && daysSinceEngagement < filters.engagementRange.min) {
          return false;
        }
        if (filters.engagementRange.max !== undefined && daysSinceEngagement > filters.engagementRange.max) {
          return false;
        }
      }

      // Filter by custom fields
      if (filters.customFieldFilters && filters.customFieldFilters.length > 0) {
        for (const filter of filters.customFieldFilters) {
          const fieldValue = contact.customFields?.[filter.field];
          if (!fieldValue) return false;

          switch (filter.operator) {
            case "equals":
              if (fieldValue !== filter.value) return false;
              break;
            case "contains":
              if (!String(fieldValue).toLowerCase().includes(filter.value.toLowerCase())) return false;
              break;
            case "starts_with":
              if (!String(fieldValue).toLowerCase().startsWith(filter.value.toLowerCase())) return false;
              break;
            case "ends_with":
              if (!String(fieldValue).toLowerCase().endsWith(filter.value.toLowerCase())) return false;
              break;
            default:
              return false;
          }
        }
      }

      return true;
    });

    return filteredContacts;
  },
});

// Preview contacts that would match given filters (without saving segment)
export const previewSegmentContacts = query({
  args: {
    filters: v.object({
      tags: v.optional(v.array(v.string())),
      companies: v.optional(v.array(v.string())),
      engagementRange: v.optional(v.object({
        min: v.optional(v.number()),
        max: v.optional(v.number()),
      })),
      customFieldFilters: v.optional(v.array(v.object({
        field: v.string(),
        operator: v.string(),
        value: v.string(),
      }))),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Get all contacts for the user
    const allContacts = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Apply filters (same logic as getContactsBySegment)
    const filteredContacts = allContacts.filter(contact => {
      const filters = args.filters;

      // Filter by tags
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => contact.tags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      // Filter by companies
      if (filters.companies && filters.companies.length > 0) {
        if (!contact.company || !filters.companies.includes(contact.company)) {
          return false;
        }
      }

      // Filter by engagement range
      if (filters.engagementRange) {
        const lastEngagement = contact.lastEngagement || 0;
        const now = Date.now();
        const daysSinceEngagement = (now - lastEngagement) / (24 * 60 * 60 * 1000);

        if (filters.engagementRange.min !== undefined && daysSinceEngagement < filters.engagementRange.min) {
          return false;
        }
        if (filters.engagementRange.max !== undefined && daysSinceEngagement > filters.engagementRange.max) {
          return false;
        }
      }

      // Filter by custom fields
      if (filters.customFieldFilters && filters.customFieldFilters.length > 0) {
        for (const filter of filters.customFieldFilters) {
          const fieldValue = contact.customFields?.[filter.field];
          if (!fieldValue) return false;

          switch (filter.operator) {
            case "equals":
              if (fieldValue !== filter.value) return false;
              break;
            case "contains":
              if (!String(fieldValue).toLowerCase().includes(filter.value.toLowerCase())) return false;
              break;
            case "starts_with":
              if (!String(fieldValue).toLowerCase().startsWith(filter.value.toLowerCase())) return false;
              break;
            case "ends_with":
              if (!String(fieldValue).toLowerCase().endsWith(filter.value.toLowerCase())) return false;
              break;
            default:
              return false;
          }
        }
      }

      return true;
    });

    return {
      contacts: filteredContacts.slice(0, 10), // Return first 10 for preview
      total: filteredContacts.length,
    };
  },
});

// Update contact count for all segments (maintenance function)
export const updateSegmentCounts = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const segments = await ctx.db
      .query("contactSegments")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const allContacts = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const segment of segments) {
      // Apply the same filtering logic as getContactsBySegment
      const filteredContacts = allContacts.filter(contact => {
        const filters = segment.filters;

        if (filters.tags && filters.tags.length > 0) {
          const hasMatchingTag = filters.tags.some(tag => contact.tags.includes(tag));
          if (!hasMatchingTag) return false;
        }

        if (filters.companies && filters.companies.length > 0) {
          if (!contact.company || !filters.companies.includes(contact.company)) {
            return false;
          }
        }

        if (filters.engagementRange) {
          const lastEngagement = contact.lastEngagement || 0;
          const now = Date.now();
          const daysSinceEngagement = (now - lastEngagement) / (24 * 60 * 60 * 1000);

          if (filters.engagementRange.min !== undefined && daysSinceEngagement < filters.engagementRange.min) {
            return false;
          }
          if (filters.engagementRange.max !== undefined && daysSinceEngagement > filters.engagementRange.max) {
            return false;
          }
        }

        if (filters.customFieldFilters && filters.customFieldFilters.length > 0) {
          for (const filter of filters.customFieldFilters) {
            const fieldValue = contact.customFields?.[filter.field];
            if (!fieldValue) return false;

            switch (filter.operator) {
              case "equals":
                if (fieldValue !== filter.value) return false;
                break;
              case "contains":
                if (!String(fieldValue).toLowerCase().includes(filter.value.toLowerCase())) return false;
                break;
              case "starts_with":
                if (!String(fieldValue).toLowerCase().startsWith(filter.value.toLowerCase())) return false;
                break;
              case "ends_with":
                if (!String(fieldValue).toLowerCase().endsWith(filter.value.toLowerCase())) return false;
                break;
              default:
                return false;
            }
          }
        }

        return true;
      });

      await ctx.db.patch(segment._id, {
        contactCount: filteredContacts.length,
        updatedAt: Date.now(),
      });
    }
  },
});
