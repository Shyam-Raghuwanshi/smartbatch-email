"use client";

import React, { useState, useEffect } from 'react';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  Square, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  Mail,
  Eye,
  MousePointer,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Activity,
  Users,
  Zap,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

interface RealTimeMonitoringProps {
  campaignId: Id<"campaigns">;
  onPause?: () => void;
  onResume?: () => void;
  onEmergencyStop?: () => void;
}

export function RealTimeMonitoring({ 
  campaignId, 
  onPause, 
  onResume, 
  onEmergencyStop 
}: RealTimeMonitoringProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  
  // Fetch real-time data
  const realTimeStats = useQuery(api.campaignMonitoring.getCampaignRealTimeStats, { campaignId });
  const alerts = useQuery(api.campaignMonitoring.getAlertTriggers, { campaignId });
  
  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(Date.now());
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    setLastRefresh(Date.now());
    setTimeout(() => setIsRefreshing(false), 1000);
  };
  
  if (!realTimeStats) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  const getHealthColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };
  
  const formatTimeRemaining = (timestamp: number | null) => {
    if (!timestamp) return 'Unknown';
    
    const diff = timestamp - Date.now();
    if (diff <= 0) return 'Complete';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };
  
  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Real-Time Monitoring</h2>
          <p className="text-sm text-gray-600">
            Last updated: {new Date(realTimeStats.lastUpdated).toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {realTimeStats.campaignStatus === 'sending' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onPause}
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={onEmergencyStop}
              >
                <Square className="h-4 w-4 mr-2" />
                Emergency Stop
              </Button>
            </>
          )}
          
          {realTimeStats.campaignStatus === 'paused' && (
            <Button
              variant="default"
              size="sm"
              onClick={onResume}
            >
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
          )}
        </div>
      </div>
      
      {/* Health Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert key={index} variant={alert.type === 'critical' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}
      
      {/* Campaign Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Campaign Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className={getHealthColor(realTimeStats.health.status)}>
                {realTimeStats.health.status.toUpperCase()}
              </Badge>
              <div className="text-sm text-gray-600">
                Progress: {realTimeStats.progress.toFixed(1)}%
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">
                ETA: {formatTimeRemaining(realTimeStats.sendingRate.estimatedCompletion)}
              </div>
              <div className="text-xs text-gray-500">
                Rate: {realTimeStats.sendingRate.current} emails/hour
              </div>
            </div>
          </div>
          <Progress value={realTimeStats.progress} className="mt-3" />
        </CardContent>
      </Card>
      
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Queue Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Queued</p>
                <p className="text-2xl font-bold text-blue-600">{realTimeStats.queueStats.queued}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sent</p>
                <p className="text-2xl font-bold text-green-600">{realTimeStats.queueStats.sent}</p>
              </div>
              <Mail className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Opens</p>
                <p className="text-2xl font-bold text-purple-600">{realTimeStats.engagementStats.opens.total}</p>
              </div>
              <Eye className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clicks</p>
                <p className="text-2xl font-bold text-indigo-600">{realTimeStats.engagementStats.clicks.total}</p>
              </div>
              <MousePointer className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bounces</p>
                <p className="text-2xl font-bold text-red-600">{realTimeStats.engagementStats.bounces.total}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-orange-600">{realTimeStats.queueStats.failed}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Performance Rates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Rate</p>
                <p className="text-xl font-bold">{realTimeStats.rates.open.toFixed(1)}%</p>
              </div>
              {realTimeStats.rates.open >= 20 ? (
                <TrendingUp className="h-6 w-6 text-green-500" />
              ) : realTimeStats.rates.open >= 10 ? (
                <Activity className="h-6 w-6 text-yellow-500" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-500" />
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Last hour: +{realTimeStats.engagementStats.opens.lastHour}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Click Rate</p>
                <p className="text-xl font-bold">{realTimeStats.rates.click.toFixed(1)}%</p>
              </div>
              {realTimeStats.rates.click >= 3 ? (
                <TrendingUp className="h-6 w-6 text-green-500" />
              ) : realTimeStats.rates.click >= 1 ? (
                <Activity className="h-6 w-6 text-yellow-500" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-500" />
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Last hour: +{realTimeStats.engagementStats.clicks.lastHour}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bounce Rate</p>
                <p className="text-xl font-bold">{realTimeStats.rates.bounce.toFixed(1)}%</p>
              </div>
              {realTimeStats.rates.bounce <= 2 ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : realTimeStats.rates.bounce <= 5 ? (
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-500" />
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Last hour: +{realTimeStats.engagementStats.bounces.lastHour}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Delivery Rate</p>
                <p className="text-xl font-bold">{realTimeStats.rates.delivery.toFixed(1)}%</p>
              </div>
              {realTimeStats.rates.delivery >= 95 ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : realTimeStats.rates.delivery >= 90 ? (
                <Activity className="h-6 w-6 text-yellow-500" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-500" />
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Complaint: {realTimeStats.rates.complaint.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Activity in the last 5 minutes and hour
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Last 5 Minutes</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Emails Sent</span>
                  <Badge variant="outline">{realTimeStats.recentActivity.last5Minutes.sent}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Opens</span>
                  <Badge variant="outline">{realTimeStats.engagementStats.opens.last5Minutes}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Clicks</span>
                  <Badge variant="outline">{realTimeStats.engagementStats.clicks.last5Minutes}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Failures</span>
                  <Badge variant={realTimeStats.recentActivity.last5Minutes.failed > 0 ? "destructive" : "outline"}>
                    {realTimeStats.recentActivity.last5Minutes.failed}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Last Hour</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Emails Sent</span>
                  <Badge variant="outline">{realTimeStats.recentActivity.lastHour.sent}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Opens</span>
                  <Badge variant="outline">{realTimeStats.engagementStats.opens.lastHour}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Clicks</span>
                  <Badge variant="outline">{realTimeStats.engagementStats.clicks.lastHour}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Failures</span>
                  <Badge variant={realTimeStats.recentActivity.lastHour.failed > 0 ? "destructive" : "outline"}>
                    {realTimeStats.recentActivity.lastHour.failed}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Issues and Recommendations */}
      {realTimeStats.health.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Issues Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {realTimeStats.health.issues.map((issue, index) => (
                <div key={index} className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">{issue}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
