#!/usr/bin/env node

// Quick Email Settings Diagnostic Script
// This script helps debug email configuration issues

console.log("🔍 SmartBatch Email Settings Diagnostic");
console.log("=====================================\n");

console.log("If you're getting the error:");
console.log("'Email settings not configured. Please set up your Resend API key and domain in Settings > Email Configuration.'\n");

console.log("Here are the steps to fix it:\n");

console.log("1. 📧 Check if you have email settings configured:");
console.log("   - Go to your app: Settings → Email Settings");
console.log("   - Look for any existing email configurations\n");

console.log("2. 🔧 If you see configurations but still get errors:");
console.log("   - Look for a yellow warning box that says 'Email Configuration Issue Detected'");
console.log("   - Click 'Fix Configuration Automatically' button");
console.log("   - This will activate your first configuration as the default\n");

console.log("3. ➕ If you have NO email configurations:");
console.log("   - Click 'Add Email Configuration'");
console.log("   - Enter your Resend API key (get it from https://resend.com/api-keys)");
console.log("   - Enter your domain (e.g., yourdomain.com)");
console.log("   - Set up the from name and email");
console.log("   - Make sure 'Make this the default email configuration' is checked");
console.log("   - Click 'Create Configuration'\n");

console.log("4. ✅ Test your configuration:");
console.log("   - Once configured, click 'Send Test Email to My Account'");
console.log("   - This verifies everything is working correctly\n");

console.log("5. 🚀 Try sending your campaign again:");
console.log("   - Go back to Campaigns and try sending");
console.log("   - The error should be resolved\n");

console.log("🔧 Quick Fix Options:");
console.log("- If you see email configurations in the UI but still get errors,");
console.log("  use the 'Fix Configuration Automatically' button");
console.log("- This activates and sets the first configuration as default\n");

console.log("💡 Prevention:");
console.log("- Always ensure at least one email configuration is marked as 'Default'");
console.log("- Keep the default configuration 'Active'");
console.log("- Verify your domain in Resend before using it\n");

console.log("📞 If you continue having issues:");
console.log("- Check the Convex logs for more detailed error messages");
console.log("- Verify your Resend API key has full permissions");
console.log("- Ensure your domain is verified in Resend dashboard");
