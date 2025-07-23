import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { internal } from "./_generated/api";

// Spam score analysis functions
export const analyzeSpamScore = action({
  args: {
    subject: v.string(),
    content: v.string(),
    fromName: v.optional(v.string()),
    fromEmail: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Spam score calculation algorithm
    let spamScore = 0;
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Subject line analysis
    const subjectSpam = analyzeSubjectLine(args.subject);
    spamScore += subjectSpam.score;
    issues.push(...subjectSpam.issues);
    suggestions.push(...subjectSpam.suggestions);

    // Content analysis
    const contentSpam = analyzeContent(args.content);
    spamScore += contentSpam.score;
    issues.push(...contentSpam.issues);
    suggestions.push(...contentSpam.suggestions);

    // From name/email analysis
    if (args.fromName || args.fromEmail) {
      const fromSpam = analyzeFromFields(args.fromName, args.fromEmail);
      spamScore += fromSpam.score;
      issues.push(...fromSpam.issues);
      suggestions.push(...fromSpam.suggestions);
    }

    return {
      spamScore: Math.min(Math.max(spamScore, 0), 100),
      riskLevel: spamScore < 30 ? 'low' : spamScore < 60 ? 'medium' : 'high',
      issues,
      suggestions,
      blacklistedWords: findBlacklistedWords(args.subject + ' ' + args.content),
      analysis: {
        subjectScore: subjectSpam.score,
        contentScore: contentSpam.score,
        fromScore: args.fromName || args.fromEmail ? analyzeFromFields(args.fromName, args.fromEmail).score : 0
      }
    };
  }
});

export const getSpamWordsList = query({
  args: {},
  handler: async (ctx) => {
    return {
      highRisk: [
        'free', 'urgent', 'limited time', 'act now', 'click here', 'buy now',
        'make money', 'earn cash', 'guarantee', 'no obligation', 'risk free',
        'winner', 'congratulations', 'selected', 'exclusive', 'secret',
        'viagra', 'casino', 'lottery', 'inheritance', 'million dollars'
      ],
      mediumRisk: [
        'discount', 'save', 'offer', 'deal', 'promotion', 'subscribe',
        'unsubscribe', 'newsletter', 'update', 'confirmation', 'verify'
      ],
      commonTriggers: [
        'ALL CAPS WORDS', 'Multiple!!!Exclamations', 'Excessive$$$Symbols',
        'Poor.grammar..and,punctuation', 'Suspicious_underscores'
      ]
    };
  }
});

// Helper functions for spam analysis
function analyzeSubjectLine(subject: string) {
  let score = 0;
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Length check
  if (subject.length < 10) {
    score += 10;
    issues.push('Subject line is too short');
    suggestions.push('Use subject lines between 30-50 characters for better engagement');
  } else if (subject.length > 60) {
    score += 5;
    issues.push('Subject line might be truncated in some email clients');
    suggestions.push('Keep subject lines under 60 characters');
  }

  // All caps check
  if (subject === subject.toUpperCase() && subject.length > 5) {
    score += 15;
    issues.push('Subject line is in ALL CAPS');
    suggestions.push('Use normal capitalization to avoid spam filters');
  }

  // Excessive punctuation
  const exclamationCount = (subject.match(/!/g) || []).length;
  if (exclamationCount > 1) {
    score += exclamationCount * 5;
    issues.push(`Excessive exclamation marks (${exclamationCount})`);
    suggestions.push('Limit exclamation marks to one or none');
  }

  // Spam words in subject
  const spamWords = findSpamWordsInText(subject);
  score += spamWords.highRisk * 8 + spamWords.mediumRisk * 3;
  if (spamWords.highRisk > 0) {
    issues.push(`Contains ${spamWords.highRisk} high-risk spam words`);
    suggestions.push('Replace promotional language with more natural phrasing');
  }

  return { score, issues, suggestions };
}

function analyzeContent(content: string) {
  let score = 0;
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Content length
  if (content.length < 50) {
    score += 10;
    issues.push('Email content is very short');
    suggestions.push('Add more valuable content to improve engagement');
  }

  // HTML to text ratio (if HTML content)
  if (content.includes('<') && content.includes('>')) {
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    const htmlLength = content.length;
    const textLength = textContent.length;
    
    if (textLength / htmlLength < 0.1) {
      score += 20;
      issues.push('Very low text-to-HTML ratio');
      suggestions.push('Add more actual text content relative to HTML markup');
    }
  }

  // Link analysis
  const linkMatches = content.match(/https?:\/\/[^\s<>"']+/g) || [];
  if (linkMatches.length > 10) {
    score += 15;
    issues.push(`Too many links (${linkMatches.length})`);
    suggestions.push('Reduce the number of links to focus on key actions');
  }

  // Spam words in content
  const spamWords = findSpamWordsInText(content);
  score += spamWords.highRisk * 5 + spamWords.mediumRisk * 2;
  if (spamWords.highRisk > 0) {
    issues.push(`Contains ${spamWords.highRisk} high-risk words in content`);
    suggestions.push('Use more natural, conversational language');
  }

  // Image to text ratio
  const imageCount = (content.match(/<img[^>]*>/g) || []).length;
  const textWordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  
  if (imageCount > 0 && textWordCount / imageCount < 50) {
    score += 10;
    issues.push('High image-to-text ratio');
    suggestions.push('Add more text content to balance with images');
  }

  return { score, issues, suggestions };
}

function analyzeFromFields(fromName?: string, fromEmail?: string) {
  let score = 0;
  const issues: string[] = [];
  const suggestions: string[] = [];

  if (fromName) {
    // Check for suspicious from names
    if (fromName.includes('noreply') || fromName.includes('no-reply')) {
      score += 5;
      issues.push('Using "noreply" in sender name');
      suggestions.push('Use a real person or company name as sender');
    }

    if (fromName === fromName.toUpperCase() && fromName.length > 5) {
      score += 8;
      issues.push('Sender name is in ALL CAPS');
      suggestions.push('Use normal capitalization for sender name');
    }
  }

  if (fromEmail) {
    // Check domain reputation (simplified)
    const domain = fromEmail.split('@')[1];
    if (domain && (domain.includes('temp') || domain.includes('disposable'))) {
      score += 25;
      issues.push('Using suspicious email domain');
      suggestions.push('Use a reputable business domain for sending');
    }
  }

  return { score, issues, suggestions };
}

function findSpamWordsInText(text: string) {
  const highRiskWords = [
    'free', 'urgent', 'limited time', 'act now', 'click here', 'buy now',
    'make money', 'earn cash', 'guarantee', 'no obligation', 'risk free',
    'winner', 'congratulations', 'selected', 'exclusive', 'secret',
    'viagra', 'casino', 'lottery', 'inheritance', 'million dollars'
  ];
  
  const mediumRiskWords = [
    'discount', 'save', 'offer', 'deal', 'promotion', 'subscribe',
    'newsletter', 'update', 'confirmation', 'verify', 'special'
  ];

  const lowerText = text.toLowerCase();
  
  const highRiskCount = highRiskWords.filter(word => 
    lowerText.includes(word.toLowerCase())
  ).length;
  
  const mediumRiskCount = mediumRiskWords.filter(word => 
    lowerText.includes(word.toLowerCase())
  ).length;

  return { highRisk: highRiskCount, mediumRisk: mediumRiskCount };
}

function findBlacklistedWords(text: string) {
  const blacklistedWords = [
    'free', 'urgent', 'limited time', 'act now', 'click here', 'buy now',
    'make money', 'guarantee', 'winner', 'congratulations', 'selected',
    'viagra', 'casino', 'lottery', 'million dollars'
  ];

  const lowerText = text.toLowerCase();
  return blacklistedWords.filter(word => 
    lowerText.includes(word.toLowerCase())
  );
}

// Content optimization suggestions
export const getContentOptimization = action({
  args: {
    subject: v.string(),
    content: v.string(),
    targetAudience: v.optional(v.string()),
    campaignType: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const optimizations = {
      subjectLine: analyzeSubjectLineOptimization(args.subject, args.campaignType),
      emailLength: analyzeEmailLength(args.content),
      ctaPlacement: analyzeCTAPlacement(args.content),
      mobileOptimization: analyzeMobileOptimization(args.content),
      personalization: analyzePersonalizationOpportunities(args.content)
    };

    return {
      optimizations,
      overallScore: calculateOptimizationScore(optimizations),
      priorityRecommendations: getPriorityRecommendations(optimizations)
    };
  }
});

function analyzeSubjectLineOptimization(subject: string, campaignType?: string) {
  const suggestions: string[] = [];
  const score = Math.max(0, 100 - (subject.length < 30 ? 20 : 0) - (subject.length > 60 ? 15 : 0));

  if (subject.length < 30) {
    suggestions.push('Consider adding more descriptive words to your subject line');
  }
  
  if (subject.length > 60) {
    suggestions.push('Shorten your subject line to avoid truncation');
  }

  if (!subject.includes('you') && !subject.includes('your')) {
    suggestions.push('Add personal pronouns like "you" or "your" to increase engagement');
  }

  if (campaignType === 'promotional' && !subject.includes('save') && !subject.includes('discount')) {
    suggestions.push('Consider adding value proposition words for promotional emails');
  }

  return { score, suggestions };
}

function analyzeEmailLength(content: string) {
  const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  let score = 100;
  const suggestions: string[] = [];

  if (wordCount < 50) {
    score -= 30;
    suggestions.push('Email is too short - add more valuable content');
  } else if (wordCount > 500) {
    score -= 20;
    suggestions.push('Email might be too long - consider breaking into sections');
  }

  if (wordCount >= 150 && wordCount <= 300) {
    suggestions.push('Email length is optimal for engagement');
  }

  return { score, wordCount, suggestions };
}

function analyzeCTAPlacement(content: string) {
  const ctaPatterns = [
    /click here/gi,
    /buy now/gi,
    /shop now/gi,
    /learn more/gi,
    /get started/gi,
    /subscribe/gi,
    /<button[^>]*>.*?<\/button>/gi,
    /<a[^>]*class[^>]*button[^>]*>.*?<\/a>/gi
  ];

  const ctas = ctaPatterns.reduce((count, pattern) => {
    return count + (content.match(pattern) || []).length;
  }, 0);

  let score = 100;
  const suggestions: string[] = [];

  if (ctas === 0) {
    score -= 40;
    suggestions.push('Add at least one clear call-to-action button');
  } else if (ctas > 3) {
    score -= 20;
    suggestions.push('Too many CTAs - focus on one primary action');
  } else if (ctas === 1) {
    suggestions.push('Perfect! Single CTA provides clear direction');
  }

  return { score, ctaCount: ctas, suggestions };
}

function analyzeMobileOptimization(content: string) {
  let score = 100;
  const suggestions: string[] = [];

  // Check for responsive design elements
  if (!content.includes('max-width') && !content.includes('media')) {
    score -= 30;
    suggestions.push('Add responsive design CSS for mobile devices');
  }

  // Check for large images
  const imageMatches = content.match(/<img[^>]*>/g) || [];
  if (imageMatches.some(img => !img.includes('max-width') && !img.includes('width'))) {
    score -= 20;
    suggestions.push('Set maximum width for images to prevent overflow on mobile');
  }

  // Check for font sizes
  if (content.includes('font-size') && content.includes('px')) {
    const fontSizes = content.match(/font-size:\s*(\d+)px/g) || [];
    const smallFonts = fontSizes.filter(font => {
      const size = parseInt(font.match(/\d+/)?.[0] || '0');
      return size < 14;
    });
    
    if (smallFonts.length > 0) {
      score -= 15;
      suggestions.push('Use font sizes of at least 14px for mobile readability');
    }
  }

  return { score, suggestions };
}

function analyzePersonalizationOpportunities(content: string) {
  const personalizedElements = [
    /\{.*?name.*?\}/gi,
    /\{.*?firstName.*?\}/gi,
    /\{.*?company.*?\}/gi,
    /\{.*?location.*?\}/gi
  ];

  const personalizationCount = personalizedElements.reduce((count, pattern) => {
    return count + (content.match(pattern) || []).length;
  }, 0);

  let score = personalizationCount * 25;
  const suggestions: string[] = [];

  if (personalizationCount === 0) {
    suggestions.push('Add personalization tokens like {firstName} or {company}');
  } else if (personalizationCount < 3) {
    suggestions.push('Consider adding more personalization elements');
  } else {
    suggestions.push('Great use of personalization!');
  }

  return { score, personalizationCount, suggestions };
}

function calculateOptimizationScore(optimizations: any) {
  const scores = [
    optimizations.subjectLine.score,
    optimizations.emailLength.score,
    optimizations.ctaPlacement.score,
    optimizations.mobileOptimization.score,
    optimizations.personalization.score
  ];

  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function getPriorityRecommendations(optimizations: any) {
  const recommendations: { priority: string; suggestion: string; impact: string }[] = [];

  if (optimizations.ctaPlacement.score < 70) {
    recommendations.push({
      priority: 'High',
      suggestion: 'Add clear call-to-action buttons',
      impact: 'Can increase click-through rates by 20-30%'
    });
  }

  if (optimizations.subjectLine.score < 70) {
    recommendations.push({
      priority: 'High',
      suggestion: 'Optimize subject line length and content',
      impact: 'Can improve open rates by 15-25%'
    });
  }

  if (optimizations.personalization.score < 50) {
    recommendations.push({
      priority: 'Medium',
      suggestion: 'Add personalization tokens',
      impact: 'Can increase engagement by 10-20%'
    });
  }

  if (optimizations.mobileOptimization.score < 70) {
    recommendations.push({
      priority: 'Medium',
      suggestion: 'Improve mobile responsiveness',
      impact: 'Essential for 60%+ of email opens on mobile devices'
    });
  }

  return recommendations;
}
