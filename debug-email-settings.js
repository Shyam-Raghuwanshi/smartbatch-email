const { ConvexHttpClient } = require("convex/browser");

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function debugEmailSettings() {
  try {
    // You'll need to replace this with the actual clerk ID from your logs or auth
    // You can get this from the Convex dashboard logs or user table
    const clerkId = "YOUR_CLERK_ID_HERE"; // Replace with actual clerk ID
    
    const result = await client.query("debugEmailSettings:debugEmailSettings", {
      clerkId: clerkId
    });
    
    console.log("Email Settings Debug Result:");
    console.log(JSON.stringify(result, null, 2));
    
    if (!result.hasValidEmailSettings) {
      console.log("\n🚨 ISSUE FOUND: No valid email settings configured!");
      console.log("Recommendations:");
      
      if (result.emailSettings.total === 0) {
        console.log("- User has no email settings configured");
        console.log("- User needs to go to Settings > Email Configuration and add a configuration");
      } else if (!result.emailSettings.default) {
        console.log("- User has email settings but none marked as default");
        console.log("- Update one of the existing settings to be default");
      } else if (result.emailSettings.default && !result.emailSettings.default.isActive) {
        console.log("- User has default email settings but they are inactive");
        console.log("- Activate the default email settings");
      }
    } else {
      console.log("\n✅ Email settings look good!");
    }
    
  } catch (error) {
    console.error("Error debugging email settings:", error);
  }
}

// To use this script:
// 1. Replace YOUR_CLERK_ID_HERE with the actual clerk ID
// 2. Run: node debug-email-settings.js
console.log("To use this script, please:");
console.log("1. Check your Convex logs or dashboard to find the user's clerk ID");
console.log("2. Replace 'YOUR_CLERK_ID_HERE' in this file with the actual clerk ID");  
console.log("3. Run: node debug-email-settings.js");
console.log("\nAlternatively, you can run the debug query directly in the Convex dashboard.");

// Uncomment this line to run the debug (after replacing the clerk ID)
// debugEmailSettings();
