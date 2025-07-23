import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { internal } from "./_generated/api";

// Personalization engine for dynamic content insertion
export const generatePersonalizedContent = action({
  args: {
    templateContent: v.string(),
    contactId: v.id("contacts"),
    campaignType: v.optional(v.string()),
    behavioralData: v.optional(v.object({
      lastOpenedAt: v.optional(v.number()),
      clickHistory: v.optional(v.array(v.string())),
      engagementScore: v.optional(v.number()),
      preferredCategories: v.optional(v.array(v.string()))
    }))
  },
  handler: async (ctx, args) => {
    // Get contact data
    const contact = await ctx.runQuery(internal.contacts.getContactById, {
      id: args.contactId
    });

    if (!contact) {
      throw new Error("Contact not found");
    }

    // Generate personalized content
    let personalizedContent = args.templateContent;

    // Basic personalization
    personalizedContent = await applyBasicPersonalization(personalizedContent, contact);

    // Behavioral targeting
    if (args.behavioralData) {
      personalizedContent = await applyBehavioralTargeting(
        personalizedContent, 
        contact, 
        args.behavioralData,
        args.campaignType
      );
    }

    // Dynamic content insertion
    personalizedContent = await insertDynamicContent(
      personalizedContent, 
      contact, 
      args.campaignType
    );

    // Smart recommendations
    const recommendations = await generateSmartRecommendations(
      contact, 
      args.behavioralData,
      args.campaignType
    );

    return {
      personalizedContent,
      recommendations,
      personalizationScore: calculatePersonalizationScore(personalizedContent, contact),
      appliedPersonalizations: extractAppliedPersonalizations(personalizedContent, args.templateContent)
    };
  }
});

export const getBehavioralSegments = query({
  args: {
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Analyze behavioral patterns
    const segments = {
      highEngagement: contacts.filter(c => 
        c.emailStats && c.emailStats.totalOpened > 10 && 
        (c.emailStats.totalOpened / c.emailStats.totalSent) > 0.3
      ),
      lowEngagement: contacts.filter(c => 
        c.emailStats && 
        (c.emailStats.totalOpened / c.emailStats.totalSent) < 0.1
      ),
      recentlyActive: contacts.filter(c => 
        c.lastEngagement && 
        Date.now() - c.lastEngagement < 30 * 24 * 60 * 60 * 1000 // 30 days
      ),
      dormant: contacts.filter(c => 
        !c.lastEngagement || 
        Date.now() - c.lastEngagement > 90 * 24 * 60 * 60 * 1000 // 90 days
      ),
      frequentClickers: contacts.filter(c => 
        c.emailStats && c.emailStats.totalClicked > 5
      )
    };

    return {
      segments,
      analytics: {
        totalContacts: contacts.length,
        segmentDistribution: {
          highEngagement: segments.highEngagement.length,
          lowEngagement: segments.lowEngagement.length,
          recentlyActive: segments.recentlyActive.length,
          dormant: segments.dormant.length,
          frequentClickers: segments.frequentClickers.length
        }
      }
    };
  }
});

export const generateDynamicContentBlocks = action({
  args: {
    contactSegment: v.string(),
    contentType: v.string(),
    industry: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const contentBlocks = await generateContentBlocksForSegment(
      args.contactSegment,
      args.contentType,
      args.industry
    );

    return contentBlocks;
  }
});

// Helper functions for personalization
async function applyBasicPersonalization(content: string, contact: any) {
  let personalized = content;

  // Replace basic tokens
  const replacements = {
    '{firstName}': contact.firstName || 'there',
    '{lastName}': contact.lastName || '',
    '{name}': contact.firstName || 'there',
    '{fullName}': contact.firstName && contact.lastName 
      ? `${contact.firstName} ${contact.lastName}` 
      : contact.firstName || 'there',
    '{email}': contact.email,
    '{company}': contact.company || 'your company',
    '{position}': contact.position || '',
    '{phone}': contact.phone || ''
  };

  // Apply custom fields
  if (contact.customFields) {
    Object.entries(contact.customFields).forEach(([key, value]) => {
      replacements[`{${key}}`] = String(value);
    });
  }

  // Replace all tokens
  Object.entries(replacements).forEach(([token, value]) => {
    const regex = new RegExp(token.replace(/[{}]/g, '\\$&'), 'g');
    personalized = personalized.replace(regex, value);
  });

  return personalized;
}

async function applyBehavioralTargeting(
  content: string, 
  contact: any, 
  behavioralData: any,
  campaignType?: string
) {
  let targeted = content;

  // Time-based personalization
  if (behavioralData.lastOpenedAt) {
    const daysSinceLastOpen = Math.floor((Date.now() - behavioralData.lastOpenedAt) / (24 * 60 * 60 * 1000));
    
    if (daysSinceLastOpen > 30) {
      // Long-time subscriber messaging
      targeted = targeted.replace(
        '{behavioralMessage}',
        "We've missed you! Here's what you've been missing..."
      );
    } else if (daysSinceLastOpen < 7) {
      // Active subscriber messaging
      targeted = targeted.replace(
        '{behavioralMessage}',
        "Thanks for staying engaged with us!"
      );
    }
  }

  // Engagement-based content
  if (behavioralData.engagementScore) {
    if (behavioralData.engagementScore > 0.7) {
      // High engagement - exclusive content
      targeted = targeted.replace(
        '{engagementContent}',
        '<div class="exclusive-content">🌟 Exclusive content for our most engaged subscribers!</div>'
      );
    } else if (behavioralData.engagementScore < 0.3) {
      // Low engagement - re-engagement content
      targeted = targeted.replace(
        '{engagementContent}',
        '<div class="reengagement-content">We want to make sure our emails are valuable to you.</div>'
      );
    }
  }

  // Click history-based recommendations
  if (behavioralData.clickHistory && behavioralData.clickHistory.length > 0) {
    const interests = inferInterestsFromClicks(behavioralData.clickHistory);
    targeted = targeted.replace(
      '{recommendedContent}',
      generateRecommendedContentHtml(interests)
    );
  }

  return targeted;
}

async function insertDynamicContent(content: string, contact: any, campaignType?: string) {
  let dynamic = content;

  // Location-based content
  if (contact.customFields?.location) {
    const locationContent = await generateLocationBasedContent(contact.customFields.location);
    dynamic = dynamic.replace('{locationContent}', locationContent);
  }

  // Industry-specific content
  if (contact.customFields?.industry) {
    const industryContent = await generateIndustryContent(contact.customFields.industry);
    dynamic = dynamic.replace('{industryContent}', industryContent);
  }

  // Time-sensitive content
  const timeContent = generateTimeBasedContent(campaignType);
  dynamic = dynamic.replace('{timeContent}', timeContent);

  // Weather-based content (if location available)
  if (contact.customFields?.location) {
    const weatherContent = await generateWeatherBasedContent(contact.customFields.location);
    dynamic = dynamic.replace('{weatherContent}', weatherContent);
  }

  return dynamic;
}

async function generateSmartRecommendations(
  contact: any, 
  behavioralData?: any,
  campaignType?: string
) {
  const recommendations = [];

  // Engagement-based recommendations
  if (behavioralData?.engagementScore) {
    if (behavioralData.engagementScore < 0.2) {
      recommendations.push({
        type: 'frequency',
        suggestion: 'Reduce email frequency for this contact',
        reason: 'Low engagement score indicates potential fatigue'
      });
    } else if (behavioralData.engagementScore > 0.8) {
      recommendations.push({
        type: 'frequency',
        suggestion: 'Consider sending exclusive content to this highly engaged contact',
        reason: 'High engagement score indicates strong interest'
      });
    }
  }

  // Time-based recommendations
  if (contact.engagementProfile?.preferredHours) {
    const bestHour = contact.engagementProfile.preferredHours[0];
    recommendations.push({
      type: 'timing',
      suggestion: `Send emails around ${bestHour}:00 for this contact`,
      reason: 'Based on their historical engagement patterns'
    });
  }

  // Content recommendations
  if (behavioralData?.preferredCategories) {
    recommendations.push({
      type: 'content',
      suggestion: `Focus on ${behavioralData.preferredCategories.join(', ')} topics`,
      reason: 'Based on their click and engagement history'
    });
  }

  // Segmentation recommendations
  const segmentRecommendation = determineOptimalSegment(contact, behavioralData);
  if (segmentRecommendation) {
    recommendations.push(segmentRecommendation);
  }

  return recommendations;
}

function calculatePersonalizationScore(personalizedContent: string, contact: any) {
  let score = 0;

  // Check for personalized elements
  const personalElements = [
    contact.firstName && personalizedContent.includes(contact.firstName),
    contact.company && personalizedContent.includes(contact.company),
    contact.position && personalizedContent.includes(contact.position),
    personalizedContent.includes('{') && personalizedContent.includes('}'), // Dynamic content
  ].filter(Boolean).length;

  score = (personalElements / 4) * 100;

  // Bonus for advanced personalization
  if (personalizedContent.includes('behavioralMessage')) score += 10;
  if (personalizedContent.includes('locationContent')) score += 10;
  if (personalizedContent.includes('industryContent')) score += 10;
  if (personalizedContent.includes('recommendedContent')) score += 15;

  return Math.min(score, 100);
}

function extractAppliedPersonalizations(personalizedContent: string, originalContent: string) {
  const applied = [];

  if (personalizedContent !== originalContent) {
    // Detect what personalizations were applied
    if (originalContent.includes('{firstName}') && !personalizedContent.includes('{firstName}')) {
      applied.push('First name personalization');
    }
    if (originalContent.includes('{company}') && !personalizedContent.includes('{company}')) {
      applied.push('Company personalization');
    }
    if (personalizedContent.includes('behavioralMessage')) {
      applied.push('Behavioral targeting');
    }
    if (personalizedContent.includes('locationContent')) {
      applied.push('Location-based content');
    }
    if (personalizedContent.includes('industryContent')) {
      applied.push('Industry-specific content');
    }
  }

  return applied;
}

function inferInterestsFromClicks(clickHistory: string[]) {
  // Simple interest inference based on clicked URLs
  const interests = [];
  
  clickHistory.forEach(url => {
    if (url.includes('product')) interests.push('products');
    if (url.includes('blog')) interests.push('content');
    if (url.includes('pricing')) interests.push('pricing');
    if (url.includes('feature')) interests.push('features');
    if (url.includes('support')) interests.push('support');
  });

  return [...new Set(interests)]; // Remove duplicates
}

function generateRecommendedContentHtml(interests: string[]) {
  if (interests.length === 0) return '';

  const contentMap = {
    products: '<div class="recommendation">📦 Check out our latest product updates</div>',
    content: '<div class="recommendation">📚 New blog posts you might enjoy</div>',
    pricing: '<div class="recommendation">💰 Special pricing available for you</div>',
    features: '<div class="recommendation">✨ New features based on your interests</div>',
    support: '<div class="recommendation">🤝 Resources to help you succeed</div>'
  };

  return interests.map(interest => contentMap[interest] || '').join('\n');
}

async function generateLocationBasedContent(location: string) {
  // Simple location-based content generation
  const locationMap = {
    'new york': 'Experience the best of NYC with our local recommendations',
    'california': 'Discover California-exclusive offers and events',
    'london': 'London-specific content and local partnerships',
    'default': 'Location-based content for your area'
  };

  const key = location.toLowerCase();
  return locationMap[key] || locationMap.default;
}

async function generateIndustryContent(industry: string) {
  const industryMap = {
    'technology': 'Latest tech trends and innovations in your industry',
    'healthcare': 'Healthcare industry insights and compliance updates',
    'finance': 'Financial sector news and regulatory changes',
    'education': 'Educational resources and learning opportunities',
    'retail': 'Retail trends and customer experience insights',
    'default': 'Industry-specific insights for your sector'
  };

  const key = industry.toLowerCase();
  return industryMap[key] || industryMap.default;
}

function generateTimeBasedContent(campaignType?: string) {
  const currentHour = new Date().getHours();
  const currentDay = new Date().getDay();

  if (currentHour < 12) {
    return 'Good morning! Start your day with...';
  } else if (currentHour < 17) {
    return 'Good afternoon! Here\'s what\'s happening...';
  } else {
    return 'Good evening! Wind down with...';
  }
}

async function generateWeatherBasedContent(location: string) {
  // Simplified weather-based content (in a real app, you'd call a weather API)
  const seasonalContent = {
    spring: '🌸 Spring is here! Perfect time for new beginnings...',
    summer: '☀️ Summer vibes! Stay cool with our recommendations...',
    fall: '🍂 Fall into savings with our autumn specials...',
    winter: '❄️ Winter warmth with our cozy recommendations...'
  };

  const month = new Date().getMonth();
  let season = 'spring';
  
  if (month >= 2 && month <= 4) season = 'spring';
  else if (month >= 5 && month <= 7) season = 'summer';
  else if (month >= 8 && month <= 10) season = 'fall';
  else season = 'winter';

  return seasonalContent[season];
}

function determineOptimalSegment(contact: any, behavioralData?: any) {
  if (!behavioralData) return null;

  if (behavioralData.engagementScore > 0.7) {
    return {
      type: 'segment',
      suggestion: 'Move to VIP/High Engagement segment',
      reason: 'Consistently high engagement warrants special treatment'
    };
  } else if (behavioralData.engagementScore < 0.2) {
    return {
      type: 'segment',
      suggestion: 'Move to Re-engagement campaign',
      reason: 'Low engagement requires different approach'
    };
  }

  return null;
}

async function generateContentBlocksForSegment(
  segment: string, 
  contentType: string, 
  industry?: string
) {
  const contentBlocks = {
    hero: '',
    body: '',
    cta: '',
    footer: ''
  };

  // Generate content based on segment
  switch (segment) {
    case 'highEngagement':
      contentBlocks.hero = 'Exclusive content for our most valued subscribers';
      contentBlocks.body = 'You\'ve shown great engagement with our content. Here\'s something special...';
      contentBlocks.cta = 'Get Exclusive Access';
      break;
      
    case 'lowEngagement':
      contentBlocks.hero = 'We want to make sure our emails are valuable to you';
      contentBlocks.body = 'Help us understand what content you\'d like to see more of...';
      contentBlocks.cta = 'Tell Us Your Preferences';
      break;
      
    case 'dormant':
      contentBlocks.hero = 'We miss you! Here\'s what you\'ve been missing';
      contentBlocks.body = 'It\'s been a while since we\'ve connected. Here are some highlights...';
      contentBlocks.cta = 'Welcome Back';
      break;

    default:
      contentBlocks.hero = 'Personalized content just for you';
      contentBlocks.body = 'Based on your interests and activity...';
      contentBlocks.cta = 'Learn More';
  }

  // Customize for industry if provided
  if (industry) {
    contentBlocks.body += ` with insights specific to the ${industry} industry.`;
  }

  return contentBlocks;
}
