"use client";

import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { CampaignDetailedStats } from './CampaignStats';
import { CampaignChart } from './CampaignChart';
import { 
  Calendar,
  Users,
  Mail,
  Settings,
  BarChart3,
  Eye,
  Edit,
  Clock,
  Send,
  FileText,
  Target
} from 'lucide-react';

interface CampaignDetailModalProps {
  campaignId: Id<"campaigns"> | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CampaignDetailModal({ campaignId, isOpen, onClose }: CampaignDetailModalProps) {
  const campaign = useQuery(api.campaigns.getCampaignById, 
    campaignId ? { id: campaignId } : 'skip'
  );
  const campaignStats = useQuery(api.campaigns.getCampaignStats,
    campaignId ? { campaignId } : 'skip'
  );
  const template = useQuery(api.templates.getTemplateById,
    campaign?.settings.templateId ? { id: campaign.settings.templateId } : 'skip'
  );

  if (!campaign) {
    return null;
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      sending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-green-100 text-green-800',
      paused: 'bg-orange-100 text-orange-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{campaign.name}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <Badge className={getStatusColor(campaign.status)}>
                  {campaign.status.toUpperCase()}
                </Badge>
                <span>•</span>
                <span>Created {formatDate(campaign.createdAt)}</span>
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="recipients">Recipients</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Campaign Info */}
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
                    <p className="text-sm text-gray-900 mt-1">{campaign.settings.subject}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Template</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {template ? template.name : campaign.settings.customContent ? 'Custom Content' : 'No template'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Target Tags</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {campaign.settings.targetTags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Track Opens</label>
                      <p className="text-sm text-gray-900 mt-1">
                        {campaign.settings.trackOpens ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Track Clicks</label>
                      <p className="text-sm text-gray-900 mt-1">
                        {campaign.settings.trackClicks ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Schedule Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Schedule & Timing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created</label>
                    <p className="text-sm text-gray-900 mt-1">{formatDate(campaign.createdAt)}</p>
                  </div>

                  {campaign.scheduledAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Scheduled For</label>
                      <p className="text-sm text-gray-900 mt-1">{formatDate(campaign.scheduledAt)}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-600">Send Delay</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {campaign.settings.sendDelay || 5} seconds between emails
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Email Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Subject</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                    <p className="text-sm text-gray-900">{campaign.settings.subject}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Content</label>
                  <div className="mt-1 p-4 bg-gray-50 rounded-md border max-h-64 overflow-y-auto">
                    {(() => {
                      // Use HTML content if available from template, fallback to plain content
                      const content = template?.htmlContent || template?.content || campaign.settings.customContent || 'No content available';
                      
                      // Check if content contains HTML tags
                      const isHTML = /<[^>]*>/g.test(content);
                      
                      if (isHTML) {
                        return (
                          <div 
                            className="text-sm email-content-preview"
                            dangerouslySetInnerHTML={{ __html: content }}
                            style={{
                              backgroundColor: '#ffffff',
                              padding: '1rem',
                              borderRadius: '0.375rem',
                              border: '1px solid #e5e7eb',
                              fontSize: '14px'
                            }}
                          />
                        );
                      } else {
                        return (
                          <div 
                            className="text-sm text-gray-900 whitespace-pre-wrap"
                            style={{
                              backgroundColor: '#ffffff',
                              padding: '1rem',
                              borderRadius: '0.375rem',
                              border: '1px solid #e5e7eb'
                            }}
                          >
                            {content}
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>

                {template?.variables && template.variables.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Available Variables</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {template.variables.map((variable) => (
                        <Badge key={variable} variant="outline" className="text-xs">
                          {'{' + variable + '}'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recipients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Target Recipients
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Target Tags</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {campaign.settings.targetTags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {campaignStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{campaignStats.totalEmails}</div>
                      <div className="text-sm text-blue-600">Total Recipients</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{campaignStats.sent}</div>
                      <div className="text-sm text-green-600">Sent</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{campaignStats.pending}</div>
                      <div className="text-sm text-yellow-600">Pending</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{campaignStats.failed}</div>
                      <div className="text-sm text-red-600">Failed</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {campaignStats ? (
              <>
                <CampaignChart stats={campaignStats} />
                <CampaignDetailedStats stats={campaignStats} />
              </>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
                  <p className="text-gray-600">
                    Analytics data will appear here once the campaign starts sending.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
