"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Phone, Building, Calendar, TrendingUp, Tag, Edit, ExternalLink } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface Contact {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  position?: string;
  tags: string[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  source?: string;
  lastEngagement?: number;
  emailStats?: {
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    lastOpenedAt?: number;
    lastClickedAt?: number;
  };
  customFields?: Record<string, string>;
}

interface ContactProfileModalProps {
  contact: Contact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactProfileModal({ contact, open, onOpenChange }: ContactProfileModalProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data for email history and analytics
  const emailHistory = [
    { date: "2024-01-15", campaign: "Welcome Series", status: "opened", subject: "Welcome to our platform!" },
    { date: "2024-01-10", campaign: "Product Update", status: "clicked", subject: "New features you'll love" },
    { date: "2024-01-05", campaign: "Newsletter", status: "delivered", subject: "Monthly Newsletter - January" },
  ];

  const engagementData = [
    { month: "Oct", opens: 5, clicks: 2 },
    { month: "Nov", opens: 8, clicks: 4 },
    { month: "Dec", opens: 12, clicks: 7 },
    { month: "Jan", opens: 6, clicks: 3 },
  ];

  const getInitials = () => {
    const first = contact.firstName?.[0] || "";
    const last = contact.lastName?.[0] || "";
    return first + last || contact.email[0].toUpperCase();
  };

  const getFullName = () => {
    const parts = [contact.firstName, contact.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : "Unknown";
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getEngagementRate = () => {
    const stats = contact.emailStats;
    if (!stats || stats.totalSent === 0) return 0;
    return Math.round((stats.totalOpened / stats.totalSent) * 100);
  };

  const getClickRate = () => {
    const stats = contact.emailStats;
    if (!stats || stats.totalSent === 0) return 0;
    return Math.round((stats.totalClicked / stats.totalSent) * 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="text-lg">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-xl">{getFullName()}</DialogTitle>
              <DialogDescription>{contact.email}</DialogDescription>
            </div>
            <div className="ml-auto">
              <Badge variant={contact.isActive ? "default" : "secondary"}>
                {contact.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Email History</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="custom">Custom Fields</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{contact.email}</p>
                      <p className="text-sm text-muted-foreground">Email</p>
                    </div>
                  </div>

                  {contact.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{contact.phone}</p>
                        <p className="text-sm text-muted-foreground">Phone</p>
                      </div>
                    </div>
                  )}

                  {contact.company && (
                    <div className="flex items-center gap-3">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{contact.company}</p>
                        {contact.position && (
                          <p className="text-sm text-muted-foreground">{contact.position}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{formatDate(contact.createdAt)}</p>
                      <p className="text-sm text-muted-foreground">
                        Added {contact.source ? `via ${contact.source}` : "manually"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Email Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Email Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {contact.emailStats ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold">{contact.emailStats.totalSent}</div>
                          <div className="text-sm text-muted-foreground">Sent</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{contact.emailStats.totalOpened}</div>
                          <div className="text-sm text-muted-foreground">Opened</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">{contact.emailStats.totalClicked}</div>
                          <div className="text-sm text-muted-foreground">Clicked</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Open Rate</span>
                          <span className="font-medium">{getEngagementRate()}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(getEngagementRate(), 100)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span>Click Rate</span>
                          <span className="font-medium">{getClickRate()}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(getClickRate(), 100)}%` }}
                          />
                        </div>
                      </div>

                      {contact.emailStats.lastOpenedAt && (
                        <p className="text-sm text-muted-foreground">
                          Last opened: {formatDate(contact.emailStats.lastOpenedAt)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No email data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Tags */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {contact.tags.length > 0 ? (
                      contact.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No tags assigned</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Email Activity</CardTitle>
                <CardDescription>Email campaigns sent to this contact</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {emailHistory.map((email, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{email.subject}</p>
                        <p className="text-sm text-muted-foreground">{email.campaign}</p>
                        <p className="text-xs text-muted-foreground">{email.date}</p>
                      </div>
                      <Badge
                        variant={
                          email.status === "clicked"
                            ? "default"
                            : email.status === "opened"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {email.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Over Time</CardTitle>
                <CardDescription>Email opens and clicks by month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={engagementData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="opens" fill="#3b82f6" name="Opens" />
                      <Bar dataKey="clicks" fill="#10b981" name="Clicks" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Custom Fields</CardTitle>
                <CardDescription>Additional information about this contact</CardDescription>
              </CardHeader>
              <CardContent>
                {contact.customFields && Object.keys(contact.customFields).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(contact.customFields).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-muted-foreground">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No custom fields defined</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 pt-4">
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit Contact
          </Button>
          <Button variant="outline">
            <ExternalLink className="mr-2 h-4 w-4" />
            Add to Campaign
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
