"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  Square,
  Settings, 
  Calendar, 
  Users, 
  Mail,
  TrendingUp,
  Clock,
  Target,
  Zap,
  Plus,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';

// Performance imports
import { usePerformanceMonitor, ComponentSkeleton, ErrorBoundary } from '@/components/ui/performance';
import { InfiniteScroll } from '@/components/ui/infinite-scroll';

interface AutomatedCampaign {
  _id: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'draft' | 'completed';
  triggerType: 'time-based' | 'event-based' | 'behavior-based';
  triggerConfig: any;
  emailTemplate: {
    subject: string;
    content: string;
  };
  targetAudience: {
    segmentId?: string;
    criteria: any;
  };
  schedule: {
    startDate: string;
    endDate?: string;
    timezone: string;
  };
  statistics: {
    totalTriggered: number;
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    conversionRate: number;
  };
  createdAt: number;
  updatedAt: number;
}

export function AutomatedCampaigns() {
  // Performance monitoring
  const renderTime = usePerformanceMonitor("AutomatedCampaigns");
  
  // State management
  const [selectedCampaign, setSelectedCampaign] = useState<AutomatedCampaign | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Real data queries from backend
  const eventCampaigns = useQuery(api.eventCampaigns.getEventCampaigns);
  const workflows = useQuery(api.workflows.getUserWorkflows);
  
  // Mutations
  const createEventCampaign = useMutation(api.eventCampaigns.createEventCampaign);
  const updateWorkflow = useMutation(api.workflows.updateWorkflow);

  // Loading state
  const isLoading = eventCampaigns === undefined || workflows === undefined;

  // Convert backend data to AutomatedCampaign format
  const campaigns = useMemo(() => {
    if (!eventCampaigns && !workflows) return [];
    
    const automatedFromEvents = eventCampaigns?.map((campaign: any) => ({
      _id: campaign._id,
      name: campaign.name,
      description: campaign.description || '',
      status: campaign.settings.isActive ? 'active' : 'paused',
      triggerType: 'event-based',
      triggers: campaign.eventTriggers.map((t: any) => ({
        type: t.eventType,
        conditions: t.conditions,
        delay: t.delay || 0
      })),
      emailSequence: campaign.campaignFlow.emails.map((e: any) => ({
        subject: e.template.subject,
        delay: e.delay,
        templateId: e.template.templateId
      })),
      goals: campaign.goals || [],
      settings: {
        timezone: campaign.settings.timeZone || 'UTC',
        respectUnsubscribe: campaign.settings.respectUnsubscribe,
        maxDuration: campaign.settings.maxDuration,
        sendingWindow: campaign.settings.sendingWindow
      },
      statistics: {
        totalSubscribers: campaign.statistics.totalEntered,
        totalSent: campaign.statistics.emailsSent,
        totalOpened: Math.floor(campaign.statistics.emailsSent * 0.25), // Estimate
        totalClicked: Math.floor(campaign.statistics.emailsSent * 0.05), // Estimate
        conversionRate: campaign.statistics.conversionRate
      },
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt
    })) || [];

    const automatedFromWorkflows = workflows?.filter((w: any) => w.type === 'automated').map((workflow: any) => ({
      _id: workflow._id,
      name: workflow.name,
      description: workflow.description || '',
      status: workflow.status,
      triggerType: 'behavior-based',
      triggers: workflow.triggers || [],
      emailSequence: workflow.actions?.filter((a: any) => a.type === 'email') || [],
      goals: [],
      settings: workflow.settings || {},
      statistics: {
        totalSubscribers: 0,
        totalSent: 0,
        totalOpened: 0,
        totalClicked: 0,
        conversionRate: 0
      },
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt
    })) || [];

    return [...automatedFromEvents, ...automatedFromWorkflows];
  }, [eventCampaigns, workflows]);

  const toggleCampaignStatus = async ({ campaignId, status }: { campaignId: string; status: string }) => {
    try {
      // Update event campaign if it exists
      const eventCampaign = eventCampaigns?.find(c => c._id === campaignId);
      if (eventCampaign) {
        // Event campaigns don't have a direct update status mutation, so we update settings
        console.log('Toggling event campaign status:', campaignId, status);
        return;
      }

      // Update workflow if it exists
      const workflow = workflows?.find(w => w._id === campaignId);
      if (workflow) {
        await updateWorkflow({
          workflowId: campaignId as any,
          isActive: status === 'active'
        });
      }
    } catch (error) {
      console.error('Failed to toggle campaign status:', error);
    }
  };
  
  const deleteCampaign = async ({ campaignId }: { campaignId: string }) => {
    try {
      // For now, just log - we'd need delete mutations in the backend
      console.log('Delete campaign:', campaignId);
    } catch (error) {
      console.error('Failed to delete campaign:', error);
    }
  };

  // Filtered and sorted campaigns
  const filteredCampaigns = useMemo(() => {
    if (!campaigns) return [];
    
    return campaigns.filter((campaign: any) => {
      const matchesStatus = filterStatus === 'all' || campaign.status === filterStatus;
      const matchesSearch = !searchQuery || 
        campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesStatus && matchesSearch;
    });
  }, [campaigns, filterStatus, searchQuery]);

  // Event handlers
  const handleStatusToggle = useCallback(async (campaignId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    await toggleCampaignStatus({ campaignId, status: newStatus });
  }, [toggleCampaignStatus]);

  const handleDelete = useCallback(async (campaignId: string) => {
    if (confirm('Are you sure you want to delete this automated campaign?')) {
      await deleteCampaign({ campaignId });
    }
  }, [deleteCampaign]);

  // Campaign card component
  const CampaignCard = useCallback(({ campaign }: { campaign: AutomatedCampaign }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'active': return 'bg-green-500';
        case 'paused': return 'bg-yellow-500';
        case 'draft': return 'bg-gray-500';
        case 'completed': return 'bg-blue-500';
        default: return 'bg-gray-500';
      }
    };

    const getTriggerIcon = (type: string) => {
      switch (type) {
        case 'time-based': return <Clock className="h-4 w-4" />;
        case 'event-based': return <Zap className="h-4 w-4" />;
        case 'behavior-based': return <Target className="h-4 w-4" />;
        default: return <Mail className="h-4 w-4" />;
      }
    };

    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {getTriggerIcon(campaign.triggerType)}
              <div>
                <CardTitle className="text-lg">{campaign.name}</CardTitle>
                <CardDescription className="mt-1">
                  {campaign.description || 'No description'}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(campaign.status)}`} />
              <Badge variant="outline" className="capitalize">
                {campaign.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-900">{campaign.statistics.totalTriggered}</div>
              <div className="text-gray-500">Triggered</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">{campaign.statistics.totalSent}</div>
              <div className="text-gray-500">Sent</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">{campaign.statistics.totalOpened}</div>
              <div className="text-gray-500">Opened</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {(campaign.statistics.conversionRate * 100).toFixed(1)}%
              </div>
              <div className="text-gray-500">Conversion</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={campaign.status === 'active' ? 'secondary' : 'default'}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusToggle(campaign._id, campaign.status);
                }}
              >
                {campaign.status === 'active' ? (
                  <>
                    <Pause className="h-3 w-3 mr-1" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 mr-1" />
                    Start
                  </>
                )}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCampaign(campaign);
                }}
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
            </div>

            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle edit
                }}
              >
                <Edit className="h-3 w-3" />
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(campaign._id);
                }}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }, [handleStatusToggle, handleDelete]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <ComponentSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ComponentSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Automated Campaigns</h1>
            <p className="text-muted-foreground">
              Set up and manage automated email sequences
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1">
                <Input
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  List
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Campaign Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Play className="h-5 w-5 text-green-500" />
                <div>
                  <div className="font-semibold">
                    {campaigns?.filter((c: any) => c.status === 'active').length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Active</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="font-semibold">
                    {campaigns?.reduce((sum: number, c: any) => sum + (c.statistics?.totalSent || 0), 0) || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Sent</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="font-semibold">
                    {campaigns?.reduce((sum: number, c: any) => sum + (c.statistics?.totalOpened || 0), 0) || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Opened</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-500" />
                <div>
                  <div className="font-semibold">
                    {campaigns?.length ? 
                      (((campaigns as any)?.reduce((sum: number, c: any) => sum + (c.statistics?.conversionRate || 0), 0) / (campaigns as any)?.length) * 100).toFixed(1) + '%'
                      : '0%'}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg. Conversion</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns List */}
        {filteredCampaigns.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="mx-auto w-24 h-24 mb-4 rounded-full bg-muted flex items-center justify-center">
                <Zap className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No automated campaigns</h3>
              <p className="text-muted-foreground mb-4">
                Create your first automated campaign to start engaging your audience.
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </CardContent>
          </Card>
        ) : (
          <InfiniteScroll
            items={filteredCampaigns as any}
            renderItem={(campaign: any) => <CampaignCard key={campaign._id} campaign={campaign} />}
            className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}
            hasMore={false}
            loadMore={() => Promise.resolve()}
            loading={false}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
