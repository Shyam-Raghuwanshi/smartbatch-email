"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  Target,
  TrendingUp,
  TrendingDown,
  Star,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users
} from 'lucide-react';

interface DateRange {
  from: Date;
  to: Date;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  sentDate: string;
  recipients: number;
  opens: number;
  clicks: number;
  bounces: number;
  unsubscribes: number;
  revenue: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  conversionRate: number;
  roas: number;
}

type MetricKey = 'openRate' | 'clickRate' | 'bounceRate' | 'conversionRate' | 'revenue' | 'roas';

interface CampaignComparisonProps {
  dateRange: DateRange;
}

export default function CampaignComparison({ dateRange }: CampaignComparisonProps) {
  const [comparisonMetric, setComparisonMetric] = useState<MetricKey>('openRate');
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>(['1', '2', '3']);

  // Mock campaign data - replace with actual data from props
  const campaignData: Campaign[] = [
    {
      id: '1',
      name: 'Black Friday Sale',
      status: 'completed',
      sentDate: '2024-01-15',
      recipients: 5000,
      opens: 1890,
      clicks: 420,
      bounces: 45,
      unsubscribes: 12,
      revenue: 15420,
      openRate: 37.8,
      clickRate: 8.4,
      bounceRate: 0.9,
      conversionRate: 3.2,
      roas: 4.8
    },
    {
      id: '2',
      name: 'Newsletter #245',
      status: 'completed',
      sentDate: '2024-01-10',
      recipients: 3200,
      opens: 896,
      clicks: 128,
      bounces: 28,
      unsubscribes: 8,
      revenue: 2140,
      openRate: 28.0,
      clickRate: 4.0,
      bounceRate: 0.9,
      conversionRate: 1.8,
      roas: 2.1
    },
    {
      id: '3',
      name: 'Welcome Series Email 1',
      status: 'completed',
      sentDate: '2024-01-12',
      recipients: 1200,
      opens: 612,
      clicks: 147,
      bounces: 8,
      unsubscribes: 3,
      revenue: 3420,
      openRate: 51.0,
      clickRate: 12.3,
      bounceRate: 0.7,
      conversionRate: 8.1,
      roas: 5.2
    },
    {
      id: '4',
      name: 'Product Launch Announcement',
      status: 'completed',
      sentDate: '2024-01-08',
      recipients: 4500,
      opens: 1260,
      clicks: 216,
      bounces: 54,
      unsubscribes: 18,
      revenue: 6590,
      openRate: 28.0,
      clickRate: 4.8,
      bounceRate: 1.2,
      conversionRate: 2.4,
      roas: 3.2
    },
    {
      id: '5',
      name: 'Cart Abandonment Recovery',
      status: 'completed',
      sentDate: '2024-01-14',
      recipients: 800,
      opens: 384,
      clicks: 125,
      bounces: 4,
      unsubscribes: 2,
      revenue: 4840,
      openRate: 48.0,
      clickRate: 15.6,
      bounceRate: 0.5,
      conversionRate: 12.8,
      roas: 6.1
    }
  ];

  const handleCampaignToggle = (campaignId: string) => {
    const newSelection = selectedCampaigns.includes(campaignId)
      ? selectedCampaigns.filter(id => id !== campaignId)
      : [...selectedCampaigns, campaignId];
    
    setSelectedCampaigns(newSelection);
  };

  const selectedCampaignData = campaignData.filter(campaign => 
    selectedCampaigns.length === 0 || selectedCampaigns.includes(campaign.id)
  );

  // Radar chart data for performance comparison
  const radarData = selectedCampaignData.map(campaign => ({
    campaign: campaign.name.substring(0, 15) + '...',
    openRate: campaign.openRate,
    clickRate: campaign.clickRate * 10, // Scale for visibility
    conversionRate: campaign.conversionRate * 10, // Scale for visibility
    deliveryRate: 100 - campaign.bounceRate,
    engagement: (campaign.openRate + campaign.clickRate) / 2
  }));

  const bestPerformer = campaignData.reduce((best, current) => 
    (current[comparisonMetric] as number) > (best[comparisonMetric] as number) ? current : best
  );

  const worstPerformer = campaignData.reduce((worst, current) => 
    (current[comparisonMetric] as number) < (worst[comparisonMetric] as number) ? current : worst
  );

  const averageMetric = campaignData.reduce((sum, campaign) => 
    sum + (campaign[comparisonMetric] as number), 0) / campaignData.length;

  const getPerformanceColor = (value: number, metric: MetricKey) => {
    const thresholds = {
      openRate: { good: 25, excellent: 35 },
      clickRate: { good: 3, excellent: 5 },
      conversionRate: { good: 2, excellent: 5 },
      bounceRate: { good: 2, excellent: 1 },
      revenue: { good: 1000, excellent: 5000 },
      roas: { good: 2, excellent: 4 }
    };
    
    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return 'text-gray-600';
    
    if (metric === 'bounceRate') {
      return value <= threshold.excellent ? 'text-green-600' : 
             value <= threshold.good ? 'text-yellow-600' : 'text-red-600';
    }
    
    return value >= threshold.excellent ? 'text-green-600' : 
           value >= threshold.good ? 'text-yellow-600' : 'text-red-600';
  };

  const getPerformanceBadge = (value: number, metric: MetricKey) => {
    const thresholds = {
      openRate: { good: 25, excellent: 35 },
      clickRate: { good: 3, excellent: 5 },
      conversionRate: { good: 2, excellent: 5 },
      bounceRate: { good: 2, excellent: 1 },
      revenue: { good: 1000, excellent: 5000 },
      roas: { good: 2, excellent: 4 }
    };
    
    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return 'outline';
    
    if (metric === 'bounceRate') {
      return value <= threshold.excellent ? 'default' : 
             value <= threshold.good ? 'secondary' : 'destructive';
    }
    
    return value >= threshold.excellent ? 'default' : 
           value >= threshold.good ? 'secondary' : 'destructive';
  };

  return (
    <div className="space-y-6">
      {/* Campaign Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Select Campaigns to Compare
          </CardTitle>
          <CardDescription>
            Choose campaigns to analyze their performance side by side
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {campaignData.map((campaign) => (
              <div key={campaign.id} className="flex items-center space-x-2">
                <Checkbox
                  id={campaign.id}
                  checked={selectedCampaigns.includes(campaign.id)}
                  onCheckedChange={() => handleCampaignToggle(campaign.id)}
                />
                <label htmlFor={campaign.id} className="text-sm cursor-pointer flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{campaign.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {campaign.openRate.toFixed(1)}% open
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500">
                    {campaign.recipients.toLocaleString()} recipients • {campaign.sentDate}
                  </div>
                </label>
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-3 mt-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedCampaigns(campaignData.map(c => c.id))}
            >
              Select All
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedCampaigns([])}
            >
              Clear All
            </Button>
            <div className="text-sm text-gray-600">
              {selectedCampaigns.length} of {campaignData.length} campaigns selected
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedCampaignData.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Campaigns Selected</h3>
            <p className="text-gray-600">Select campaigns above to view comparison analytics</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Comparison Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {selectedCampaignData.length}
                </div>
                <div className="text-sm text-gray-600">Campaigns Compared</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(selectedCampaignData.reduce((sum, c) => sum + c.openRate, 0) / selectedCampaignData.length).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Avg Open Rate</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {(selectedCampaignData.reduce((sum, c) => sum + c.clickRate, 0) / selectedCampaignData.length).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Avg Click Rate</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  ${selectedCampaignData.reduce((sum, c) => sum + c.revenue, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Revenue</div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Comparison Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Performance Comparison</CardTitle>
                  <CardDescription>
                    Compare key metrics across selected campaigns
                  </CardDescription>
                </div>
                <Select value={comparisonMetric} onValueChange={(value: MetricKey) => setComparisonMetric(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openRate">Open Rate</SelectItem>
                    <SelectItem value="clickRate">Click Rate</SelectItem>
                    <SelectItem value="conversionRate">Conversion Rate</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="roas">ROAS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={selectedCampaignData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar 
                      dataKey={comparisonMetric} 
                      fill="#8884d8"
                      name={comparisonMetric.charAt(0).toUpperCase() + comparisonMetric.slice(1)}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Radar */}
            <Card>
              <CardHeader>
                <CardTitle>Multi-dimensional Performance</CardTitle>
                <CardDescription>
                  Overall performance comparison across key metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="campaign" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar
                        name="Open Rate"
                        dataKey="openRate"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.6}
                      />
                      <Radar
                        name="Click Rate (x10)"
                        dataKey="clickRate"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                        fillOpacity={0.6}
                      />
                      <Tooltip />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Performance Rankings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Performance Rankings
                </CardTitle>
                <CardDescription>
                  Campaigns ranked by selected metric
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedCampaignData
                    .sort((a, b) => (b[comparisonMetric] as number) - (a[comparisonMetric] as number))
                    .map((campaign, index) => (
                      <div key={campaign.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant={index === 0 ? "default" : "outline"}>
                            #{index + 1}
                          </Badge>
                          {index === 0 && <Star className="h-4 w-4 text-yellow-500" />}
                          <div>
                            <div className="font-medium">{campaign.name}</div>
                            <div className="text-sm text-gray-600">
                              {campaign.recipients.toLocaleString()} recipients
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-medium ${getPerformanceColor(campaign[comparisonMetric as keyof typeof campaign] as number, comparisonMetric)}`}>
                            {typeof campaign[comparisonMetric as keyof typeof campaign] === 'number' 
                              ? comparisonMetric === 'revenue'
                                ? `$${(campaign[comparisonMetric as keyof typeof campaign] as number).toLocaleString()}`
                                : `${(campaign[comparisonMetric as keyof typeof campaign] as number).toFixed(1)}${comparisonMetric.includes('Rate') ? '%' : comparisonMetric === 'roas' ? 'x' : ''}`
                              : campaign[comparisonMetric as keyof typeof campaign]}
                          </div>
                          <Badge 
                            variant={getPerformanceBadge(campaign[comparisonMetric as keyof typeof campaign] as number, comparisonMetric)}
                            className="text-xs"
                          >
                            {index === 0 ? 'Best' : index === selectedCampaignData.length - 1 ? 'Needs Work' : 'Good'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Metrics Comparison</CardTitle>
              <CardDescription>
                Complete performance breakdown for selected campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Campaign</th>
                      <th className="text-center p-2">Recipients</th>
                      <th className="text-center p-2">Open Rate</th>
                      <th className="text-center p-2">Click Rate</th>
                      <th className="text-center p-2">Bounce Rate</th>
                      <th className="text-center p-2">Conversion</th>
                      <th className="text-center p-2">Revenue</th>
                      <th className="text-center p-2">ROAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCampaignData.map((campaign) => (
                      <tr key={campaign.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div className="font-medium">{campaign.name}</div>
                          <div className="text-xs text-gray-500">{campaign.sentDate}</div>
                        </td>
                        <td className="text-center p-2">{campaign.recipients.toLocaleString()}</td>
                        <td className="text-center p-2">
                          <Badge variant={getPerformanceBadge(campaign.openRate, 'openRate')} className="text-xs">
                            {campaign.openRate.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="text-center p-2">
                          <Badge variant={getPerformanceBadge(campaign.clickRate, 'clickRate')} className="text-xs">
                            {campaign.clickRate.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="text-center p-2">
                          <Badge variant={getPerformanceBadge(campaign.bounceRate, 'bounceRate')} className="text-xs">
                            {campaign.bounceRate.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="text-center p-2">
                          <Badge variant={getPerformanceBadge(campaign.conversionRate, 'conversionRate')} className="text-xs">
                            {campaign.conversionRate.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="text-center p-2 font-medium text-green-600">
                          ${campaign.revenue.toLocaleString()}
                        </td>
                        <td className="text-center p-2 font-medium text-blue-600">
                          {campaign.roas.toFixed(1)}x
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Insights and Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Comparison Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-green-800">Top Performers</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                      <Award className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          Best Overall: {bestPerformer.name}
                        </p>
                        <p className="text-xs text-green-600">
                          {bestPerformer.openRate}% open rate with {bestPerformer.roas}x ROAS
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">
                          Highest Revenue: {selectedCampaignData.reduce((best, current) => 
                            current.revenue > best.revenue ? current : best
                          ).name}
                        </p>
                        <p className="text-xs text-blue-600">
                          Generated ${selectedCampaignData.reduce((best, current) => 
                            current.revenue > best.revenue ? current : best
                          ).revenue.toLocaleString()} in revenue
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-orange-800">Improvement Areas</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-orange-800">
                          Needs Attention: {worstPerformer.name}
                        </p>
                        <p className="text-xs text-orange-600">
                          {worstPerformer.openRate}% open rate - consider subject line optimization
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                      <TrendingDown className="h-4 w-4 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800">
                          Average Performance Gap
                        </p>
                        <p className="text-xs text-red-600">
                          {(bestPerformer[comparisonMetric as keyof typeof bestPerformer] as number - averageMetric).toFixed(1)} point difference between best and average
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
