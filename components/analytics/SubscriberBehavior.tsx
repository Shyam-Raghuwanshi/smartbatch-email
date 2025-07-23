"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
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
  Cell
} from 'recharts';
import { 
  Users,
  Clock,
  MousePointer,
  Eye,
  Mail,
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  UserCheck,
  UserX
} from 'lucide-react';

interface SubscriberBehaviorProps {
  dateRange: {
    from: Date;
    to: Date;
  };
}

export function SubscriberBehavior({ dateRange }: SubscriberBehaviorProps) {
  const [behaviorSegment, setBehaviorSegment] = useState('all');
  const [timeframe, setTimeframe] = useState('weekly');

  // Mock data - replace with actual data from props
  const engagementPatterns = [
    { day: 'Monday', opens: 245, clicks: 67, unsubscribes: 3 },
    { day: 'Tuesday', opens: 289, clicks: 78, unsubscribes: 2 },
    { day: 'Wednesday', opens: 321, clicks: 89, unsubscribes: 4 },
    { day: 'Thursday', opens: 298, clicks: 82, unsubscribes: 3 },
    { day: 'Friday', opens: 356, clicks: 98, unsubscribes: 1 },
    { day: 'Saturday', opens: 178, clicks: 45, unsubscribes: 2 },
    { day: 'Sunday', opens: 134, clicks: 32, unsubscribes: 1 },
  ];

  const timeBasedActivity = [
    { hour: '6AM', activity: 15, engagement: 12 },
    { hour: '7AM', activity: 28, engagement: 23 },
    { hour: '8AM', activity: 45, engagement: 38 },
    { hour: '9AM', activity: 67, engagement: 58 },
    { hour: '10AM', activity: 89, engagement: 78 },
    { hour: '11AM', activity: 78, engagement: 65 },
    { hour: '12PM', activity: 92, engagement: 82 },
    { hour: '1PM', activity: 85, engagement: 76 },
    { hour: '2PM', activity: 88, engagement: 79 },
    { hour: '3PM', activity: 82, engagement: 73 },
    { hour: '4PM', activity: 76, engagement: 68 },
    { hour: '5PM', activity: 69, engagement: 61 },
    { hour: '6PM', activity: 58, engagement: 51 },
    { hour: '7PM', activity: 45, engagement: 39 },
    { hour: '8PM', activity: 38, engagement: 33 },
    { hour: '9PM', activity: 32, engagement: 28 },
  ];

  const subscriberJourney = [
    { stage: 'Subscribed', count: 1000, percentage: 100 },
    { stage: 'First Open', count: 780, percentage: 78 },
    { stage: 'First Click', count: 245, percentage: 24.5 },
    { stage: 'Multiple Engagements', count: 156, percentage: 15.6 },
    { stage: 'Purchase', count: 89, percentage: 8.9 },
    { stage: 'Repeat Purchase', count: 34, percentage: 3.4 },
  ];

  const behaviorSegments = [
    {
      name: 'Highly Active',
      count: 1250,
      percentage: 15.2,
      traits: ['Opens 80%+ of emails', 'Clicks frequently', 'Low unsubscribe risk'],
      color: '#22c55e',
      avgSessionTime: '4m 32s',
      avgClicksPerEmail: 2.4,
      lifetimeValue: '$445'
    },
    {
      name: 'Regular Readers',
      count: 2850,
      percentage: 34.6,
      traits: ['Opens 40-80% of emails', 'Moderate clicking', 'Average engagement'],
      color: '#3b82f6',
      avgSessionTime: '2m 15s',
      avgClicksPerEmail: 1.2,
      lifetimeValue: '$156'
    },
    {
      name: 'Occasional Browsers',
      count: 2100,
      percentage: 25.5,
      traits: ['Opens 20-40% of emails', 'Rare clicking', 'Subject line dependent'],
      color: '#f59e0b',
      avgSessionTime: '1m 8s',
      avgClicksPerEmail: 0.4,
      lifetimeValue: '$67'
    },
    {
      name: 'Passive Subscribers',
      count: 1450,
      percentage: 17.6,
      traits: ['Opens <20% of emails', 'Minimal engagement', 'High unsubscribe risk'],
      color: '#ef4444',
      avgSessionTime: '0m 23s',
      avgClicksPerEmail: 0.1,
      lifetimeValue: '$12'
    },
    {
      name: 'Dormant Users',
      count: 580,
      percentage: 7.1,
      traits: ['No recent opens', 'No clicks', 'Potential churners'],
      color: '#6b7280',
      avgSessionTime: '0m 0s',
      avgClicksPerEmail: 0,
      lifetimeValue: '$0'
    },
  ];

  const contentPreferences = [
    { type: 'Product Updates', engagement: 78, opens: 2340 },
    { type: 'Educational Content', engagement: 65, opens: 1950 },
    { type: 'Industry News', engagement: 58, opens: 1740 },
    { type: 'Promotional Offers', engagement: 82, opens: 2460 },
    { type: 'Company News', engagement: 42, opens: 1260 },
    { type: 'Event Invitations', engagement: 71, opens: 2130 },
  ];

  const deviceBehavior = [
    { device: 'Mobile', opens: 58, clicks: 62, purchases: 45 },
    { device: 'Desktop', opens: 32, clicks: 28, purchases: 40 },
    { device: 'Tablet', opens: 10, clicks: 10, purchases: 15 },
  ];

  const unsubscribeReasons = [
    { reason: 'Too many emails', percentage: 35, count: 42 },
    { reason: 'Content not relevant', percentage: 28, count: 34 },
    { reason: 'Never signed up', percentage: 15, count: 18 },
    { reason: 'Email design issues', percentage: 12, count: 14 },
    { reason: 'Other', percentage: 10, count: 12 },
  ];

  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280'];

  return (
    <div className="space-y-6">
      {/* Behavior Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {behaviorSegments.reduce((sum, segment) => sum + segment.count, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Subscribers</div>
            <div className="text-xs text-green-600 flex items-center justify-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              +3.2% this month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {(engagementPatterns.reduce((sum, day) => sum + day.opens, 0) / 
                engagementPatterns.reduce((sum, day) => sum + day.opens + day.clicks, 0) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Avg Engagement Rate</div>
            <div className="text-xs text-green-600 flex items-center justify-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              +1.8% vs last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              2m 45s
            </div>
            <div className="text-sm text-gray-600">Avg Session Time</div>
            <div className="text-xs text-green-600 flex items-center justify-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              +15s improvement
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {((behaviorSegments[0].count + behaviorSegments[1].count) / 
                behaviorSegments.reduce((sum, s) => sum + s.count, 0) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Active Subscribers</div>
            <div className="text-xs text-green-600 flex items-center justify-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              +2.4% this month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Weekly Engagement Patterns
            </CardTitle>
            <CardDescription>
              Subscriber activity throughout the week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={engagementPatterns}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="opens" 
                    stackId="1" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.6}
                    name="Opens"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="clicks" 
                    stackId="1" 
                    stroke="#22c55e" 
                    fill="#22c55e" 
                    fillOpacity={0.6}
                    name="Clicks"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Hourly Activity Heatmap
            </CardTitle>
            <CardDescription>
              Best times for subscriber engagement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeBasedActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="activity" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Total Activity"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="engagement" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="Quality Engagement"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Behavior Segments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Subscriber Behavior Segments
          </CardTitle>
          <CardDescription>
            Detailed breakdown of subscriber engagement patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {behaviorSegments.map((segment) => (
              <div key={segment.name} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: segment.color }}
                    />
                    <div>
                      <h3 className="font-medium text-lg">{segment.name}</h3>
                      <p className="text-sm text-gray-600">
                        {segment.count.toLocaleString()} subscribers ({segment.percentage}%)
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-sm">
                    LTV: {segment.lifetimeValue}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-blue-600">{segment.avgSessionTime}</div>
                    <div className="text-sm text-gray-600">Avg Session</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-green-600">{segment.avgClicksPerEmail}</div>
                    <div className="text-sm text-gray-600">Clicks/Email</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-purple-600">{segment.lifetimeValue}</div>
                    <div className="text-sm text-gray-600">Lifetime Value</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-orange-600">{segment.percentage}%</div>
                    <div className="text-sm text-gray-600">Of Total Base</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-700">Key Characteristics:</div>
                  <div className="flex flex-wrap gap-2">
                    {segment.traits.map((trait, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Content Preferences
            </CardTitle>
            <CardDescription>
              What type of content resonates most with your audience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contentPreferences
                .sort((a, b) => b.engagement - a.engagement)
                .map((content, index) => (
                  <div key={content.type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={index === 0 ? "default" : "outline"} className="text-xs">
                          #{index + 1}
                        </Badge>
                        <span className="font-medium">{content.type}</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {content.engagement}% engagement
                      </span>
                    </div>
                    <Progress value={content.engagement} className="h-2" />
                    <div className="text-xs text-gray-500">
                      {content.opens.toLocaleString()} total opens
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Device Behavior */}
        <Card>
          <CardHeader>
            <CardTitle>Cross-Device Behavior</CardTitle>
            <CardDescription>
              How subscribers interact across different devices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deviceBehavior}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="device" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="opens" fill="#8884d8" name="Opens %" />
                  <Bar dataKey="clicks" fill="#82ca9d" name="Clicks %" />
                  <Bar dataKey="purchases" fill="#ffc658" name="Purchases %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between p-2 bg-blue-50 rounded">
                <span>Mobile dominates opens</span>
                <span className="font-medium">58% of all opens</span>
              </div>
              <div className="flex justify-between p-2 bg-green-50 rounded">
                <span>Desktop drives purchases</span>
                <span className="font-medium">40% of purchases</span>
              </div>
              <div className="flex justify-between p-2 bg-orange-50 rounded">
                <span>Cross-device journey</span>
                <span className="font-medium">23% multi-device</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriber Journey */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Subscriber Journey Funnel
          </CardTitle>
          <CardDescription>
            How subscribers progress through your email funnel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subscriberJourney.map((stage, index) => (
              <div key={stage.stage} className="relative">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-medium">{stage.stage}</h3>
                      <p className="text-sm text-gray-600">
                        {stage.count.toLocaleString()} subscribers
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{stage.percentage}%</div>
                    <div className="text-sm text-gray-600">of total</div>
                  </div>
                </div>
                
                <div className="mt-2">
                  <Progress value={stage.percentage} className="h-3" />
                </div>
                
                {index < subscriberJourney.length - 1 && (
                  <div className="text-center text-sm text-gray-500 mt-2">
                    {((subscriberJourney[index + 1].count / stage.count) * 100).toFixed(1)}% conversion rate ↓
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Unsubscribe Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5" />
            Unsubscribe Analysis
          </CardTitle>
          <CardDescription>
            Understanding why subscribers leave and how to reduce churn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-4">Top Unsubscribe Reasons</h4>
              <div className="space-y-3">
                {unsubscribeReasons.map((reason) => (
                  <div key={reason.reason} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{reason.reason}</span>
                      <span className="text-sm font-medium">{reason.percentage}%</span>
                    </div>
                    <Progress value={reason.percentage} className="h-2" />
                    <div className="text-xs text-gray-500">
                      {reason.count} unsubscribes
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-4">Retention Strategies</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <UserCheck className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Reduce Email Frequency
                    </p>
                    <p className="text-xs text-green-600">
                      35% cite "too many emails" - implement preference center
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <Target className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      Improve Content Relevance
                    </p>
                    <p className="text-xs text-blue-600">
                      28% want more relevant content - use behavioral targeting
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                  <Mail className="h-4 w-4 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-purple-800">
                      Design Optimization
                    </p>
                    <p className="text-xs text-purple-600">
                      12% report design issues - focus on mobile optimization
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
