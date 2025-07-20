"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Eye, 
  MousePointer, 
  Users, 
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

interface CampaignChartProps {
  stats: {
    totalEmails: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
  };
}

export function CampaignChart({ stats }: CampaignChartProps) {
  const metrics = [
    {
      label: "Delivery Rate",
      value: stats.delivered,
      total: stats.sent,
      percentage: stats.sent > 0 ? (stats.delivered / stats.sent) * 100 : 0,
      icon: Mail,
      color: "bg-blue-500",
      textColor: "text-blue-600"
    },
    {
      label: "Open Rate", 
      value: stats.opened,
      total: stats.delivered,
      percentage: stats.openRate,
      icon: Eye,
      color: "bg-green-500",
      textColor: "text-green-600"
    },
    {
      label: "Click Rate",
      value: stats.clicked,
      total: stats.opened,
      percentage: stats.clickRate,
      icon: MousePointer,
      color: "bg-purple-500",
      textColor: "text-purple-600"
    },
    {
      label: "Bounce Rate",
      value: stats.bounced,
      total: stats.sent,
      percentage: stats.bounceRate,
      icon: TrendingDown,
      color: "bg-red-500",
      textColor: "text-red-600"
    }
  ];

  const getTrendIcon = (percentage: number, type: 'positive' | 'negative') => {
    if (percentage === 0) return <Minus className="h-3 w-3" />;
    
    if (type === 'positive') {
      return percentage >= 20 ? <TrendingUp className="h-3 w-3 text-green-500" /> : 
             percentage >= 10 ? <Minus className="h-3 w-3 text-yellow-500" /> :
             <TrendingDown className="h-3 w-3 text-red-500" />;
    } else {
      return percentage <= 5 ? <TrendingUp className="h-3 w-3 text-green-500" /> :
             percentage <= 10 ? <Minus className="h-3 w-3 text-yellow-500" /> :
             <TrendingDown className="h-3 w-3 text-red-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Campaign Performance
        </CardTitle>
        <CardDescription>
          Email engagement metrics and performance indicators
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{stats.totalEmails}</div>
            <div className="text-sm text-gray-600">Total Recipients</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
            <div className="text-sm text-blue-600">Emails Sent</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.opened}</div>
            <div className="text-sm text-green-600">Opens</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.clicked}</div>
            <div className="text-sm text-purple-600">Clicks</div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <metric.icon className={`h-4 w-4 ${metric.textColor}`} />
                  <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {metric.value}/{metric.total}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(metric.percentage, metric.label === 'Bounce Rate' ? 'negative' : 'positive')}
                    <span className={`text-sm font-medium ${metric.textColor}`}>
                      {metric.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              <Progress 
                value={metric.percentage} 
                className="h-2"
              />
            </div>
          ))}
        </div>

        {/* Performance Summary */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Engagement Score:</span>
              <div className="font-medium">
                {stats.openRate > 0 && stats.clickRate > 0 ? (
                  <Badge variant={
                    (stats.openRate + stats.clickRate) / 2 >= 15 ? "default" :
                    (stats.openRate + stats.clickRate) / 2 >= 8 ? "secondary" : "destructive"
                  }>
                    {((stats.openRate + stats.clickRate) / 2).toFixed(1)}% 
                    {(stats.openRate + stats.clickRate) / 2 >= 15 ? ' Excellent' :
                     (stats.openRate + stats.clickRate) / 2 >= 8 ? ' Good' : ' Needs Improvement'}
                  </Badge>
                ) : (
                  <Badge variant="outline">No data</Badge>
                )}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Deliverability:</span>
              <div className="font-medium">
                <Badge variant={
                  stats.bounceRate <= 2 ? "default" :
                  stats.bounceRate <= 5 ? "secondary" : "destructive"
                }>
                  {stats.bounceRate <= 2 ? 'Excellent' :
                   stats.bounceRate <= 5 ? 'Good' : 'Poor'} 
                  ({(100 - stats.bounceRate).toFixed(1)}%)
                </Badge>
              </div>
            </div>
            <div>
              <span className="text-gray-600">Total Unsubscribes:</span>
              <div className="font-medium text-orange-600">
                {stats.unsubscribed} ({stats.sent > 0 ? ((stats.unsubscribed / stats.sent) * 100).toFixed(2) : 0}%)
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
