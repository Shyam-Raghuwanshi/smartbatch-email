import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Enhanced template processing with personalization
 */
export const processEmailTemplate = internalMutation({
  args: {
    templateId: v.id("templates"),
    recipient: v.string(),
    variables: v.record(v.string(), v.any()),
    baseUrl: v.string(),
  },
  handler: async (ctx: any, args: any): Promise<any> => {
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // Get contact information for personalization
    const contact = await ctx.db
      .query("contacts")
      .filter((q: any) => q.eq(q.field("email"), args.recipient))
      .first();

    // Build variables with contact data and custom variables
    const allVariables = {
      ...args.variables,
      email: args.recipient,
      firstName: contact?.firstName || "",
      lastName: contact?.lastName || "",
      fullName: contact?.firstName && contact?.lastName 
        ? `${contact.firstName} ${contact.lastName}`
        : contact?.firstName || contact?.lastName || "",
      company: contact?.company || "",
      position: contact?.position || "",
      ...contact?.customFields,
    };

    // Process template content
    let htmlContent = template.htmlContent || template.content;
    let textContent = template.content;
    let subject = template.subject;

    // Replace variables
    for (const [key, value] of Object.entries(allVariables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      htmlContent = htmlContent.replace(regex, String(value));
      textContent = textContent.replace(regex, String(value));
      subject = subject.replace(regex, String(value));
    }

    // Add tracking pixels and convert links for click tracking
    const emailId = crypto.randomUUID();
    
    // Add open tracking pixel
    const trackingPixel = `<img src="${args.baseUrl}/track/open/${emailId}" width="1" height="1" style="display:none;" />`;
    if (htmlContent.includes('</body>')) {
      htmlContent = htmlContent.replace('</body>', trackingPixel + '</body>');
    } else {
      htmlContent += trackingPixel;
    }

    // Convert links for click tracking
    htmlContent = convertLinksForTracking(htmlContent, emailId, args.baseUrl);

    return {
      subject,
      htmlContent,
      textContent,
      trackingId: emailId,
    };
  },
});

/**
 * Validate email template
 */
export const validateEmailTemplate = query({
  args: {
    templateId: v.id("templates"),
    testVariables: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    const issues = [];
    const warnings = [];

    // Check for required variables
    const requiredVars = extractVariables(template.content);
    const subjectVars = extractVariables(template.subject);
    const htmlVars = template.htmlContent ? extractVariables(template.htmlContent) : [];
    
    const allRequiredVars = [...new Set([...requiredVars, ...subjectVars, ...htmlVars])];
    const providedVars = Object.keys(args.testVariables || {});

    for (const variable of allRequiredVars) {
      if (!providedVars.includes(variable)) {
        issues.push(`Missing variable: ${variable}`);
      }
    }

    // Check for common issues
    if (template.subject.length > 100) {
      warnings.push("Subject line is very long (over 100 characters)");
    }

    if (template.subject.includes('{{') && template.subject.includes('}}')) {
      const unreplacedVars = template.subject.match(/{{[^}]+}}/g);
      if (unreplacedVars && args.testVariables) {
        warnings.push("Subject contains unprocessed variables");
      }
    }

    // Check HTML validity if present
    if (template.htmlContent) {
      if (!template.htmlContent.includes('<html>') && !template.htmlContent.includes('<body>')) {
        warnings.push("HTML template should include proper HTML structure");
      }
    }

    // Test rendering with provided variables
    let renderedContent = "";
    let renderedSubject = "";
    
    if (args.testVariables) {
      renderedContent = processTemplateString(template.content, args.testVariables);
      renderedSubject = processTemplateString(template.subject, args.testVariables);
    }

    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      requiredVariables: allRequiredVars,
      renderedContent: args.testVariables ? renderedContent : null,
      renderedSubject: args.testVariables ? renderedSubject : null,
    };
  },
});

/**
 * Preview email template
 */
export const previewEmailTemplate = query({
  args: {
    templateId: v.id("templates"),
    variables: v.record(v.string(), v.any()),
    recipientEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // Get contact data if recipient email provided
    let contactData = {};
    if (args.recipientEmail) {
      const contact = await ctx.db
        .query("contacts")
        .filter((q) => q.eq(q.field("email"), args.recipientEmail))
        .first();
      
      if (contact) {
        contactData = {
          firstName: contact.firstName || "",
          lastName: contact.lastName || "",
          company: contact.company || "",
          position: contact.position || "",
          ...contact.customFields,
        };
      }
    }

    // Merge variables
    const allVariables = {
      ...args.variables,
      email: args.recipientEmail || "example@email.com",
      ...contactData,
    };

    // Process content
    const htmlContent = template.htmlContent 
      ? processTemplateString(template.htmlContent, allVariables)
      : processTemplateString(template.content, allVariables);
    
    const textContent = processTemplateString(template.content, allVariables);
    const subject = processTemplateString(template.subject, allVariables);

    return {
      subject,
      htmlContent,
      textContent,
      variables: allVariables,
    };
  },
});

// Helper functions
function extractVariables(content: string): string[] {
  const variables: string[] = [];
  
  // Extract {{variable}} format
  const doubleRegex = /{{([^}]+)}}/g;
  let match;
  while ((match = doubleRegex.exec(content)) !== null) {
    const variable = match[1].trim();
    if (!variables.includes(variable)) {
      variables.push(variable);
    }
  }
  
  // Extract {variable} format (single braces)
  const singleRegex = /{([^}]+)}/g;
  while ((match = singleRegex.exec(content)) !== null) {
    const variable = match[1].trim();
    // Avoid duplicates and only add if it's a simple variable name (no spaces or special chars except underscore)
    if (!variables.includes(variable) && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(variable)) {
      variables.push(variable);
    }
  }
  
  return variables;
}

function processTemplateString(template: string, variables: Record<string, any>): string {
  let processed = template;
  
  for (const [key, value] of Object.entries(variables)) {
    // Handle both {{variable}} and {variable} formats for backward compatibility
    const doubleRegex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    const singleRegex = new RegExp(`{\\s*${key}\\s*}`, 'g');
    
    processed = processed.replace(doubleRegex, String(value));
    processed = processed.replace(singleRegex, String(value));
  }
  
  return processed;
}

function convertLinksForTracking(htmlContent: string, emailId: string, baseUrl: string): string {
  // Convert all links to tracking links
  const linkRegex = /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi;
  
  return htmlContent.replace(linkRegex, (match, url) => {
    // Skip tracking links and unsubscribe links
    if (url.includes('/track/') || url.includes('/unsubscribe')) {
      return match;
    }
    
    const trackingUrl = `${baseUrl}/track/click/${emailId}?url=${encodeURIComponent(url)}`;
    return match.replace(url, trackingUrl);
  });
}
