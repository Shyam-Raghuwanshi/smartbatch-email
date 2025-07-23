'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import {
  TrendingDown,
  Users,
  Mail,
  MousePointer,
  ShoppingCart,
  Target,
  Filter,
  Download,
  ArrowDown,
  ArrowRight,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface FunnelAnalysisProps {
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export default function FunnelAnalysis({ dateRange }: FunnelAnalysisProps) {
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [selectedSegment, setSelectedSegment] = useState('all');

  // Mock data - in real app, this would come from Convex
  const overallFunnel = [
    { stage: 'Emails Sent', count: 50000, percentage: 100, dropoff: 0 },
    { stage: 'Delivered', count: 47500, percentage: 95, dropoff: 5 },
    { stage: 'Opened', count: 14250, percentage: 30, dropoff: 70 },
    { stage: 'Clicked', count: 2375, percentage: 5, dropoff: 83.3 },
    { stage: 'Converted', count: 475, percentage: 1, dropoff: 80 }
  ];

  const funnelTrends = [
    { date: '2024-01-01', sent: 8000, delivered: 7600, opened: 2280, clicked: 380, converted: 76 },
    { date: '2024-01-08', sent: 8200, delivered: 7790, opened: 2337, clicked: 394, converted: 82 },
    { date: '2024-01-15', sent: 7800, delivered: 7410, opened: 2223, clicked: 356, converted: 71 },
    { date: '2024-01-22', sent: 8500, delivered: 8075, opened: 2423, clicked: 425, converted: 89 },
    { date: '2024-01-29', sent: 8100, delivered: 7695, opened: 2309, clicked: 405, converted: 81 }
  ];

  const campaignFunnels = [
    {
      campaign: 'Welcome Series',
      sent: 12000,
      delivered: 11520,
      opened: 4608,
      clicked: 922,
      converted: 184,
      conversionRate: 1.53
    },
    {
      campaign: 'Product Launch',
      sent: 15000,
      delivered: 14250,
      opened: 3420,
      clicked: 684,
      converted: 137,
      conversionRate: 0.91
    },
    {
      campaign: 'Newsletter',
      sent: 20000,
      delivered: 19000,
      opened: 5700,
      clicked: 570,
      converted: 114,
      conversionRate: 0.57
    },
    {
      campaign: 'Promotional',
      sent: 8000,
      delivered: 7600,
      opened: 2280,
      clicked: 456,
      converted: 91,
      conversionRate: 1.14
    }
  ];

  const segmentFunnels = [
    {
      segment: 'New Subscribers',
      sent: 15000,
      delivered: 14250,
      opened: 4988,
      clicked: 998,
      converted: 200,
      conversionRate: 1.33
    },
    {
      segment: 'Active Users',
      sent: 20000,
      delivered: 19400,
      opened: 6790,
      clicked: 1358,
      converted: 272,
      conversionRate: 1.36
    },
    {
      segment: 'VIP Customers',
      sent: 5000,
      delivered: 4900,
      opened: 1960,
      clicked: 490,
      converted: 147,
      conversionRate: 2.94
    },
    {
      segment: 'Re-engagement',
      sent: 10000,
      delivered: 9500,
      opened: 1425,
      clicked: 143,
      converted: 14,
      conversionRate: 0.14
    }
  ];

  const deviceFunnels = [
    { device: 'Desktop', opened: 6840, clicked: 1368, converted: 274, rate: 4.0 },
    { device: 'Mobile', opened: 5985, clicked: 719, converted: 144, rate: 2.4 },
    { device: 'Tablet', opened: 1425, clicked: 171, converted: 34, rate: 2.4 }
  ];

  const timeBasedFunnel = [
    { hour: '6AM', opened: 15.2, clicked: 2.1, converted: 0.8 },
    { hour: '9AM', opened: 28.5, clicked: 4.2, converted: 1.2 },
    { hour: '12PM', opened: 32.1, clicked: 5.8, converted: 1.8 },
    { hour: '3PM', opened: 24.7, clicked: 3.9, converted: 1.1 },
    { hour: '6PM', opened: 31.8, clicked: 5.2, converted: 1.5 },
    { hour: '9PM', opened: 19.3, clicked: 2.8, converted: 0.9 }
  ];

  const bottlenecks = [
    {
      stage: 'Open Rate',
      current: 30,
      benchmark: 22,
      status: 'above',
      improvement: 'Strong subject lines driving opens'
    },
    {
      stage: 'Click-through Rate',
      current: 5,
      benchmark: 3.2,
      status: 'above',
      improvement: 'Engaging content and clear CTAs'
    },
    {
      stage: 'Conversion Rate',
      current: 1,
      benchmark: 2.1,
      status: 'below',
      improvement: 'Landing page optimization needed'
    }
  ];

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  const calculateDropoff = (current: number, previous: number) => {
    return ((previous - current) / previous * 100).toFixed(1);
  };

  const formatFunnelData = (data: any[]) => {
    return data.map((item, index) => ({
      ...item,
      fill: COLORS[index % COLORS.length]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Funnel Analysis</h2>
          <p className="text-gray-600">Track conversion paths and identify optimization opportunities</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {overallFunnel.map((stage, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">{stage.stage}</p>
                {index > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    -{stage.dropoff}%
                  </Badge>
                )}
              </div>
              <p className="text-2xl font-bold">{stage.count.toLocaleString()}</p>
              <p className="text-sm text-gray-600">{stage.percentage}% of sent</p>
              <div className="mt-2">
                <Progress value={stage.percentage} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="campaigns">By Campaign</TabsTrigger>
          <TabsTrigger value="segments">By Segment</TabsTrigger>
          <TabsTrigger value="devices">By Device</TabsTrigger>
          <TabsTrigger value="timing">By Time</TabsTrigger>
          <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>Overall email-to-conversion flow</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {overallFunnel.map((stage, index) => (
                    <div key={index} className="relative">
                      <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-transparent">
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="font-medium">{stage.stage}</h3>
                            <p className="text-sm text-gray-600">{stage.count.toLocaleString()} users</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{stage.percentage}%</p>
                          {index > 0 && (
                            <p className="text-sm text-red-600 flex items-center gap-1">
                              <TrendingDown className="h-4 w-4" />
                              {stage.dropoff}% drop
                            </p>
                          )}
                        </div>
                      </div>
                      {index < overallFunnel.length - 1 && (
                        <div className="flex justify-center py-2">
                          <ArrowDown className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Funnel Visualization</CardTitle>
                <CardDescription>Visual representation of conversion flow</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <FunnelChart>
                      <Tooltip />
                      <Funnel
                        dataKey="count"
                        data={formatFunnelData(overallFunnel)}
                        isAnimationActive
                      >
                        <LabelList position="center" fill="#fff" stroke="none" />
                      </Funnel>
                    </FunnelChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Funnel Performance Trends</CardTitle>
              <CardDescription>Track how your funnel metrics change over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={funnelTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="sent" stroke="#94A3B8" strokeWidth={2} name="Sent" />
                    <Line type="monotone" dataKey="delivered" stroke="#10B981" strokeWidth={2} name="Delivered" />
                    <Line type="monotone" dataKey="opened" stroke="#3B82F6" strokeWidth={2} name="Opened" />
                    <Line type="monotone" dataKey="clicked" stroke="#F59E0B" strokeWidth={2} name="Clicked" />
                    <Line type="monotone" dataKey="converted" stroke="#EF4444" strokeWidth={2} name="Converted" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Funnel Comparison</CardTitle>
              <CardDescription>Compare conversion funnels across different campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaignFunnels.map((campaign, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-lg">{campaign.campaign}</h3>
                      <Badge 
                        className={campaign.conversionRate > 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                      >
                        {campaign.conversionRate}% conversion
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{campaign.sent.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Sent</p>
                        <div className="mt-2 bg-gray-200 h-2 rounded-full">
                          <div className="bg-blue-500 h-2 rounded-full" style={{width: '100%'}}></div>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-2xl font-bold">{campaign.delivered.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Delivered</p>
                        <div className="mt-2 bg-gray-200 h-2 rounded-full">
                          <div className="bg-green-500 h-2 rounded-full" style={{width: `${(campaign.delivered/campaign.sent)*100}%`}}></div>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-2xl font-bold">{campaign.opened.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Opened</p>
                        <div className="mt-2 bg-gray-200 h-2 rounded-full">
                          <div className="bg-yellow-500 h-2 rounded-full" style={{width: `${(campaign.opened/campaign.sent)*100}%`}}></div>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-2xl font-bold">{campaign.clicked.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Clicked</p>
                        <div className="mt-2 bg-gray-200 h-2 rounded-full">
                          <div className="bg-orange-500 h-2 rounded-full" style={{width: `${(campaign.clicked/campaign.sent)*100}%`}}></div>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-2xl font-bold">{campaign.converted.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Converted</p>
                        <div className="mt-2 bg-gray-200 h-2 rounded-full">
                          <div className="bg-red-500 h-2 rounded-full" style={{width: `${(campaign.converted/campaign.sent)*100}%`}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments">
          <Card>
            <CardHeader>
              <CardTitle>Segment Funnel Performance</CardTitle>
              <CardDescription>Compare how different audience segments convert</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={segmentFunnels}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="segment" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="opened" fill="#3B82F6" name="Opened" />
                    <Bar dataKey="clicked" fill="#F59E0B" name="Clicked" />
                    <Bar dataKey="converted" fill="#10B981" name="Converted" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices">
          <Card>
            <CardHeader>
              <CardTitle>Device-Based Conversion</CardTitle>
              <CardDescription>Funnel performance across different devices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {deviceFunnels.map((device, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h3 className="font-medium text-lg mb-4">{device.device}</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Opened</span>
                        <span className="font-bold">{device.opened.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Clicked</span>
                        <span className="font-bold">{device.clicked.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Converted</span>
                        <span className="font-bold">{device.converted.toLocaleString()}</span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Conversion Rate</span>
                          <span className="font-bold text-lg">{device.rate}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timing">
          <Card>
            <CardHeader>
              <CardTitle>Time-Based Funnel Analysis</CardTitle>
              <CardDescription>How conversion rates vary throughout the day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeBasedFunnel}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="opened" 
                      stackId="1" 
                      stroke="#3B82F6" 
                      fill="#3B82F6" 
                      fillOpacity={0.6}
                      name="Open Rate %"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="clicked" 
                      stackId="2" 
                      stroke="#F59E0B" 
                      fill="#F59E0B" 
                      fillOpacity={0.6}
                      name="Click Rate %"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="converted" 
                      stackId="3" 
                      stroke="#10B981" 
                      fill="#10B981" 
                      fillOpacity={0.6}
                      name="Conversion Rate %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bottlenecks">
          <Card>
            <CardHeader>
              <CardTitle>Funnel Bottlenecks & Optimization</CardTitle>
              <CardDescription>Identify areas for improvement in your conversion funnel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {bottlenecks.map((bottleneck, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-lg">{bottleneck.stage}</h3>
                      {bottleneck.status === 'above' ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Current Performance</p>
                        <p className={`text-2xl font-bold ${bottleneck.status === 'above' ? 'text-green-600' : 'text-red-600'}`}>
                          {bottleneck.current}%
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Industry Benchmark</p>
                        <p className="text-2xl font-bold text-gray-600">{bottleneck.benchmark}%</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Performance Gap</p>
                        <p className={`text-2xl font-bold ${bottleneck.status === 'above' ? 'text-green-600' : 'text-red-600'}`}>
                          {bottleneck.status === 'above' ? '+' : ''}{(bottleneck.current - bottleneck.benchmark).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Optimization Insight:</strong> {bottleneck.improvement}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
