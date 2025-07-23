"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  Target,
  Users,
  Mail,
  Filter,
  RefreshCw,
  DollarSign,
  PieChart,
  Activity,
} from 'lucide-react';
import { cn } from "@/lib/utils";

// Import our analytics components
import { KPIDashboard } from '@/components/analytics/KPIDashboard';
import { PerformanceTrends } from '@/components/analytics/PerformanceTrends';
import { AudienceInsights } from '@/components/analytics/AudienceInsights';
import { RevenueAttribution } from '@/components/analytics/RevenueAttribution';
import CampaignComparison from '@/components/analytics/CampaignComparison';
import { SubscriberBehavior } from '@/components/analytics/SubscriberBehavior';
import DeliverabilityReports from '@/components/analytics/DeliverabilityReports';
import FunnelAnalysis from '@/components/analytics/FunnelAnalysis';
import CohortAnalysis from '@/components/analytics/CohortAnalysis';
import PredictiveAnalytics from '@/components/analytics/PredictiveAnalytics';
import { ExportReports } from '@/components/analytics/ExportReports';
import { DateRangeFilter } from '@/components/analytics/DateRangeFilter';

interface DateRange {
  from: Date;
  to: Date;
}

function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  });
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Auto refresh every 5 minutes if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      window.location.reload();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Get user campaigns for filtering
  const campaigns = useQuery(api.campaigns.getCampaignsByUser);

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
  };

  const handleCampaignFilter = (campaignIds: string[]) => {
    setSelectedCampaigns(campaignIds);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Comprehensive insights into your email campaign performance
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
          
          <ExportReports 
            dateRange={dateRange}
          />
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <DateRangeFilter
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
            />
            
            <Select 
              value={selectedCampaigns.length > 0 ? "filtered" : "all"}
              onValueChange={(value) => {
                if (value === "all") {
                  setSelectedCampaigns([]);
                }
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by campaigns" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                <SelectItem value="filtered">
                  {selectedCampaigns.length} Selected
                </SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="audience" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Audience
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="behavior" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Behavior
          </TabsTrigger>
          <TabsTrigger value="deliverability" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Deliverability
          </TabsTrigger>
          <TabsTrigger value="predictive" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Predictive
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab - KPIs and High-level Metrics */}
        <TabsContent value="overview" className="space-y-6">
          <KPIDashboard dateRange={dateRange} />
        </TabsContent>
        
        {/* Performance Tab - Trends and Charts */}
        <TabsContent value="performance" className="space-y-6">
          <PerformanceTrends dateRange={dateRange} />
        </TabsContent>
        
        {/* Audience Tab - Engagement and Demographics */}
        <TabsContent value="audience" className="space-y-6">
          <AudienceInsights dateRange={dateRange} />
        </TabsContent>
        
        {/* Revenue Tab - E-commerce Attribution */}
        <TabsContent value="revenue" className="space-y-6">
          <RevenueAttribution dateRange={dateRange} />
        </TabsContent>
        
        {/* Campaigns Tab - Comparison and Analysis */}
        <TabsContent value="campaigns" className="space-y-6">
          <div className="space-y-6">
            <CampaignComparison dateRange={dateRange} />
            
            <FunnelAnalysis dateRange={dateRange} />
          </div>
        </TabsContent>
        
        {/* Behavior Tab - Subscriber Analysis */}
        <TabsContent value="behavior" className="space-y-6">
          <div className="space-y-6">
            <SubscriberBehavior dateRange={dateRange} />
            
            <CohortAnalysis dateRange={dateRange} />
          </div>
        </TabsContent>
        
        {/* Deliverability Tab - Email Delivery Analysis */}
        <TabsContent value="deliverability" className="space-y-6">
          <DeliverabilityReports dateRange={dateRange} />
        </TabsContent>
        
        {/* Predictive Tab - AI-powered Insights */}
        <TabsContent value="predictive" className="space-y-6">
          <PredictiveAnalytics dateRange={dateRange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AnalyticsWrapper() {
  return (
    <Suspense fallback={<div>Loading analytics...</div>}>
      <AnalyticsPage />
    </Suspense>
  );
}
