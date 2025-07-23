import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { internal } from "./_generated/api";

// Template intelligence for performance-based ranking and suggestions
export const getTemplatePerformanceRankings = query({
  args: {
    userId: v.id("users"),
    timeRange: v.optional(v.string()) // '7d', '30d', '90d', 'all'
  },
  handler: async (ctx, args) => {
    const timeRange = args.timeRange || '30d';
    const cutoffTime = getTimeRangeCutoff(timeRange);

    // Get templates with their usage analytics
    const templates = await ctx.db
      .query("templates")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Get campaign data for performance analysis
    const campaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gte(q.field("createdAt"), cutoffTime))
      .collect();

    // Calculate performance metrics for each template
    const templatePerformance = await Promise.all(
      templates.map(async (template) => {
        const templateCampaigns = campaigns.filter(c => 
          c.settings.templateId === template._id
        );

        const metrics = await calculateTemplateMetrics(ctx, template, templateCampaigns);
        
        return {
          template,
          metrics,
          performanceScore: calculatePerformanceScore(metrics),
          recommendations: generateTemplateRecommendations(template, metrics)
        };
      })
    );

    // Sort by performance score
    templatePerformance.sort((a, b) => b.performanceScore - a.performanceScore);

    return {
      templates: templatePerformance,
      analytics: {
        totalTemplates: templates.length,
        averagePerformanceScore: templatePerformance.reduce((sum, t) => sum + t.performanceScore, 0) / templatePerformance.length,
        topPerformer: templatePerformance[0] || null,
        bottomPerformer: templatePerformance[templatePerformance.length - 1] || null
      }
    };
  }
});

export const generateAutomaticTemplateSuggestions = action({
  args: {
    userId: v.id("users"),
    campaignType: v.string(),
    targetAudience: v.optional(v.string()),
    industry: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Get user's historical performance data
    const performanceData = await ctx.runQuery(internal.templateIntelligence.getTemplatePerformanceRankings, {
      userId: args.userId
    });

    // Generate suggestions based on campaign type and performance
    const suggestions = await generateTemplateBasedSuggestions(
      args.campaignType,
      args.targetAudience,
      args.industry,
      performanceData
    );

    return {
      suggestions,
      reasoning: generateSuggestionReasoning(suggestions, performanceData),
      alternativeOptions: await generateAlternativeTemplates(args.campaignType, args.industry)
    };
  }
});

export const getIndustrySpecificTemplates = query({
  args: {
    industry: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    // Get public industry-specific templates
    const industryTemplates = await ctx.db
      .query("templates")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .filter((q) => q.eq(q.field("category"), args.industry))
      .order("desc")
      .take(limit);

    // Get performance data for these templates
    const templatesWithPerformance = await Promise.all(
      industryTemplates.map(async (template) => {
        const avgPerformance = await calculateIndustryAveragePerformance(ctx, template, args.industry);
        return {
          ...template,
          industryPerformance: avgPerformance,
          popularityScore: template.usageCount || 0
        };
      })
    );

    return {
      templates: templatesWithPerformance,
      industryInsights: await generateIndustryInsights(args.industry),
      bestPractices: getIndustryBestPractices(args.industry)
    };
  }
});

export const analyzeTemplateABTestPotential = action({
  args: {
    templateId: v.id("templates"),
    testVariations: v.array(v.object({
      type: v.string(), // 'subject', 'content', 'cta', 'layout'
      variation: v.string()
    }))
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found");

    // Analyze potential for each test variation
    const testAnalysis = await Promise.all(
      args.testVariations.map(async (variation) => {
        const analysis = await analyzeVariationPotential(template, variation);
        return {
          variation,
          analysis,
          predictedImpact: await predictVariationImpact(template, variation),
          confidence: calculateConfidenceScore(template, variation)
        };
      })
    );

    return {
      template,
      testAnalysis,
      recommendations: generateABTestRecommendations(testAnalysis),
      estimatedTestDuration: calculateEstimatedTestDuration(template),
      sampleSizeRecommendation: calculateSampleSizeRecommendation(template)
    };
  }
});

export const updateTemplatePerformanceMetrics = mutation({
  args: {
    templateId: v.id("templates"),
    campaignId: v.id("campaigns"),
    metrics: v.object({
      opens: v.number(),
      clicks: v.number(),
      conversions: v.number(),
      bounces: v.number(),
      unsubscribes: v.number()
    })
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found");

    // Update template analytics
    const currentAnalytics = template.analytics || {
      opens: 0,
      clicks: 0,
      conversions: 0,
      lastUsed: Date.now()
    };

    const updatedAnalytics = {
      opens: currentAnalytics.opens + args.metrics.opens,
      clicks: currentAnalytics.clicks + args.metrics.clicks,
      conversions: currentAnalytics.conversions + args.metrics.conversions,
      lastUsed: Date.now()
    };

    await ctx.db.patch(args.templateId, {
      analytics: updatedAnalytics,
      usageCount: (template.usageCount || 0) + 1
    });

    // Calculate and update spam score if needed
    const spamAnalysis = await ctx.runAction(internal.contentAnalysis.analyzeSpamScore, {
      subject: template.subject,
      content: template.content
    });

    await ctx.db.patch(args.templateId, {
      spamScore: spamAnalysis.spamScore
    });

    return updatedAnalytics;
  }
});

// Helper functions
function getTimeRangeCutoff(timeRange: string): number {
  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;

  switch (timeRange) {
    case '7d': return now - (7 * msPerDay);
    case '30d': return now - (30 * msPerDay);
    case '90d': return now - (90 * msPerDay);
    default: return 0; // 'all'
  }
}

async function calculateTemplateMetrics(ctx: any, template: any, campaigns: any[]) {
  if (campaigns.length === 0) {
    return {
      totalUsage: 0,
      avgOpenRate: 0,
      avgClickRate: 0,
      avgConversionRate: 0,
      totalRevenue: 0,
      engagementScore: 0
    };
  }

  // Get campaign statistics
  const campaignStats = await Promise.all(
    campaigns.map(async (campaign) => {
      return await ctx.runQuery(internal.campaigns.getCampaignStats, {
        campaignId: campaign._id
      });
    })
  );

  const totalSent = campaignStats.reduce((sum, stats) => sum + (stats?.sent || 0), 0);
  const totalOpened = campaignStats.reduce((sum, stats) => sum + (stats?.opened || 0), 0);
  const totalClicked = campaignStats.reduce((sum, stats) => sum + (stats?.clicked || 0), 0);

  return {
    totalUsage: campaigns.length,
    avgOpenRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
    avgClickRate: totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0,
    avgConversionRate: 0, // Would need conversion tracking
    totalRevenue: 0, // Would need revenue tracking
    engagementScore: calculateEngagementScore(totalSent, totalOpened, totalClicked)
  };
}

function calculatePerformanceScore(metrics: any): number {
  let score = 0;

  // Open rate scoring (0-40 points)
  score += Math.min(metrics.avgOpenRate * 2, 40);

  // Click rate scoring (0-30 points)
  score += Math.min(metrics.avgClickRate * 5, 30);

  // Usage frequency scoring (0-20 points)
  score += Math.min(metrics.totalUsage * 2, 20);

  // Engagement score (0-10 points)
  score += Math.min(metrics.engagementScore / 10, 10);

  return Math.round(score);
}

function calculateEngagementScore(sent: number, opened: number, clicked: number): number {
  if (sent === 0) return 0;
  
  const openWeight = 0.3;
  const clickWeight = 0.7;
  
  const openRate = opened / sent;
  const clickRate = clicked / sent;
  
  return (openRate * openWeight + clickRate * clickWeight) * 100;
}

function generateTemplateRecommendations(template: any, metrics: any) {
  const recommendations = [];

  if (metrics.avgOpenRate < 20) {
    recommendations.push({
      type: 'subject_line',
      priority: 'high',
      suggestion: 'Improve subject line to increase open rates',
      impact: 'Could improve open rates by 15-25%'
    });
  }

  if (metrics.avgClickRate < 5) {
    recommendations.push({
      type: 'call_to_action',
      priority: 'high',
      suggestion: 'Strengthen call-to-action buttons and placement',
      impact: 'Could improve click rates by 10-20%'
    });
  }

  if (metrics.totalUsage < 3) {
    recommendations.push({
      type: 'visibility',
      priority: 'medium',
      suggestion: 'Template needs more exposure - consider promoting',
      impact: 'Increase template usage and gather more performance data'
    });
  }

  if (template.spamScore && template.spamScore > 60) {
    recommendations.push({
      type: 'deliverability',
      priority: 'high',
      suggestion: 'Reduce spam score to improve email deliverability',
      impact: 'Better inbox placement and delivery rates'
    });
  }

  return recommendations;
}

async function generateTemplateBasedSuggestions(
  campaignType: string,
  targetAudience?: string,
  industry?: string,
  performanceData?: any
) {
  const suggestions = [];

  // Top performing template suggestion
  if (performanceData?.templates?.length > 0) {
    const topTemplate = performanceData.templates[0];
    suggestions.push({
      type: 'top_performer',
      template: topTemplate.template,
      reason: `This template has the highest performance score (${topTemplate.performanceScore}/100)`,
      confidence: 'high'
    });
  }

  // Campaign type specific suggestions
  const campaignTypeSuggestions = getCampaignTypeTemplateSuggestions(campaignType);
  suggestions.push(...campaignTypeSuggestions);

  // Industry specific suggestions
  if (industry) {
    const industrySuggestions = getIndustryTemplateSuggestions(industry);
    suggestions.push(...industrySuggestions);
  }

  return suggestions;
}

function getCampaignTypeTemplateSuggestions(campaignType: string) {
  const suggestions = {
    'newsletter': [
      {
        type: 'layout',
        suggestion: 'Use a multi-column layout for newsletter content',
        reason: 'Newsletters perform better with organized, scannable content'
      }
    ],
    'promotional': [
      {
        type: 'urgency',
        suggestion: 'Include urgency elements and clear value propositions',
        reason: 'Promotional emails need strong motivators for action'
      }
    ],
    'welcome': [
      {
        type: 'onboarding',
        suggestion: 'Use progressive disclosure and clear next steps',
        reason: 'Welcome emails should guide users through initial experience'
      }
    ],
    'transactional': [
      {
        type: 'clarity',
        suggestion: 'Focus on clarity and transaction details',
        reason: 'Transactional emails should be clear and informative'
      }
    ]
  };

  return suggestions[campaignType] || [];
}

function getIndustryTemplateSuggestions(industry: string) {
  const suggestions = {
    'technology': [
      {
        type: 'modern_design',
        suggestion: 'Use clean, modern design with tech-focused imagery',
        reason: 'Tech industry audiences expect modern, professional designs'
      }
    ],
    'healthcare': [
      {
        type: 'trust_signals',
        suggestion: 'Include trust signals and compliance information',
        reason: 'Healthcare requires high trust and regulatory compliance'
      }
    ],
    'finance': [
      {
        type: 'security',
        suggestion: 'Emphasize security and data protection',
        reason: 'Finance industry values security and trust above all'
      }
    ],
    'retail': [
      {
        type: 'visual_products',
        suggestion: 'Use high-quality product images and clear pricing',
        reason: 'Retail emails should showcase products visually'
      }
    ]
  };

  return suggestions[industry] || [];
}

function generateSuggestionReasoning(suggestions: any[], performanceData?: any) {
  const reasoning = [];

  if (performanceData?.analytics?.averagePerformanceScore) {
    const avgScore = performanceData.analytics.averagePerformanceScore;
    if (avgScore < 50) {
      reasoning.push('Your templates have below-average performance. Focus on improving open and click rates.');
    } else if (avgScore > 80) {
      reasoning.push('Your templates perform well. Consider A/B testing minor variations for optimization.');
    }
  }

  return reasoning;
}

async function generateAlternativeTemplates(campaignType: string, industry?: string) {
  // This would normally query a template database
  const alternatives = [
    {
      name: `${campaignType.charAt(0).toUpperCase() + campaignType.slice(1)} Template A`,
      description: `Clean, professional template optimized for ${campaignType} campaigns`,
      expectedPerformance: 'High open rates, moderate click rates'
    },
    {
      name: `${campaignType.charAt(0).toUpperCase() + campaignType.slice(1)} Template B`,
      description: `Modern, visual template with strong CTAs`,
      expectedPerformance: 'Moderate open rates, high click rates'
    }
  ];

  if (industry) {
    alternatives.push({
      name: `${industry.charAt(0).toUpperCase() + industry.slice(1)} Industry Template`,
      description: `Industry-specific template optimized for ${industry}`,
      expectedPerformance: 'Optimized for industry standards'
    });
  }

  return alternatives;
}

async function calculateIndustryAveragePerformance(ctx: any, template: any, industry: string) {
  // This would calculate average performance across the industry
  // For now, return mock data
  return {
    avgOpenRate: 22.5,
    avgClickRate: 3.2,
    avgEngagementScore: 65
  };
}

async function generateIndustryInsights(industry: string) {
  const insights = {
    'technology': {
      bestSendTimes: ['Tuesday 10 AM', 'Wednesday 2 PM', 'Thursday 9 AM'],
      topSubjectLines: ['New feature update', 'Technical insights', 'Product announcement'],
      avgMetrics: { openRate: 24.2, clickRate: 4.1 }
    },
    'healthcare': {
      bestSendTimes: ['Monday 9 AM', 'Wednesday 11 AM', 'Friday 3 PM'],
      topSubjectLines: ['Health updates', 'Patient care', 'Medical insights'],
      avgMetrics: { openRate: 26.8, clickRate: 3.7 }
    },
    'finance': {
      bestSendTimes: ['Tuesday 8 AM', 'Thursday 10 AM', 'Friday 9 AM'],
      topSubjectLines: ['Market update', 'Financial insights', 'Investment opportunity'],
      avgMetrics: { openRate: 21.5, clickRate: 2.9 }
    }
  };

  return insights[industry] || {
    bestSendTimes: ['Tuesday 10 AM', 'Wednesday 2 PM', 'Thursday 11 AM'],
    topSubjectLines: ['Updates', 'News', 'Insights'],
    avgMetrics: { openRate: 22.0, clickRate: 3.5 }
  };
}

function getIndustryBestPractices(industry: string) {
  const practices = {
    'technology': [
      'Use technical terminology appropriately',
      'Include feature screenshots and demos',
      'Focus on innovation and efficiency benefits',
      'Provide clear documentation links'
    ],
    'healthcare': [
      'Ensure HIPAA compliance in all communications',
      'Use professional, trustworthy tone',
      'Include relevant certifications and credentials',
      'Focus on patient outcomes and safety'
    ],
    'finance': [
      'Emphasize security and data protection',
      'Include regulatory compliance information',
      'Use professional, conservative design',
      'Provide clear risk disclosures'
    ]
  };

  return practices[industry] || [
    'Maintain professional tone and design',
    'Focus on clear value propositions',
    'Use industry-appropriate language',
    'Include relevant contact information'
  ];
}

async function analyzeVariationPotential(template: any, variation: any) {
  const analysis = {
    feasibility: 'high',
    estimatedImpact: 'medium',
    riskLevel: 'low',
    implementationComplexity: 'low'
  };

  switch (variation.type) {
    case 'subject':
      analysis.estimatedImpact = 'high';
      analysis.feasibility = 'high';
      break;
    case 'cta':
      analysis.estimatedImpact = 'high';
      analysis.implementationComplexity = 'medium';
      break;
    case 'layout':
      analysis.estimatedImpact = 'medium';
      analysis.implementationComplexity = 'high';
      analysis.riskLevel = 'medium';
      break;
  }

  return analysis;
}

async function predictVariationImpact(template: any, variation: any) {
  // This would use ML models in a real implementation
  const baseImpact = {
    subject: { openRate: 15, clickRate: 0 },
    content: { openRate: 5, clickRate: 10 },
    cta: { openRate: 0, clickRate: 20 },
    layout: { openRate: 8, clickRate: 12 }
  };

  return baseImpact[variation.type] || { openRate: 5, clickRate: 5 };
}

function calculateConfidenceScore(template: any, variation: any) {
  let confidence = 70; // Base confidence

  // Increase confidence based on template usage
  if (template.usageCount && template.usageCount > 10) {
    confidence += 15;
  }

  // Increase confidence for well-tested variation types
  if (variation.type === 'subject' || variation.type === 'cta') {
    confidence += 10;
  }

  return Math.min(confidence, 95);
}

function generateABTestRecommendations(testAnalysis: any[]) {
  const recommendations = [];

  // Find highest impact variations
  const highImpactTests = testAnalysis
    .filter(test => test.analysis.estimatedImpact === 'high')
    .sort((a, b) => b.confidence - a.confidence);

  if (highImpactTests.length > 0) {
    recommendations.push({
      priority: 'high',
      suggestion: `Start with ${highImpactTests[0].variation.type} testing`,
      reason: 'Highest potential impact with good confidence level'
    });
  }

  // Recommend against high-risk tests for new templates
  const highRiskTests = testAnalysis.filter(test => test.analysis.riskLevel === 'high');
  if (highRiskTests.length > 0) {
    recommendations.push({
      priority: 'medium',
      suggestion: 'Avoid high-risk variations initially',
      reason: 'Build baseline performance data before complex tests'
    });
  }

  return recommendations;
}

function calculateEstimatedTestDuration(template: any) {
  const baseUsage = template.usageCount || 1;
  
  if (baseUsage < 5) {
    return '2-4 weeks'; // Need more data collection time
  } else if (baseUsage < 20) {
    return '1-2 weeks';
  } else {
    return '3-7 days'; // High usage allows faster testing
  }
}

function calculateSampleSizeRecommendation(template: any) {
  const baseUsage = template.usageCount || 1;
  
  // Statistical significance requirements
  const minSampleSize = Math.max(100, baseUsage * 10);
  
  return {
    minimum: minSampleSize,
    recommended: minSampleSize * 2,
    optimal: minSampleSize * 3,
    reasoning: 'Based on statistical significance requirements and template usage history'
  };
}
