import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

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

// AI-powered email content validation using Perplexity AI
export const validateEmailContent = action({
  args: {
    subject: v.string(),
    content: v.string(),
    campaignType: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // Use Perplexity AI for comprehensive email validation
      const aiAnalysis = await ctx.runAction(api.perplexityAI.analyzeEmailWithAI, {
        content: args.content,
        subject: args.subject,
        analysisType: "spam_score",
        context: {
          campaignType: args.campaignType,
          targetAudience: args.targetAudience,
        }
      });

      if (!aiAnalysis.success) {
        // Fallback to basic validation if AI fails
        return fallbackValidation(args);
      }

      // Parse AI response to extract structured data
      const parsedResults = parseAIValidationResponse(aiAnalysis.response);
      
      return {
        spamScore: parsedResults.spamScore,
        suggestions: parsedResults.suggestions,
        aiAnalysis: aiAnalysis.response,
        riskLevel: parsedResults.riskLevel,
        deliverabilityScore: parsedResults.deliverabilityScore,
        specificIssues: parsedResults.specificIssues,
        isAIPowered: true,
      };

    } catch (error) {
      console.error("AI validation failed:", error);
      // Fallback to basic validation
      return fallbackValidation(args);
    }
  },
});

// Enhanced AI-powered template optimization
export const optimizeTemplateWithAI = action({
  args: {
    subject: v.string(),
    content: v.string(),
    campaignType: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    optimizationType: v.union(
      v.literal("engagement"),
      v.literal("deliverability"),
      v.literal("conversion"),
      v.literal("comprehensive")
    ),
  },
  handler: async (ctx, args) => {
    try {
      const aiAnalysis = await ctx.runAction(api.perplexityAI.analyzeEmailWithAI, {
        content: args.content,
        subject: args.subject,
        analysisType: "optimization",
        context: {
          campaignType: args.campaignType,
          targetAudience: args.targetAudience,
        }
      });

      if (!aiAnalysis.success) {
        throw new Error("AI optimization failed");
      }

      const parsedOptimization = parseAIOptimizationResponse(aiAnalysis.response);

      return {
        success: true,
        optimizationScore: parsedOptimization.optimizationScore,
        subjectLineEffectiveness: parsedOptimization.subjectLineEffectiveness,
        ctaRecommendations: parsedOptimization.ctaRecommendations,
        contentImprovements: parsedOptimization.contentImprovements,
        mobileOptimization: parsedOptimization.mobileOptimization,
        recommendations: parsedOptimization.recommendations,
        aiAnalysis: aiAnalysis.response,
        isAIPowered: true,
      };

    } catch (error) {
      console.error("AI optimization failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        isAIPowered: false,
      };
    }
  },
});

// Generate alternative subject lines using AI
export const generateSubjectLineAlternatives = action({
  args: {
    currentSubject: v.string(),
    content: v.string(),
    campaignType: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const aiAnalysis = await ctx.runAction(api.perplexityAI.analyzeEmailWithAI, {
        content: args.content,
        subject: args.currentSubject,
        analysisType: "subject_line_analysis",
        context: {
          campaignType: args.campaignType,
          targetAudience: args.targetAudience,
        }
      });

      if (!aiAnalysis.success) {
        throw new Error("AI subject line analysis failed");
      }

      const parsedResults = parseAISubjectLineResponse(aiAnalysis.response);

      return {
        success: true,
        currentScore: parsedResults.currentScore,
        alternatives: parsedResults.alternatives,
        abTestingRecommendations: parsedResults.abTestingRecommendations,
        analysis: parsedResults.analysis,
        bestPractices: parsedResults.bestPractices,
        aiAnalysis: aiAnalysis.response,
      };

    } catch (error) {
      console.error("AI subject line analysis failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// Helper function for fallback validation when AI is unavailable
function fallbackValidation(args: { subject: string; content: string }) {
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

  if (spamScore > 30) {
    suggestions.push('Consider using more natural language and fewer promotional terms');
  }

  if (spamScore > 50) {
    suggestions.push('Your email has a high spam risk - consider rewriting with less promotional language');
  }

  return {
    spamScore: Math.min(spamScore, 100),
    suggestions,
    isAIPowered: false,
    riskLevel: spamScore < 30 ? 'low' : spamScore < 50 ? 'medium' : 'high',
  };
}

// Helper function to parse AI validation response
function parseAIValidationResponse(aiResponse: string) {
  try {
    // Extract spam score from AI response
    const spamScoreMatch = aiResponse.match(/(?:spam score|score)[:\s]*(\d+)/i);
    const spamScore = spamScoreMatch ? parseInt(spamScoreMatch[1]) : 50;

    // Extract risk level
    const riskLevelMatch = aiResponse.match(/(?:risk level|risk)[:\s]*(low|medium|high)/i);
    const riskLevel = riskLevelMatch ? riskLevelMatch[1].toLowerCase() : 'medium';

    // Extract deliverability score
    const deliverabilityMatch = aiResponse.match(/(?:deliverability)[:\s]*(\d+)/i);
    const deliverabilityScore = deliverabilityMatch ? parseInt(deliverabilityMatch[1]) : 70;

    // Extract suggestions (look for numbered lists or bullet points)
    const suggestions: string[] = [];
    const suggestionMatches = aiResponse.match(/(?:\d+\.|[-•*])\s*([^\n\r]+)/g);
    if (suggestionMatches) {
      suggestions.push(...suggestionMatches.map(match => 
        match.replace(/^\d+\.|^[-•*]\s*/, '').trim()
      ).slice(0, 10)); // Limit to 10 suggestions
    }

    // Extract specific issues
    const specificIssues: string[] = [];
    const issueMatches = aiResponse.match(/(?:issues? found|problems?)[:\s]*([^.]+)/gi);
    if (issueMatches) {
      specificIssues.push(...issueMatches.map(match => match.trim()));
    }

    return {
      spamScore: Math.max(0, Math.min(100, spamScore)),
      riskLevel,
      deliverabilityScore: Math.max(0, Math.min(100, deliverabilityScore)),
      suggestions: suggestions.length > 0 ? suggestions : ['Review your email content for potential improvements'],
      specificIssues,
    };
  } catch (error) {
    console.error("Error parsing AI validation response:", error);
    return {
      spamScore: 50,
      riskLevel: 'medium',
      deliverabilityScore: 70,
      suggestions: ['Unable to parse AI recommendations - please review manually'],
      specificIssues: [],
    };
  }
}

// Helper function to parse AI optimization response
function parseAIOptimizationResponse(aiResponse: string) {
  try {
    const optimizationScoreMatch = aiResponse.match(/(?:optimization score|overall score)[:\s]*(\d+)/i);
    const optimizationScore = optimizationScoreMatch ? parseInt(optimizationScoreMatch[1]) : 70;

    const subjectEffectivenessMatch = aiResponse.match(/(?:subject line effectiveness|subject effectiveness)[:\s]*(\d+)/i);
    const subjectLineEffectiveness = subjectEffectivenessMatch ? parseInt(subjectEffectivenessMatch[1]) : 70;

    // Extract recommendations
    const recommendations: string[] = [];
    const recMatches = aiResponse.match(/(?:\d+\.|[-•*])\s*([^\n\r]+)/g);
    if (recMatches) {
      recommendations.push(...recMatches.map(match => 
        match.replace(/^\d+\.|^[-•*]\s*/, '').trim()
      ).slice(0, 15));
    }

    return {
      optimizationScore: Math.max(0, Math.min(100, optimizationScore)),
      subjectLineEffectiveness: Math.max(0, Math.min(100, subjectLineEffectiveness)),
      ctaRecommendations: recommendations.filter(rec => rec.toLowerCase().includes('cta') || rec.toLowerCase().includes('call-to-action')),
      contentImprovements: recommendations.filter(rec => rec.toLowerCase().includes('content') || rec.toLowerCase().includes('structure')),
      mobileOptimization: recommendations.filter(rec => rec.toLowerCase().includes('mobile') || rec.toLowerCase().includes('responsive')),
      recommendations,
    };
  } catch (error) {
    console.error("Error parsing AI optimization response:", error);
    return {
      optimizationScore: 70,
      subjectLineEffectiveness: 70,
      ctaRecommendations: [],
      contentImprovements: [],
      mobileOptimization: [],
      recommendations: ['Unable to parse AI optimization recommendations'],
    };
  }
}

// Helper function to parse AI subject line response
function parseAISubjectLineResponse(aiResponse: string) {
  try {
    const currentScoreMatch = aiResponse.match(/(?:current score|effectiveness score)[:\s]*(\d+)/i);
    const currentScore = currentScoreMatch ? parseInt(currentScoreMatch[1]) : 70;

    // Extract alternative subject lines with multiple patterns
    const alternatives: string[] = [];
    
    // Try multiple patterns to extract subject lines
    const patterns = [
      // Pattern 1: Quoted strings after numbers/bullets
      /(?:\d+\.|[-•*])\s*["']([^"']+)["']/g,
      // Pattern 2: Lines starting with numbers/bullets (without quotes)
      /(?:\d+\.|[-•*])\s*([^\n\r]{10,80})/g,
      // Pattern 3: Alternative subject lines section
      /(?:alternative|suggestion|option)[^:]*:?\s*([^\n\r]{10,80})/gi,
      // Pattern 4: Subject line examples
      /(?:subject|example)[^:]*:?\s*["']?([^"'\n\r]{10,80})["']?/gi
    ];

    for (const pattern of patterns) {
      const matches = Array.from(aiResponse.matchAll(pattern));
      for (const match of matches) {
        const candidate = match[1]?.trim();
        if (candidate && 
            candidate.length >= 10 && 
            candidate.length <= 80 &&
            !alternatives.includes(candidate) &&
            !candidate.toLowerCase().includes('unable') &&
            !candidate.toLowerCase().includes('error')) {
          alternatives.push(candidate);
        }
      }
      if (alternatives.length >= 5) break;
    }

    // If no alternatives found, extract any reasonable lines
    if (alternatives.length === 0) {
      const lines = aiResponse.split('\n').filter(line => 
        line.trim().length >= 10 && 
        line.trim().length <= 80 &&
        !line.toLowerCase().includes('analysis') &&
        !line.toLowerCase().includes('recommendation') &&
        !line.toLowerCase().includes('score')
      );
      alternatives.push(...lines.slice(0, 5).map(line => line.trim()));
    }

    // Extract A/B testing recommendations
    const abTestingRecommendations: string[] = [];
    const abMatches = aiResponse.match(/(?:a\/b test|testing)[:\s]*([^\n\r]+)/gi);
    if (abMatches) {
      abTestingRecommendations.push(...abMatches.map(match => match.trim()));
    }

    // Extract analysis points
    const analysisMatches = aiResponse.match(/(?:analysis|strengths?|weaknesses?)[:\s]*([^\n\r]+)/gi);
    const analysis = analysisMatches ? analysisMatches.map(match => match.trim()) : [];

    return {
      currentScore: Math.max(0, Math.min(100, currentScore)),
      alternatives: alternatives.length > 0 ? alternatives : [
        "🎯 Boost Your Email Performance Today",
        "✨ Transform Your Communication Strategy",
        "🚀 Unlock Professional Email Success",
        "💡 Master Effective Email Marketing",
        "⭐ Elevate Your Message Impact"
      ],
      abTestingRecommendations,
      analysis,
      bestPractices: analysis.filter(item => item.toLowerCase().includes('practice')),
    };
  } catch (error) {
    console.error("Error parsing AI subject line response:", error);
    return {
      currentScore: 70,
      alternatives: [
        "🎯 Boost Your Email Performance Today",
        "✨ Transform Your Communication Strategy", 
        "🚀 Unlock Professional Email Success",
        "💡 Master Effective Email Marketing",
        "⭐ Elevate Your Message Impact"
      ],
      abTestingRecommendations: [],
      analysis: [],
      bestPractices: [],
    };
  }
}