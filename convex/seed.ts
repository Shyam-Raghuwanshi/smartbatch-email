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
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    .email-container { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
      max-width: 650px; 
      margin: 0 auto; 
      background: #f8fafc;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }
    
    .header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      padding: 60px 30px; 
      text-align: center; 
      position: relative;
      overflow: hidden;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
      background-size: 30px 30px;
      animation: float 20s linear infinite;
    }
    
    @keyframes float {
      0% { transform: translate(-50%, -50%) rotate(0deg); }
      100% { transform: translate(-50%, -50%) rotate(360deg); }
    }
    
    .header h1 { 
      font-size: 2.5rem; 
      font-weight: 700; 
      margin-bottom: 16px; 
      position: relative; 
      z-index: 1;
    }
    
    .header p { 
      font-size: 1.2rem; 
      opacity: 0.9; 
      position: relative; 
      z-index: 1;
    }
    
    .welcome-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      position: relative;
      z-index: 1;
    }
    
    .content { 
      padding: 50px 40px; 
      background: #ffffff; 
      position: relative;
    }
    
    .content h2 {
      color: #1e293b;
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 30px;
      text-align: center;
    }
    
    .steps-container {
      margin: 40px 0;
    }
    
    .step {
      display: flex;
      align-items: flex-start;
      margin-bottom: 24px;
      padding: 24px;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      border-radius: 12px;
      border-left: 4px solid #667eea;
      transition: transform 0.2s ease;
    }
    
    .step:hover {
      transform: translateX(4px);
    }
    
    .step-number {
      background: #667eea;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      margin-right: 16px;
      flex-shrink: 0;
    }
    
    .step-content h3 {
      color: #1e293b;
      font-weight: 600;
      margin-bottom: 4px;
    }
    
    .step-content p {
      color: #64748b;
      line-height: 1.5;
    }
    
    .button { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; 
      padding: 16px 40px; 
      text-decoration: none; 
      border-radius: 50px; 
      display: inline-block; 
      margin: 30px 0; 
      font-weight: 600;
      font-size: 1.1rem;
      box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
      transition: all 0.3s ease;
      text-align: center;
      width: 100%;
      max-width: 300px;
    }
    
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
    }
    
    .button-container {
      text-align: center;
      margin: 40px 0;
    }
    
    .support-note {
      background: #f1f5f9;
      padding: 24px;
      border-radius: 12px;
      border-left: 4px solid #0ea5e9;
      margin-top: 30px;
    }
    
    .support-note p {
      color: #475569;
      line-height: 1.6;
      margin: 0;
    }
    
    .footer { 
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      color: white;
      padding: 40px 30px; 
      text-align: center;
    }
    
    .footer p {
      margin: 0;
      opacity: 0.9;
      line-height: 1.6;
    }
    
    @media (max-width: 640px) {
      .email-container { margin: 10px; }
      .header { padding: 40px 20px; }
      .header h1 { font-size: 2rem; }
      .content { padding: 30px 20px; }
      .step { padding: 16px; }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="welcome-icon">🎉</div>
      <h1>Welcome, {name}!</h1>
      <p>We're thrilled to have you join our community</p>
    </div>
    <div class="content">
      <h2>🚀 Get Started in 3 Easy Steps</h2>
      <div class="steps-container">
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-content">
            <h3>Complete your profile</h3>
            <p>Add your details to personalize your experience and unlock all features</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <div class="step-content">
            <h3>Explore features</h3>
            <p>Discover what makes our platform special and how it can help you succeed</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h3>Connect with others</h3>
            <p>Join our vibrant community and start building meaningful connections</p>
          </div>
        </div>
      </div>
      <div class="button-container">
        <a href="{onboardingUrl}" class="button">Get Started Now</a>
      </div>
      <div class="support-note">
        <p>💬 <strong>Need help?</strong> Our support team is here to help 24/7. We're committed to making your experience amazing!</p>
      </div>
    </div>
    <div class="footer">
      <p>Best regards,<br><strong>The {companyName} Team</strong></p>
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
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    .newsletter { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
      max-width: 700px; 
      margin: 0 auto; 
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    
    .header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; 
      padding: 50px 40px; 
      text-align: center; 
      position: relative;
      overflow: hidden;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="10" cy="60" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="90" cy="40" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
      opacity: 0.3;
    }
    
    .newsletter-logo {
      width: 60px;
      height: 60px;
      background: rgba(255,255,255,0.2);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 2rem;
      position: relative;
      z-index: 1;
    }
    
    .header h1 { 
      font-size: 2.2rem; 
      font-weight: 700; 
      margin-bottom: 8px; 
      position: relative; 
      z-index: 1;
    }
    
    .header p { 
      opacity: 0.9; 
      font-size: 1.1rem; 
      position: relative; 
      z-index: 1;
    }
    
    .section { 
      background: white; 
      margin: 0; 
      padding: 40px 40px; 
      border-bottom: 1px solid #e2e8f0;
      position: relative;
    }
    
    .section:last-of-type {
      border-bottom: none;
      border-radius: 0 0 20px 20px;
    }
    
    .section h2 {
      color: #1e293b;
      font-size: 1.4rem;
      font-weight: 600;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .feature-highlight { 
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      padding: 32px; 
      border-radius: 16px; 
      margin: 24px 0;
      border-left: 6px solid #667eea;
      position: relative;
      overflow: hidden;
    }
    
    .feature-highlight::before {
      content: '✨';
      position: absolute;
      top: 16px;
      right: 16px;
      font-size: 1.5rem;
      opacity: 0.3;
    }
    
    .feature-highlight h3 {
      color: #1e293b;
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 12px;
    }
    
    .feature-highlight p {
      color: #475569;
      line-height: 1.6;
      margin: 0;
    }
    
    .feature-list {
      list-style: none;
      padding: 0;
      margin: 24px 0;
    }
    
    .feature-list li {
      padding: 16px 0;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      color: #475569;
      line-height: 1.5;
    }
    
    .feature-list li:last-child {
      border-bottom: none;
    }
    
    .feature-list li::before {
      content: '→';
      color: #667eea;
      font-weight: 600;
      margin-right: 12px;
      font-size: 1.2rem;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }
    
    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 24px;
      border-radius: 12px;
      text-align: center;
    }
    
    .stat-number {
      font-size: 2rem;
      font-weight: 700;
      display: block;
    }
    
    .stat-label {
      font-size: 0.9rem;
      opacity: 0.9;
      margin-top: 4px;
    }
    
    .cta-section {
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
      padding: 40px;
      text-align: center;
      border-radius: 16px;
      margin: 30px 0;
    }
    
    .cta-button { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; 
      padding: 18px 40px; 
      text-decoration: none; 
      border-radius: 50px; 
      display: inline-block;
      font-weight: 600;
      font-size: 1.1rem;
      box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
      transition: all 0.3s ease;
    }
    
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
    }
    
    .tip-box {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      padding: 24px;
      border-radius: 12px;
      border-left: 4px solid #f59e0b;
      margin: 24px 0;
    }
    
    .tip-box h3 {
      color: #92400e;
      margin-bottom: 8px;
    }
    
    .tip-box p {
      color: #a16207;
      margin: 0;
      line-height: 1.5;
    }
    
    .footer {
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      color: white;
      padding: 40px;
      text-align: center;
      border-radius: 0 0 20px 20px;
    }
    
    @media (max-width: 640px) {
      .newsletter { margin: 10px; }
      .header { padding: 30px 20px; }
      .section { padding: 24px 20px; }
      .stats-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="newsletter">
    <div class="header">
      <div class="newsletter-logo">📧</div>
      <h1>{newsletterTitle}</h1>
      <p>{date}</p>
    </div>
    
    <div class="section">
      <h2>🚀 What's New This Week</h2>
      <div class="feature-highlight">
        <h3>Feature Spotlight: {featureName}</h3>
        <p>{featureDescription}</p>
      </div>
      <ul class="feature-list">
        <li>Enhanced user interface improvements</li>
        <li>Performance optimizations</li>
        <li>New integration capabilities</li>
      </ul>
    </div>
    
    <div class="section">
      <h2>📈 Community Highlights</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-number">{milestoneNumber}</span>
          <div class="stat-label">Active Users</div>
        </div>
        <div class="stat-card">
          <span class="stat-number">98%</span>
          <div class="stat-label">Satisfaction</div>
        </div>
      </div>
      <p style="color: #475569; line-height: 1.6; margin-top: 20px;">Our community reached {milestoneNumber} active users this week! Thank you for being part of our journey and helping us build something amazing together.</p>
    </div>
    
    <div class="section">
      <h2>💡 Weekly Tip</h2>
      <div class="tip-box">
        <h3>Pro Tip of the Week</h3>
        <p>{weeklyTip}</p>
      </div>
      <div class="cta-section">
        <h3 style="margin-bottom: 16px; color: #1e293b;">Want to Learn More?</h3>
        <a href="{learnMoreUrl}" class="cta-button">Discover More Tips</a>
      </div>
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
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    .promo-email { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
      max-width: 650px; 
      margin: 0 auto; 
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    
    .promo-header { 
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
      color: white; 
      padding: 50px 30px; 
      text-align: center; 
      position: relative;
      overflow: hidden;
    }
    
    .promo-header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 2px, transparent 2px);
      background-size: 40px 40px;
      animation: sparkle 15s linear infinite;
    }
    
    @keyframes sparkle {
      0% { transform: translate(-50%, -50%) rotate(0deg); }
      100% { transform: translate(-50%, -50%) rotate(360deg); }
    }
    
    .fire-icon {
      font-size: 3rem;
      margin-bottom: 16px;
      display: block;
      animation: bounce 2s infinite;
    }
    
    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-10px); }
      60% { transform: translateY(-5px); }
    }
    
    .promo-header h1 { 
      font-size: 2.5rem; 
      font-weight: 800; 
      margin-bottom: 20px; 
      position: relative; 
      z-index: 1;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    
    .discount-badge { 
      background: linear-gradient(135deg, #feca57 0%, #ff9ff3 100%);
      color: #2f3542; 
      padding: 24px 32px; 
      border-radius: 50%; 
      display: inline-block; 
      font-size: 2rem; 
      font-weight: 800; 
      margin: 20px 0;
      box-shadow: 0 15px 35px rgba(254, 202, 87, 0.4);
      position: relative;
      z-index: 1;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    
    .product-name {
      font-size: 1.8rem;
      font-weight: 600;
      position: relative;
      z-index: 1;
    }
    
    .urgency { 
      background: linear-gradient(135deg, #ff4757 0%, #c44569 100%);
      color: white; 
      padding: 20px; 
      text-align: center; 
      font-weight: 700;
      font-size: 1.1rem;
      position: relative;
      overflow: hidden;
    }
    
    .urgency::before {
      content: '⚡';
      position: absolute;
      left: 20px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1.5rem;
      animation: flash 1s infinite;
    }
    
    .urgency::after {
      content: '⚡';
      position: absolute;
      right: 20px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1.5rem;
      animation: flash 1s infinite reverse;
    }
    
    @keyframes flash {
      0%, 50% { opacity: 1; }
      25%, 75% { opacity: 0.3; }
    }
    
    .product-section { 
      padding: 50px 40px; 
      text-align: center;
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    }
    
    .greeting {
      font-size: 1.3rem;
      color: #1e293b;
      font-weight: 600;
      margin-bottom: 24px;
    }
    
    .product-description {
      font-size: 1.1rem;
      color: #475569;
      line-height: 1.6;
      margin-bottom: 40px;
    }
    
    .pricing-container {
      background: #f1f5f9;
      padding: 40px;
      border-radius: 20px;
      margin: 40px 0;
      position: relative;
      border: 2px solid #e2e8f0;
    }
    
    .pricing-container::before {
      content: '🔥 HOT DEAL';
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: #ff4757;
      color: white;
      padding: 8px 20px;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 700;
    }
    
    .original-price {
      font-size: 1.5rem;
      color: #94a3b8;
      text-decoration: line-through;
      margin-bottom: 8px;
    }
    
    .sale-price {
      font-size: 3rem;
      color: #059669;
      font-weight: 800;
      margin-bottom: 8px;
    }
    
    .savings {
      font-size: 1.2rem;
      color: #059669;
      font-weight: 600;
      background: #d1fae5;
      padding: 12px 24px;
      border-radius: 50px;
      display: inline-block;
      margin-top: 16px;
    }
    
    .cta-large { 
      background: linear-gradient(135deg, #2ed573 0%, #1dd1a1 100%);
      color: white; 
      padding: 24px 48px; 
      font-size: 1.3rem; 
      text-decoration: none; 
      border-radius: 50px; 
      display: inline-block; 
      margin: 40px 0;
      font-weight: 700;
      box-shadow: 0 15px 35px rgba(46, 213, 115, 0.4);
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .cta-large:hover {
      transform: translateY(-3px);
      box-shadow: 0 20px 45px rgba(46, 213, 115, 0.5);
    }
    
    .promo-code {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      margin: 30px 0;
      border: 2px dashed rgba(255,255,255,0.3);
    }
    
    .promo-code-label {
      font-size: 0.9rem;
      opacity: 0.9;
      margin-bottom: 8px;
    }
    
    .promo-code-value {
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: 2px;
      font-family: 'Courier New', monospace;
    }
    
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 40px 0;
    }
    
    .feature-item {
      background: white;
      padding: 24px;
      border-radius: 12px;
      border: 2px solid #e2e8f0;
      text-align: left;
    }
    
    .feature-icon {
      font-size: 2rem;
      margin-bottom: 12px;
      display: block;
    }
    
    .feature-title {
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 8px;
    }
    
    .feature-desc {
      color: #64748b;
      font-size: 0.9rem;
      line-height: 1.4;
    }
    
    .footer {
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      color: white;
      padding: 30px;
      text-align: center;
      font-size: 0.9rem;
      opacity: 0.9;
    }
    
    @media (max-width: 640px) {
      .promo-email { margin: 10px; }
      .promo-header { padding: 30px 20px; }
      .promo-header h1 { font-size: 2rem; }
      .product-section { padding: 30px 20px; }
      .discount-badge { padding: 16px 24px; font-size: 1.5rem; }
      .features-grid { grid-template-columns: 1fr; }
      .cta-large { padding: 18px 36px; font-size: 1.1rem; }
    }
  </style>
</head>
<body>
  <div class="promo-email">
    <div class="promo-header">
      <span class="fire-icon">🔥</span>
      <h1>FLASH SALE ALERT!</h1>
      <div class="discount-badge">{discountPercent}% OFF</div>
      <h2 class="product-name">{productName}</h2>
    </div>
    
    <div class="urgency">
      Offer expires in {timeRemaining} - Don't miss out!
    </div>
    
    <div class="product-section">
      <h3 class="greeting">Hey {name}! 👋</h3>
      <p class="product-description">This is your chance to grab {productName} at an incredible discount! Limited time offer - grab it before it's gone!</p>
      
      <div class="pricing-container">
        <div class="original-price">{originalPrice}</div>
        <div class="sale-price">{salePrice}</div>
        <div class="savings">You save {savings}! 🎉</div>
      </div>
      
      <div class="features-grid">
        <div class="feature-item">
          <span class="feature-icon">⚡</span>
          <div class="feature-title">Instant Access</div>
          <div class="feature-desc">Get started immediately</div>
        </div>
        <div class="feature-item">
          <span class="feature-icon">🔒</span>
          <div class="feature-title">Secure Purchase</div>
          <div class="feature-desc">100% safe & protected</div>
        </div>
        <div class="feature-item">
          <span class="feature-icon">💎</span>
          <div class="feature-title">Premium Quality</div>
          <div class="feature-desc">Best-in-class experience</div>
        </div>
      </div>
      
      <a href="{shopUrl}" class="cta-large">Shop Now & Save</a>
      
      <div class="promo-code">
        <div class="promo-code-label">Use this code at checkout:</div>
        <div class="promo-code-value">{promoCode}</div>
      </div>
    </div>
    
    <div class="footer">
      <p>© 2024 Your Company. This offer is valid for a limited time only.</p>
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
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    .event-invite { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
      max-width: 650px; 
      margin: 0 auto; 
      background: #ffffff;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    
    .event-header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; 
      padding: 60px 40px; 
      text-align: center; 
      position: relative;
      overflow: hidden;
    }
    
    .event-header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="confetti" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="5" r="1.5" fill="rgba(255,255,255,0.2)"/><rect x="5" y="10" width="2" height="2" fill="rgba(255,255,255,0.1)" transform="rotate(45 6 11)"/><circle cx="15" cy="15" r="1" fill="rgba(255,255,255,0.2)"/></pattern></defs><rect width="100" height="100" fill="url(%23confetti)"/></svg>');
      animation: confetti-fall 20s linear infinite;
    }
    
    @keyframes confetti-fall {
      0% { transform: translate(-50%, -60%) rotate(0deg); }
      100% { transform: translate(-50%, -40%) rotate(360deg); }
    }
    
    .event-icon {
      width: 80px;
      height: 80px;
      background: rgba(255,255,255,0.2);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      font-size: 3rem;
      position: relative;
      z-index: 1;
      backdrop-filter: blur(10px);
    }
    
    .event-header h1 { 
      font-size: 2.5rem; 
      font-weight: 800; 
      margin-bottom: 16px; 
      position: relative; 
      z-index: 1;
    }
    
    .event-header p { 
      font-size: 1.2rem; 
      opacity: 0.95; 
      position: relative; 
      z-index: 1;
    }
    
    .event-details { 
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      padding: 50px 40px;
    }
    
    .greeting {
      font-size: 1.4rem;
      color: #1e293b;
      font-weight: 600;
      margin-bottom: 24px;
    }
    
    .event-description {
      font-size: 1.1rem;
      color: #475569;
      line-height: 1.7;
      margin-bottom: 40px;
    }
    
    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      margin: 40px 0;
    }
    
    .detail-card {
      background: white;
      padding: 32px 24px;
      border-radius: 16px;
      border: 2px solid #e2e8f0;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }
    
    .detail-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    .detail-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }
    
    .detail-icon {
      font-size: 2.5rem;
      margin-bottom: 16px;
      display: block;
    }
    
    .detail-label { 
      font-weight: 600; 
      color: #1e293b;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    
    .detail-value {
      font-size: 1.2rem;
      color: #475569;
      font-weight: 500;
      line-height: 1.4;
    }
    
    .highlights-section {
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
      padding: 40px;
      border-radius: 20px;
      margin: 40px 0;
    }
    
    .highlights-section h3 {
      color: #1e293b;
      font-size: 1.3rem;
      font-weight: 600;
      margin-bottom: 24px;
      text-align: center;
    }
    
    .highlights-list {
      list-style: none;
      padding: 0;
    }
    
    .highlights-list li {
      background: white;
      padding: 20px 24px;
      margin-bottom: 16px;
      border-radius: 12px;
      border-left: 4px solid #667eea;
      font-size: 1.1rem;
      color: #475569;
      position: relative;
      transition: all 0.2s ease;
    }
    
    .highlights-list li:last-child {
      margin-bottom: 0;
    }
    
    .highlights-list li:hover {
      transform: translateX(4px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
    }
    
    .highlights-list li::before {
      content: '✨';
      position: absolute;
      left: -2px;
      top: 50%;
      transform: translateY(-50%);
      background: #667eea;
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
    }
    
    .rsvp-section { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 50px 40px; 
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .rsvp-section::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at 30% 70%, rgba(255,255,255,0.1) 0%, transparent 50%),
                  radial-gradient(circle at 70% 30%, rgba(255,255,255,0.1) 0%, transparent 50%);
    }
    
    .rsvp-section h3 {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 16px;
      position: relative;
      z-index: 1;
    }
    
    .rsvp-subtitle {
      font-size: 1.1rem;
      opacity: 0.9;
      margin-bottom: 32px;
      position: relative;
      z-index: 1;
    }
    
    .rsvp-button { 
      background: white;
      color: #667eea; 
      padding: 20px 48px; 
      text-decoration: none; 
      border-radius: 50px; 
      font-size: 1.2rem;
      font-weight: 700;
      display: inline-block;
      margin-bottom: 24px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
      position: relative;
      z-index: 1;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .rsvp-button:hover {
      transform: translateY(-3px);
      box-shadow: 0 15px 35px rgba(0,0,0,0.3);
      background: #f8fafc;
    }
    
    .rsvp-deadline {
      font-size: 0.95rem;
      opacity: 0.8;
      position: relative;
      z-index: 1;
    }
    
    .countdown-timer {
      background: rgba(255,255,255,0.15);
      padding: 20px;
      border-radius: 12px;
      margin: 24px auto 0;
      max-width: 300px;
      backdrop-filter: blur(10px);
      position: relative;
      z-index: 1;
    }
    
    .countdown-label {
      font-size: 0.9rem;
      opacity: 0.8;
      margin-bottom: 8px;
    }
    
    .countdown-value {
      font-size: 1.5rem;
      font-weight: 700;
    }
    
    .footer {
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      color: white;
      padding: 30px;
      text-align: center;
      font-size: 0.9rem;
      opacity: 0.9;
    }
    
    @media (max-width: 640px) {
      .event-invite { margin: 10px; }
      .event-header { padding: 40px 24px; }
      .event-header h1 { font-size: 2rem; }
      .event-details { padding: 30px 24px; }
      .details-grid { grid-template-columns: 1fr; gap: 16px; }
      .rsvp-section { padding: 40px 24px; }
      .rsvp-button { padding: 16px 32px; font-size: 1rem; }
    }
  </style>
</head>
<body>
  <div class="event-invite">
    <div class="event-header">
      <div class="event-icon">�</div>
      <h1>{eventName}</h1>
      <p>Join us for an unforgettable experience</p>
    </div>
    
    <div class="event-details">
      <h2 class="greeting">Dear {name}! 🌟</h2>
      <p class="event-description">We're excited to invite you to {eventName}! This {eventType} promises to be an amazing experience filled with innovation, networking, and inspiration.</p>
      
      <div class="details-grid">
        <div class="detail-card">
          <span class="detail-icon">📅</span>
          <div class="detail-label">Date</div>
          <div class="detail-value">{eventDate}</div>
        </div>
        <div class="detail-card">
          <span class="detail-icon">🕐</span>
          <div class="detail-label">Time</div>
          <div class="detail-value">{eventTime}</div>
        </div>
        <div class="detail-card">
          <span class="detail-icon">📍</span>
          <div class="detail-label">Location</div>
          <div class="detail-value">{eventLocation}</div>
        </div>
        <div class="detail-card">
          <span class="detail-icon">👥</span>
          <div class="detail-label">Capacity</div>
          <div class="detail-value">{capacity} attendees</div>
        </div>
      </div>
      
      <div class="highlights-section">
        <h3>🎯 What to Expect</h3>
        <ul class="highlights-list">
          <li>{highlight1}</li>
          <li>{highlight2}</li>
          <li>{highlight3}</li>
        </ul>
      </div>
    </div>
    
    <div class="rsvp-section">
      <h3>Ready to Join Us?</h3>
      <p class="rsvp-subtitle">Secure your spot at this exclusive event</p>
      <a href="{rsvpUrl}" class="rsvp-button">RSVP Now</a>
      <div class="countdown-timer">
        <div class="countdown-label">RSVP Deadline</div>
        <div class="countdown-value">{rsvpDeadline}</div>
      </div>
    </div>
    
    <div class="footer">
      <p>© 2024 Event Organizers. We can't wait to see you there!</p>
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
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    .security-email { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
      max-width: 600px; 
      margin: 0 auto; 
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }
    
    .security-header { 
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      color: white; 
      padding: 40px 30px; 
      text-align: center; 
      position: relative;
      overflow: hidden;
    }
    
    .security-header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
      background-size: 25px 25px;
      animation: security-pattern 25s linear infinite;
    }
    
    @keyframes security-pattern {
      0% { transform: translate(-50%, -50%) rotate(0deg); }
      100% { transform: translate(-50%, -50%) rotate(360deg); }
    }
    
    .security-icon {
      width: 70px;
      height: 70px;
      background: rgba(255,255,255,0.2);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 2.5rem;
      position: relative;
      z-index: 1;
      backdrop-filter: blur(10px);
    }
    
    .security-header h1 { 
      font-size: 2rem; 
      font-weight: 700; 
      margin-bottom: 12px; 
      position: relative; 
      z-index: 1;
    }
    
    .security-header p {
      opacity: 0.9;
      font-size: 1rem;
      position: relative;
      z-index: 1;
    }
    
    .content-box { 
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      padding: 40px 35px;
    }
    
    .greeting {
      font-size: 1.3rem;
      color: #1e293b;
      font-weight: 600;
      margin-bottom: 24px;
    }
    
    .main-message {
      font-size: 1.1rem;
      color: #475569;
      line-height: 1.6;
      margin-bottom: 32px;
    }
    
    .security-notice { 
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 2px solid #f59e0b;
      padding: 24px; 
      border-radius: 12px; 
      margin: 32px 0;
      position: relative;
      overflow: hidden;
    }
    
    .security-notice::before {
      content: '⚠️';
      position: absolute;
      top: 16px;
      right: 16px;
      font-size: 1.5rem;
    }
    
    .security-notice .notice-title {
      color: #92400e;
      font-weight: 700;
      font-size: 1.1rem;
      margin-bottom: 8px;
    }
    
    .security-notice .notice-text {
      color: #a16207;
      line-height: 1.5;
      margin: 0;
    }
    
    .action-section {
      text-align: center;
      margin: 40px 0;
    }
    
    .action-text {
      font-size: 1.1rem;
      color: #475569;
      margin-bottom: 24px;
    }
    
    .reset-button { 
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      color: white; 
      padding: 18px 40px; 
      text-decoration: none; 
      border-radius: 50px; 
      display: inline-block; 
      font-weight: 600;
      font-size: 1.1rem;
      box-shadow: 0 10px 25px rgba(5, 150, 105, 0.3);
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .reset-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 35px rgba(5, 150, 105, 0.4);
    }
    
    .expiry-notice { 
      background: #fee2e2;
      color: #991b1b; 
      padding: 16px 20px;
      border-radius: 8px;
      font-size: 0.95rem;
      margin: 24px 0;
      border-left: 4px solid #dc2626;
      font-weight: 500;
    }
    
    .security-tips {
      background: #f0f9ff;
      padding: 32px;
      border-radius: 12px;
      margin: 32px 0;
      border-left: 4px solid #0ea5e9;
    }
    
    .security-tips h3 {
      color: #0c4a6e;
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .tips-list {
      list-style: none;
      padding: 0;
    }
    
    .tips-list li {
      padding: 12px 0;
      color: #0369a1;
      font-size: 1rem;
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    
    .tips-list li::before {
      content: '🛡️';
      font-size: 1.2rem;
      margin-top: 2px;
    }
    
    .link-fallback {
      background: #f1f5f9;
      padding: 20px;
      border-radius: 8px;
      margin: 24px 0;
    }
    
    .link-fallback p {
      color: #475569;
      font-size: 0.95rem;
      margin-bottom: 12px;
    }
    
    .link-text {
      word-break: break-all;
      color: #0ea5e9;
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
      background: white;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }
    
    .footer {
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    
    .footer-content {
      font-size: 0.9rem;
      opacity: 0.9;
      line-height: 1.5;
    }
    
    .company-info {
      margin-top: 16px;
      font-size: 0.85rem;
      opacity: 0.7;
    }
    
    @media (max-width: 640px) {
      .security-email { margin: 10px; }
      .security-header { padding: 30px 20px; }
      .security-header h1 { font-size: 1.7rem; }
      .content-box { padding: 30px 20px; }
      .reset-button { padding: 16px 32px; font-size: 1rem; }
      .security-tips { padding: 24px 16px; }
    }
  </style>
</head>
<body>
  <div class="security-email">
    <div class="security-header">
      <div class="security-icon">🔒</div>
      <h1>Password Reset Request</h1>
      <p>Secure access to your account</p>
    </div>
    
    <div class="content-box">
      <h2 class="greeting">Hi {name}! 👋</h2>
      <p class="main-message">We received a request to reset your password for your {companyName} account. Don't worry - we'll get you back to your account safely and securely.</p>
      
      <div class="security-notice">
        <div class="notice-title">Security Notice</div>
        <p class="notice-text">If you didn't request this password reset, please ignore this email. Your account remains secure and no action is needed.</p>
      </div>
      
      <div class="action-section">
        <p class="action-text">To reset your password, click the secure button below:</p>
        <a href="{resetUrl}" class="reset-button">Reset My Password</a>
      </div>
      
      <div class="expiry-notice">
        ⏰ <strong>Important:</strong> This secure link will expire in {expiryTime} for your protection.
      </div>
      
      <div class="security-tips">
        <h3>🛡️ Security Best Practices</h3>
        <ul class="tips-list">
          <li>Use a strong, unique password with at least 12 characters</li>
          <li>Enable two-factor authentication for extra security</li>
          <li>Never share your password with anyone, ever</li>
          <li>Use a password manager to generate and store secure passwords</li>
        </ul>
      </div>
      
      <div class="link-fallback">
        <p>If the button above doesn't work, copy and paste this secure link into your browser:</p>
        <div class="link-text">{resetUrl}</div>
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-content">
        <p>This is an automated security message from {companyName}.</p>
        <p>If you have any questions, please contact our support team.</p>
      </div>
      <div class="company-info">
        © 2024 {companyName}. Keeping your account secure is our priority.
      </div>
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
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    .thank-you-email { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
      max-width: 650px; 
      margin: 0 auto; 
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    
    .gratitude-header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; 
      padding: 60px 40px; 
      text-align: center; 
      position: relative;
      overflow: hidden;
    }
    
    .gratitude-header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="hearts" width="50" height="50" patternUnits="userSpaceOnUse"><text x="25" y="25" text-anchor="middle" dominant-baseline="middle" font-size="20" fill="rgba(255,255,255,0.1)">💜</text></pattern></defs><rect width="100" height="100" fill="url(%23hearts)"/></svg>');
      animation: hearts-float 30s linear infinite;
    }
    
    @keyframes hearts-float {
      0% { transform: translate(-50%, -50%) rotate(0deg); }
      100% { transform: translate(-50%, -50%) rotate(360deg); }
    }
    
    .thank-you-icon {
      width: 80px;
      height: 80px;
      background: rgba(255,255,255,0.2);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      font-size: 3rem;
      position: relative;
      z-index: 1;
      backdrop-filter: blur(10px);
      animation: gratitude-pulse 3s ease-in-out infinite;
    }
    
    @keyframes gratitude-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    
    .gratitude-header h1 { 
      font-size: 2.5rem; 
      font-weight: 800; 
      margin-bottom: 16px; 
      position: relative; 
      z-index: 1;
    }
    
    .gratitude-header p { 
      font-size: 1.2rem; 
      opacity: 0.95; 
      position: relative; 
      z-index: 1;
    }
    
    .content-section { 
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      padding: 50px 40px;
    }
    
    .main-message {
      font-size: 1.3rem;
      color: #1e293b;
      font-weight: 600;
      margin-bottom: 24px;
      text-align: center;
    }
    
    .gratitude-text {
      font-size: 1.1rem;
      color: #475569;
      line-height: 1.7;
      margin-bottom: 40px;
      text-align: center;
    }
    
    .next-steps { 
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
      padding: 40px; 
      border-radius: 20px; 
      margin: 40px 0;
      position: relative;
      overflow: hidden;
    }
    
    .next-steps::before {
      content: '🚀';
      position: absolute;
      top: 20px;
      right: 20px;
      font-size: 2rem;
      opacity: 0.3;
    }
    
    .next-steps h3 {
      color: #1e293b;
      font-size: 1.4rem;
      font-weight: 700;
      margin-bottom: 32px;
      text-align: center;
    }
    
    .step { 
      margin: 24px 0; 
      padding: 28px 32px; 
      background: white; 
      border-radius: 16px; 
      border-left: 6px solid #667eea;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      position: relative;
      transition: all 0.3s ease;
    }
    
    .step:hover {
      transform: translateX(8px);
      box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1);
    }
    
    .step-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 12px;
    }
    
    .step-number {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.1rem;
    }
    
    .step-title {
      color: #1e293b;
      font-weight: 600;
      font-size: 1.1rem;
    }
    
    .step-description {
      color: #64748b;
      line-height: 1.5;
      margin-left: 52px;
    }
    
    .details-section {
      background: #fefce8;
      padding: 32px;
      border-radius: 16px;
      margin: 40px 0;
      border-left: 4px solid #eab308;
    }
    
    .details-section h3 {
      color: #a16207;
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }
    
    .detail-item {
      background: white;
      padding: 16px 20px;
      border-radius: 8px;
      border: 1px solid #fed7aa;
    }
    
    .detail-label {
      font-weight: 600;
      color: #92400e;
      font-size: 0.9rem;
      margin-bottom: 4px;
    }
    
    .detail-value {
      color: #a16207;
      font-size: 1rem;
    }
    
    .contact-info { 
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      padding: 40px; 
      border-radius: 20px; 
      text-align: center;
      margin: 40px 0;
      position: relative;
      overflow: hidden;
    }
    
    .contact-info::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at 30% 40%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                  radial-gradient(circle at 70% 60%, rgba(59, 130, 246, 0.1) 0%, transparent 50%);
    }
    
    .contact-info h3 {
      color: #1e40af;
      font-size: 1.4rem;
      font-weight: 700;
      margin-bottom: 16px;
      position: relative;
      z-index: 1;
    }
    
    .contact-subtitle {
      color: #3730a3;
      font-size: 1rem;
      margin-bottom: 32px;
      opacity: 0.9;
      position: relative;
      z-index: 1;
    }
    
    .contact-methods {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      position: relative;
      z-index: 1;
    }
    
    .contact-method {
      background: white;
      padding: 24px 20px;
      border-radius: 12px;
      border: 2px solid #e0e7ff;
      transition: all 0.3s ease;
    }
    
    .contact-method:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(59, 130, 246, 0.15);
      border-color: #3b82f6;
    }
    
    .contact-icon {
      font-size: 1.5rem;
      margin-bottom: 8px;
      display: block;
    }
    
    .contact-label {
      font-weight: 600;
      color: #1e40af;
      font-size: 0.9rem;
      margin-bottom: 4px;
    }
    
    .contact-value {
      color: #3730a3;
      font-size: 1rem;
      word-break: break-word;
    }
    
    .footer {
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    
    .footer-message {
      font-size: 1rem;
      opacity: 0.9;
      line-height: 1.6;
      margin-bottom: 16px;
    }
    
    .footer-company {
      font-size: 0.9rem;
      opacity: 0.7;
    }
    
    @media (max-width: 640px) {
      .thank-you-email { margin: 10px; }
      .gratitude-header { padding: 40px 24px; }
      .gratitude-header h1 { font-size: 2rem; }
      .content-section { padding: 30px 24px; }
      .next-steps { padding: 24px 16px; }
      .step { padding: 20px 16px; }
      .contact-methods { grid-template-columns: 1fr; }
      .details-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="thank-you-email">
    <div class="gratitude-header">
      <div class="thank-you-icon">🙏</div>
      <h1>Thank You, {name}!</h1>
      <p>Your {actionType} means the world to us</p>
    </div>
    
    <div class="content-section">
      <h2 class="main-message">We're Incredibly Grateful! ✨</h2>
      <p class="gratitude-text">Thank you for {specificAction}. Your trust and support help us continue to {companyMission} and serve our amazing community better every day.</p>
      
      <div class="next-steps">
        <h3>What Happens Next?</h3>
        <div class="step">
          <div class="step-header">
            <div class="step-number">1</div>
            <div class="step-title">First Step</div>
          </div>
          <div class="step-description">{nextStep1}</div>
        </div>
        <div class="step">
          <div class="step-header">
            <div class="step-number">2</div>
            <div class="step-title">Next Phase</div>
          </div>
          <div class="step-description">{nextStep2}</div>
        </div>
        <div class="step">
          <div class="step-header">
            <div class="step-number">3</div>
            <div class="step-title">Final Step</div>
          </div>
          <div class="step-description">{nextStep3}</div>
        </div>
      </div>
      
      <div class="details-section">
        <h3>📋 Your Transaction Details</h3>
        <div class="details-grid">
          <div class="detail-item">
            <div class="detail-label">Reference Number</div>
            <div class="detail-value">{referenceNumber}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Date</div>
            <div class="detail-value">{transactionDate}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Status</div>
            <div class="detail-value">{status}</div>
          </div>
        </div>
      </div>
      
      <div class="contact-info">
        <h3>💬 We're Here to Help!</h3>
        <p class="contact-subtitle">Our support team is ready to assist you 24/7</p>
        <div class="contact-methods">
          <div class="contact-method">
            <span class="contact-icon">📧</span>
            <div class="contact-label">Email Support</div>
            <div class="contact-value">{supportEmail}</div>
          </div>
          <div class="contact-method">
            <span class="contact-icon">📞</span>
            <div class="contact-label">Phone Support</div>
            <div class="contact-value">{supportPhone}</div>
          </div>
          <div class="contact-method">
            <span class="contact-icon">💬</span>
            <div class="contact-label">Live Chat</div>
            <div class="contact-value">{websiteUrl}</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p class="footer-message">Thank you for choosing us. We're committed to providing you with an exceptional experience every step of the way.</p>
      <p class="footer-company">© 2024 Your Company. Made with ❤️ for our valued customers.</p>
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
