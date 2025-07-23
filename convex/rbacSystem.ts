import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

/**
 * Role-Based Access Control (RBAC) System
 * Handles user roles, permissions, team management, and access control
 */

// Define role hierarchy and permissions
export const ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  MANAGER: "manager",
  EDITOR: "editor",
  VIEWER: "viewer",
} as const;

export const PERMISSIONS = {
  // Campaign permissions
  CAMPAIGNS_VIEW: "campaigns:view",
  CAMPAIGNS_CREATE: "campaigns:create",
  CAMPAIGNS_EDIT: "campaigns:edit",
  CAMPAIGNS_DELETE: "campaigns:delete",
  CAMPAIGNS_SEND: "campaigns:send",
  
  // Contact permissions
  CONTACTS_VIEW: "contacts:view",
  CONTACTS_CREATE: "contacts:create",
  CONTACTS_EDIT: "contacts:edit",
  CONTACTS_DELETE: "contacts:delete",
  CONTACTS_IMPORT: "contacts:import",
  CONTACTS_EXPORT: "contacts:export",
  
  // Template permissions
  TEMPLATES_VIEW: "templates:view",
  TEMPLATES_CREATE: "templates:create",
  TEMPLATES_EDIT: "templates:edit",
  TEMPLATES_DELETE: "templates:delete",
  
  // Analytics permissions
  ANALYTICS_VIEW: "analytics:view",
  ANALYTICS_EXPORT: "analytics:export",
  
  // Integration permissions
  INTEGRATIONS_VIEW: "integrations:view",
  INTEGRATIONS_MANAGE: "integrations:manage",
  
  // User management permissions
  USERS_VIEW: "users:view",
  USERS_INVITE: "users:invite",
  USERS_MANAGE: "users:manage",
  USERS_DELETE: "users:delete",
  
  // Settings permissions
  SETTINGS_VIEW: "settings:view",
  SETTINGS_MANAGE: "settings:manage",
  
  // Billing permissions
  BILLING_VIEW: "billing:view",
  BILLING_MANAGE: "billing:manage",
  
  // Audit permissions
  AUDIT_VIEW: "audit:view",
  AUDIT_EXPORT: "audit:export",
} as const;

// Default role permissions
export const ROLE_PERMISSIONS = {
  [ROLES.OWNER]: Object.values(PERMISSIONS),
  [ROLES.ADMIN]: [
    PERMISSIONS.CAMPAIGNS_VIEW,
    PERMISSIONS.CAMPAIGNS_CREATE,
    PERMISSIONS.CAMPAIGNS_EDIT,
    PERMISSIONS.CAMPAIGNS_DELETE,
    PERMISSIONS.CAMPAIGNS_SEND,
    PERMISSIONS.CONTACTS_VIEW,
    PERMISSIONS.CONTACTS_CREATE,
    PERMISSIONS.CONTACTS_EDIT,
    PERMISSIONS.CONTACTS_DELETE,
    PERMISSIONS.CONTACTS_IMPORT,
    PERMISSIONS.CONTACTS_EXPORT,
    PERMISSIONS.TEMPLATES_VIEW,
    PERMISSIONS.TEMPLATES_CREATE,
    PERMISSIONS.TEMPLATES_EDIT,
    PERMISSIONS.TEMPLATES_DELETE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.INTEGRATIONS_VIEW,
    PERMISSIONS.INTEGRATIONS_MANAGE,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_INVITE,
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_MANAGE,
    PERMISSIONS.AUDIT_VIEW,
  ],
  [ROLES.MANAGER]: [
    PERMISSIONS.CAMPAIGNS_VIEW,
    PERMISSIONS.CAMPAIGNS_CREATE,
    PERMISSIONS.CAMPAIGNS_EDIT,
    PERMISSIONS.CAMPAIGNS_SEND,
    PERMISSIONS.CONTACTS_VIEW,
    PERMISSIONS.CONTACTS_CREATE,
    PERMISSIONS.CONTACTS_EDIT,
    PERMISSIONS.CONTACTS_IMPORT,
    PERMISSIONS.TEMPLATES_VIEW,
    PERMISSIONS.TEMPLATES_CREATE,
    PERMISSIONS.TEMPLATES_EDIT,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.INTEGRATIONS_VIEW,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
  ],
  [ROLES.EDITOR]: [
    PERMISSIONS.CAMPAIGNS_VIEW,
    PERMISSIONS.CAMPAIGNS_CREATE,
    PERMISSIONS.CAMPAIGNS_EDIT,
    PERMISSIONS.CONTACTS_VIEW,
    PERMISSIONS.CONTACTS_CREATE,
    PERMISSIONS.CONTACTS_EDIT,
    PERMISSIONS.TEMPLATES_VIEW,
    PERMISSIONS.TEMPLATES_CREATE,
    PERMISSIONS.TEMPLATES_EDIT,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
  [ROLES.VIEWER]: [
    PERMISSIONS.CAMPAIGNS_VIEW,
    PERMISSIONS.CONTACTS_VIEW,
    PERMISSIONS.TEMPLATES_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
};

// Create team
export const createTeam = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    settings: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // Create team
    const teamId = await ctx.db.insert("teams", {
      name: args.name,
      description: args.description,
      ownerId: user._id,
      settings: args.settings || {},
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Add creator as owner
    await ctx.db.insert("teamMembers", {
      teamId,
      userId: user._id,
      role: ROLES.OWNER,
      permissions: ROLE_PERMISSIONS[ROLES.OWNER],
      invitedBy: user._id,
      joinedAt: Date.now(),
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Log team creation
    await ctx.runMutation(internal.auditLogging.createAuditLog, {
      eventType: "team_created",
      userId: user._id,
      resourceType: "team",
      resourceId: teamId,
      action: "created",
      description: `Team "${args.name}" created`,
      details: { teamName: args.name },
      riskLevel: "low",
      tags: ["team", "rbac"],
    });

    return teamId;
  },
});

// Invite user to team
export const inviteTeamMember = mutation({
  args: {
    teamId: v.id("teams"),
    email: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("manager"),
      v.literal("editor"),
      v.literal("viewer")
    ),
    customPermissions: v.optional(v.array(v.string())),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // Check if user has permission to invite
    const hasPermission = await checkPermission(ctx, user._id, args.teamId, PERMISSIONS.USERS_INVITE);
    if (!hasPermission) {
      throw new Error("Insufficient permissions to invite users");
    }

    // Check if user is already a member or has pending invite
    const existingMember = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_user", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existingMember) {
      throw new Error("User is already a member or has a pending invitation");
    }

    // Get permissions for role
    const permissions = args.customPermissions || ROLE_PERMISSIONS[args.role as keyof typeof ROLE_PERMISSIONS];

    // Create invitation
    const invitationId = await ctx.db.insert("teamInvitations", {
      teamId: args.teamId,
      email: args.email,
      role: args.role,
      permissions,
      invitedBy: user._id,
      message: args.message,
      status: "pending",
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Log invitation
    await ctx.runMutation(internal.auditLogging.createAuditLog, {
      eventType: "team_invitation_sent",
      userId: user._id,
      resourceType: "team_invitation",
      resourceId: invitationId,
      action: "sent",
      description: `Team invitation sent to ${args.email}`,
      details: { 
        teamId: args.teamId,
        email: args.email,
        role: args.role 
      },
      riskLevel: "low",
      tags: ["team", "invitation", "rbac"],
    });

    // In a real implementation, send email invitation here
    await sendInvitationEmail(args.email, args.teamId, invitationId, args.message);

    return invitationId;
  },
});

// Accept team invitation
export const acceptTeamInvitation = mutation({
  args: {
    invitationId: v.id("teamInvitations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // Get invitation
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation || invitation.status !== "pending") {
      throw new Error("Invalid or expired invitation");
    }

    if (invitation.expiresAt < Date.now()) {
      throw new Error("Invitation has expired");
    }

    if (invitation.email !== user.email) {
      throw new Error("Invitation is not for this email address");
    }

    // Check if user is already a member
    const existingMember = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_user", (q) => q.eq("teamId", invitation.teamId).eq("userId", user._id))
      .first();

    if (existingMember) {
      throw new Error("User is already a team member");
    }

    // Create team membership
    const membershipId = await ctx.db.insert("teamMembers", {
      teamId: invitation.teamId,
      userId: user._id,
      email: user.email,
      role: invitation.role,
      permissions: invitation.permissions,
      invitedBy: invitation.invitedBy,
      joinedAt: Date.now(),
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update invitation status
    await ctx.db.patch(args.invitationId, {
      status: "accepted",
      acceptedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Log acceptance
    await ctx.runMutation(internal.auditLogging.createAuditLog, {
      eventType: "team_invitation_accepted",
      userId: user._id,
      resourceType: "team_member",
      resourceId: membershipId,
      action: "joined",
      description: `User joined team`,
      details: { 
        teamId: invitation.teamId,
        role: invitation.role,
        invitationId: args.invitationId
      },
      riskLevel: "low",
      tags: ["team", "membership", "rbac"],
    });

    return membershipId;
  },
});

// Update team member role/permissions
export const updateTeamMember = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.id("users"),
    role: v.optional(v.string()),
    permissions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser) throw new Error("User not found");

    // Check if current user has permission to manage users
    const hasPermission = await checkPermission(ctx, currentUser._id, args.teamId, PERMISSIONS.USERS_MANAGE);
    if (!hasPermission) {
      throw new Error("Insufficient permissions to manage team members");
    }

    // Get target member
    const member = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_user", (q) => q.eq("teamId", args.teamId).eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!member) {
      throw new Error("Team member not found");
    }

    // Prevent demoting the team owner
    if (member.role === ROLES.OWNER) {
      throw new Error("Cannot modify team owner role");
    }

    // Prepare updates
    const updates: any = { updatedAt: Date.now() };
    
    if (args.role) {
      updates.role = args.role;
      updates.permissions = args.permissions || ROLE_PERMISSIONS[args.role as keyof typeof ROLE_PERMISSIONS];
    } else if (args.permissions) {
      updates.permissions = args.permissions;
    }

    // Update member
    await ctx.db.patch(member._id, updates);

    // Log update
    await ctx.runMutation(internal.auditLogging.createAuditLog, {
      eventType: "team_member_updated",
      userId: currentUser._id,
      resourceType: "team_member",
      resourceId: member._id,
      action: "updated",
      description: `Team member role/permissions updated`,
      details: { 
        teamId: args.teamId,
        targetUserId: args.userId,
        oldRole: member.role,
        newRole: args.role,
      },
      riskLevel: "medium",
      tags: ["team", "permissions", "rbac"],
    });

    return member._id;
  },
});

// Remove team member
export const removeTeamMember = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser) throw new Error("User not found");

    // Check if current user has permission to manage users
    const hasPermission = await checkPermission(ctx, currentUser._id, args.teamId, PERMISSIONS.USERS_MANAGE);
    if (!hasPermission) {
      throw new Error("Insufficient permissions to remove team members");
    }

    // Get target member
    const member = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_user", (q) => q.eq("teamId", args.teamId).eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!member) {
      throw new Error("Team member not found");
    }

    // Prevent removing the team owner
    if (member.role === ROLES.OWNER) {
      throw new Error("Cannot remove team owner");
    }

    // Deactivate membership
    await ctx.db.patch(member._id, {
      isActive: false,
      removedAt: Date.now(),
      removedBy: currentUser._id,
      updatedAt: Date.now(),
    });

    // Log removal
    await ctx.runMutation(internal.auditLogging.createAuditLog, {
      eventType: "team_member_removed",
      userId: currentUser._id,
      resourceType: "team_member",
      resourceId: member._id,
      action: "removed",
      description: `Team member removed`,
      details: { 
        teamId: args.teamId,
        removedUserId: args.userId,
        removedRole: member.role,
      },
      riskLevel: "medium",
      tags: ["team", "removal", "rbac"],
    });

    return member._id;
  },
});

// Check if user has specific permission
export const checkPermission = internalQuery({
  args: {
    userId: v.id("users"),
    teamId: v.optional(v.id("teams")),
    permission: v.string(),
  },
  handler: async (ctx, args) => {
    // If no team specified, check global permissions (for workspace owner)
    if (!args.teamId) {
      const user = await ctx.db.get(args.userId);
      return user?.subscription?.plan === "enterprise"; // Simple check
    }

    // Get team membership
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_user", (q) => q.eq("teamId", args.teamId).eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!membership) {
      return false;
    }

    // Check if user has the specific permission
    return membership.permissions.includes(args.permission);
  },
});

// Get user's teams and permissions
export const getUserTeams = query({
  args: {},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // Get active team memberships
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get team details
    const teams = await Promise.all(
      memberships.map(async (membership) => {
        const team = await ctx.db.get(membership.teamId);
        return {
          teamId: membership.teamId,
          team,
          role: membership.role,
          permissions: membership.permissions,
          joinedAt: membership.joinedAt,
        };
      })
    );

    return teams.filter(t => t.team); // Filter out deleted teams
  },
});

// Get team members
export const getTeamMembers = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // Check if user has permission to view team members
    const hasPermission = await checkPermission(ctx, user._id, args.teamId, PERMISSIONS.USERS_VIEW);
    if (!hasPermission) {
      throw new Error("Insufficient permissions to view team members");
    }

    // Get active team members
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get user details for each member
    const members = await Promise.all(
      memberships.map(async (membership) => {
        const memberUser = await ctx.db.get(membership.userId);
        return {
          ...membership,
          user: memberUser ? {
            _id: memberUser._id,
            name: memberUser.name,
            email: memberUser.email,
          } : null,
        };
      })
    );

    return members.filter(m => m.user); // Filter out deleted users
  },
});

// Get team invitations
export const getTeamInvitations = query({
  args: {
    teamId: v.id("teams"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // Check if user has permission to view invitations
    const hasPermission = await checkPermission(ctx, user._id, args.teamId, PERMISSIONS.USERS_VIEW);
    if (!hasPermission) {
      throw new Error("Insufficient permissions to view team invitations");
    }

    let query = ctx.db
      .query("teamInvitations")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const invitations = await query.collect();

    return invitations;
  },
});

// Get RBAC dashboard
export const getRBACDashboard = query({
  args: {
    teamId: v.optional(v.id("teams")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    if (args.teamId) {
      // Check if user has permission to view team dashboard
      const hasPermission = await checkPermission(ctx, user._id, args.teamId, PERMISSIONS.USERS_VIEW);
      if (!hasPermission) {
        throw new Error("Insufficient permissions to view team dashboard");
      }
    }

    // Get teams stats
    const teams = await ctx.db
      .query("teams")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get members stats
    const members = await ctx.db
      .query("teamMembers")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get pending invitations
    const pendingInvitations = await ctx.db
      .query("teamInvitations")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .filter((q) => q.gte(q.field("expiresAt"), Date.now()))
      .collect();

    // Group members by role
    const membersByRole = members.reduce((acc, member) => {
      acc[member.role] = (acc[member.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      teams: {
        total: teams.length,
        active: teams.filter(t => t.isActive).length,
      },
      members: {
        total: members.length,
        byRole: membersByRole,
        recent: members
          .sort((a, b) => b.joinedAt - a.joinedAt)
          .slice(0, 10),
      },
      invitations: {
        pending: pendingInvitations.length,
        expired: await getExpiredInvitationsCount(ctx),
      },
      permissions: PERMISSIONS,
      roles: ROLES,
    };
  },
});

// Internal helper functions
async function sendInvitationEmail(
  email: string, 
  teamId: Id<"teams">, 
  invitationId: Id<"teamInvitations">, 
  message?: string
): Promise<void> {
  // In a real implementation, send email using your email service
  // This would include a link to accept the invitation
  console.log(`Sending invitation email to ${email} for team ${teamId}`);
}

async function getExpiredInvitationsCount(ctx: any): Promise<number> {
  const expired = await ctx.db
    .query("teamInvitations")
    .filter((q) => q.eq(q.field("status"), "pending"))
    .filter((q) => q.lt(q.field("expiresAt"), Date.now()))
    .collect();

  return expired.length;
}
