import { mutation } from "../_generated/server";

// Migration to add updatedAt field to existing contacts
export const addUpdatedAtToContacts = mutation({
  handler: async (ctx) => {
    const contacts = await ctx.db.query("contacts").collect();
    
    for (const contact of contacts) {
      if (!contact.updatedAt) {
        await ctx.db.patch(contact._id, {
          updatedAt: contact.createdAt, // Use createdAt as the initial updatedAt
        });
      }
    }
    
    return `Updated ${contacts.filter(c => !c.updatedAt).length} contacts with updatedAt field`;
  },
});
