"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Clock, Database, Wifi, AlertTriangle, CheckCircle, BarChart3, Zap, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  timestamp: number;
  trend?: 'up' | 'down' | 'stable';
}

interface ComponentMetric {
  componentName: string;
  renderTime: number;
  lastRender: number;
  renderCount: number;
  averageRenderTime: number;
  maxRenderTime: number;
}

interface CacheMetric {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  cacheSize: number;
}

interface NetworkMetric {
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
  bytesTransferred: number;
}

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [componentMetrics, setComponentMetrics] = useState<ComponentMetric[]>([]);
  const [cacheMetrics, setCacheMetrics] = useState<CacheMetric>({
    hitRate: 0,
    missRate: 0,
    totalRequests: 0,
    cacheSize: 0
  });
  const [networkMetrics, setNetworkMetrics] = useState<NetworkMetric>({
    requestCount: 0,
    averageResponseTime: 0,
    errorRate: 0,
    bytesTransferred: 0
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online');
  const [memoryUsage, setMemoryUsage] = useState<number>(0);
  const [chartData, setChartData] = useState<Array<{time: string, memory: number, renderTime: number}>>([]);

  // Initialize performance monitoring
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      // Collect performance metrics
      const now = Date.now();
      const newMetrics: PerformanceMetric[] = [];

      // Page load time
      if (performance.timing) {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        if (loadTime > 0) {
          const prevMetric = metrics.find(m => m.name === 'Page Load Time');
          let trend: 'up' | 'down' | 'stable' = 'stable';
          if (prevMetric) {
            trend = loadTime > prevMetric.value ? 'up' : loadTime < prevMetric.value ? 'down' : 'stable';
          }
          
          newMetrics.push({
            name: 'Page Load Time',
            value: loadTime,
            unit: 'ms',
            status: loadTime < 2000 ? 'good' : loadTime < 4000 ? 'warning' : 'critical',
            timestamp: now,
            trend
          });
        }
      }

      // FCP (First Contentful Paint)
      if ('performance' in window && 'getEntriesByType' in performance) {
        const paintEntries = performance.getEntriesByType('paint');
        const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        if (fcp) {
          const prevMetric = metrics.find(m => m.name === 'First Contentful Paint');
          let trend: 'up' | 'down' | 'stable' = 'stable';
          if (prevMetric) {
            trend = fcp.startTime > prevMetric.value ? 'up' : fcp.startTime < prevMetric.value ? 'down' : 'stable';
          }
          
          newMetrics.push({
            name: 'First Contentful Paint',
            value: Math.round(fcp.startTime),
            unit: 'ms',
            status: fcp.startTime < 1500 ? 'good' : fcp.startTime < 2500 ? 'warning' : 'critical',
            timestamp: now,
            trend
          });
        }
      }

      // Memory usage (if available)
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        const prevMemory = memoryUsage;
        const trend: 'up' | 'down' | 'stable' = usedMB > prevMemory ? 'up' : usedMB < prevMemory ? 'down' : 'stable';
        
        setMemoryUsage(usedMB);
        
        newMetrics.push({
          name: 'Memory Usage',
          value: usedMB,
          unit: 'MB',
          status: usedMB < 50 ? 'good' : usedMB < 100 ? 'warning' : 'critical',
          timestamp: now,
          trend
        });
      }

      // DOM nodes count
      const domNodes = document.querySelectorAll('*').length;
      const prevDomMetric = metrics.find(m => m.name === 'DOM Nodes');
      let domTrend: 'up' | 'down' | 'stable' = 'stable';
      if (prevDomMetric) {
        domTrend = domNodes > prevDomMetric.value ? 'up' : domNodes < prevDomMetric.value ? 'down' : 'stable';
      }
      
      newMetrics.push({
        name: 'DOM Nodes',
        value: domNodes,
        unit: 'nodes',
        status: domNodes < 1000 ? 'good' : domNodes < 3000 ? 'warning' : 'critical',
        timestamp: now,
        trend: domTrend
      });

      // Cache performance (simulated)
      const cacheHitRate = Math.random() * 0.3 + 0.7; // 70-100% hit rate simulation
      setCacheMetrics(prev => ({
        ...prev,
        hitRate: cacheHitRate * 100,
        missRate: (1 - cacheHitRate) * 100,
        totalRequests: prev.totalRequests + Math.floor(Math.random() * 5) + 1,
        cacheSize: Math.floor(Math.random() * 20) + 10
      }));

      // Network status
      setNetworkStatus(navigator.onLine ? 'online' : 'offline');

      setMetrics(prev => [...prev.slice(-9), ...newMetrics].slice(-20));
    }, 2000);

    return () => clearInterval(interval);
  }, [isMonitoring, metrics, memoryUsage]);

  // Listen for component render times (would be populated by usePerformanceMonitor)
  useEffect(() => {
    const handlePerformanceLog = (event: CustomEvent) => {
      const { componentName, renderTime } = event.detail;
      
      setComponentMetrics(prev => {
        const existing = prev.find(m => m.componentName === componentName);
        if (existing) {
          const newRenderCount = existing.renderCount + 1;
          const newAverageRenderTime = (existing.averageRenderTime * existing.renderCount + renderTime) / newRenderCount;
          const newMaxRenderTime = Math.max(existing.maxRenderTime, renderTime);
          
          return prev.map(m => 
            m.componentName === componentName 
              ? { 
                  ...m, 
                  renderTime, 
                  lastRender: Date.now(), 
                  renderCount: newRenderCount,
                  averageRenderTime: newAverageRenderTime,
                  maxRenderTime: newMaxRenderTime
                }
              : m
          );
        } else {
          return [...prev, {
            componentName,
            renderTime,
            lastRender: Date.now(),
            renderCount: 1,
            averageRenderTime: renderTime,
            maxRenderTime: renderTime
          }];
        }
      });
      
      // Update chart data
      const now = new Date().toLocaleTimeString();
      setChartData(prev => [...prev.slice(-19), {
        time: now,
        memory: memoryUsage,
        renderTime: renderTime
      }]);
    };

    window.addEventListener('component-render', handlePerformanceLog as EventListener);
    return () => window.removeEventListener('component-render', handlePerformanceLog as EventListener);
  }, [memoryUsage]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-red-500" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-green-500" />;
      case 'stable': return <Minus className="h-3 w-3 text-gray-500" />;
      default: return null;
    }
  };

  const clearMetrics = useCallback(() => {
    setMetrics([]);
    setComponentMetrics([]);
    setChartData([]);
    setCacheMetrics({
      hitRate: 0,
      missRate: 0,
      totalRequests: 0,
      cacheSize: 0
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Performance Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor application performance and optimization metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isMonitoring ? "destructive" : "default"}
            onClick={() => setIsMonitoring(!isMonitoring)}
          >
            {isMonitoring ? "Stop Monitoring" : "Start Monitoring"}
          </Button>
          <Button variant="outline" onClick={clearMetrics}>
            Clear Data
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wifi className={`h-5 w-5 ${networkStatus === 'online' ? 'text-green-500' : 'text-red-500'}`} />
              <div>
                <div className="font-semibold">Network</div>
                <div className={`text-sm ${networkStatus === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                  {networkStatus === 'online' ? 'Online' : 'Offline'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="font-semibold">Memory</div>
                  <div className="text-sm text-blue-600">{memoryUsage} MB</div>
                </div>
              </div>
              {getTrendIcon(metrics.find(m => m.name === 'Memory Usage')?.trend)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <div>
                <div className="font-semibold">Components</div>
                <div className="text-sm text-purple-600">{componentMetrics.length} tracked</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-semibold">Cache Hit Rate</div>
                <div className="text-sm text-green-600">{cacheMetrics.hitRate.toFixed(1)}%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              <div>
                <div className="font-semibold">Status</div>
                <div className={`text-sm ${isMonitoring ? 'text-green-600' : 'text-gray-600'}`}>
                  {isMonitoring ? 'Monitoring' : 'Idle'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
          <TabsTrigger value="charts">Real-time Charts</TabsTrigger>
          <TabsTrigger value="components">Component Performance</TabsTrigger>
          <TabsTrigger value="cache">Cache & Network</TabsTrigger>
          <TabsTrigger value="optimization">Optimizations</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Real-time Performance Metrics
              </CardTitle>
              <CardDescription>
                Key performance indicators updated every 2 seconds
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {isMonitoring ? 'Collecting metrics...' : 'Start monitoring to see metrics'}
                </div>
              ) : (
                <div className="space-y-4">
                  {metrics.map((metric, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(metric.status)}
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {metric.name}
                            {getTrendIcon(metric.trend)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(metric.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-lg">
                          {metric.value.toFixed(0)} {metric.unit}
                        </div>
                        <Badge className={getStatusColor(metric.status)}>
                          {metric.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Memory Usage Over Time</CardTitle>
                <CardDescription>Real-time memory consumption tracking</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="memory" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    Start monitoring to see memory usage chart
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Component Render Times</CardTitle>
                <CardDescription>Real-time render performance tracking</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="renderTime" stroke="#8b5cf6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    Start monitoring to see render time chart
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="components" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Component Render Performance
              </CardTitle>
              <CardDescription>
                Track render times and performance metrics for individual components
              </CardDescription>
            </CardHeader>
            <CardContent>
              {componentMetrics.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No component metrics available. Components with usePerformanceMonitor will appear here.
                </div>
              ) : (
                <div className="space-y-4">
                  {componentMetrics
                    .sort((a, b) => b.averageRenderTime - a.averageRenderTime)
                    .map((component, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-medium">{component.componentName}</div>
                          <div className="text-sm text-muted-foreground">
                            {component.renderCount} renders • Last: {new Date(component.lastRender).toLocaleTimeString()}
                          </div>
                        </div>
                        <Badge className={component.averageRenderTime > 100 ? 'text-red-600 bg-red-50' : component.averageRenderTime > 50 ? 'text-yellow-600 bg-yellow-50' : 'text-green-600 bg-green-50'}>
                          {component.averageRenderTime > 100 ? 'Slow' : component.averageRenderTime > 50 ? 'Moderate' : 'Fast'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Current</div>
                          <div className="font-mono">{component.renderTime.toFixed(2)} ms</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Average</div>
                          <div className="font-mono">{component.averageRenderTime.toFixed(2)} ms</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Max</div>
                          <div className="font-mono">{component.maxRenderTime.toFixed(2)} ms</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cache Performance</CardTitle>
                <CardDescription>Memory cache hit/miss rates and efficiency</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Hit Rate</span>
                    <span className="font-mono">{cacheMetrics.hitRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={cacheMetrics.hitRate} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Miss Rate</span>
                    <span className="font-mono">{cacheMetrics.missRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={cacheMetrics.missRate} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <div className="text-sm text-muted-foreground">Total Requests</div>
                    <div className="font-mono text-lg">{cacheMetrics.totalRequests}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Cache Size</div>
                    <div className="font-mono text-lg">{cacheMetrics.cacheSize} MB</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Network Performance</CardTitle>
                <CardDescription>Network requests and response times</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Request Count</div>
                    <div className="font-mono text-lg">{networkMetrics.requestCount}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Avg Response</div>
                    <div className="font-mono text-lg">{networkMetrics.averageResponseTime}ms</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Error Rate</div>
                    <div className="font-mono text-lg">{networkMetrics.errorRate.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Data Transfer</div>
                    <div className="font-mono text-lg">{(networkMetrics.bytesTransferred / 1024).toFixed(1)}KB</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Optimizations Enabled</CardTitle>
              <CardDescription>
                Active optimization features in the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Virtual Scrolling</h4>
                  <p className="text-sm text-green-700">
                    Efficiently renders large lists by only displaying visible items
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Memory Caching</h4>
                  <p className="text-sm text-blue-700">
                    In-memory cache with TTL for API responses and computed data
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="font-semibold text-purple-800 mb-2">Optimistic Updates</h4>
                  <p className="text-sm text-purple-700">
                    Immediate UI feedback while background operations complete
                  </p>
                </div>
                
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h4 className="font-semibold text-orange-800 mb-2">Component Monitoring</h4>
                  <p className="text-sm text-orange-700">
                    Track render times and identify performance bottlenecks
                  </p>
                </div>
                
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Error Boundaries</h4>
                  <p className="text-sm text-gray-700">
                    Graceful error handling prevents entire app crashes
                  </p>
                </div>
                
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <h4 className="font-semibold text-indigo-800 mb-2">Background Sync</h4>
                  <p className="text-sm text-indigo-700">
                    Keep data fresh with intelligent background synchronization
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
