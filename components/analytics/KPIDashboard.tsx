"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Mail,
  Eye,
  MousePointer,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';

interface DateRange {
  from: Date;
  to: Date;
}

interface KPIData {
  totalEmails: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  deliveryRate: number;
  revenue: number;
  totalSubscribers: number;
  activeSubscribers: number;
  trends: {
    openRate: number;
    clickRate: number;
    revenue: number;
    subscribers: number;
  };
}

interface KPIDashboardProps {
  dateRange: DateRange;
}

export function KPIDashboard({ dateRange }: KPIDashboardProps) {
  // Mock data - replace with actual data filtering based on dateRange
  const data: KPIData = {
    totalEmails: 45230,
    openRate: 24.8,
    clickRate: 3.2,
    bounceRate: 1.8,
    unsubscribeRate: 0.3,
    deliveryRate: 98.2,
    revenue: 28750,
    totalSubscribers: 12340,
    activeSubscribers: 11890,
    trends: {
      openRate: 2.1,
      clickRate: 0.8,
      revenue: 15.2,
      subscribers: 5.3
    }
  };

  const kpis = [
    {
      title: "Total Emails Sent",
      value: data.totalEmails?.toLocaleString() || "0",
      icon: Mail,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "Emails sent this period",
      trend: null
    },
    {
      title: "Open Rate",
      value: `${data.openRate?.toFixed(1) || 0}%`,
      icon: Eye,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: "Average open rate",
      trend: data.trends?.openRate || 0,
      benchmark: 22.86
    },
    {
      title: "Click-through Rate",
      value: `${data.clickRate?.toFixed(1) || 0}%`,
      icon: MousePointer,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: "Average click rate",
      trend: data.trends?.clickRate || 0,
      benchmark: 2.91
    },
    {
      title: "Delivery Rate",
      value: `${data.deliveryRate?.toFixed(1) || 0}%`,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      description: "Successfully delivered",
      trend: null,
      target: 99
    },
    {
      title: "Bounce Rate",
      value: `${data.bounceRate?.toFixed(1) || 0}%`,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      description: "Emails that bounced",
      trend: null,
      target: 2,
      inverse: true
    },
    {
      title: "Total Revenue",
      value: `$${(data.revenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      description: "Total revenue attributed",
      trend: data.trends?.revenue || 0
    },
    {
      title: "Total Subscribers",
      value: data.totalSubscribers?.toLocaleString() || "0",
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      description: "Active subscribers",
      trend: data.trends?.subscribers || 0
    },
    {
      title: "Unsubscribe Rate",
      value: `${data.unsubscribeRate?.toFixed(1) || 0}%`,
      icon: TrendingDown,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      description: "Unsubscribe rate",
      trend: null,
      target: 0.5,
      inverse: true
    }
  ];

  const getTrendIcon = (trend: number | null, inverse = false) => {
    if (trend === null || trend === 0) return null;
    
    const isPositive = inverse ? trend < 0 : trend > 0;
    return isPositive ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  const getTrendColor = (trend: number | null, inverse = false) => {
    if (trend === null || trend === 0) return "text-gray-500";
    
    const isPositive = inverse ? trend < 0 : trend > 0;
    return isPositive ? "text-green-500" : "text-red-500";
  };

  const getPerformanceColor = (value: number, benchmark?: number, target?: number, inverse = false) => {
    if (benchmark) {
      const ratio = value / benchmark;
      if (inverse) {
        return ratio <= 0.5 ? "text-green-600" : ratio <= 1 ? "text-yellow-600" : "text-red-600";
      }
      return ratio >= 1.2 ? "text-green-600" : ratio >= 0.8 ? "text-yellow-600" : "text-red-600";
    }
    
    if (target) {
      if (inverse) {
        return value <= target ? "text-green-600" : value <= target * 2 ? "text-yellow-600" : "text-red-600";
      }
      return value >= target ? "text-green-600" : value >= target * 0.8 ? "text-yellow-600" : "text-red-600";
    }
    
    return "";
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          const numericValue = parseFloat(kpi.value.replace(/[^0-9.-]/g, '')) || 0;
          
          return (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                    <Icon className={`h-6 w-6 ${kpi.color}`} />
                  </div>
                  
                  {kpi.trend !== null && (
                    <div className="flex items-center gap-1">
                      {getTrendIcon(kpi.trend, kpi.inverse)}
                      <span className={`text-sm font-medium ${getTrendColor(kpi.trend, kpi.inverse)}`}>
                        {Math.abs(kpi.trend).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4">
                  <div className="flex items-baseline gap-2">
                    <h3 className={`text-2xl font-bold ${getPerformanceColor(numericValue, kpi.benchmark, kpi.target, kpi.inverse) || kpi.color}`}>
                      {kpi.value}
                    </h3>
                    {kpi.benchmark && (
                      <span className="text-sm text-gray-500">
                        vs {kpi.benchmark}% avg
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {kpi.title}
                  </p>
                  <p className="text-sm text-gray-600">
                    {kpi.description}
                  </p>
                  
                  {kpi.target && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Target: {kpi.target}%</span>
                        <span>{((numericValue / kpi.target) * 100).toFixed(0)}% of target</span>
                      </div>
                      <Progress 
                        value={Math.min((numericValue / kpi.target) * 100, 100)} 
                        className="h-1"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Summary
          </CardTitle>
          <CardDescription>
            Overall campaign performance analysis for this period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Engagement Health */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Engagement Health</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Open Rate</span>
                  <Badge variant={data.openRate >= 20 ? "default" : data.openRate >= 15 ? "secondary" : "destructive"}>
                    {data.openRate >= 20 ? "Excellent" : data.openRate >= 15 ? "Good" : "Needs Improvement"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Click Rate</span>
                  <Badge variant={data.clickRate >= 3 ? "default" : data.clickRate >= 2 ? "secondary" : "destructive"}>
                    {data.clickRate >= 3 ? "Excellent" : data.clickRate >= 2 ? "Good" : "Needs Improvement"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Deliverability Health */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Deliverability Health</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Delivery Rate</span>
                  <Badge variant={data.deliveryRate >= 98 ? "default" : data.deliveryRate >= 95 ? "secondary" : "destructive"}>
                    {data.deliveryRate >= 98 ? "Excellent" : data.deliveryRate >= 95 ? "Good" : "Poor"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Bounce Rate</span>
                  <Badge variant={data.bounceRate <= 2 ? "default" : data.bounceRate <= 5 ? "secondary" : "destructive"}>
                    {data.bounceRate <= 2 ? "Excellent" : data.bounceRate <= 5 ? "Good" : "Poor"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* List Health */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">List Health</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Growth Rate</span>
                  <Badge variant={data.trends?.subscribers > 0 ? "default" : "secondary"}>
                    {data.trends?.subscribers > 0 ? "Growing" : "Stable"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Unsubscribe Rate</span>
                  <Badge variant={data.unsubscribeRate <= 0.5 ? "default" : data.unsubscribeRate <= 1 ? "secondary" : "destructive"}>
                    {data.unsubscribeRate <= 0.5 ? "Healthy" : data.unsubscribeRate <= 1 ? "Monitor" : "High"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
