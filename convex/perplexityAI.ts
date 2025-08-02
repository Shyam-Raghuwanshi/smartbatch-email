import { action } from "./_generated/server";
import { v } from "convex/values";

// Perplexity AI integration for SmartBatch Email
export const analyzeEmailWithAI = action({
  args: {
    content: v.string(),
    subject: v.optional(v.string()),
    analysisType: v.union(
      v.literal("spam_score"),
      v.literal("optimization"),
      v.literal("content_suggestions"),
      v.literal("subject_line_analysis")
    ),
    context: v.optional(v.object({
      campaignType: v.optional(v.string()),
      targetAudience: v.optional(v.string()),
      previousPerformance: v.optional(v.any())
    }))
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      throw new Error("Perplexity API key not configured");
    }

    let prompt = "";
    
    // Build prompt based on analysis type
    switch (args.analysisType) {
      case "spam_score":
        prompt = `Analyze this email for spam indicators and deliverability issues. Provide a score from 0-100 (0 being high spam risk, 100 being excellent deliverability) and specific recommendations.

Subject: ${args.subject || "No subject"}
Content: ${args.content}

Please provide:
1. Spam score (0-100)
2. Risk level (low/medium/high)
3. Specific issues found
4. Actionable recommendations to improve deliverability`;
        break;
        
      case "optimization":
        prompt = `Analyze this email for performance optimization opportunities. Focus on engagement, click-through rates, and conversion potential.

Subject: ${args.subject || "No subject"}
Content: ${args.content}
Campaign Type: ${args.context?.campaignType || "General"}
Target Audience: ${args.context?.targetAudience || "General"}

Please provide:
1. Overall optimization score (0-100)
2. Subject line effectiveness
3. CTA placement and effectiveness
4. Content readability and engagement
5. Mobile responsiveness concerns
6. Specific improvement recommendations`;
        break;
        
      case "content_suggestions":
        prompt = `Generate AI-powered content suggestions to improve this email's effectiveness.

Subject: ${args.subject || "No subject"}
Content: ${args.content}
Campaign Type: ${args.context?.campaignType || "General"}
Target Audience: ${args.context?.targetAudience || "General"}

Please provide:
1. Alternative subject line suggestions (3-5 options)
2. Content structure improvements
3. Personalization opportunities
4. Call-to-action optimization
5. Additional content ideas that would enhance engagement`;
        break;
        
      case "subject_line_analysis":
        prompt = `Analyze this email subject line for effectiveness and provide alternatives.

Subject: ${args.subject || "No subject"}
Campaign Type: ${args.context?.campaignType || "General"}
Target Audience: ${args.context?.targetAudience || "General"}

Please provide:
1. Subject line effectiveness score (0-100)
2. Analysis of current subject line strengths/weaknesses
3. 5 alternative subject line options
4. A/B testing recommendations
5. Best practices specific to the campaign type`;
        break;
    }

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "sonar-pro",
          messages: [
            { 
              role: "system", 
              content: "You are an expert email marketing specialist with deep knowledge of deliverability, engagement optimization, and email best practices. Provide detailed, actionable insights based on current industry standards and proven strategies."
            },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;

      if (!aiResponse) {
        throw new Error("No response from Perplexity AI");
      }

      // Parse the response and return structured data
      return {
        success: true,
        analysisType: args.analysisType,
        response: aiResponse,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error("Perplexity AI error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        analysisType: args.analysisType,
        timestamp: Date.now()
      };
    }
  }
});

export const generateEmailContent = action({
  args: {
    campaignType: v.string(),
    targetAudience: v.string(),
    businessContext: v.optional(v.string()),
    productService: v.optional(v.string()),
    tone: v.optional(v.string()),
    length: v.optional(v.union(v.literal("short"), v.literal("medium"), v.literal("long")))
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      throw new Error("Perplexity API key not configured");
    }

    const prompt = `Generate a complete email campaign for the following requirements:

Campaign Type: ${args.campaignType}
Target Audience: ${args.targetAudience}
Business Context: ${args.businessContext || "General business"}
Product/Service: ${args.productService || "General offering"}
Tone: ${args.tone || "Professional"}
Length: ${args.length || "medium"}

Please provide:
1. 3 compelling subject line options
2. Complete email content (HTML structure not needed, just content)
3. Clear call-to-action suggestions
4. Personalization recommendations
5. A/B testing variations to consider

Focus on conversion optimization, engagement, and deliverability best practices.`;

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "sonar-pro",
          messages: [
            { 
              role: "system", 
              content: "You are an expert email marketing copywriter specializing in high-converting email campaigns. Create engaging, persuasive content that drives action while maintaining professionalism and avoiding spam triggers."
            },
            { role: "user", content: prompt }
          ],
          temperature: 0.8,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;

      if (!aiResponse) {
        throw new Error("No response from Perplexity AI");
      }

      return {
        success: true,
        content: aiResponse,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error("Perplexity AI error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: Date.now()
      };
    }
  }
});
