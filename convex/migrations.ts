import { mutation } from "./_generated/server";

// Migration to fix existing templates with missing required fields
export const migrateTemplatesSchema = mutation({
  handler: async (ctx) => {
    // Get all templates that might be missing required fields
    const templates = await ctx.db.query("templates").collect();
    
    let migratedCount = 0;
    
    for (const template of templates) {
      const updates: any = {};
      let needsUpdate = false;
      
      // Add missing category field
      if (!template.category) {
        updates.category = "General";
        needsUpdate = true;
      }
      
      // Add missing tags field
      if (!template.tags) {
        updates.tags = [];
        needsUpdate = true;
      }
      
      // Add missing updatedAt field
      if (!template.updatedAt) {
        updates.updatedAt = template.createdAt || Date.now();
        needsUpdate = true;
      }
      
      // Add missing usageCount field
      if (template.usageCount === undefined) {
        updates.usageCount = 0;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await ctx.db.patch(template._id, updates);
        migratedCount++;
      }
    }
    
    return {
      message: `Successfully migrated ${migratedCount} templates`,
      migratedCount
    };
  },
});
