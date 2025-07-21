"use client";

import React from 'react';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  List, 
  Clock, 
  Mail, 
  CheckCircle2, 
  AlertCircle,
  Activity,
  TrendingUp,
  Pause,
  Send
} from 'lucide-react';

export function SendingQueueOverview() {
  const queueOverview = useQuery(api.campaignMonitoring.getSendingQueueOverview);
  
  if (!queueOverview) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            Sending Queue Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const { overview, activeCampaigns } = queueOverview;
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sending': return <Send className="h-4 w-4 text-green-500" />;
      case 'paused': return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'scheduled': return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sending': return 'bg-green-100 text-green-800 border-green-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Overall Queue Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            Global Sending Queue
          </CardTitle>
          <CardDescription>
            Overview of all email sending activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{overview.queued}</div>
              <div className="text-sm text-blue-600 flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" />
                Queued
              </div>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{overview.processing}</div>
              <div className="text-sm text-yellow-600 flex items-center justify-center gap-1">
                <Activity className="h-3 w-3" />
                Processing
              </div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{overview.sent}</div>
              <div className="text-sm text-green-600 flex items-center justify-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Sent
              </div>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{overview.failed}</div>
              <div className="text-sm text-red-600 flex items-center justify-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Failed
              </div>
            </div>
            
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">{overview.recentlySent}</div>
              <div className="text-sm text-indigo-600 flex items-center justify-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Last 5min
              </div>
            </div>
          </div>
          
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{overview.total > 0 ? Math.round(((overview.sent + overview.failed) / overview.total) * 100) : 0}%</span>
            </div>
            <Progress 
              value={overview.total > 0 ? ((overview.sent + overview.failed) / overview.total) * 100 : 0} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{overview.sent + overview.failed} processed</span>
              <span>{overview.total} total</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Active Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Active Campaigns
          </CardTitle>
          <CardDescription>
            Campaigns currently sending or scheduled
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeCampaigns.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <Mail className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Active Campaigns</h3>
              <p className="text-gray-600">All campaigns are either completed or in draft mode.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeCampaigns.map((campaign) => {
                const progress = campaign.total > 0 ? ((campaign.sent + campaign.failed) / campaign.total) * 100 : 0;
                const isActive = campaign.status === 'sending';
                
                return (
                  <div key={campaign.campaignId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(campaign.status)}
                        <div>
                          <h3 className="font-medium text-gray-900">{campaign.campaignName}</h3>
                          <Badge className={getStatusColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{progress.toFixed(1)}%</div>
                        <div className="text-sm text-gray-500">complete</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Progress value={progress} className="h-2" />
                      
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-sm font-medium text-blue-600">{campaign.queued}</div>
                          <div className="text-xs text-gray-500">Queued</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-yellow-600">{campaign.processing}</div>
                          <div className="text-xs text-gray-500">Processing</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-green-600">{campaign.sent}</div>
                          <div className="text-xs text-gray-500">Sent</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-red-600">{campaign.failed}</div>
                          <div className="text-xs text-gray-500">Failed</div>
                        </div>
                      </div>
                    </div>
                    
                    {isActive && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                        <Activity className="h-3 w-3 animate-pulse" />
                        <span>Currently sending emails...</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Queue Health Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Queue Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold mb-2">
                {overview.total > 0 ? ((overview.sent / (overview.sent + overview.failed)) * 100).toFixed(1) : '0'}%
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
              <div className="text-xs text-gray-500 mt-1">
                {overview.sent} of {overview.sent + overview.failed} processed
              </div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold mb-2 text-blue-600">
                {overview.queued + overview.processing}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
              <div className="text-xs text-gray-500 mt-1">
                Ready to process
              </div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold mb-2 text-indigo-600">
                {overview.recentlySent}
              </div>
              <div className="text-sm text-gray-600">Recent Activity</div>
              <div className="text-xs text-gray-500 mt-1">
                Sent in last 5 minutes
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
