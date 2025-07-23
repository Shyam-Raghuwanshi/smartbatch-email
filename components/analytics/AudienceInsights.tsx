"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  Users,
  MapPin,
  Globe,
  Clock,
  TrendingUp,
  TrendingDown,
  Heart,
  Star,
  Award,
  UserCheck,
  UserX
} from 'lucide-react';

interface AudienceInsightsProps {
  dateRange: {
    from: Date;
    to: Date;
  };
}

export function AudienceInsights({ dateRange }: AudienceInsightsProps) {
  const [segmentType, setSegmentType] = useState('engagement');

  // Mock data - replace with actual data from props
  const demographicData = [
    { age: '18-24', count: 1250, percentage: 15.2 },
    { age: '25-34', count: 2850, percentage: 34.6 },
    { age: '35-44', count: 2100, percentage: 25.5 },
    { age: '45-54', count: 1450, percentage: 17.6 },
    { age: '55+', count: 580, percentage: 7.1 },
  ];

  const locationData = [
    { country: 'United States', users: 3500, percentage: 42.3 },
    { country: 'Canada', users: 1200, percentage: 14.5 },
    { country: 'United Kingdom', users: 980, percentage: 11.9 },
    { country: 'Australia', users: 750, percentage: 9.1 },
    { country: 'Germany', users: 650, percentage: 7.9 },
    { country: 'France', users: 540, percentage: 6.5 },
    { country: 'Others', users: 650, percentage: 7.8 },
  ];

  const engagementSegments = [
    { 
      name: 'Super Engaged', 
      count: 1250, 
      percentage: 15.2,
      description: 'Opens >80% of emails, clicks frequently',
      color: '#22c55e',
      openRate: 89.2,
      clickRate: 12.4
    },
    { 
      name: 'Engaged', 
      count: 2850, 
      percentage: 34.6,
      description: 'Opens 50-80% of emails',
      color: '#3b82f6',
      openRate: 65.1,
      clickRate: 6.8
    },
    { 
      name: 'Moderate', 
      count: 2100, 
      percentage: 25.5,
      description: 'Opens 20-50% of emails',
      color: '#f59e0b',
      openRate: 35.2,
      clickRate: 3.1
    },
    { 
      name: 'Low Engagement', 
      count: 1450, 
      percentage: 17.6,
      description: 'Opens <20% of emails',
      color: '#ef4444',
      openRate: 12.5,
      clickRate: 1.2
    },
    { 
      name: 'Inactive', 
      count: 580, 
      percentage: 7.1,
      description: 'No engagement in 90+ days',
      color: '#6b7280',
      openRate: 0,
      clickRate: 0
    },
  ];

  const devicePreferences = [
    { device: 'Mobile', percentage: 58, color: '#8884d8' },
    { device: 'Desktop', percentage: 32, color: '#82ca9d' },
    { device: 'Tablet', percentage: 10, color: '#ffc658' },
  ];

  const timeZoneData = [
    { timezone: 'EST (UTC-5)', users: 2100, percentage: 35.2 },
    { timezone: 'PST (UTC-8)', users: 1580, percentage: 26.4 },
    { timezone: 'CST (UTC-6)', users: 980, percentage: 16.4 },
    { timezone: 'MST (UTC-7)', users: 640, percentage: 10.7 },
    { timezone: 'GMT (UTC+0)', users: 450, percentage: 7.5 },
    { timezone: 'Others', users: 230, percentage: 3.8 },
  ];

  const subscriberGrowth = [
    { month: 'Jan', newSubscribers: 245, unsubscribes: 32, netGrowth: 213 },
    { month: 'Feb', newSubscribers: 289, unsubscribes: 28, netGrowth: 261 },
    { month: 'Mar', newSubscribers: 321, unsubscribes: 35, netGrowth: 286 },
    { month: 'Apr', newSubscribers: 298, unsubscribes: 41, netGrowth: 257 },
    { month: 'May', newSubscribers: 356, unsubscribes: 29, netGrowth: 327 },
    { month: 'Jun', newSubscribers: 402, unsubscribes: 38, netGrowth: 364 },
  ];

  const topPerformingSegments = engagementSegments
    .sort((a, b) => b.openRate - a.openRate)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Audience Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {engagementSegments.reduce((sum, segment) => sum + segment.count, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Subscribers</div>
            <div className="text-xs text-green-600 flex items-center justify-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              +5.2% this month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {((engagementSegments[0].count + engagementSegments[1].count) / 
                engagementSegments.reduce((sum, s) => sum + s.count, 0) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Engaged Users</div>
            <div className="text-xs text-green-600 flex items-center justify-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              +2.1% vs last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {subscriberGrowth[subscriberGrowth.length - 1].netGrowth}
            </div>
            <div className="text-sm text-gray-600">Monthly Net Growth</div>
            <div className="text-xs text-green-600 flex items-center justify-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              Best month yet
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {((subscriberGrowth[subscriberGrowth.length - 1].unsubscribes / 
                subscriberGrowth[subscriberGrowth.length - 1].newSubscribers) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Churn Rate</div>
            <div className="text-xs text-green-600 flex items-center justify-center gap-1 mt-1">
              <TrendingDown className="h-3 w-3" />
              -0.8% improvement
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Segments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Engagement Segments
            </CardTitle>
            <CardDescription>
              Subscribers grouped by engagement level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {engagementSegments.map((segment) => (
                <div key={segment.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: segment.color }}
                      />
                      <div>
                        <div className="font-medium">{segment.name}</div>
                        <div className="text-sm text-gray-600">{segment.description}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{segment.count.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">{segment.percentage}%</div>
                    </div>
                  </div>
                  <Progress value={segment.percentage} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Open Rate: {segment.openRate}%</span>
                    <span>Click Rate: {segment.clickRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Geographic Distribution
            </CardTitle>
            <CardDescription>
              Subscribers by country
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {locationData.map((location) => (
                <div key={location.country} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{location.country}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-600">
                      {location.users.toLocaleString()} ({location.percentage}%)
                    </div>
                    <div className="w-20">
                      <Progress value={location.percentage} className="h-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Age Demographics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Age Demographics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demographicData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="age" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Device Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Device Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={devicePreferences}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ device, percentage }) => `${device}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="percentage"
                  >
                    {devicePreferences.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Time Zone Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time Zones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {timeZoneData.map((tz) => (
                <div key={tz.timezone} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{tz.timezone}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{tz.percentage}%</span>
                    <div className="w-16">
                      <Progress value={tz.percentage} className="h-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriber Growth Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Subscriber Growth Trend
          </CardTitle>
          <CardDescription>
            Monthly new subscribers vs unsubscribes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={subscriberGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="newSubscribers" 
                  stackId="1" 
                  stroke="#22c55e" 
                  fill="#22c55e" 
                  fillOpacity={0.6}
                  name="New Subscribers"
                />
                <Area 
                  type="monotone" 
                  dataKey="unsubscribes" 
                  stackId="2" 
                  stroke="#ef4444" 
                  fill="#ef4444" 
                  fillOpacity={0.6}
                  name="Unsubscribes"
                />
                <Line 
                  type="monotone" 
                  dataKey="netGrowth" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name="Net Growth"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Segments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Top Performing Segments
          </CardTitle>
          <CardDescription>
            Segments with highest engagement rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topPerformingSegments.map((segment, index) => (
              <div key={segment.name} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant={index === 0 ? "default" : "outline"}>
                    #{index + 1}
                  </Badge>
                  {index === 0 && <Star className="h-4 w-4 text-yellow-500" />}
                </div>
                <h3 className="font-medium mb-2">{segment.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subscribers:</span>
                    <span className="font-medium">{segment.count.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Open Rate:</span>
                    <span className="font-medium text-green-600">{segment.openRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Click Rate:</span>
                    <span className="font-medium text-blue-600">{segment.clickRate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Audience Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-green-800">Opportunities</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <UserCheck className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Re-engage Moderate Segment
                    </p>
                    <p className="text-xs text-green-600">
                      25.5% of your audience has moderate engagement. Create targeted campaigns to boost their activity.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <Globe className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      Expand in Key Markets
                    </p>
                    <p className="text-xs text-blue-600">
                      Strong performance in US and Canada suggests potential for expansion in similar markets.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-red-800">Areas for Improvement</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                  <UserX className="h-4 w-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      Inactive Subscriber Cleanup
                    </p>
                    <p className="text-xs text-red-600">
                      7.1% of subscribers are inactive. Consider a win-back campaign or list cleanup.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                  <Clock className="h-4 w-4 text-orange-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">
                      Optimize Send Times
                    </p>
                    <p className="text-xs text-orange-600">
                      With subscribers across multiple time zones, consider segmented send times for better engagement.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
