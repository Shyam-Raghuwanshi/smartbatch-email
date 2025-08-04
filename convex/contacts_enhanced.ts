import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all contacts for a user with optional filtering
export const getContacts = query({
  args: {
    search: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    companies: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    let contactsQuery = ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", user._id));

    const contacts = await contactsQuery.collect();

    // Apply client-side filtering for now (can be optimized with better indexes)
    let filteredContacts = contacts.filter((contact) => {
      if (args.isActive !== undefined && contact.isActive !== args.isActive) {
        return false;
      }

      if (args.search) {
        const searchLower = args.search.toLowerCase();
        const fullName = `${contact.firstName || ""} ${contact.lastName || ""}`.toLowerCase();
        if (
          !contact.email.toLowerCase().includes(searchLower) &&
          !fullName.includes(searchLower) &&
          !(contact.company?.toLowerCase().includes(searchLower))
        ) {
          return false;
        }
      }

      if (args.tags && args.tags.length > 0) {
        if (!args.tags.some(tag => contact.tags.includes(tag))) {
          return false;
        }
      }

      if (args.companies && args.companies.length > 0) {
        if (!contact.company || !args.companies.includes(contact.company)) {
          return false;
        }
      }

      return true;
    });

    // Sort by updatedAt desc
    filteredContacts.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    // Apply pagination
    const offset = args.offset || 0;
    const limit = args.limit || 50;
    const paginatedContacts = filteredContacts.slice(offset, offset + limit);

    return {
      contacts: paginatedContacts,
      total: filteredContacts.length,
      hasMore: offset + limit < filteredContacts.length,
    };
  },
});

// Get a single contact by ID
export const getContact = query({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const contact = await ctx.db.get(args.contactId);
    if (!contact) throw new Error("Contact not found");

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || contact.userId !== user._id) {
      throw new Error("Contact not found");
    }

    return contact;
  },
});

// Create a new contact
export const createContact = mutation({
  args: {
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    position: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    customFields: v.optional(v.object({})),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Check for duplicate email
    const existingContact = await ctx.db
      .query("contacts")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    if (existingContact) {
      throw new Error("Contact with this email already exists");
    }

    const now = Date.now();
    const contactId = await ctx.db.insert("contacts", {
      userId: user._id,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      phone: args.phone,
      company: args.company,
      position: args.position,
      tags: args.tags || [],
      customFields: args.customFields,
      createdAt: now,
      updatedAt: now,
      isActive: true,
      source: args.source || "manual",
      emailStats: {
        totalSent: 0,
        totalOpened: 0,
        totalClicked: 0,
      },
    });

    return contactId;
  },
});

// Update a contact
export const updateContact = mutation({
  args: {
    contactId: v.id("contacts"),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    position: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    customFields: v.optional(v.object({})),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const { contactId, ...updateData } = args;

    const contact = await ctx.db.get(contactId);
    if (!contact) throw new Error("Contact not found");

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || contact.userId !== user._id) {
      throw new Error("Contact not found");
    }

    // Check for duplicate email if email is being updated
    if (updateData.email && updateData.email !== contact.email) {
      const existingContact = await ctx.db
        .query("contacts")
        .withIndex("by_email", (q) => q.eq("email", updateData.email!))
        .filter((q) => q.eq(q.field("userId"), user._id))
        .first();

      if (existingContact) {
        throw new Error("Contact with this email already exists");
      }
    }
    
    await ctx.db.patch(contactId, {
      ...updateData,
      updatedAt: Date.now(),
    });
  },
});

// Delete contacts (bulk operation)
export const deleteContacts = mutation({
  args: { contactIds: v.array(v.id("contacts")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Verify ownership of all contacts
    const contacts = await Promise.all(
      args.contactIds.map(id => ctx.db.get(id))
    );

    for (const contact of contacts) {
      if (!contact || contact.userId !== user._id) {
        throw new Error("One or more contacts not found");
      }
    }

    // Delete all contacts
    await Promise.all(
      args.contactIds.map(id => ctx.db.delete(id))
    );
  },
});

// Bulk update tags
export const bulkUpdateTags = mutation({
  args: {
    contactIds: v.array(v.id("contacts")),
    tagsToAdd: v.optional(v.array(v.string())),
    tagsToRemove: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Get all contacts and verify ownership
    const contacts = await Promise.all(
      args.contactIds.map(id => ctx.db.get(id))
    );

    for (const contact of contacts) {
      if (!contact || contact.userId !== user._id) {
        throw new Error("One or more contacts not found");
      }

      let newTags = [...contact.tags];

      // Add new tags
      if (args.tagsToAdd) {
        args.tagsToAdd.forEach(tag => {
          if (!newTags.includes(tag)) {
            newTags.push(tag);
          }
        });
      }

      // Remove tags
      if (args.tagsToRemove) {
        newTags = newTags.filter(tag => !args.tagsToRemove!.includes(tag));
      }

      await ctx.db.patch(contact._id, {
        tags: newTags,
        updatedAt: Date.now(),
      });
    }
  },
});

// Import contacts from CSV data
export const importContacts = mutation({
  args: {
    contacts: v.array(v.object({
      email: v.string(),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      phone: v.optional(v.string()),
      company: v.optional(v.string()),
      position: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
    })),
    fileName: v.string(),
    skipDuplicates: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const now = Date.now();
    let successful = 0;
    let failed = 0;
    let duplicatesSkipped = 0;
    const errors: string[] = [];

    // Create import record
    const importId = await ctx.db.insert("contactImports", {
      userId: user._id,
      fileName: args.fileName,
      source: "csv",
      status: "processing",
      totalRecords: args.contacts.length,
      successfulImports: 0,
      failedImports: 0,
      duplicatesSkipped: 0,
      createdAt: now,
    });

    // Process each contact
    for (const contactData of args.contacts) {
      try {
        // Check for existing contact
        const existingContact = await ctx.db
          .query("contacts")
          .withIndex("by_email", (q) => q.eq("email", contactData.email))
          .filter((q) => q.eq(q.field("userId"), user._id))
          .first();

        if (existingContact) {
          if (args.skipDuplicates) {
            duplicatesSkipped++;
            continue;
          } else {
            errors.push(`Duplicate email: ${contactData.email}`);
            failed++;
            continue;
          }
        }

        // Create contact
        await ctx.db.insert("contacts", {
          userId: user._id,
          email: contactData.email,
          firstName: contactData.firstName,
          lastName: contactData.lastName,
          phone: contactData.phone,
          company: contactData.company,
          position: contactData.position,
          tags: contactData.tags || [],
          createdAt: now,
          updatedAt: now,
          isActive: true,
          source: "csv_import",
          emailStats: {
            totalSent: 0,
            totalOpened: 0,
            totalClicked: 0,
          },
        });

        successful++;
      } catch (error) {
        failed++;
        errors.push(`Error importing ${contactData.email}: ${error}`);
      }
    }

    // Update import record
    await ctx.db.patch(importId, {
      status: failed > 0 ? (successful > 0 ? "partial" : "failed") : "completed",
      successfulImports: successful,
      failedImports: failed,
      duplicatesSkipped,
      errors: errors.slice(0, 100), // Limit error messages
      completedAt: Date.now(),
    });

    return {
      importId,
      successful,
      failed,
      duplicatesSkipped,
      errors: errors.slice(0, 10), // Return first 10 errors
    };
  },
});

// Get all unique tags
export const getTags = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const tagSet = new Set<string>();
    contacts.forEach(contact => {
      contact.tags.forEach(tag => tagSet.add(tag));
    });

    return Array.from(tagSet).sort();
  },
});

// Get all unique companies
export const getCompanies = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const companySet = new Set<string>();
    contacts.forEach(contact => {
      if (contact.company) {
        companySet.add(contact.company);
      }
    });

    return Array.from(companySet).sort();
  },
});

// Get contact statistics
export const getContactStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const total = contacts.length;
    const active = contacts.filter(c => c.isActive).length;
    const inactive = total - active;

    // Calculate engagement stats
    const engaged = contacts.filter(c => 
      c.lastEngagement && c.lastEngagement > Date.now() - (30 * 24 * 60 * 60 * 1000)
    ).length;

    // Company distribution
    const companyCount: Record<string, number> = {};
    contacts.forEach(contact => {
      const company = contact.company || "Unknown";
      companyCount[company] = (companyCount[company] || 0) + 1;
    });

    // Tag distribution
    const tagCount: Record<string, number> = {};
    contacts.forEach(contact => {
      contact.tags.forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });

    return {
      total,
      active,
      inactive,
      engaged,
      companyDistribution: Object.entries(companyCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10),
      tagDistribution: Object.entries(tagCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10),
    };
  },
});

// Get import history
export const getImportHistory = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const imports = await ctx.db
      .query("contactImports")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(20);

    return imports;
  },
});
