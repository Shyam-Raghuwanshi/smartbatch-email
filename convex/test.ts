import { query } from "./_generated/server";

// Simple test query to check authentication
export const testAuth = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      return { authenticated: false, message: "No identity found" };
    }
    
    return { 
      authenticated: true, 
      identity: {
        subject: identity.subject,
        email: identity.email,
        name: identity.name
      }
    };
  },
});

// Public test query (no auth required)
export const testPublic = query({
  handler: async () => {
    return { message: "Public endpoint working", timestamp: Date.now() };
  },
});
