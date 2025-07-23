"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  UserPlus, 
  Shield, 
  Settings, 
  Crown, 
  Star, 
  Eye,
  Edit,
  Trash2,
  Mail,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  role: "owner" | "admin" | "manager" | "editor" | "viewer";
  status: "active" | "pending" | "suspended";
  permissions: string[];
  joinedAt: number;
  lastActiveAt?: number;
}

interface TeamInvitation {
  id: string;
  email: string;
  role: string;
  status: "pending" | "accepted" | "declined" | "expired";
  invitedBy: string;
  createdAt: number;
  expiresAt: number;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

const AVAILABLE_PERMISSIONS: Permission[] = [
  // Campaign Permissions
  { id: "campaigns.create", name: "Create Campaigns", description: "Create new email campaigns", category: "Campaigns" },
  { id: "campaigns.edit", name: "Edit Campaigns", description: "Edit existing campaigns", category: "Campaigns" },
  { id: "campaigns.delete", name: "Delete Campaigns", description: "Delete campaigns", category: "Campaigns" },
  { id: "campaigns.send", name: "Send Campaigns", description: "Send campaigns to recipients", category: "Campaigns" },
  { id: "campaigns.schedule", name: "Schedule Campaigns", description: "Schedule campaigns for later", category: "Campaigns" },
  
  // Contact Permissions
  { id: "contacts.view", name: "View Contacts", description: "View contact lists and details", category: "Contacts" },
  { id: "contacts.create", name: "Create Contacts", description: "Add new contacts", category: "Contacts" },
  { id: "contacts.edit", name: "Edit Contacts", description: "Edit contact information", category: "Contacts" },
  { id: "contacts.delete", name: "Delete Contacts", description: "Delete contacts", category: "Contacts" },
  { id: "contacts.import", name: "Import Contacts", description: "Import contact lists", category: "Contacts" },
  { id: "contacts.export", name: "Export Contacts", description: "Export contact data", category: "Contacts" },
  
  // Template Permissions
  { id: "templates.view", name: "View Templates", description: "View email templates", category: "Templates" },
  { id: "templates.create", name: "Create Templates", description: "Create new templates", category: "Templates" },
  { id: "templates.edit", name: "Edit Templates", description: "Edit existing templates", category: "Templates" },
  { id: "templates.delete", name: "Delete Templates", description: "Delete templates", category: "Templates" },
  
  // Analytics Permissions
  { id: "analytics.view", name: "View Analytics", description: "View campaign analytics and reports", category: "Analytics" },
  { id: "analytics.export", name: "Export Analytics", description: "Export analytics data", category: "Analytics" },
  
  // Team Permissions
  { id: "team.invite", name: "Invite Members", description: "Invite new team members", category: "Team" },
  { id: "team.manage", name: "Manage Members", description: "Manage team member roles and permissions", category: "Team" },
  { id: "team.remove", name: "Remove Members", description: "Remove team members", category: "Team" },
  
  // Settings Permissions
  { id: "settings.view", name: "View Settings", description: "View organization settings", category: "Settings" },
  { id: "settings.edit", name: "Edit Settings", description: "Edit organization settings", category: "Settings" },
  { id: "integrations.manage", name: "Manage Integrations", description: "Manage third-party integrations", category: "Settings" },
  
  // Security Permissions
  { id: "security.view", name: "View Security", description: "View security dashboard and logs", category: "Security" },
  { id: "security.audit", name: "Audit Access", description: "Access audit logs and security reports", category: "Security" },
];

const ROLE_CONFIGS = {
  owner: {
    name: "Owner",
    description: "Full access to all features and settings",
    icon: <Crown className="h-4 w-4" />,
    color: "bg-purple-100 text-purple-800",
    permissions: AVAILABLE_PERMISSIONS.map(p => p.id),
  },
  admin: {
    name: "Administrator", 
    description: "Manage team, campaigns, and most settings",
    icon: <Star className="h-4 w-4" />,
    color: "bg-blue-100 text-blue-800",
    permissions: AVAILABLE_PERMISSIONS.filter(p => !p.id.startsWith("settings.")).map(p => p.id),
  },
  manager: {
    name: "Manager",
    description: "Manage campaigns, contacts, and view analytics", 
    icon: <Settings className="h-4 w-4" />,
    color: "bg-green-100 text-green-800",
    permissions: [
      "campaigns.create", "campaigns.edit", "campaigns.send", "campaigns.schedule",
      "contacts.view", "contacts.create", "contacts.edit", "contacts.import",
      "templates.view", "templates.create", "templates.edit",
      "analytics.view", "analytics.export"
    ],
  },
  editor: {
    name: "Editor",
    description: "Create and edit campaigns and templates",
    icon: <Edit className="h-4 w-4" />,
    color: "bg-yellow-100 text-yellow-800",
    permissions: [
      "campaigns.create", "campaigns.edit", "campaigns.schedule",
      "contacts.view", "contacts.create", "contacts.edit",
      "templates.view", "templates.create", "templates.edit",
      "analytics.view"
    ],
  },
  viewer: {
    name: "Viewer",
    description: "View-only access to campaigns and analytics",
    icon: <Eye className="h-4 w-4" />,
    color: "bg-gray-100 text-gray-800",
    permissions: [
      "campaigns.view", "contacts.view", "templates.view", "analytics.view"
    ],
  },
};

export const RBACDashboard: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState("members");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: "",
    role: "",
    message: "",
  });

  // Mock data - in real implementation, these would come from Convex queries
  const teamData = {
    name: "SmartBatch Team",
    memberCount: 8,
    pendingInvitations: 2,
    activeMembers: 6,
  };

  const teamMembers: TeamMember[] = [
    {
      id: "1",
      userId: "user1",
      name: "John Doe",
      email: "john@company.com",
      role: "owner",
      status: "active",
      permissions: ROLE_CONFIGS.owner.permissions,
      joinedAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
      lastActiveAt: Date.now() - 30 * 60 * 1000,
    },
    {
      id: "2", 
      userId: "user2",
      name: "Jane Smith",
      email: "jane@company.com",
      role: "admin",
      status: "active",
      permissions: ROLE_CONFIGS.admin.permissions,
      joinedAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
      lastActiveAt: Date.now() - 2 * 60 * 60 * 1000,
    },
    {
      id: "3",
      userId: "user3", 
      name: "Mike Johnson",
      email: "mike@company.com",
      role: "manager",
      status: "active",
      permissions: ROLE_CONFIGS.manager.permissions,
      joinedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
      lastActiveAt: Date.now() - 24 * 60 * 60 * 1000,
    },
    {
      id: "4",
      userId: "user4",
      name: "Sarah Wilson", 
      email: "sarah@company.com",
      role: "editor",
      status: "pending",
      permissions: ROLE_CONFIGS.editor.permissions,
      joinedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    },
  ];

  const pendingInvitations: TeamInvitation[] = [
    {
      id: "1",
      email: "new@company.com",
      role: "editor",
      status: "pending",
      invitedBy: "John Doe",
      createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      expiresAt: Date.now() + 5 * 24 * 60 * 60 * 1000,
    },
    {
      id: "2",
      email: "temp@company.com", 
      role: "viewer",
      status: "pending",
      invitedBy: "Jane Smith",
      createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
      expiresAt: Date.now() + 6 * 24 * 60 * 60 * 1000,
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending": return <Clock className="h-4 w-4 text-yellow-500" />;
      case "suspended": return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "suspended": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleConfig = (role: string) => {
    return ROLE_CONFIGS[role as keyof typeof ROLE_CONFIGS] || ROLE_CONFIGS.viewer;
  };

  const handleInviteMember = () => {
    // In real implementation, this would call a Convex mutation
    console.log("Inviting member:", inviteData);
    setInviteDialogOpen(false);
    setInviteData({ email: "", role: "", message: "" });
  };

  const groupPermissionsByCategory = (permissions: string[]) => {
    const grouped: Record<string, Permission[]> = {};
    permissions.forEach(permId => {
      const permission = AVAILABLE_PERMISSIONS.find(p => p.id === permId);
      if (permission) {
        if (!grouped[permission.category]) {
          grouped[permission.category] = [];
        }
        grouped[permission.category].push(permission);
      }
    });
    return grouped;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team & Access Control</h1>
          <p className="text-muted-foreground">
            Manage team members, roles, and permissions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Team Settings
          </Button>
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your team
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteData.email}
                    onChange={(e) => setInviteData({
                      ...inviteData,
                      email: e.target.value
                    })}
                    placeholder="colleague@company.com"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={inviteData.role}
                    onValueChange={(value) => setInviteData({
                      ...inviteData,
                      role: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROLE_CONFIGS).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center space-x-2">
                            {config.icon}
                            <div>
                              <div className="font-medium">{config.name}</div>
                              <div className="text-xs text-muted-foreground">{config.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="message">Personal Message (Optional)</Label>
                  <Textarea
                    id="message"
                    value={inviteData.message}
                    onChange={(e) => setInviteData({
                      ...inviteData,
                      message: e.target.value
                    })}
                    placeholder="Welcome to the team! We're excited to have you join us."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleInviteMember}>
                    Send Invitation
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Team Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamData.memberCount}</div>
            <p className="text-xs text-muted-foreground">
              {teamData.activeMembers} active, {teamData.pendingInvitations} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamData.activeMembers}</div>
            <p className="text-xs text-muted-foreground">
              Online in last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamData.pendingInvitations}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles Defined</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(ROLE_CONFIGS).length}</div>
            <p className="text-xs text-muted-foreground">
              Permission levels
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Team Management Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="audit">Access Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage your team members and their access levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => {
                    const roleConfig = getRoleConfig(member.role);
                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback>
                                {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{member.name}</div>
                              <div className="text-sm text-muted-foreground">{member.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={roleConfig.color}>
                            <div className="flex items-center space-x-1">
                              {roleConfig.icon}
                              <span>{roleConfig.name}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(member.status)}
                            <Badge className={getStatusColor(member.status)}>
                              {member.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {member.lastActiveAt ? (
                            <div className="text-sm">
                              {new Date(member.lastActiveAt).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Never</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-3 w-3" />
                            </Button>
                            {member.role !== "owner" && (
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>
                Manage pending team invitations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingInvitations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Invited By</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingInvitations.map((invitation) => {
                      const roleConfig = getRoleConfig(invitation.role);
                      const daysUntilExpiry = Math.ceil((invitation.expiresAt - Date.now()) / (24 * 60 * 60 * 1000));
                      
                      return (
                        <TableRow key={invitation.id}>
                          <TableCell className="font-medium">
                            {invitation.email}
                          </TableCell>
                          <TableCell>
                            <Badge className={roleConfig.color}>
                              {roleConfig.name}
                            </Badge>
                          </TableCell>
                          <TableCell>{invitation.invitedBy}</TableCell>
                          <TableCell>
                            {new Date(invitation.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">
                                {daysUntilExpiry} days
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Button variant="ghost" size="sm">
                                Resend
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Pending Invitations</h3>
                  <p className="text-muted-foreground mb-4">
                    All team invitations have been responded to.
                  </p>
                  <Button onClick={() => setInviteDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite New Member
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(ROLE_CONFIGS).map(([roleKey, config]) => {
              const groupedPermissions = groupPermissionsByCategory(config.permissions);
              
              return (
                <Card key={roleKey}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      {config.icon}
                      <span>{config.name}</span>
                    </CardTitle>
                    <CardDescription>
                      {config.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(groupedPermissions).map(([category, permissions]) => (
                        <div key={category}>
                          <h4 className="text-sm font-semibold mb-2">{category}</h4>
                          <div className="space-y-1">
                            {permissions.map((permission) => (
                              <div key={permission.id} className="flex items-center space-x-2 text-sm">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                <span>{permission.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Access Audit Trail</CardTitle>
              <CardDescription>
                Monitor team member activities and access patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Audit Logging Active</h3>
                <p className="text-muted-foreground mb-4">
                  All team member activities are being logged for security and compliance.
                </p>
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  View Full Audit Log
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RBACDashboard;
