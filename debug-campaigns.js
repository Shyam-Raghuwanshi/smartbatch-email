const { ConvexHttpClient } = require("convex/browser");

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://zealous-snake-344.convex.cloud");

async function debugCampaigns() {
  try {
    console.log("Fetching all campaigns...");
    
    // We need to simulate a user authentication to get campaigns
    // Let's try to call the public query first
    const campaigns = await client.query("campaigns:getCampaignsByUser");
    
    console.log("Found campaigns:", campaigns?.length || 0);
    
    if (campaigns) {
      campaigns.forEach((campaign, index) => {
        console.log(`\n--- Campaign ${index + 1} ---`);
        console.log("ID:", campaign._id);
        console.log("Name:", campaign.name);
        console.log("Status:", campaign.status);
        console.log("Subject:", campaign.settings?.subject);
        console.log("Created:", new Date(campaign.createdAt).toISOString());
        
        // Check if this might be our "july cam" campaign
        if (campaign.name.toLowerCase().includes('july') || campaign.name.toLowerCase().includes('cam')) {
          console.log("🎯 POTENTIAL MATCH FOUND! 🎯");
        }
      });
    }
    
    // Also look for campaigns with "sending" status
    const sendingCampaigns = campaigns?.filter(c => c.status === 'sending') || [];
    console.log(`\n\nCampaigns with "sending" status: ${sendingCampaigns.length}`);
    
    sendingCampaigns.forEach((campaign, index) => {
      console.log(`\n--- Sending Campaign ${index + 1} ---`);
      console.log("ID:", campaign._id);
      console.log("Name:", campaign.name);
      console.log("Status:", campaign.status);
      console.log("Subject:", campaign.settings?.subject);
    });
    
  } catch (error) {
    console.error("Error:", error.message);
    console.log("Note: This might fail due to authentication requirements");
  }
}

debugCampaigns();
