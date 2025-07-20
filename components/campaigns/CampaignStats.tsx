"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Eye, 
  MousePointer, 
  Send, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Users,
  Mail,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface CampaignStatsProps {
  campaignId: string;
  status: string;
  stats?: {
    totalEmails: number;
    sent: number;
    pending: number;
    failed: number;
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

export function CampaignStats({ campaignId, status, stats }: CampaignStatsProps) {
  if (!stats || status === 'draft') {
    return (
      <div className="text-sm text-gray-400 flex items-center gap-1">
        <Minus className="h-3 w-3" />
        No data yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Quick Stats Row */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1 text-blue-600">
          <Send className="h-3 w-3" />
          <span>{stats.sent}</span>
        </div>
        <div className="flex items-center gap-1 text-green-600">
          <Eye className="h-3 w-3" />
          <span>{stats.opened}</span>
        </div>
        <div className="flex items-center gap-1 text-purple-600">
          <MousePointer className="h-3 w-3" />
          <span>{stats.clicked}</span>
        </div>
      </div>

      {/* Rates */}
      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-gray-500">Open:</span>
          <span className={`font-medium ${stats.openRate >= 20 ? 'text-green-600' : stats.openRate >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
            {stats.openRate.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-500">Click:</span>
          <span className={`font-medium ${stats.clickRate >= 3 ? 'text-green-600' : stats.clickRate >= 1 ? 'text-yellow-600' : 'text-red-600'}`}>
            {stats.clickRate.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

interface CampaignProgressProps {
  status: string;
  totalEmails: number;
  sentEmails: number;
  pendingEmails: number;
  failedEmails: number;
}

export function CampaignProgress({ status, totalEmails, sentEmails, pendingEmails, failedEmails }: CampaignProgressProps) {
  if (status === 'draft' || totalEmails === 0) {
    return null;
  }

  const progressPercentage = totalEmails > 0 ? (sentEmails / totalEmails) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Progress</span>
        <span className="font-medium">{sentEmails}/{totalEmails}</span>
      </div>
      <Progress value={progressPercentage} className="h-2" />
      <div className="flex items-center gap-4 text-xs text-gray-500">
        {pendingEmails > 0 && (
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            {pendingEmails} pending
          </span>
        )}
        {failedEmails > 0 && (
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            {failedEmails} failed
          </span>
        )}
      </div>
    </div>
  );
}

interface CampaignDetailedStatsProps {
  stats: {
    totalEmails: number;
    sent: number;
    pending: number;
    failed: number;
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

export function CampaignDetailedStats({ stats }: CampaignDetailedStatsProps) {
  const metrics = [
    {
      label: "Total Recipients",
      value: stats.totalEmails,
      icon: Users,
      color: "text-gray-600",
    },
    {
      label: "Emails Sent",
      value: stats.sent,
      icon: Mail,
      color: "text-blue-600",
    },
    {
      label: "Delivered",
      value: stats.delivered,
      icon: CheckCircle2,
      color: "text-green-600",
    },
    {
      label: "Opened",
      value: stats.opened,
      percentage: stats.openRate,
      icon: Eye,
      color: "text-green-600",
    },
    {
      label: "Clicked",
      value: stats.clicked,
      percentage: stats.clickRate,
      icon: MousePointer,
      color: "text-purple-600",
    },
    {
      label: "Bounced",
      value: stats.bounced,
      percentage: stats.bounceRate,
      icon: AlertCircle,
      color: "text-red-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                    {metric.percentage !== undefined && (
                      <Badge variant="outline" className={metric.color}>
                        {metric.percentage.toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                </div>
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${metric.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                  <Icon className={`h-4 w-4 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
