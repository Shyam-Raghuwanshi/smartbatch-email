"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  Mail,
  Eye,
  MousePointer,
  Users,
  Activity,
  Calendar,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface DateRange {
  from: Date;
  to: Date;
}

// Simple date range filter component
function DateRangeFilter({ 
  dateRange, 
  onDateRangeChange 
}: { 
  dateRange: DateRange; 
  onDateRangeChange: (range: DateRange) => void;
}) {
  const presets = [
    {
      label: "Last 7 days",
      range: {
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        to: new Date(),
      },
    },
    {
      label: "Last 30 days",
      range: {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date(),
      },
    },
    {
      label: "Last 90 days",
      range: {
        from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        to: new Date(),
      },
    },
  ];

  return (
    <Select
      value="30days"
      onValueChange={(value) => {
        const preset = presets.find(p => p.label.includes(value.replace(/[^0-9]/g, '')));
        if (preset) {
          onDateRangeChange(preset.range);
        }
      }}
    >
      <SelectTrigger className="w-40">
        <SelectValue placeholder="Select range" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="7days">Last 7 days</SelectItem>
        <SelectItem value="30days">Last 30 days</SelectItem>
        <SelectItem value="90days">Last 90 days</SelectItem>
      </SelectContent>
    </Select>
  );
}

function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  });
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Auto refresh every 5 minutes if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      window.location.reload();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Get analytics data from backend
  const dashboardData = useQuery(api.analyticsData.getDashboardAnalytics, {
    startDate: dateRange.from.getTime(),
    endDate: dateRange.to.getTime(),
  });

  const trendsData = useQuery(api.analyticsData.getPerformanceTrends, {
    startDate: dateRange.from.getTime(),
    endDate: dateRange.to.getTime(),
    granularity: "day",
  });

  const campaignComparison = useQuery(api.analyticsData.getCampaignComparison, {
    limit: 10,
  });

  const audienceData = useQuery(api.analyticsData.getAudienceInsights, {
    startDate: dateRange.from.getTime(),
    endDate: dateRange.to.getTime(),
  });

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
  };

  if (!dashboardData || !trendsData || !campaignComparison || !audienceData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track your email campaign performance and engagement metrics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              "flex items-center gap-2",
              autoRefresh && "bg-green-50 border-green-200 text-green-700"
            )}
          >
            <RefreshCw className={cn("h-4 w-4", autoRefresh && "animate-spin")} />
            Auto Refresh
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <DateRangeFilter
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
            />
            <div className="text-sm text-gray-500">
              {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="audience" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Audience
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.overview.totalEmails.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.overview.totalSent} sent, {dashboardData.overview.totalQueued} queued
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.overview.openRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.overview.totalOpened} opens
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                <MousePointer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.overview.clickRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.overview.totalClicked} clicks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.contacts.total.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.contacts.active} active contacts
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Campaign Status */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Active Campaigns</span>
                  <Badge variant="secondary">{dashboardData.overview.activeCampaigns}</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Delivery Rate</span>
                  <span className="text-sm">{dashboardData.overview.deliveryRate.toFixed(1)}%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Failure Rate</span>
                  <span className="text-sm">{dashboardData.overview.failureRate.toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Recent Campaigns</h4>
                  {dashboardData.recentActivity.campaigns.length === 0 ? (
                    <p className="text-sm text-gray-500">No recent campaigns</p>
                  ) : (
                    <div className="space-y-2">
                      {dashboardData.recentActivity.campaigns.slice(0, 3).map((campaign: any) => (
                        <div key={campaign._id} className="flex items-center justify-between text-sm">
                          <span>{campaign.name}</span>
                          <Badge 
                            variant={campaign.status === 'sent' ? 'default' : 
                                   campaign.status === 'sending' ? 'secondary' : 'outline'}
                          >
                            {campaign.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Recent Emails</h4>
                  {dashboardData.recentActivity.emails.length === 0 ? (
                    <p className="text-sm text-gray-500">No recent emails</p>
                  ) : (
                    <div className="space-y-2">
                      {dashboardData.recentActivity.emails.slice(0, 3).map((email: any) => (
                        <div key={email._id} className="flex items-center justify-between text-sm">
                          <span className="truncate max-w-40">{email.recipient}</span>
                          <Badge 
                            variant={email.status === 'sent' ? 'default' : 
                                   email.status === 'failed' ? 'destructive' : 'outline'}
                          >
                            {email.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="sent" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Emails Sent"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="opened" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Emails Opened"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="clicked" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      name="Emails Clicked"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Engagement Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                    <Line 
                      type="monotone" 
                      dataKey="openRate" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Open Rate (%)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="clickRate" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      name="Click Rate (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaignComparison.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No campaigns found</p>
                    <p className="text-sm text-gray-500">Create your first campaign to see analytics</p>
                  </div>
                ) : (
                  campaignComparison.map((campaign: any) => (
                    <div key={campaign.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{campaign.name}</h3>
                        <Badge 
                          variant={campaign.status === 'sent' ? 'default' : 
                                 campaign.status === 'sending' ? 'secondary' : 'outline'}
                        >
                          {campaign.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Sent</p>
                          <p className="font-medium">{campaign.sent}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Open Rate</p>
                          <p className="font-medium">{campaign.openRate.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Click Rate</p>
                          <p className="font-medium">{campaign.clickRate.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Delivery Rate</p>
                          <p className="font-medium">{campaign.deliveryRate.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audience Tab */}
        <TabsContent value="audience" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{audienceData.totalContacts.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {audienceData.activeContacts} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Contacts</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{audienceData.newContacts.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {audienceData.growthRate.toFixed(1)}% growth rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Engagement</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{audienceData.engagementLevels.high}</div>
                <p className="text-xs text-muted-foreground">
                  {audienceData.totalContacts > 0 ? 
                    ((audienceData.engagementLevels.high / audienceData.totalContacts) * 100).toFixed(1) : 0}% of audience
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Emails/Contact</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{audienceData.avgEmailsPerContact.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">
                  Per contact in period
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Levels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">High Engagement</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ 
                            width: `${audienceData.totalContacts > 0 ? 
                              (audienceData.engagementLevels.high / audienceData.totalContacts) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{audienceData.engagementLevels.high}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Medium Engagement</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full" 
                          style={{ 
                            width: `${audienceData.totalContacts > 0 ? 
                              (audienceData.engagementLevels.medium / audienceData.totalContacts) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{audienceData.engagementLevels.medium}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Low Engagement</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full" 
                          style={{ 
                            width: `${audienceData.totalContacts > 0 ? 
                              (audienceData.engagementLevels.low / audienceData.totalContacts) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{audienceData.engagementLevels.low}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Inactive</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ 
                            width: `${audienceData.totalContacts > 0 ? 
                              (audienceData.engagementLevels.inactive / audienceData.totalContacts) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{audienceData.engagementLevels.inactive}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {audienceData.topTags.length === 0 ? (
                    <p className="text-sm text-gray-500">No tags found</p>
                  ) : (
                    audienceData.topTags.map((tagData: any) => (
                      <div key={tagData.tag} className="flex items-center justify-between">
                        <Badge variant="outline">{tagData.tag}</Badge>
                        <span className="text-sm text-gray-600">{tagData.count} contacts</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AnalyticsWrapper() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    }>
      <AnalyticsPage />
    </Suspense>
  );
}
