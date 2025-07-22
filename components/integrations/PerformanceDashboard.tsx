"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  Clock, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3,
  LineChart,
  PieChart,
  Settings,
  Play,
  Pause,
  RefreshCw,
  Download
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { formatDistanceToNow } from 'date-fns';
import type { Id } from '@/convex/_generated/dataModel';

interface PerformanceDashboardProps {
  userId: Id<'users'>;
  integrationId?: Id<'integrations'>;
}

export default function PerformanceDashboard({ userId, integrationId }: PerformanceDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedMetric, setSelectedMetric] = useState('response_time');

  // Queries
  const performanceMetrics = useQuery(api.performanceOptimization.getPerformanceMetrics, {
    userId,
    integrationId,
    timeRange,
  });

  const optimizationPlans = useQuery(api.performanceOptimization.getOptimizationPlans, {
    userId,
    integrationId,
  });

  const performanceInsights = useQuery(api.performanceOptimization.getPerformanceInsights, {
    userId,
    integrationId,
    timeRange,
  });

  const autoTuningStatus = useQuery(api.performanceOptimization.getAutoTuningStatus, {
    userId,
    integrationId,
  });

  // Mutations
  const triggerOptimization = useMutation(api.performanceOptimization.triggerOptimization);
  const toggleAutoTuning = useMutation(api.performanceOptimization.toggleAutoTuning);

  const handleOptimization = async (planId: string) => {
    try {
      await triggerOptimization({
        userId,
        planId,
      });
    } catch (error) {
      console.error('Optimization failed:', error);
    }
  };

  const handleAutoTuningToggle = async () => {
    try {
      await toggleAutoTuning({
        userId,
        integrationId,
        enabled: !autoTuningStatus?.enabled,
      });
    } catch (error) {
      console.error('Auto-tuning toggle failed:', error);
    }
  };

  const getMetricValue = (metric: any, type: string) => {
    return metric?.metrics?.[type] || 0;
  };

  const getMetricTrend = (metric: any, type: string) => {
    const current = getMetricValue(metric, type);
    const previous = metric?.previousMetrics?.[type] || current;
    return ((current - previous) / previous) * 100;
  };

  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'response_time': return <Clock className="h-4 w-4" />;
      case 'throughput': return <Zap className="h-4 w-4" />;
      case 'error_rate': return <AlertTriangle className="h-4 w-4" />;
      case 'cpu_usage': return <Activity className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <div className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatMetricValue = (value: number, type: string) => {
    switch (type) {
      case 'response_time':
        return `${value.toFixed(2)}ms`;
      case 'throughput':
        return `${value.toFixed(1)} req/s`;
      case 'error_rate':
        return `${(value * 100).toFixed(2)}%`;
      case 'cpu_usage':
        return `${value.toFixed(1)}%`;
      case 'memory_usage':
        return `${(value / 1024 / 1024).toFixed(1)}MB`;
      case 'disk_usage':
        return `${(value / 1024 / 1024 / 1024).toFixed(1)}GB`;
      default:
        return value.toString();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Performance Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor and optimize integration performance with real-time metrics and automated tuning
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Auto-Tuning Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Auto-Tuning
            </span>
            <Button
              variant={autoTuningStatus?.enabled ? "default" : "outline"}
              size="sm"
              onClick={handleAutoTuningToggle}
            >
              {autoTuningStatus?.enabled ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Disable
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Enable
                </>
              )}
            </Button>
          </CardTitle>
          <CardDescription>
            {autoTuningStatus?.enabled 
              ? "Automatic performance optimization is active"
              : "Automatic performance optimization is disabled"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {autoTuningStatus && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Next Optimization</div>
                <div className="font-medium">
                  {autoTuningStatus.nextOptimizationAt 
                    ? formatDistanceToNow(autoTuningStatus.nextOptimizationAt)
                    : "Not scheduled"
                  }
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Optimizations Applied</div>
                <div className="font-medium">{autoTuningStatus.optimizationsApplied || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Performance Score</div>
                <div className="font-medium">{autoTuningStatus.performanceScore || 0}%</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Detailed Metrics</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['response_time', 'throughput', 'error_rate', 'cpu_usage'].map((metricType) => {
              const value = getMetricValue(performanceMetrics, metricType);
              const trend = getMetricTrend(performanceMetrics, metricType);
              
              return (
                <Card key={metricType}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-sm font-medium">
                      <span className="flex items-center">
                        {getMetricIcon(metricType)}
                        <span className="ml-2 capitalize">{metricType.replace('_', ' ')}</span>
                      </span>
                      {getTrendIcon(trend)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatMetricValue(value, metricType)}</div>
                    <p className="text-xs text-muted-foreground">
                      {trend !== 0 && (
                        <span className={trend > 0 ? 'text-red-500' : 'text-green-500'}>
                          {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                        </span>
                      )}
                      {trend === 0 && 'No change'}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Performance Score */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Performance Score</CardTitle>
              <CardDescription>
                Composite score based on all performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {performanceMetrics?.overallScore || 0}%
                  </span>
                  <Badge className={getStatusColor(performanceMetrics?.performanceStatus || 'unknown')}>
                    {performanceMetrics?.performanceStatus || 'Unknown'}
                  </Badge>
                </div>
                <Progress 
                  value={performanceMetrics?.overallScore || 0} 
                  className="w-full"
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Response Time</div>
                    <div className="font-medium">{performanceMetrics?.scores?.responseTime || 0}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Throughput</div>
                    <div className="font-medium">{performanceMetrics?.scores?.throughput || 0}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Reliability</div>
                    <div className="font-medium">{performanceMetrics?.scores?.reliability || 0}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Resource Usage</div>
                    <div className="font-medium">{performanceMetrics?.scores?.resourceUsage || 0}%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Performance Issues */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                Performance Issues
              </CardTitle>
              <CardDescription>
                Recent performance degradations and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {performanceMetrics?.recentIssues?.length > 0 ? (
                <div className="space-y-3">
                  {performanceMetrics.recentIssues.slice(0, 5).map((issue: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <div>
                          <p className="font-medium">{issue.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {issue.metric} • {formatDistanceToNow(issue.timestamp)} ago
                          </p>
                        </div>
                      </div>
                      <Badge variant={issue.severity === 'critical' ? 'destructive' : 'secondary'}>
                        {issue.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-muted-foreground">No performance issues detected</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Response Time Metrics</CardTitle>
                <CardDescription>Request processing time analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Average</div>
                      <div className="text-lg font-semibold">
                        {formatMetricValue(performanceMetrics?.responseTimeMetrics?.average || 0, 'response_time')}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">95th Percentile</div>
                      <div className="text-lg font-semibold">
                        {formatMetricValue(performanceMetrics?.responseTimeMetrics?.p95 || 0, 'response_time')}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">99th Percentile</div>
                      <div className="text-lg font-semibold">
                        {formatMetricValue(performanceMetrics?.responseTimeMetrics?.p99 || 0, 'response_time')}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Max</div>
                      <div className="text-lg font-semibold">
                        {formatMetricValue(performanceMetrics?.responseTimeMetrics?.max || 0, 'response_time')}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Usage</CardTitle>
                <CardDescription>System resource consumption</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['cpu_usage', 'memory_usage', 'disk_usage', 'network_usage'].map((resource) => (
                    <div key={resource} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{resource.replace('_', ' ')}</span>
                        <span>{formatMetricValue(getMetricValue(performanceMetrics, resource), resource)}</span>
                      </div>
                      <Progress value={getMetricValue(performanceMetrics, resource)} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Throughput and Error Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Throughput Analysis</CardTitle>
                <CardDescription>Request processing capacity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Current Rate</div>
                      <div className="text-lg font-semibold">
                        {formatMetricValue(performanceMetrics?.throughputMetrics?.current || 0, 'throughput')}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Peak Rate</div>
                      <div className="text-lg font-semibold">
                        {formatMetricValue(performanceMetrics?.throughputMetrics?.peak || 0, 'throughput')}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Capacity Utilization</div>
                    <div className="mt-2">
                      <Progress 
                        value={performanceMetrics?.throughputMetrics?.utilization || 0} 
                        className="h-2"
                      />
                      <div className="text-sm text-right mt-1">
                        {performanceMetrics?.throughputMetrics?.utilization || 0}%
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Analysis</CardTitle>
                <CardDescription>Error rates and types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Error Rate</div>
                      <div className="text-lg font-semibold">
                        {formatMetricValue(performanceMetrics?.errorMetrics?.rate || 0, 'error_rate')}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Total Errors</div>
                      <div className="text-lg font-semibold">
                        {performanceMetrics?.errorMetrics?.total || 0}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {performanceMetrics?.errorMetrics?.byType?.slice(0, 3).map((error: any, index: number) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">{error.type}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{error.count}</span>
                          <div className="w-16 h-2 bg-muted rounded">
                            <div 
                              className="h-full bg-red-500 rounded"
                              style={{ width: `${(error.count / performanceMetrics.errorMetrics.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          {/* Optimization Plans */}
          <Card>
            <CardHeader>
              <CardTitle>Optimization Plans</CardTitle>
              <CardDescription>
                Available performance optimization strategies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {optimizationPlans?.map((plan: any) => (
                  <div key={plan._id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{plan.name}</h3>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={plan.priority === 'high' ? 'destructive' : 'secondary'}>
                          {plan.priority} priority
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => handleOptimization(plan._id)}
                          disabled={plan.status === 'applying'}
                        >
                          {plan.status === 'applying' ? 'Applying...' : 'Apply'}
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Expected Improvement</div>
                        <div className="font-medium">{plan.expectedImprovement}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Impact</div>
                        <div className="font-medium capitalize">{plan.impact}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Effort</div>
                        <div className="font-medium capitalize">{plan.effort}</div>
                      </div>
                    </div>
                    {plan.recommendations && (
                      <div className="mt-3">
                        <div className="text-sm text-muted-foreground mb-2">Recommendations:</div>
                        <ul className="text-sm space-y-1">
                          {plan.recommendations.slice(0, 3).map((rec: string, index: number) => (
                            <li key={index} className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {/* Performance Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
              <CardDescription>
                AI-powered analysis and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceInsights?.insights?.map((insight: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {insight.type === 'warning' && <AlertTriangle className="h-5 w-5 text-orange-500" />}
                        {insight.type === 'info' && <BarChart3 className="h-5 w-5 text-blue-500" />}
                        {insight.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{insight.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                        {insight.recommendations && (
                          <div className="mt-3">
                            <div className="text-sm font-medium mb-2">Recommendations:</div>
                            <ul className="text-sm space-y-1">
                              {insight.recommendations.map((rec: string, recIndex: number) => (
                                <li key={recIndex} className="flex items-start">
                                  <span className="mr-2">•</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <Badge variant="outline">{insight.severity}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trend Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Trend Analysis</CardTitle>
              <CardDescription>
                Performance trends and predictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {performanceInsights?.trends?.map((trend: any, index: number) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium capitalize">{trend.metric.replace('_', ' ')}</span>
                      {getTrendIcon(trend.direction)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {trend.description}
                    </div>
                    <div className="mt-2 text-xs">
                      <span className="text-muted-foreground">Confidence: </span>
                      <span className="font-medium">{trend.confidence}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {/* Performance History */}
          <Card>
            <CardHeader>
              <CardTitle>Performance History</CardTitle>
              <CardDescription>
                Historical performance data and optimization results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceMetrics?.history?.slice(0, 10).map((record: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      </div>
                      <div>
                        <p className="font-medium">{record.event}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(record.timestamp)} ago
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        Score: {record.performanceScore}%
                      </div>
                      {record.improvement && (
                        <div className="text-xs text-green-600">
                          +{record.improvement}% improvement
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
