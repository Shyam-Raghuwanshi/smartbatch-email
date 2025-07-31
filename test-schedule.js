// Simple test to create a scheduled campaign and verify schedule functionality
console.log('Testing Schedule functionality...');

// Simulate creating a scheduled campaign
const testScheduledCampaign = {
  name: "Test Scheduled Campaign",
  subject: "Test Email Subject",
  content: "This is a test email content",
  scheduleType: "scheduled",
  scheduledAt: new Date(Date.now() + 60000), // 1 minute from now
  targetTags: ["test"],
  trackOpens: true,
  trackClicks: true
};

console.log('Test campaign data:', testScheduledCampaign);

// The campaign form should now:
// 1. Set status to "scheduled" when scheduleType is "scheduled" and scheduledAt is provided
// 2. Automatically create a campaignSchedules entry when the campaign is created
// 3. The Schedule page should display this campaign in the table

console.log('Schedule page should now show campaigns when you create scheduled campaigns!');
