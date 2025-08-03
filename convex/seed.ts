import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Seed sample data for testing
export const seedSampleData = mutation({
  handler: async (ctx) => {
    // Create global templates available for all users
    const template1 = await ctx.db.insert("templates", {
      userId: undefined, // undefined makes it a global/system template
      name: "Professional Welcome Email",
      subject: "🎉 Welcome to {companyName}, {name}!",
      content: `<!DOCTYPE html>
<html>
<head>
  <style>
    .email-container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
    .content { padding: 30px 20px; background: #ffffff; }
    .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Welcome, {name}!</h1>
      <p>We're thrilled to have you join our community</p>
    </div>
    <div class="content">
      <h2>Get Started in 3 Easy Steps:</h2>
      <ol>
        <li><strong>Complete your profile</strong> - Add your details to personalize your experience</li>
        <li><strong>Explore features</strong> - Discover what makes our platform special</li>
        <li><strong>Connect with others</strong> - Join our vibrant community</li>
      </ol>
      <a href="{onboardingUrl}" class="button">Get Started Now</a>
      <p>If you have any questions, our support team is here to help 24/7.</p>
    </div>
    <div class="footer">
      <p>Best regards,<br>The {companyName} Team</p>
    </div>
  </div>
</body>
</html>`,
      category: "Welcome",
      tags: ["welcome", "onboarding", "professional"],
      variables: ["name", "companyName", "onboardingUrl"],
      isDefault: true, // Mark as default/system template
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0,
    });

    const template2 = await ctx.db.insert("templates", {
      userId: undefined, // undefined makes it a global/system template
      name: "Modern Newsletter Template",
      subject: "📧 {newsletterTitle} - {date}",
      content: `<!DOCTYPE html>
<html>
<head>
  <style>
    .newsletter { font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 650px; margin: 0 auto; }
    .header { background: #2c3e50; color: white; padding: 30px; text-align: center; }
    .section { background: white; margin: 20px 0; padding: 25px; border-left: 4px solid #3498db; }
    .highlight { background: #ecf0f1; padding: 15px; border-radius: 8px; margin: 15px 0; }
    .cta-button { background: #e74c3c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
  </style>
</head>
<body>
  <div class="newsletter">
    <div class="header">
      <h1>{newsletterTitle}</h1>
      <p>{date}</p>
    </div>
    <div class="section">
      <h2>🚀 What's New This Week</h2>
      <div class="highlight">
        <h3>Feature Spotlight: {featureName}</h3>
        <p>{featureDescription}</p>
      </div>
      <ul>
        <li>Enhanced user interface improvements</li>
        <li>Performance optimizations</li>
        <li>New integration capabilities</li>
      </ul>
    </div>
    <div class="section">
      <h2>📈 Community Highlights</h2>
      <p>Our community reached {milestoneNumber} active users this week! Thank you for being part of our journey.</p>
    </div>
    <div class="section" style="text-align: center;">
      <h2>💡 Weekly Tip</h2>
      <p>{weeklyTip}</p>
      <a href="{learnMoreUrl}" class="cta-button">Learn More</a>
    </div>
  </div>
</body>
</html>`,
      category: "Newsletter",
      tags: ["newsletter", "updates", "modern"],
      variables: ["name", "date", "newsletterTitle", "featureName", "featureDescription", "milestoneNumber", "weeklyTip", "learnMoreUrl"],
      isDefault: true, // Mark as default/system template
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0,
    });

    const template3 = await ctx.db.insert("templates", {
      userId: undefined, // undefined makes it a global/system template
      name: "Promotional Campaign",
      subject: "🔥 Limited Time: {discountPercent}% OFF {productName}",
      content: `<!DOCTYPE html>
<html>
<head>
  <style>
    .promo-email { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; }
    .promo-header { background: linear-gradient(45deg, #ff6b6b, #ee5a24); color: white; padding: 40px 20px; text-align: center; }
    .discount-badge { background: #feca57; color: #2f3542; padding: 20px; border-radius: 50%; display: inline-block; font-size: 24px; font-weight: bold; margin: 20px 0; }
    .product-section { padding: 30px 20px; text-align: center; }
    .urgency { background: #ff4757; color: white; padding: 15px; text-align: center; font-weight: bold; }
    .cta-large { background: #2ed573; color: white; padding: 20px 40px; font-size: 18px; text-decoration: none; border-radius: 30px; display: inline-block; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="promo-email">
    <div class="promo-header">
      <h1>FLASH SALE ALERT!</h1>
      <div class="discount-badge">{discountPercent}% OFF</div>
      <h2>{productName}</h2>
    </div>
    <div class="urgency">
      ⏰ Offer expires in {timeRemaining} - Don't miss out!
    </div>
    <div class="product-section">
      <h3>Hey {name},</h3>
      <p>This is your chance to grab {productName} at an incredible discount!</p>
      <p><strike>Regular Price: {originalPrice}</strike></p>
      <p><strong>Sale Price: {salePrice}</strong></p>
      <p>You save: {savings}</p>
      <a href="{shopUrl}" class="cta-large">Shop Now</a>
      <p><small>Use code: {promoCode} at checkout</small></p>
    </div>
  </div>
</body>
</html>`,
      category: "Promotional",
      tags: ["promotion", "sale", "discount", "marketing"],
      variables: ["name", "discountPercent", "productName", "timeRemaining", "originalPrice", "salePrice", "savings", "shopUrl", "promoCode"],
      isDefault: true, // Mark as default/system template
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0,
    });

    const template4 = await ctx.db.insert("templates", {
      userId: undefined, // undefined makes it a global/system template
      name: "Event Invitation",
      subject: "🎪 You're Invited: {eventName} on {eventDate}",
      content: `<!DOCTYPE html>
<html>
<head>
  <style>
    .event-invite { font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; }
    .event-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 50px 20px; text-align: center; }
    .event-details { background: white; padding: 40px 30px; }
    .detail-row { display: flex; margin: 15px 0; }
    .detail-label { font-weight: bold; width: 100px; }
    .rsvp-section { background: #e3f2fd; padding: 30px; text-align: center; }
    .rsvp-button { background: #1976d2; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-size: 16px; }
  </style>
</head>
<body>
  <div class="event-invite">
    <div class="event-header">
      <h1>🎉 {eventName}</h1>
      <p>Join us for an unforgettable experience</p>
    </div>
    <div class="event-details">
      <h2>Dear {name},</h2>
      <p>We're excited to invite you to {eventName}! This {eventType} promises to be an amazing experience.</p>
      
      <h3>Event Details:</h3>
      <div class="detail-row">
        <span class="detail-label">📅 Date:</span>
        <span>{eventDate}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">🕐 Time:</span>
        <span>{eventTime}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">📍 Location:</span>
        <span>{eventLocation}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">👥 Capacity:</span>
        <span>{capacity} attendees</span>
      </div>
      
      <h3>What to Expect:</h3>
      <ul>
        <li>{highlight1}</li>
        <li>{highlight2}</li>
        <li>{highlight3}</li>
      </ul>
    </div>
    <div class="rsvp-section">
      <h3>Ready to Join Us?</h3>
      <a href="{rsvpUrl}" class="rsvp-button">RSVP Now</a>
      <p><small>Please RSVP by {rsvpDeadline}</small></p>
    </div>
  </div>
</body>
</html>`,
      category: "Event",
      tags: ["event", "invitation", "rsvp"],
      variables: ["name", "eventName", "eventDate", "eventTime", "eventLocation", "eventType", "capacity", "highlight1", "highlight2", "highlight3", "rsvpUrl", "rsvpDeadline"],
      isDefault: true, // Mark as default/system template
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0,
    });

    const template5 = await ctx.db.insert("templates", {
      userId: undefined, // undefined makes it a global/system template
      name: "Password Reset",
      subject: "🔒 Reset Your Password - {companyName}",
      content: `<!DOCTYPE html>
<html>
<head>
  <style>
    .security-email { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 550px; margin: 0 auto; }
    .security-header { background: #dc3545; color: white; padding: 30px 20px; text-align: center; }
    .content-box { background: white; padding: 30px; border: 1px solid #dee2e6; }
    .security-notice { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .reset-button { background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
    .expiry-notice { color: #6c757d; font-size: 14px; }
  </style>
</head>
<body>
  <div class="security-email">
    <div class="security-header">
      <h1>🔒 Password Reset Request</h1>
    </div>
    <div class="content-box">
      <h2>Hi {name},</h2>
      <p>We received a request to reset your password for your {companyName} account.</p>
      
      <div class="security-notice">
        <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your account is still secure.
      </div>
      
      <p>To reset your password, click the button below:</p>
      <a href="{resetUrl}" class="reset-button">Reset My Password</a>
      
      <p class="expiry-notice">This link will expire in {expiryTime} for security reasons.</p>
      
      <h3>Security Tips:</h3>
      <ul>
        <li>Use a strong, unique password</li>
        <li>Enable two-factor authentication</li>
        <li>Never share your password with anyone</li>
      </ul>
      
      <p>If you're having trouble with the button, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #007bff;">{resetUrl}</p>
    </div>
  </div>
</body>
</html>`,
      category: "Security",
      tags: ["security", "password", "reset", "authentication"],
      variables: ["name", "companyName", "resetUrl", "expiryTime"],
      isDefault: true, // Mark as default/system template
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0,
    });

    const template6 = await ctx.db.insert("templates", {
      userId: undefined, // undefined makes it a global/system template
      name: "Thank You & Follow-up",
      subject: "Thank you, {name}! Here's what's next 🙏",
      content: `<!DOCTYPE html>
<html>
<head>
  <style>
    .thank-you-email { font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; }
    .gratitude-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
    .content-section { background: white; padding: 35px 25px; }
    .next-steps { background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 25px 0; }
    .step { margin: 15px 0; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid #28a745; }
    .contact-info { background: #e7f3ff; padding: 20px; border-radius: 8px; text-align: center; }
  </style>
</head>
<body>
  <div class="thank-you-email">
    <div class="gratitude-header">
      <h1>🎉 Thank You, {name}!</h1>
      <p>Your {actionType} means the world to us</p>
    </div>
    <div class="content-section">
      <h2>We're Grateful!</h2>
      <p>Thank you for {specificAction}. Your trust and support help us continue to {companyMission}.</p>
      
      <div class="next-steps">
        <h3>🚀 What Happens Next?</h3>
        <div class="step">
          <strong>Step 1:</strong> {nextStep1}
        </div>
        <div class="step">
          <strong>Step 2:</strong> {nextStep2}
        </div>
        <div class="step">
          <strong>Step 3:</strong> {nextStep3}
        </div>
      </div>
      
      <h3>📋 Your Details:</h3>
      <ul>
        <li><strong>Reference:</strong> {referenceNumber}</li>
        <li><strong>Date:</strong> {transactionDate}</li>
        <li><strong>Status:</strong> {status}</li>
      </ul>
      
      <div class="contact-info">
        <h3>💬 Need Help?</h3>
        <p>Our support team is here for you!</p>
        <p>📧 Email: {supportEmail}</p>
        <p>📞 Phone: {supportPhone}</p>
        <p>💬 Live Chat: {websiteUrl}</p>
      </div>
    </div>
  </div>
</body>
</html>`,
      category: "Follow-up",
      tags: ["thank-you", "follow-up", "customer-service"],
      variables: ["name", "actionType", "specificAction", "companyMission", "nextStep1", "nextStep2", "nextStep3", "referenceNumber", "transactionDate", "status", "supportEmail", "supportPhone", "websiteUrl"],
      isDefault: true, // Mark as default/system template
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0,
    });

    const template7 = await ctx.db.insert("templates", {
      userId: undefined, // undefined makes it a global/system template
      name: "Survey & Feedback Request",
      subject: "📊 Help us improve: 2-minute feedback survey",
      content: `<!DOCTYPE html>
<html>
<head>
  <style>
    .survey-email { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; }
    .survey-header { background: #6c5ce7; color: white; padding: 35px 20px; text-align: center; }
    .survey-content { background: white; padding: 30px 25px; }
    .survey-cta { background: #00b894; color: white; padding: 18px 35px; text-decoration: none; border-radius: 25px; display: inline-block; font-size: 16px; margin: 20px 0; }
    .incentive-box { background: #fdcb6e; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; }
    .questions-preview { background: #f1f2f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="survey-email">
    <div class="survey-header">
      <h1>📊 Your Opinion Matters!</h1>
      <p>Help us serve you better</p>
    </div>
    <div class="survey-content">
      <h2>Hi {name},</h2>
      <p>We hope you're enjoying your experience with {companyName}! Your feedback is incredibly valuable to us and helps shape the future of our {productService}.</p>
      
      <div class="incentive-box">
        <h3>🎁 Quick Survey Reward</h3>
        <p>Complete our 2-minute survey and get {incentive}!</p>
      </div>
      
      <div class="questions-preview">
        <h3>What we'll ask about:</h3>
        <ul>
          <li>Overall satisfaction with {productService}</li>
          <li>Features you find most valuable</li>
          <li>Areas where we can improve</li>
          <li>Likelihood to recommend us</li>
        </ul>
      </div>
      
      <div style="text-align: center;">
        <a href="{surveyUrl}" class="survey-cta">Take 2-Minute Survey</a>
      </div>
      
      <p><strong>Why your feedback matters:</strong></p>
      <ul>
        <li>✨ Help us improve our {productService}</li>
        <li>🚀 Influence new features and updates</li>
        <li>💡 Share ideas for better user experience</li>
        <li>🤝 Build a product that truly serves your needs</li>
      </ul>
      
      <p><small>This survey will take approximately {estimatedTime} to complete and will remain open until {surveyDeadline}.</small></p>
    </div>
  </div>
</body>
</html>`,
      category: "Survey",
      tags: ["survey", "feedback", "customer-research"],
      variables: ["name", "companyName", "productService", "incentive", "surveyUrl", "estimatedTime", "surveyDeadline"],
      isDefault: true, // Mark as default/system template
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0,
    });

    // Since templates are now global, we can skip creating sample contacts and campaigns
    // or create them only if a user is provided for testing purposes

    return {
      message: "Global email templates created successfully! These templates are now available to all users.",
      data: {
        templates: [template1, template2, template3, template4, template5, template6, template7],
        message: "Templates are now global and available to all users"
      },
    };
  },
});
