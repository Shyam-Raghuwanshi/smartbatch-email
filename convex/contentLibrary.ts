import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { internal } from "./_generated/api";

// Content library with reusable components
export const getContentLibrary = query({
  args: {
    userId: v.id("users"),
    category: v.optional(v.string()),
    searchQuery: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    let componentsQuery = ctx.db
      .query("contentComponents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));

    if (args.category) {
      componentsQuery = componentsQuery.filter((q) => 
        q.eq(q.field("category"), args.category)
      );
    }

    let components = await componentsQuery.collect();

    // Filter by search query if provided
    if (args.searchQuery) {
      const query = args.searchQuery.toLowerCase();
      components = components.filter(comp => 
        comp.name.toLowerCase().includes(query) ||
        comp.description?.toLowerCase().includes(query) ||
        comp.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort by usage and rating
    components.sort((a, b) => {
      const aScore = (a.usageCount || 0) + (a.rating || 0) * 10;
      const bScore = (b.usageCount || 0) + (b.rating || 0) * 10;
      return bScore - aScore;
    });

    return {
      components,
      categories: await getContentCategories(ctx, args.userId),
      stats: {
        totalComponents: components.length,
        mostUsed: components[0] || null,
        recentlyAdded: components.filter(c => 
          Date.now() - c.createdAt < 7 * 24 * 60 * 60 * 1000
        ).length
      }
    };
  }
});

export const createContentComponent = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    type: v.string(), // 'header', 'footer', 'cta', 'text_block', 'image_block', 'social_media'
    content: v.string(),
    htmlContent: v.optional(v.string()),
    category: v.string(),
    tags: v.array(v.string()),
    description: v.optional(v.string()),
    variables: v.optional(v.array(v.string())),
    styles: v.optional(v.object({
      backgroundColor: v.optional(v.string()),
      textColor: v.optional(v.string()),
      fontSize: v.optional(v.string()),
      fontFamily: v.optional(v.string()),
      padding: v.optional(v.string()),
      margin: v.optional(v.string()),
      borderRadius: v.optional(v.string()),
      borderColor: v.optional(v.string()),
      borderWidth: v.optional(v.string())
    })),
    isPublic: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const componentId = await ctx.db.insert("contentComponents", {
      userId: args.userId,
      name: args.name,
      type: args.type,
      content: args.content,
      htmlContent: args.htmlContent,
      category: args.category,
      tags: args.tags,
      description: args.description,
      variables: args.variables || [],
      styles: args.styles,
      isPublic: args.isPublic || false,
      usageCount: 0,
      rating: 0,
      ratingCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    return componentId;
  }
});

export const updateContentComponent = mutation({
  args: {
    componentId: v.id("contentComponents"),
    updates: v.object({
      name: v.optional(v.string()),
      content: v.optional(v.string()),
      htmlContent: v.optional(v.string()),
      category: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      description: v.optional(v.string()),
      variables: v.optional(v.array(v.string())),
      styles: v.optional(v.object({
        backgroundColor: v.optional(v.string()),
        textColor: v.optional(v.string()),
        fontSize: v.optional(v.string()),
        fontFamily: v.optional(v.string()),
        padding: v.optional(v.string()),
        margin: v.optional(v.string()),
        borderRadius: v.optional(v.string()),
        borderColor: v.optional(v.string()),
        borderWidth: v.optional(v.string())
      }))
    })
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.componentId, {
      ...args.updates,
      updatedAt: Date.now()
    });
  }
});

export const deleteContentComponent = mutation({
  args: {
    componentId: v.id("contentComponents")
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.componentId);
  }
});

export const incrementComponentUsage = mutation({
  args: {
    componentId: v.id("contentComponents")
  },
  handler: async (ctx, args) => {
    const component = await ctx.db.get(args.componentId);
    if (component) {
      await ctx.db.patch(args.componentId, {
        usageCount: (component.usageCount || 0) + 1
      });
    }
  }
});

export const rateContentComponent = mutation({
  args: {
    componentId: v.id("contentComponents"),
    rating: v.number() // 1-5 stars
  },
  handler: async (ctx, args) => {
    const component = await ctx.db.get(args.componentId);
    if (!component) throw new Error("Component not found");

    const currentRating = component.rating || 0;
    const currentCount = component.ratingCount || 0;
    
    const newCount = currentCount + 1;
    const newRating = ((currentRating * currentCount) + args.rating) / newCount;

    await ctx.db.patch(args.componentId, {
      rating: newRating,
      ratingCount: newCount
    });
  }
});

export const getPublicContentComponents = query({
  args: {
    category: v.optional(v.string()),
    type: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    let query = ctx.db
      .query("contentComponents")
      .withIndex("by_public", (q) => q.eq("isPublic", true));

    if (args.category) {
      query = query.filter((q) => q.eq(q.field("category"), args.category));
    }

    if (args.type) {
      query = query.filter((q) => q.eq(q.field("type"), args.type));
    }

    const components = await query
      .order("desc")
      .take(limit);

    return components;
  }
});

export const generateContentComponentFromAI = action({
  args: {
    type: v.string(),
    description: v.string(),
    style: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    tone: v.optional(v.string()) // 'professional', 'casual', 'friendly', 'urgent'
  },
  handler: async (ctx, args) => {
    // AI-generated content based on requirements
    const generatedContent = await generateAIContent(
      args.type,
      args.description,
      args.style,
      args.targetAudience,
      args.tone
    );

    return {
      content: generatedContent.content,
      htmlContent: generatedContent.htmlContent,
      suggestions: generatedContent.suggestions,
      variations: generatedContent.variations
    };
  }
});

export const duplicateContentComponent = mutation({
  args: {
    componentId: v.id("contentComponents"),
    userId: v.id("users"),
    newName: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.componentId);
    if (!original) throw new Error("Component not found");

    const duplicatedId = await ctx.db.insert("contentComponents", {
      userId: args.userId,
      name: args.newName || `Copy of ${original.name}`,
      type: original.type,
      content: original.content,
      htmlContent: original.htmlContent,
      category: original.category,
      tags: original.tags,
      description: original.description,
      variables: original.variables || [],
      styles: original.styles,
      isPublic: false, // Duplicates are private by default
      usageCount: 0,
      rating: 0,
      ratingCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    return duplicatedId;
  }
});

export const getContentComponentAnalytics = query({
  args: {
    userId: v.id("users"),
    timeRange: v.optional(v.string()) // '7d', '30d', '90d'
  },
  handler: async (ctx, args) => {
    const components = await ctx.db
      .query("contentComponents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const analytics = {
      totalComponents: components.length,
      componentsByType: {},
      componentsByCategory: {},
      mostUsedComponents: components
        .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
        .slice(0, 10),
      highestRatedComponents: components
        .filter(c => c.rating && c.rating > 0)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 10),
      recentActivity: components
        .filter(c => Date.now() - c.updatedAt < 30 * 24 * 60 * 60 * 1000)
        .length,
      totalUsage: components.reduce((sum, c) => sum + (c.usageCount || 0), 0)
    };

    // Group by type
    components.forEach(comp => {
      analytics.componentsByType[comp.type] = (analytics.componentsByType[comp.type] || 0) + 1;
    });

    // Group by category
    components.forEach(comp => {
      analytics.componentsByCategory[comp.category] = (analytics.componentsByCategory[comp.category] || 0) + 1;
    });

    return analytics;
  }
});

// Helper functions
async function getContentCategories(ctx: any, userId: string) {
  const components = await ctx.db
    .query("contentComponents")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  const categories = [...new Set(components.map(c => c.category))];
  return categories.map(category => ({
    name: category,
    count: components.filter(c => c.category === category).length
  }));
}

async function generateAIContent(
  type: string,
  description: string,
  style?: string,
  targetAudience?: string,
  tone?: string
) {
  // AI content generation logic
  const contentTemplates = {
    header: {
      content: generateHeaderContent(description, tone),
      htmlContent: generateHeaderHTML(description, style, tone)
    },
    footer: {
      content: generateFooterContent(description, tone),
      htmlContent: generateFooterHTML(description, style)
    },
    cta: {
      content: generateCTAContent(description, tone),
      htmlContent: generateCTAHTML(description, style, tone)
    },
    text_block: {
      content: generateTextBlockContent(description, tone, targetAudience),
      htmlContent: generateTextBlockHTML(description, style, tone, targetAudience)
    },
    image_block: {
      content: generateImageBlockContent(description),
      htmlContent: generateImageBlockHTML(description, style)
    },
    social_media: {
      content: generateSocialMediaContent(description),
      htmlContent: generateSocialMediaHTML(description, style)
    }
  };

  const generated = contentTemplates[type] || contentTemplates.text_block;

  return {
    ...generated,
    suggestions: generateContentSuggestions(type, description, tone),
    variations: generateContentVariations(type, description, tone)
  };
}

function generateHeaderContent(description: string, tone?: string) {
  const toneVariations = {
    professional: `Professional ${description}`,
    casual: `Hey there! ${description}`,
    friendly: `Welcome! ${description}`,
    urgent: `Important: ${description}`
  };

  return toneVariations[tone || 'professional'] || description;
}

function generateHeaderHTML(description: string, style?: string, tone?: string) {
  const content = generateHeaderContent(description, tone);
  const styleClass = style || 'professional';
  
  return `
    <div class="email-header ${styleClass}">
      <h1 style="margin: 0; padding: 20px; font-size: 24px; font-weight: bold; text-align: center;">
        ${content}
      </h1>
    </div>
  `;
}

function generateFooterContent(description: string, tone?: string) {
  return `
    ${description}
    
    Best regards,
    The Team
    
    You're receiving this email because you subscribed to our updates.
    Unsubscribe | Update preferences | Contact us
  `;
}

function generateFooterHTML(description: string, style?: string) {
  return `
    <div class="email-footer" style="background-color: #f8f9fa; padding: 20px; margin-top: 30px; border-top: 1px solid #dee2e6;">
      <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 14px;">
        ${description}
      </p>
      <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 14px;">
        Best regards,<br>
        The Team
      </p>
      <p style="margin: 0; color: #6c757d; font-size: 12px;">
        You're receiving this email because you subscribed to our updates.
        <a href="{unsubscribeUrl}" style="color: #007bff;">Unsubscribe</a> | 
        <a href="{preferencesUrl}" style="color: #007bff;">Update preferences</a> | 
        <a href="{contactUrl}" style="color: #007bff;">Contact us</a>
      </p>
    </div>
  `;
}

function generateCTAContent(description: string, tone?: string) {
  const toneVariations = {
    professional: 'Learn More',
    casual: "Let's Go!",
    friendly: 'Get Started',
    urgent: 'Act Now!'
  };

  return toneVariations[tone || 'professional'];
}

function generateCTAHTML(description: string, style?: string, tone?: string) {
  const content = generateCTAContent(description, tone);
  const buttonStyle = style === 'modern' ? 
    'background: linear-gradient(45deg, #007bff, #0056b3); border-radius: 25px;' :
    'background-color: #007bff; border-radius: 5px;';

  return `
    <div style="text-align: center; margin: 30px 0;">
      <a href="{ctaUrl}" style="
        display: inline-block;
        ${buttonStyle}
        color: white;
        text-decoration: none;
        padding: 12px 30px;
        font-weight: bold;
        font-size: 16px;
        transition: all 0.3s ease;
      ">
        ${content}
      </a>
    </div>
  `;
}

function generateTextBlockContent(description: string, tone?: string, targetAudience?: string) {
  const audienceContext = targetAudience ? ` for ${targetAudience}` : '';
  const toneContext = tone ? ` in a ${tone} tone` : '';
  
  return `This is a text block about ${description}${audienceContext}${toneContext}. 

You can customize this content to match your specific needs and brand voice. Consider including:
- Key benefits or features
- Relevant statistics or data
- Customer testimonials
- Clear value propositions

Remember to keep your content scannable with bullet points, short paragraphs, and clear headings.`;
}

function generateTextBlockHTML(description: string, style?: string, tone?: string, targetAudience?: string) {
  const content = generateTextBlockContent(description, tone, targetAudience);
  
  return `
    <div class="text-block" style="padding: 20px 0;">
      <p style="margin: 0 0 15px 0; line-height: 1.6; color: #333;">
        ${content.split('\n').map(para => para.trim()).filter(para => para).join('</p><p style="margin: 0 0 15px 0; line-height: 1.6; color: #333;">')}
      </p>
    </div>
  `;
}

function generateImageBlockContent(description: string) {
  return `Image block: ${description}. Remember to include alt text for accessibility and ensure images are optimized for email clients.`;
}

function generateImageBlockHTML(description: string, style?: string) {
  return `
    <div class="image-block" style="text-align: center; margin: 20px 0;">
      <img src="{imageUrl}" alt="${description}" style="
        max-width: 100%;
        height: auto;
        border-radius: ${style === 'modern' ? '10px' : '5px'};
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      ">
      <p style="margin: 10px 0 0 0; font-size: 14px; color: #6c757d; font-style: italic;">
        ${description}
      </p>
    </div>
  `;
}

function generateSocialMediaContent(description: string) {
  return `Follow us on social media for ${description}`;
}

function generateSocialMediaHTML(description: string, style?: string) {
  return `
    <div class="social-media" style="text-align: center; padding: 20px 0; border-top: 1px solid #dee2e6; margin-top: 30px;">
      <p style="margin: 0 0 15px 0; font-size: 16px; color: #333;">
        ${description}
      </p>
      <div style="display: inline-block;">
        <a href="{facebookUrl}" style="display: inline-block; margin: 0 10px; text-decoration: none;">
          <img src="https://via.placeholder.com/32x32/3b5998/ffffff?text=f" alt="Facebook" style="width: 32px; height: 32px; border-radius: 16px;">
        </a>
        <a href="{twitterUrl}" style="display: inline-block; margin: 0 10px; text-decoration: none;">
          <img src="https://via.placeholder.com/32x32/1da1f2/ffffff?text=t" alt="Twitter" style="width: 32px; height: 32px; border-radius: 16px;">
        </a>
        <a href="{linkedinUrl}" style="display: inline-block; margin: 0 10px; text-decoration: none;">
          <img src="https://via.placeholder.com/32x32/0077b5/ffffff?text=in" alt="LinkedIn" style="width: 32px; height: 32px; border-radius: 16px;">
        </a>
        <a href="{instagramUrl}" style="display: inline-block; margin: 0 10px; text-decoration: none;">
          <img src="https://via.placeholder.com/32x32/e4405f/ffffff?text=ig" alt="Instagram" style="width: 32px; height: 32px; border-radius: 16px;">
        </a>
      </div>
    </div>
  `;
}

function generateContentSuggestions(type: string, description: string, tone?: string) {
  const suggestions = {
    header: [
      'Consider adding your company logo',
      'Use consistent brand colors',
      'Keep header concise and impactful'
    ],
    footer: [
      'Include physical address for compliance',
      'Add social media links',
      'Provide clear unsubscribe option'
    ],
    cta: [
      'Use action-oriented language',
      'Make the button visually prominent',
      'Limit to one primary CTA per email'
    ],
    text_block: [
      'Keep paragraphs short and scannable',
      'Use bullet points for lists',
      'Include relevant links and references'
    ],
    image_block: [
      'Optimize images for email clients',
      'Include descriptive alt text',
      'Consider mobile responsiveness'
    ],
    social_media: [
      'Use consistent social media icons',
      'Link to active social profiles',
      'Consider adding social sharing buttons'
    ]
  };

  return suggestions[type] || ['Customize content to match your brand voice', 'Test across different email clients'];
}

function generateContentVariations(type: string, description: string, tone?: string) {
  return [
    {
      name: 'Variation A',
      description: 'Conservative approach with traditional styling'
    },
    {
      name: 'Variation B', 
      description: 'Modern approach with contemporary design elements'
    },
    {
      name: 'Variation C',
      description: 'Minimalist approach focusing on essential content'
    }
  ];
}
