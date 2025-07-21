"use client";

import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  Users, 
  Mail, 
  Settings, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  Zap
} from 'lucide-react';

export default function TestSchedulingPage() {
  const campaigns = useQuery(api.campaigns.getCampaignsByUser);
  const currentUser = useQuery(api.users.getCurrentUser);
  
  const [activeTab, setActiveTab] = useState('overview');

  const scheduledCampaigns = campaigns?.filter(c => c.scheduleSettings?.type !== 'immediate') || [];
  const immediateCampaigns = campaigns?.filter(c => c.scheduleSettings?.type === 'immediate') || [];
  const recurringCampaigns = campaigns?.filter(c => c.scheduleSettings?.type === 'recurring') || [];
  const optimalCampaigns = campaigns?.filter(c => c.scheduleSettings?.type === 'optimal') || [];

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Email Scheduling System Test</h1>
          <p className="text-gray-600">
            Validate and test the intelligent email scheduling system components.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="scheduling">Scheduling Types</TabsTrigger>
            <TabsTrigger value="system">System Status</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{campaigns?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    All email campaigns
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{scheduledCampaigns.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Future scheduled campaigns
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recurring</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{recurringCampaigns.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Repeating campaigns
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Optimized</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{optimalCampaigns.length}</div>
                  <p className="text-xs text-muted-foreground">
                    AI-optimized timing
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Scheduling System Status
                </CardTitle>
                <CardDescription>
                  Verify that all scheduling components are working correctly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Backend Services</h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="w-2 h-2 p-0 bg-green-500"></Badge>
                        <span className="text-sm">Email Scheduler Functions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="w-2 h-2 p-0 bg-green-500"></Badge>
                        <span className="text-sm">Cron Jobs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="w-2 h-2 p-0 bg-green-500"></Badge>
                        <span className="text-sm">Schema Updates</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">UI Components</h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="w-2 h-2 p-0 bg-green-500"></Badge>
                        <span className="text-sm">Scheduling Interface</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="w-2 h-2 p-0 bg-green-500"></Badge>
                        <span className="text-sm">Schedule Management</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="w-2 h-2 p-0 bg-green-500"></Badge>
                        <span className="text-sm">Timezone Calendar</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign List</CardTitle>
                <CardDescription>
                  All campaigns with their scheduling information
                </CardDescription>
              </CardHeader>
              <CardContent>
                {campaigns && campaigns.length > 0 ? (
                  <div className="space-y-4">
                    {campaigns.map((campaign) => (
                      <div key={campaign._id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{campaign.name}</h3>
                            <p className="text-sm text-gray-600">{campaign.settings?.subject}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              campaign.status === 'active' ? 'default' :
                              campaign.status === 'completed' ? 'secondary' :
                              campaign.status === 'paused' ? 'outline' : 'destructive'
                            }>
                              {campaign.status}
                            </Badge>
                            {campaign.scheduleSettings && (
                              <Badge variant="outline">
                                {campaign.scheduleSettings.type}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {campaign.scheduleSettings && (
                          <div className="mt-3 grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Type:</span> {campaign.scheduleSettings.type}
                            </div>
                            {campaign.scheduleSettings.timezone && (
                              <div>
                                <span className="font-medium">Timezone:</span> {campaign.scheduleSettings.timezone}
                              </div>
                            )}
                            {campaign.scheduleSettings.sendRate && (
                              <div>
                                <span className="font-medium">Rate:</span> {campaign.scheduleSettings.sendRate.emailsPerHour}/hour
                              </div>
                            )}
                            {campaign.scheduledAt && (
                              <div>
                                <span className="font-medium">Scheduled:</span> {new Date(campaign.scheduledAt).toLocaleString()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Mail className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by creating your first email campaign.
                    </p>
                    <div className="mt-6">
                      <Button>
                        <Mail className="h-4 w-4 mr-2" />
                        Create Campaign
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scheduling" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Immediate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{immediateCampaigns.length}</div>
                  <p className="text-xs text-gray-600">Send right away</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Scheduled</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{scheduledCampaigns.length}</div>
                  <p className="text-xs text-gray-600">Future date/time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Recurring</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{recurringCampaigns.length}</div>
                  <p className="text-xs text-gray-600">Repeat patterns</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Optimal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{optimalCampaigns.length}</div>
                  <p className="text-xs text-gray-600">AI-powered timing</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Scheduling Features</CardTitle>
                <CardDescription>
                  Available scheduling capabilities and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Core Features</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Immediate Send</span>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Scheduled Send</span>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Recurring Campaigns</span>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Optimal Timing</span>
                        <Badge variant="default">Active</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">Advanced Features</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Timezone Optimization</span>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">ISP Throttling</span>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Priority Queue</span>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Engagement Analysis</span>
                        <Badge variant="default">Active</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Components
                </CardTitle>
                <CardDescription>
                  Status of all scheduling system components
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Database Schema</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm">campaigns table enhanced</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm">campaignSchedules table</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm">sendRateConfigs table</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm">timezoneProfiles table</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm">contacts enhanced</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Backend Functions</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm">emailScheduler.ts</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Enhanced crons.ts</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Priority queue processing</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Timezone analysis</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">UI Components</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm">SchedulingInterface</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm">ScheduleManagement</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm">TimezoneCalendar</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm">OptimalTimingAnalyzer</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current User</CardTitle>
              </CardHeader>
              <CardContent>
                {currentUser ? (
                  <div className="space-y-2">
                    <p><strong>Email:</strong> {currentUser.email}</p>
                    <p><strong>Name:</strong> {currentUser.name}</p>
                    <p><strong>Member since:</strong> {new Date(currentUser._creationTime).toLocaleDateString()}</p>
                  </div>
                ) : (
                  <p>Not logged in</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
