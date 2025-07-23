"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Cell,
  ComposedChart
} from 'recharts';
import { 
  TrendingUp,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Download
} from 'lucide-react';

interface PerformanceTrendsProps {
  dateRange: {
    from: Date;
    to: Date;
  };
}

export function PerformanceTrends({ dateRange }: PerformanceTrendsProps) {
  const [chartType, setChartType] = useState('line');
  const [metric, setMetric] = useState('engagement');
  const [timeGranularity, setTimeGranularity] = useState('daily');

  // Mock data - replace with actual data from props
  const performanceData = [
    { date: '2024-01-01', opens: 245, clicks: 89, sent: 1000, revenue: 1250 },
    { date: '2024-01-02', opens: 289, clicks: 95, sent: 1100, revenue: 1400 },
    { date: '2024-01-03', opens: 321, clicks: 112, sent: 1200, revenue: 1680 },
    { date: '2024-01-04', opens: 298, clicks: 88, sent: 1050, revenue: 1320 },
    { date: '2024-01-05', opens: 356, clicks: 134, sent: 1300, revenue: 2010 },
    { date: '2024-01-06', opens: 402, clicks: 156, sent: 1400, revenue: 2340 },
    { date: '2024-01-07', opens: 378, clicks: 142, sent: 1350, revenue: 2130 },
  ];

  const hourlyData = [
    { hour: '00:00', opens: 12, clicks: 3 },
    { hour: '01:00', opens: 8, clicks: 2 },
    { hour: '02:00', opens: 5, clicks: 1 },
    { hour: '03:00', opens: 3, clicks: 0 },
    { hour: '04:00', opens: 4, clicks: 1 },
    { hour: '05:00', opens: 8, clicks: 2 },
    { hour: '06:00', opens: 15, clicks: 4 },
    { hour: '07:00', opens: 28, clicks: 8 },
    { hour: '08:00', opens: 45, clicks: 12 },
    { hour: '09:00', opens: 67, clicks: 18 },
    { hour: '10:00', opens: 89, clicks: 25 },
    { hour: '11:00', opens: 78, clicks: 22 },
    { hour: '12:00', opens: 92, clicks: 28 },
    { hour: '13:00', opens: 85, clicks: 24 },
    { hour: '14:00', opens: 88, clicks: 26 },
    { hour: '15:00', opens: 82, clicks: 23 },
    { hour: '16:00', opens: 76, clicks: 21 },
    { hour: '17:00', opens: 69, clicks: 19 },
    { hour: '18:00', opens: 58, clicks: 16 },
    { hour: '19:00', opens: 45, clicks: 13 },
    { hour: '20:00', opens: 38, clicks: 11 },
    { hour: '21:00', opens: 32, clicks: 9 },
    { hour: '22:00', opens: 25, clicks: 7 },
    { hour: '23:00', opens: 18, clicks: 5 },
  ];

  const deviceData = [
    { name: 'Desktop', value: 45, color: '#8884d8' },
    { name: 'Mobile', value: 42, color: '#82ca9d' },
    { name: 'Tablet', value: 13, color: '#ffc658' },
  ];

  const campaignPerformance = [
    { name: 'Newsletter #1', openRate: 24.5, clickRate: 3.2, sent: 1000 },
    { name: 'Promo Campaign', openRate: 32.1, clickRate: 5.8, sent: 800 },
    { name: 'Welcome Series', openRate: 45.2, clickRate: 8.1, sent: 500 },
    { name: 'Re-engagement', openRate: 18.9, clickRate: 2.1, sent: 1200 },
  ];

  const renderChart = () => {
    const chartData = timeGranularity === 'hourly' ? hourlyData : performanceData;
    
    switch (chartType) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={timeGranularity === 'hourly' ? 'hour' : 'date'} />
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
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={timeGranularity === 'hourly' ? 'hour' : 'date'} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="opens" fill="#8884d8" />
              <Bar dataKey="clicks" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'composed':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="sent" fill="#ffc658" name="Emails Sent" />
              <Line yAxisId="right" type="monotone" dataKey="opens" stroke="#8884d8" name="Opens" />
              <Line yAxisId="right" type="monotone" dataKey="clicks" stroke="#82ca9d" name="Clicks" />
            </ComposedChart>
          </ResponsiveContainer>
        );
        
      default:
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={timeGranularity === 'hourly' ? 'hour' : 'date'} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="opens" 
                stroke="#8884d8" 
                strokeWidth={2} 
                dot={{ r: 4 }} 
              />
              <Line 
                type="monotone" 
                dataKey="clicks" 
                stroke="#82ca9d" 
                strokeWidth={2} 
                dot={{ r: 4 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  const bestPerformingHour = hourlyData.reduce((best, current) => 
    current.opens > best.opens ? current : best
  );

  const averageOpenRate = performanceData.reduce((sum, day) => 
    sum + (day.opens / day.sent), 0
  ) / performanceData.length * 100;

  return (
    <div className="space-y-6">
      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {performanceData.reduce((sum, day) => sum + day.opens, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Opens</div>
            <div className="text-xs text-green-600 flex items-center justify-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              +12.5% vs last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {performanceData.reduce((sum, day) => sum + day.clicks, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Clicks</div>
            <div className="text-xs text-green-600 flex items-center justify-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              +8.3% vs last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {averageOpenRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Avg Open Rate</div>
            <div className="text-xs text-green-600 flex items-center justify-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              +2.1% vs last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {bestPerformingHour.hour}
            </div>
            <div className="text-sm text-gray-600">Best Hour</div>
            <div className="text-xs text-gray-500">
              {bestPerformingHour.opens} opens
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Performance Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Trends
              </CardTitle>
              <CardDescription>
                Email engagement over time
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={timeGranularity} onValueChange={setTimeGranularity}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={chartType} onValueChange={setChartType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="composed">Combined</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderChart()}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Device Breakdown
            </CardTitle>
            <CardDescription>
              Email opens by device type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Campaign Performance Ranking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Top Performing Campaigns
            </CardTitle>
            <CardDescription>
              Ranked by open rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaignPerformance
                .sort((a, b) => b.openRate - a.openRate)
                .map((campaign, index) => (
                  <div key={campaign.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <div>
                        <div className="font-medium">{campaign.name}</div>
                        <div className="text-sm text-gray-600">{campaign.sent} emails sent</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">{campaign.openRate}%</div>
                      <div className="text-sm text-gray-600">{campaign.clickRate}% CTR</div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Hourly Engagement Heatmap
          </CardTitle>
          <CardDescription>
            Best times to send emails based on historical data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="opens" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">Optimization Tip</span>
            </div>
            <p className="text-sm text-blue-700">
              Your audience is most engaged between 9 AM - 2 PM. Consider scheduling your campaigns during these hours for better performance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
