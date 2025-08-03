"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  BarChart3, 
  Thermometer, 
  Clock,
  AlertTriangle,
  Eye,
  TrendingUp,
  RefreshCw,
  Bell
} from 'lucide-react';
import { Id } from "@/convex/_generated/dataModel";
import { RealTimeMonitoring } from '@/components/campaigns/RealTimeMonitoring';
import { EngagementHeatmap } from '@/components/campaigns/EngagementHeatmap';
import { SendingQueueOverview } from '@/components/campaigns/SendingQueueOverview';
import { AlertingSystem } from '@/components/campaigns/AlertingSystem';
import { PerformanceCharts } from '@/components/campaigns/PerformanceCharts';
import { toast } from "sonner";

function CampaignMonitoring() {
  const searchParams = useSearchParams();
  const campaignIdParam = searchParams.get('campaign');
  const campaignId = campaignIdParam as Id<"campaigns"> | undefined;
  
  const [activeTab, setActiveTab] = useState(campaignId ? "realtime" : "overview");
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<Id<"campaigns">[]>(
    campaignId ? [campaignId] : []
  );
  const [heatmapDays, setHeatmapDays] = useState(7);
  
  // Get campaigns with real-time updates
  const userId = useQuery(api.lib.getUserId);
  const campaigns = useQuery(api.campaigns.getCampaignsByUser);
  const campaignUpdates = useQuery(api.optimizedQueries.subscribeCampaignUpdates, userId ? {
    userId: userId,
  } : "skip");
  
  // Merge campaign updates
  const mergedCampaigns = React.useMemo(() => {
    if (!campaigns) return [];
    if (!campaignUpdates) return campaigns;
    
    const updateMap = new Map(campaignUpdates.map(c => [c._id, c]));
    return campaigns.map(campaign => {
      const update = updateMap.get(campaign._id);
      return update ? { ...campaign, ...update } : campaign;
    });
  }, [campaigns, campaignUpdates]);
  
  // Get alerts for all campaigns
  const alerts = useQuery(api.campaignMonitoring.getAlertTriggers, {});
  
  // Get comparative data for selected campaigns (for CSV export)
  const comparativeData = useQuery(
    api.campaignMonitoring.getComparativeCampaignAnalytics,
    selectedCampaignIds.length > 0 ? { 
      campaignIds: selectedCampaignIds, 
      timeRange: heatmapDays 
    } : "skip"
  );
  
  // Campaign control mutations
  const pauseCampaign = useMutation(api.campaigns.pauseCampaign);
  const resumeCampaign = useMutation(api.campaigns.resumeCampaign);
  const emergencyStopCampaign = useMutation(api.campaigns.emergencyStopCampaign);
  
  // Get all campaigns with status grouping
  const allCampaigns = React.useMemo(() => mergedCampaigns, [mergedCampaigns]);
  
  // Get active campaigns (sending or scheduled)
  const activeCampaigns = React.useMemo(() => 
    mergedCampaigns.filter((c: any) => 
      c.status === 'sending' || c.status === 'scheduled' || c.status === 'paused'
    ),
    [mergedCampaigns]
  );
  
  const selectedCampaign = campaignId ? mergedCampaigns.find((c: any) => c._id === campaignId) : null;
  
  const handlePauseCampaign = async () => {
    if (!campaignId) return;
    
    try {
      await pauseCampaign({ campaignId });
      toast.success("Campaign paused successfully");
    } catch (error) {
      toast.error("Failed to pause campaign");
      console.error(error);
    }
  };
  
  const handleResumeCampaign = async () => {
    if (!campaignId) return;
    
    try {
      await resumeCampaign({ campaignId });
      toast.success("Campaign resumed successfully");
    } catch (error) {
      toast.error("Failed to resume campaign");
      console.error(error);
    }
  };
  
  const handleEmergencyStop = async () => {
    if (!campaignId) return;
    
    if (confirm("Are you sure you want to emergency stop this campaign? This action cannot be undone.")) {
      try {
        await emergencyStopCampaign({ campaignId });
        toast.success("Campaign stopped successfully");
      } catch (error) {
        toast.error("Failed to stop campaign");
        console.error(error);
      }
    }
  };
  
  const handleExportCSV = () => {
    if (!comparativeData || comparativeData.length === 0) {
      toast.error("No campaign data available for export");
      return;
    }
    
    const csvData = [
      ['Campaign Name', 'Status', 'Sent', 'Delivered', 'Delivery Rate', 'Open Rate', 'Click Rate', 'Bounce Rate', 'Unsubscribe Rate', 'Created Date']
    ];
    
    comparativeData.forEach(campaign => {
      const stats = campaign.stats || {};
      const rates = campaign.rates || {};
      
      csvData.push([
        campaign.campaignName || 'Unknown Campaign',
        campaign.status || 'Unknown',
        (stats.sent || 0).toString(),
        (stats.delivered || 0).toString(),
        `${(rates.deliveryRate || 0).toFixed(2)}%`,
        `${(rates.openRate || 0).toFixed(2)}%`,
        `${(rates.clickRate || 0).toFixed(2)}%`,
        `${(rates.bounceRate || 0).toFixed(2)}%`,
        `${(rates.unsubscribeRate || 0).toFixed(2)}%`,
        campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : 'Unknown Date'
      ]);
    });
    
    const csvContent = csvData.map(row => 
      row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`)
    ).map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign-monitoring-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success(`CSV exported successfully! (${comparativeData.length} campaigns)`);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaign Monitoring</h1>
          <p className="mt-1 text-sm text-gray-600">
            Real-time campaign performance and analytics dashboard
          </p>
          {selectedCampaign && (
            <div className="mt-2">
              <Badge variant="outline" className="mr-2">
                Monitoring: {selectedCampaign.name}
              </Badge>
              <Badge variant={
                selectedCampaign.status === 'sending' ? 'default' :
                selectedCampaign.status === 'paused' ? 'secondary' : 'outline'
              }>
                {selectedCampaign.status}
              </Badge>
            </div>
          )}
        </div>
        
      </div>
      
      {/* Global Alerts */}
      {alerts && alerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              System Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 3).map((alert: any, index: number) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Badge variant="destructive">{alert.type}</Badge>
                  <span>{alert.message}</span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
              {alerts.length > 3 && (
                <div className="text-sm text-red-600">
                  ...and {alerts.length - 3} more alerts
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Campaign Selection for Single Campaign Mode */}
      {!campaignId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Select Campaign to Monitor</CardTitle>
                <CardDescription>
                  Choose campaigns for detailed monitoring and analytics. Select multiple campaigns to export comparative data.
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <select 
                  value={heatmapDays} 
                  onChange={(e) => setHeatmapDays(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value={7}>Last 7 days</option>
                  <option value={14}>Last 14 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 90 days</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={selectedCampaignIds.length === 0}
                  onClick={handleExportCSV}
                  className="flex items-center gap-2"
                >
                  Export CSV
                  {selectedCampaignIds.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedCampaignIds.length}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {!allCampaigns.length && (
                <div className="col-span-full text-center text-gray-500">
                  No campaigns available. Create a campaign to get started.
                </div>
              )}
              {allCampaigns.map((campaign: any) => {
                const isActive = ['sending', 'scheduled', 'paused'].includes(campaign.status);
                const isCompleted = ['completed', 'sent'].includes(campaign.status);
                const isFailed = ['failed', 'cancelled'].includes(campaign.status);
                const isSelected = selectedCampaignIds.includes(campaign._id);
                
                return (
                  <Button
                    key={campaign._id}
                    variant={isSelected ? "default" : "outline"}
                    className={`h-auto p-4 justify-start ${isSelected ? 'bg-blue-500 text-white' : ''}`}
                    onClick={() => {
                      if (isSelected) {
                        // If already selected, remove from selection
                        setSelectedCampaignIds(prev => prev.filter(id => id !== campaign._id));
                      } else {
                        // If not selected, add to selection
                        setSelectedCampaignIds(prev => [...prev, campaign._id]);
                      }
                      // Only set active tab if this is the first selection
                      if (selectedCampaignIds.length === 0) {
                        setActiveTab("realtime");
                      }
                    }}
                  >
                    <div className="text-left w-full">
                      <div className="font-medium">{campaign.name}</div>
                      <div className={`text-sm mb-2 ${isSelected ? 'text-blue-100' : 'text-gray-600'}`}>
                        {campaign.settings.subject}
                      </div>
                      <Badge 
                        variant={
                          campaign.status === 'sending' ? 'default' :
                          campaign.status === 'paused' ? 'secondary' :
                          campaign.status === 'scheduled' ? 'default' :
                          isCompleted ? 'default' :
                          isFailed ? 'destructive' : 'outline'
                        }
                        className={
                          campaign.status === 'sending' ? 'bg-green-500 text-white' :
                          campaign.status === 'scheduled' ? 'bg-blue-600 text-white' :
                          isCompleted ? 'bg-gray-500 text-white' :
                          isFailed ? '' : ''
                        }
                      >
                        {campaign.status}
                      </Badge>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="realtime" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Real-time
          </TabsTrigger>
          <TabsTrigger value="engagement" className="flex items-center gap-2">
            <Thermometer className="h-4 w-4" />
            Engagement
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alerts
          </TabsTrigger>
        </TabsList>
        
        {/* Queue Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <SendingQueueOverview />
        </TabsContent>
        
        {/* Real-time Monitoring Tab */}
        <TabsContent value="realtime" className="space-y-6">
          {(campaignId || selectedCampaignIds.length > 0) ? (
            <RealTimeMonitoring
              campaignId={campaignId || selectedCampaignIds[0]}
              onPause={handlePauseCampaign}
              onResume={handleResumeCampaign}
              onEmergencyStop={handleEmergencyStop}
            />
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Activity className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Campaign Selected</h3>
                <p className="text-gray-600">Select a campaign from the overview tab to view real-time monitoring.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Engagement Heatmap Tab */}
        <TabsContent value="engagement" className="space-y-6">
          {(campaignId || selectedCampaignIds.length > 0) ? (
            <EngagementHeatmap
              campaignId={campaignId || selectedCampaignIds[0]}
              days={heatmapDays}
              onDaysChange={setHeatmapDays}
            />
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Thermometer className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Campaign Selected</h3>
                <p className="text-gray-600">Select a campaign to view engagement heatmap and patterns.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Performance Charts Tab */}
        <TabsContent value="performance" className="space-y-6">
          {(campaignId || selectedCampaignIds.length > 0) ? (
            <PerformanceCharts
              campaignId={campaignId || selectedCampaignIds[0]}
              timeRange={heatmapDays}
            />
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <BarChart3 className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Campaign Selected</h3>
                <p className="text-gray-600">Select a campaign to view detailed performance charts and analytics.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Alerting System Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <AlertingSystem />
        </TabsContent>
      </Tabs>
      
      {/* Quick Action Cards for Active Campaigns */}
      {activeCampaigns.length > 0 && activeTab === "overview" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Monitor and control your active campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCampaigns.slice(0, 6).map((campaign:any) => (
                <div key={campaign._id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 truncate">{campaign.name}</h3>
                    <Badge 
                      variant={
                        campaign.status === 'sending' ? 'default' :
                        campaign.status === 'paused' ? 'secondary' : 'outline'
                      }
                    >
                      {campaign.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 truncate">{campaign.settings.subject}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedCampaignIds([campaign._id]);
                        setActiveTab("realtime");
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Monitor
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedCampaignIds([campaign._id]);
                        setActiveTab("engagement");
                      }}
                    >
                      <Thermometer className="h-3 w-3 mr-1" />
                      Heatmap
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedCampaignIds([campaign._id]);
                        setActiveTab("performance");
                      }}
                    >
                      <BarChart3 className="h-3 w-3 mr-1" />
                      Charts
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MonitoringWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CampaignMonitoring />
    </Suspense>
  );
}

export default MonitoringWrapper;
