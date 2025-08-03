import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Ensure user exists
export const ensureUser = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    let user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    // Create user if doesn't exist
    if (!user) {
      const userId = await ctx.db.insert("users", {
        clerkId: identity.subject,
        email: identity.email || "user@example.com",
        name: identity.name || "User",
        subscription: {
          plan: "free",
          status: "active"
        },
        createdAt: Date.now(),
      });
      user = await ctx.db.get(userId);
    }

    return user;
  },
});

// Create template
export const createTemplate = mutation({
  args: {
    name: v.string(),
    subject: v.string(),
    content: v.string(),
    htmlContent: v.optional(v.string()),
    previewText: v.optional(v.string()),
    category: v.string(),
    tags: v.array(v.string()),
    description: v.optional(v.string()),
    variables: v.array(v.string()),
    isDefault: v.optional(v.boolean()),
    isPublic: v.optional(v.boolean()),
    settings: v.optional(v.object({
      textColor: v.optional(v.string()),
      backgroundColor: v.optional(v.string()),
      fontFamily: v.optional(v.string()),
      fontSize: v.optional(v.string()),
      linkColor: v.optional(v.string()),
      buttonColor: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    let user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    // Create user if doesn't exist
    if (!user) {
      const userId = await ctx.db.insert("users", {
        clerkId: identity.subject,
        email: identity.email || "user@example.com",
        name: identity.name || "User",
        subscription: {
          plan: "free",
          status: "active"
        },
        createdAt: Date.now(),
      });
      user = await ctx.db.get(userId);
    }

    if (!user) {
      throw new Error("Failed to create or retrieve user");
    }

    const templateId = await ctx.db.insert("templates", {
      ...args,
      userId: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0,
    });
    return templateId;
  },
});

// Get templates by user (authenticated)
export const getTemplatesByUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user) {
      return [];
    }

    return await ctx.db
      .query("templates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

// Get template by ID
export const getTemplateById = query({
  args: { id: v.id("templates") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const template = await ctx.db.get(args.id);
    if (!template) {
      return null;
    }
    
    // Verify user owns this template or it's a default template
    if (!template.isDefault) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();
      
      if (!user || template.userId !== user._id) {
        throw new Error("Unauthorized");
      }
    }
    
    return template;
  },
});

// Get template by name
export const getTemplateByName = query({
  args: { name: v.string() },
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
      .query("templates")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .filter((q) => 
        q.or(
          q.eq(q.field("userId"), user._id),
          q.eq(q.field("isDefault"), true)
        )
      )
      .unique();
  },
});

// Update template
export const updateTemplate = mutation({
  args: {
    id: v.id("templates"),
    name: v.optional(v.string()),
    subject: v.optional(v.string()),
    content: v.optional(v.string()),
    htmlContent: v.optional(v.string()),
    previewText: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
    variables: v.optional(v.array(v.string())),
    settings: v.optional(v.object({
      textColor: v.optional(v.string()),
      backgroundColor: v.optional(v.string()),
      fontFamily: v.optional(v.string()),
      fontSize: v.optional(v.string()),
      linkColor: v.optional(v.string()),
      buttonColor: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const template = await ctx.db.get(args.id);
    if (!template) {
      throw new Error("Template not found");
    }
    
    // Verify user owns this template
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user || template.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    return id;
  },
});

// Delete template
export const deleteTemplate = mutation({
  args: { id: v.id("templates") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const template = await ctx.db.get(args.id);
    if (!template) {
      throw new Error("Template not found");
    }
    
    // Verify user owns this template and it's not a default template
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user || template.userId !== user._id || template.isDefault) {
      throw new Error("Unauthorized");
    }
    
    await ctx.db.delete(args.id);
  },
});

// Get default templates
export const getDefaultTemplates = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("templates")
      .filter((q) => q.eq(q.field("isDefault"), true))
      .collect();
  },
});

// Clone template
export const cloneTemplate = mutation({
  args: {
    templateId: v.id("templates"),
    newName: v.string(),
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

    const originalTemplate = await ctx.db.get(args.templateId);
    if (!originalTemplate) {
      throw new Error("Template not found");
    }

    // Verify user can access this template (owns it or it's default)
    if (!originalTemplate.isDefault && originalTemplate.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const clonedTemplateId = await ctx.db.insert("templates", {
      userId: user._id,
      name: args.newName,
      subject: originalTemplate.subject,
      content: originalTemplate.content,
      category: originalTemplate.category,
      tags: originalTemplate.tags,
      variables: originalTemplate.variables,
      isDefault: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0,
      description: originalTemplate.description,
      settings: originalTemplate.settings,
    });

    return clonedTemplateId;
  },
});

// Get templates by category
export const getTemplatesByCategory = query({
  args: { category: v.string() },
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
      .query("templates")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => 
        q.or(
          q.eq(q.field("userId"), user._id),
          q.eq(q.field("isPublic"), true)
        )
      )
      .order("desc")
      .collect();
  },
});

// Get public templates
export const getPublicTemplates = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("templates")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .order("desc")
      .collect();
  },
});

// Get template categories
export const getCategories = query({
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

    const templates = await ctx.db
      .query("templates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const categories = Array.from(new Set(templates.map(t => t.category)));
    return categories;
  },
});

// Get all tags
export const getAllTags = query({
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

    const templates = await ctx.db
      .query("templates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const allTags = templates.reduce((tags: string[], template) => {
      template.tags.forEach(tag => {
        if (!tags.includes(tag)) {
          tags.push(tag);
        }
      });
      return tags;
    }, []);
    
    return allTags;
  },
});

// Search templates
export const searchTemplates = query({
  args: {
    query: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isPublic: v.optional(v.boolean()),
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

    let templates = await ctx.db
      .query("templates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Filter by search query
    if (args.query) {
      const query = args.query.toLowerCase();
      templates = templates.filter(template => 
        template.name.toLowerCase().includes(query) ||
        template.subject.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (args.category) {
      templates = templates.filter(template => template.category === args.category);
    }

    // Filter by tags
    if (args.tags && args.tags.length > 0) {
      templates = templates.filter(template => 
        args.tags!.some(tag => template.tags.includes(tag))
      );
    }

    return templates;
  },
});

// Validate email content (spam check)
export const validateEmailContent = mutation({
  args: {
    subject: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Simple spam score calculation based on common spam indicators
    let spamScore = 0;
    const suggestions: string[] = [];

    const spamWords = [
      'free', 'urgent', 'act now', 'limited time', 'click here', 
      'buy now', 'guarantee', 'winner', 'congratulations', 'cash',
      'money back', 'risk free', 'no obligation', 'special offer'
    ];

    const subject = args.subject.toLowerCase();
    const content = args.content.toLowerCase();
    const fullText = subject + ' ' + content;

    // Check for spam words
    spamWords.forEach(word => {
      if (fullText.includes(word)) {
        spamScore += 10;
      }
    });

    // Check for excessive caps
    const capsPercentage = (args.subject.match(/[A-Z]/g) || []).length / args.subject.length;
    if (capsPercentage > 0.3) {
      spamScore += 15;
      suggestions.push('Reduce the use of capital letters in your subject line');
    }

    // Check for excessive exclamation marks
    const exclamationCount = (fullText.match(/!/g) || []).length;
    if (exclamationCount > 3) {
      spamScore += 10;
      suggestions.push('Reduce the number of exclamation marks');
    }

    // Check subject length
    if (args.subject.length > 50) {
      spamScore += 5;
      suggestions.push('Consider shortening your subject line (recommended: under 50 characters)');
    }

    // Check for missing unsubscribe link
    if (!content.includes('unsubscribe')) {
      spamScore += 20;
      suggestions.push('Add an unsubscribe link to comply with email regulations');
    }

    // Provide general suggestions
    if (spamScore > 30) {
      suggestions.push('Consider using more natural language and fewer promotional terms');
    }

    if (spamScore > 50) {
      suggestions.push('Your email has a high spam risk - consider rewriting with less promotional language');
    }

    return {
      spamScore: Math.min(spamScore, 100),
      suggestions,
    };
  },
});