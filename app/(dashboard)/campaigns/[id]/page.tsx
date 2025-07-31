"use client";

import React, { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Clock,
  Mail,
  Users,
  Eye,
  Edit,
  Play,
  Pause,
  Square,
  TrendingUp,
  ArrowLeft,
  Settings,
  Target,
  Timer,
  Globe,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
} from "lucide-react";
import { toast } from "sonner";

export default function CampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as Id<"campaigns">;
  
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const campaign = useQuery(api.campaigns.getCampaignById, { id: campaignId });
  const analytics = useQuery(api.analytics.getCampaignAnalytics, { campaignId });
  const scheduleEntries = useQuery(api.emailScheduler.getCampaignSchedules, { campaignId });
  const contacts = useQuery(api.contacts.getContactsByTags, { 
    tags: campaign?.settings.targetTags || [] 
  });
  
  const updateCampaignStatus = useMutation(api.campaigns.updateCampaignStatus);

  if (!campaign) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Campaign not found</h1>
          <p className="text-gray-600 mt-2">The campaign you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const handleStatusChange = async (newStatus: "paused" | "cancelled" | "scheduled") => {
    try {
      await updateCampaignStatus({ id: campaignId, status: newStatus });
      toast.success(`Campaign ${newStatus} successfully`);
    } catch (error) {
      console.error('Error updating campaign status:', error);
      toast.error(`Failed to ${newStatus} campaign`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-100 text-gray-800";
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "sending": return "bg-yellow-100 text-yellow-800";
      case "sent": return "bg-green-100 text-green-800";
      case "paused": return "bg-orange-100 text-orange-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  };

  const getEmailContent = () => {
    if (campaign.settings.customContent) {
      return campaign.settings.customContent;
    }
    // If using template, we'd fetch template content here
    return "Content from selected template would be displayed here.";
  };

  const targetContactsCount = contacts?.length || 0;
  const sentCount = analytics?.sent || 0;
  const openRate = analytics && analytics.sent > 0 ? ((analytics.opened || 0) / analytics.sent * 100) : 0;
  const clickRate = analytics && analytics.sent > 0 ? ((analytics.clicked || 0) / analytics.sent * 100) : 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getStatusColor(campaign.status)}>
                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
              </Badge>
              <span className="text-gray-500">•</span>
              <span className="text-gray-600">Created {formatDateTime(campaign.createdAt)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" onClick={() => router.push(`/campaigns/edit/${campaignId}`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          {campaign.status === "scheduled" && (
            <Button variant="outline" onClick={() => handleStatusChange("paused")}>
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          )}
          {campaign.status === "paused" && (
            <Button onClick={() => handleStatusChange("scheduled")}>
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
          )}
          {(campaign.status === "scheduled" || campaign.status === "paused") && (
            <Button variant="destructive" onClick={() => handleStatusChange("cancelled")}>
              <Square className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Target Recipients</p>
                <p className="text-2xl font-bold">{targetContactsCount}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Emails Sent</p>
                <p className="text-2xl font-bold">{sentCount}</p>
                {targetContactsCount > 0 && (
                  <Progress 
                    value={(sentCount / targetContactsCount) * 100} 
                    className="mt-2"
                  />
                )}
              </div>
              <Send className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Rate</p>
                <p className="text-2xl font-bold">{openRate.toFixed(1)}%</p>
                <p className="text-sm text-gray-500">{analytics?.opened || 0} opens</p>
              </div>
              <Mail className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Click Rate</p>
                <p className="text-2xl font-bold">{clickRate.toFixed(1)}%</p>
                <p className="text-sm text-gray-500">{analytics?.clicked || 0} clicks</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Campaign Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Subject Line</label>
              <p className="text-gray-900">{campaign.settings.subject}</p>
            </div>
            
            <Separator />
            
            <div>
              <label className="text-sm font-medium text-gray-600">Target Tags</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {campaign.settings.targetTags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    <Target className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Track Opens</label>
                <div className="flex items-center gap-1 mt-1">
                  {campaign.settings.trackOpens ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm">
                    {campaign.settings.trackOpens ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Track Clicks</label>
                <div className="flex items-center gap-1 mt-1">
                  {campaign.settings.trackClicks ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm">
                    {campaign.settings.trackClicks ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>
            
            {campaign.settings.sendDelay && (
              <>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-gray-600">Send Delay</label>
                  <div className="flex items-center gap-1 mt-1">
                    <Timer className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{campaign.settings.sendDelay} seconds between emails</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Schedule Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {campaign.scheduledAt ? (
              <div>
                <label className="text-sm font-medium text-gray-600">Scheduled For</label>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span>{formatDateTime(campaign.scheduledAt)}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No schedule set</p>
              </div>
            )}
            
            {campaign.scheduleSettings && (
              <>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-gray-600">Schedule Type</label>
                  <p className="text-gray-900 capitalize">{campaign.scheduleSettings.type}</p>
                </div>
                
                {campaign.scheduleSettings.timezone && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Timezone</label>
                    <div className="flex items-center gap-1 mt-1">
                      <Globe className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{campaign.scheduleSettings.timezone}</span>
                    </div>
                  </div>
                )}
                
                {campaign.scheduleSettings.sendRate && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Send Rate Limits</label>
                    <div className="text-sm text-gray-600 mt-1">
                      <p>• {campaign.scheduleSettings.sendRate.emailsPerHour} emails/hour</p>
                      <p>• {campaign.scheduleSettings.sendRate.emailsPerDay} emails/day</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Schedule Entries */}
      {scheduleEntries && scheduleEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Schedule History
            </CardTitle>
            <CardDescription>
              Execution history for this campaign
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scheduled For</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Executed At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduleEntries.map((entry) => (
                  <TableRow key={entry._id}>
                    <TableCell>{formatDateTime(entry.scheduledAt)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        entry.status === "processed" ? "bg-green-100 text-green-800" :
                        entry.status === "pending" ? "bg-blue-100 text-blue-800" :
                        entry.status === "failed" ? "bg-red-100 text-red-800" :
                        "bg-yellow-100 text-yellow-800"
                      }>
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{entry.recipientCount || 0}</TableCell>
                    <TableCell>
                      {entry.actualSentAt ? formatDateTime(entry.actualSentAt) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Email Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Preview how your email will appear to recipients
            </DialogDescription>
          </DialogHeader>
          
          <div className="border rounded-lg bg-white p-4">
            <div className="border-b pb-3 mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>From: Your Name &lt;noreply@yourcompany.com&gt;</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <div className="text-sm text-gray-600 mb-1">
                To: Sample Recipient &lt;sample@example.com&gt;
              </div>
              <div className="text-lg font-semibold text-gray-900">
                Subject: {campaign.settings.subject}
              </div>
            </div>
            
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-gray-900">
                {getEmailContent()}
              </div>
            </div>
            
            <div className="border-t pt-4 mt-6 text-xs text-gray-500">
              <p>This is a preview of your email campaign.</p>
              <p className="mt-1">
                Recipients: {targetContactsCount} contact{targetContactsCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
