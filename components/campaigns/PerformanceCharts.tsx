"use client";

import React, { useState, useEffect } from 'react';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Clock,
  Target,
  Users,
  Mail,
  MousePointer,
  Eye
} from 'lucide-react';
import { Id } from "@/convex/_generated/dataModel";

interface PerformanceChartsProps {
  campaignId?: Id<"campaigns">;
  timeRange?: number; // days
}

export const PerformanceCharts: React.FC<PerformanceChartsProps> = ({ 
  campaignId, 
  timeRange = 7 
}) => {
  const [selectedMetric, setSelectedMetric] = useState('opens');
  const [chartType, setChartType] = useState('line');

  // Get engagement heatmap data for time-based analysis
  const heatmapData = useQuery(api.campaignMonitoring.getCampaignEngagementHeatmap, 
    campaignId ? {
      campaignId,
      days: timeRange
    } : "skip"
  );

  // Get real-time stats for current metrics
  const realTimeStats = useQuery(api.campaignMonitoring.getCampaignRealTimeStats, 
    campaignId ? {
      campaignId: campaignId
    } : "skip"
  );

  // Generate hourly performance data
  const generateHourlyData = () => {
    if (!heatmapData) return [];

    const hourlyData = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourData = heatmapData.find((d: any) => d.hour === hour);
      hourlyData.push({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        opens: hourData?.opens || 0,
        clicks: hourData?.clicks || 0,
        sent: hourData?.sent || 0,
        bounces: 0, // Not available in current schema
        openRate: (hourData?.sent || 0) > 0 ? ((hourData?.opens || 0) / (hourData?.sent || 1) * 100) : 0,
        clickRate: (hourData?.sent || 0) > 0 ? ((hourData?.clicks || 0) / (hourData?.sent || 1) * 100) : 0,
      });
    }
    return hourlyData;
  };

  // Generate daily performance data for the time range
  const generateDailyData = () => {
    if (!heatmapData) return [];

    const dailyData = [];
    const today = new Date();
    
    for (let i = timeRange - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dayData = heatmapData.filter((d: any) => {
        const dataDate = new Date(d.timestamp || Date.now());
        return dataDate.toDateString() === date.toDateString();
      });

      const totalOpens = dayData.reduce((sum: number, d: any) => sum + (d.opens || 0), 0);
      const totalClicks = dayData.reduce((sum: number, d: any) => sum + (d.clicks || 0), 0);
      const totalSent = dayData.reduce((sum: number, d: any) => sum + (d.sent || 0), 0);
      const totalBounces = 0; // Not available in current schema

      dailyData.push({
        date: dayName,
        fullDate: date.toLocaleDateString(),
        opens: totalOpens,
        clicks: totalClicks,
        sent: totalSent,
        bounces: totalBounces,
        openRate: totalSent > 0 ? (totalOpens / totalSent * 100) : 0,
        clickRate: totalSent > 0 ? (totalClicks / totalSent * 100) : 0,
        bounceRate: 0,
      });
    }
    return dailyData;
  };

  const hourlyData = generateHourlyData();
  const dailyData = generateDailyData();

  // Engagement funnel data
  const funnelData = realTimeStats ? [
    { name: 'Sent', value: realTimeStats.queueStats.sent, color: '#8884d8' },
    { name: 'Delivered', value: realTimeStats.queueStats.sent - realTimeStats.queueStats.failed, color: '#82ca9d' },
    { name: 'Opened', value: realTimeStats.engagementStats.opens.total, color: '#ffc658' },
    { name: 'Clicked', value: realTimeStats.engagementStats.clicks.total, color: '#ff7300' },
  ] : [];

  // Performance metrics comparison
  const metricsData = [
    {
      metric: 'Open Rate',
      current: realTimeStats?.rates.open || 0,
      industry: 22.86,
      icon: Eye,
      trend: 'up'
    },
    {
      metric: 'Click Rate',
      current: realTimeStats?.rates.click || 0,
      industry: 2.91,
      icon: MousePointer,
      trend: 'up'
    },
    {
      metric: 'Bounce Rate',
      current: realTimeStats?.rates.bounce || 0,
      industry: 0.43,
      icon: TrendingDown,
      trend: 'down'
    },
    {
      metric: 'Delivery Rate',
      current: realTimeStats?.rates.delivery || 0,
      industry: 99.57,
      icon: Mail,
      trend: 'up'
    }
  ];

  const chartData = selectedMetric === 'hourly' ? hourlyData : dailyData;

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={selectedMetric === 'hourly' ? 'hour' : 'date'} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey={selectedMetric === 'opens' ? 'opens' : selectedMetric === 'clicks' ? 'clicks' : 'openRate'} 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              {selectedMetric === 'comparison' && (
                <Line 
                  type="monotone" 
                  dataKey="clickRate" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={selectedMetric === 'hourly' ? 'hour' : 'date'} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="opens" 
                stackId="1" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.6}
              />
              <Area 
                type="monotone" 
                dataKey="clicks" 
                stackId="1" 
                stroke="#82ca9d" 
                fill="#82ca9d" 
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={selectedMetric === 'hourly' ? 'hour' : 'date'} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="opens" fill="#8884d8" />
              <Bar dataKey="clicks" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  if (!realTimeStats) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsData.map((metric, index) => {
          const Icon = metric.icon;
          const isGood = metric.trend === 'up' ? 
            metric.current >= metric.industry : 
            metric.current <= metric.industry;
          
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className="h-5 w-5 text-gray-500" />
                  <Badge variant={isGood ? "default" : "destructive"}>
                    {isGood ? "Good" : "Needs Attention"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">{metric.metric}</p>
                  <p className="text-2xl font-bold">{metric.current.toFixed(2)}%</p>
                  <p className="text-xs text-gray-500">
                    Industry avg: {metric.industry}%
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Engagement Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Engagement Funnel
          </CardTitle>
          <CardDescription>
            Conversion flow from sent emails to clicks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={funnelData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Time-based Performance Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Performance Over Time
              </CardTitle>
              <CardDescription>
                Track engagement patterns and trends
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="opens">Opens</SelectItem>
                  <SelectItem value="clicks">Clicks</SelectItem>
                  <SelectItem value="rates">Open Rate</SelectItem>
                  <SelectItem value="comparison">Compare</SelectItem>
                </SelectContent>
              </Select>
              <Select value={chartType} onValueChange={setChartType}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line</SelectItem>
                  <SelectItem value="area">Area</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderChart()}
        </CardContent>
      </Card>

      {/* Best Performing Times */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Optimal Send Times
          </CardTitle>
          <CardDescription>
            Best performing hours based on engagement data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hourlyData
              .sort((a, b) => b.openRate - a.openRate)
              .slice(0, 3)
              .map((timeSlot, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{timeSlot.hour}</span>
                    <Badge variant="outline">
                      Rank #{index + 1}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Open Rate: {timeSlot.openRate.toFixed(1)}%</p>
                    <p>Opens: {timeSlot.opens}</p>
                    <p>Clicks: {timeSlot.clicks}</p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
