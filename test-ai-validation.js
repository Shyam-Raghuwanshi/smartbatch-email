// Simple test script to verify AI validation functionality
// This can be run to test the Perplexity AI integration

const testValidation = async () => {
  console.log('Testing AI Validation Feature...');
  
  // Test data
  const testEmail = {
    subject: "🔥 URGENT: Win $1000 Cash Prize NOW!!! Click Here FREE!!!",
    content: "Congratulations WINNER! You've been selected to win $1000 CASH! This is a LIMITED TIME offer - ACT NOW! Click here to claim your prize. No obligation, 100% FREE! Don't miss out on this AMAZING opportunity! CLICK NOW!"
  };
  
  console.log('Test email subject:', testEmail.subject);
  console.log('Test email content:', testEmail.content);
  console.log('\nThis email should trigger high spam score and get AI recommendations...');
  
  // Expected results:
  console.log('\nExpected AI Analysis:');
  console.log('- High spam score (70-90+)');
  console.log('- Risk level: high');
  console.log('- Suggestions to reduce promotional language');
  console.log('- Recommendations to reduce caps and exclamations');
  console.log('- Add unsubscribe link suggestion');
  
  console.log('\nTo test this, open the template editor and use these values, then click "AI Validate"');
};

testValidation();
