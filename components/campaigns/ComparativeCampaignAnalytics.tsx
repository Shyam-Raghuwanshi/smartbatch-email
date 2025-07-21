"use client";

import React, { useState } from 'react';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  MousePointer, 
  Mail, 
  AlertCircle,
  Download,
  Calendar,
  Target,
  Zap
} from 'lucide-react';
import { Id } from "@/convex/_generated/dataModel";

interface ComparativeCampaignAnalyticsProps {
  selectedCampaignIds?: Id<"campaigns">[];
  onCampaignSelectionChange?: (campaignIds: Id<"campaigns">[]) => void;
}

export function ComparativeCampaignAnalytics({ 
  selectedCampaignIds = [], 
  onCampaignSelectionChange 
}: ComparativeCampaignAnalyticsProps) {
  const [timeRange, setTimeRange] = useState(30);
  const [sortBy, setSortBy] = useState<'openRate' | 'clickRate' | 'deliveryRate' | 'sent'>('openRate');
  
  // Get all user campaigns for selection
  const allCampaigns = useQuery(api.campaigns.getCampaignsByUser);
  
  // Get comparative data for selected campaigns
  const comparativeData = useQuery(
    api.campaignMonitoring.getComparativeCampaignAnalytics,
    selectedCampaignIds.length > 0 ? { campaignIds: selectedCampaignIds, timeRange } : "skip"
  );
  
  const handleCampaignToggle = (campaignId: Id<"campaigns">, checked: boolean) => {
    const newSelection = checked 
      ? [...selectedCampaignIds, campaignId]
      : selectedCampaignIds.filter(id => id !== campaignId);
    
    onCampaignSelectionChange?.(newSelection);
  };
  
  const exportData = () => {
    if (!comparativeData) return;
    
    const csvData = [
      ['Campaign Name', 'Status', 'Sent', 'Delivery Rate', 'Open Rate', 'Click Rate', 'Bounce Rate', 'Created Date']
    ];
    
    comparativeData.forEach(campaign => {
      csvData.push([
        campaign.campaignName,
        campaign.status,
        campaign.stats.sent.toString(),
        `${campaign.rates.deliveryRate.toFixed(2)}%`,
        `${campaign.rates.openRate.toFixed(2)}%`,
        `${campaign.rates.clickRate.toFixed(2)}%`,
        `${campaign.rates.bounceRate.toFixed(2)}%`,
        new Date(campaign.createdAt).toLocaleDateString()
      ]);
    });
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign-comparison-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  
  const sortedData = comparativeData?.sort((a, b) => {
    switch (sortBy) {
      case 'openRate': return b.rates.openRate - a.rates.openRate;
      case 'clickRate': return b.rates.clickRate - a.rates.clickRate;
      case 'deliveryRate': return b.rates.deliveryRate - a.rates.deliveryRate;
      case 'sent': return b.stats.sent - a.stats.sent;
      default: return 0;
    }
  });
  
  const getPerformanceColor = (value: number, type: 'rate' | 'bounce') => {
    if (type === 'bounce') {
      return value <= 2 ? 'text-green-600' : value <= 5 ? 'text-yellow-600' : 'text-red-600';
    }
    // For open/click rates
    if (type === 'rate') {
      return value >= 20 ? 'text-green-600' : value >= 10 ? 'text-yellow-600' : 'text-red-600';
    }
    return 'text-gray-600';
  };
  
  const getPerformanceBadge = (value: number, type: 'open' | 'click' | 'delivery' | 'bounce') => {
    if (type === 'bounce') {
      return value <= 2 ? 'default' : value <= 5 ? 'secondary' : 'destructive';
    }
    if (type === 'open') {
      return value >= 20 ? 'default' : value >= 10 ? 'secondary' : 'destructive';
    }
    if (type === 'click') {
      return value >= 3 ? 'default' : value >= 1 ? 'secondary' : 'destructive';
    }
    if (type === 'delivery') {
      return value >= 95 ? 'default' : value >= 90 ? 'secondary' : 'destructive';
    }
    return 'outline';
  };
  
  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Comparative Campaign Analytics
              </CardTitle>
              <CardDescription>
                Compare performance across multiple campaigns
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={timeRange.toString()} onValueChange={(value) => setTimeRange(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
              {comparativeData && comparativeData.length > 0 && (
                <Button variant="outline" onClick={exportData}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Campaign Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Select Campaigns to Compare</h3>
              <span className="text-xs text-gray-500">
                {selectedCampaignIds.length} selected
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-40 overflow-y-auto">
              {allCampaigns?.map((campaign) => (
                <div key={campaign._id} className="flex items-center space-x-2">
                  <Checkbox
                    id={campaign._id}
                    checked={selectedCampaignIds.includes(campaign._id)}
                    onCheckedChange={(checked) => 
                      handleCampaignToggle(campaign._id, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={campaign._id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {campaign.name}
                  </label>
                  <Badge variant="outline" className="text-xs">
                    {campaign.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Comparison Results */}
      {selectedCampaignIds.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <BarChart3 className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select Campaigns to Compare</h3>
            <p className="text-gray-600">Choose 2 or more campaigns to see comparative analytics and insights.</p>
          </CardContent>
        </Card>
      ) : !comparativeData ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading comparative analytics...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {comparativeData.reduce((sum, c) => sum + c.stats.sent, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Emails Sent</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {comparativeData.length > 0 
                    ? (comparativeData.reduce((sum, c) => sum + c.rates.openRate, 0) / comparativeData.length).toFixed(1)
                    : 0}%
                </div>
                <div className="text-sm text-gray-600">Avg Open Rate</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {comparativeData.length > 0 
                    ? (comparativeData.reduce((sum, c) => sum + c.rates.clickRate, 0) / comparativeData.length).toFixed(1)
                    : 0}%
                </div>
                <div className="text-sm text-gray-600">Avg Click Rate</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {comparativeData.length > 0 
                    ? (comparativeData.reduce((sum, c) => sum + c.rates.deliveryRate, 0) / comparativeData.length).toFixed(1)
                    : 0}%
                </div>
                <div className="text-sm text-gray-600">Avg Delivery Rate</div>
              </CardContent>
            </Card>
          </div>
          
          {/* Detailed Comparison Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Campaign Performance Comparison</CardTitle>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openRate">Sort by Open Rate</SelectItem>
                    <SelectItem value="clickRate">Sort by Click Rate</SelectItem>
                    <SelectItem value="deliveryRate">Sort by Delivery Rate</SelectItem>
                    <SelectItem value="sent">Sort by Volume</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedData?.map((campaign, index) => (
                  <div key={campaign.campaignId} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-gray-900">{campaign.campaignName}</h3>
                          <Badge variant="outline">{campaign.status}</Badge>
                          {index === 0 && (
                            <Badge className="bg-green-100 text-green-800">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Best
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          Subject: {campaign.subject}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(campaign.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {campaign.targetTags.join(', ') || 'No tags'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Performance Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{campaign.stats.sent}</div>
                        <div className="text-xs text-gray-500">Sent</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{campaign.stats.delivered}</div>
                        <div className="text-xs text-gray-500">Delivered</div>
                        <Badge variant={getPerformanceBadge(campaign.rates.deliveryRate, 'delivery')} className="text-xs mt-1">
                          {campaign.rates.deliveryRate.toFixed(1)}%
                        </Badge>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">{campaign.stats.opened}</div>
                        <div className="text-xs text-gray-500">Opened</div>
                        <Badge variant={getPerformanceBadge(campaign.rates.openRate, 'open')} className="text-xs mt-1">
                          {campaign.rates.openRate.toFixed(1)}%
                        </Badge>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-bold text-indigo-600">{campaign.stats.clicked}</div>
                        <div className="text-xs text-gray-500">Clicked</div>
                        <Badge variant={getPerformanceBadge(campaign.rates.clickRate, 'click')} className="text-xs mt-1">
                          {campaign.rates.clickRate.toFixed(1)}%
                        </Badge>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">{campaign.stats.bounced}</div>
                        <div className="text-xs text-gray-500">Bounced</div>
                        <Badge variant={getPerformanceBadge(campaign.rates.bounceRate, 'bounce')} className="text-xs mt-1">
                          {campaign.rates.bounceRate.toFixed(1)}%
                        </Badge>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-600">{campaign.stats.unsubscribed}</div>
                        <div className="text-xs text-gray-500">Unsubscribed</div>
                        <Badge variant="outline" className="text-xs mt-1">
                          {campaign.rates.unsubscribeRate.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Performance Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Best Performing Campaign */}
                {sortedData && sortedData.length > 0 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">Best Performing Campaign</span>
                    </div>
                    <p className="text-sm text-green-700">
                      <strong>{sortedData[0].campaignName}</strong> has the highest {sortBy.replace('Rate', ' rate')} 
                      at {sortedData[0].rates[sortBy].toFixed(1)}%
                    </p>
                  </div>
                )}
                
                {/* Improvement Opportunities */}
                {sortedData && sortedData.length > 1 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Improvement Opportunities</span>
                    </div>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {sortedData.filter(c => c.rates.bounceRate > 5).map(c => (
                        <li key={c.campaignId}>
                          • <strong>{c.campaignName}</strong> has a high bounce rate ({c.rates.bounceRate.toFixed(1)}%) - check email list quality
                        </li>
                      ))}
                      {sortedData.filter(c => c.rates.openRate < 10).map(c => (
                        <li key={c.campaignId}>
                          • <strong>{c.campaignName}</strong> has low open rate ({c.rates.openRate.toFixed(1)}%) - consider improving subject line
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
