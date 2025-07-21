#!/bin/bash

# Email Service Setup Script
# This script helps configure the Resend email service integration

echo "🚀 Setting up Resend Email Service Integration..."

# Check if Convex is installed
if ! command -v npx convex &> /dev/null; then
    echo "❌ Convex CLI not found. Please install it first:"
    echo "   npm install -g convex"
    exit 1
fi

# Check if the Resend package is installed
if ! npm list @convex-dev/resend &> /dev/null; then
    echo "📦 Installing Resend Convex Component..."
    npm install @convex-dev/resend
    if [ $? -eq 0 ]; then
        echo "✅ Resend package installed successfully"
    else
        echo "❌ Failed to install Resend package"
        exit 1
    fi
else
    echo "✅ Resend package already installed"
fi

# Check environment variables
echo "🔧 Checking environment configuration..."

ENV_FILE=".env.local"
if [ ! -f "$ENV_FILE" ]; then
    echo "📝 Creating $ENV_FILE file..."
    touch "$ENV_FILE"
fi

# Check for required environment variables
missing_vars=()

if ! grep -q "RESEND_API_KEY" "$ENV_FILE"; then
    missing_vars+=("RESEND_API_KEY")
fi

if ! grep -q "CONVEX_SITE_URL" "$ENV_FILE"; then
    missing_vars+=("CONVEX_SITE_URL")
fi

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo "⚠️  Missing environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "   - $var"
    done
    
    echo ""
    echo "Please add these to your $ENV_FILE file:"
    echo ""
    
    if [[ " ${missing_vars[@]} " =~ " RESEND_API_KEY " ]]; then
        echo "# Get your API key from https://resend.com/api-keys"
        echo "RESEND_API_KEY=your_resend_api_key_here"
    fi
    
    if [[ " ${missing_vars[@]} " =~ " CONVEX_SITE_URL " ]]; then
        echo "# Your app's URL (for webhooks and tracking links)"
        echo "CONVEX_SITE_URL=http://localhost:3000"
    fi
    
    echo ""
    echo "After adding the environment variables, run this script again."
    exit 1
else
    echo "✅ Environment variables configured"
fi

# Deploy Convex functions
echo "🚀 Deploying Convex functions..."
npx convex deploy

if [ $? -eq 0 ]; then
    echo "✅ Convex functions deployed successfully"
else
    echo "❌ Failed to deploy Convex functions"
    exit 1
fi

# Run database migrations if needed
echo "🗄️  Running database migrations..."
npx convex run migrations:run

echo ""
echo "🎉 Email service setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your Resend webhook URL in the Resend dashboard:"
echo "   Webhook URL: $(grep CONVEX_SITE_URL $ENV_FILE | cut -d '=' -f2)/resend-webhook"
echo ""
echo "2. Verify your sending domain in Resend (recommended for production)"
echo ""
echo "3. Test the email service by sending a test email from your app"
echo ""
echo "📖 For detailed documentation, see: convex/EMAIL_SERVICE_README.md"
echo ""
echo "🔧 Useful commands:"
echo "   - Send test email: npx convex run emailService:sendEmail"
echo "   - Check rate limits: npx convex run rateLimiter:getRateLimitStatus"
echo "   - View email queue: npx convex run emailService:getUserEmailQueue"
echo "   - Monitor email analytics: npx convex run emailDashboard:getDashboardData"
