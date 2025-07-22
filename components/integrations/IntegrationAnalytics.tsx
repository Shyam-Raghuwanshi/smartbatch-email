"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Globe,
  TrendingUp,
  TrendingDown,
  Zap,
  Wifi,
  WifiOff,
  Gauge,
  RefreshCw,
  Download,
  Calendar
} from "lucide-react";

interface IntegrationAnalyticsProps {
  userId: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function IntegrationAnalytics({ userId }: IntegrationAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const [selectedMetric, setSelectedMetric] = useState<"syncs" | "webhooks" | "health" | "usage">("syncs");

  // Calculate time range in milliseconds
  const getTimeRangeMs = () => {
    const now = Date.now();
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    return {
      start: now - (days * 24 * 60 * 60 * 1000),
      end: now
    };
  };

  const analytics = useQuery(api.scheduler.generateIntegrationAnalytics, {
    userId,
    timeRange: getTimeRangeMs()
  });

  const monitoringDashboard = useQuery(api.monitoring.getMonitoringDashboard, {
    userId
  });

  if (!analytics || !monitoringDashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  const { overview, integrationMetrics, syncHistory, webhookMetrics } = analytics;

  // Prepare chart data
  const integrationStatusData = [
    { name: "Active", value: overview.activeIntegrations, color: "#00C49F" },
    { name: "Inactive", value: overview.totalIntegrations - overview.activeIntegrations, color: "#FF8042" }
  ];

  const syncPerformanceData = integrationMetrics.map(metric => ({
    name: metric.name,
    successful: metric.successfulSyncs,
    failed: metric.failedSyncs,
    total: metric.totalSyncs,
    successRate: metric.totalSyncs > 0 ? (metric.successfulSyncs / metric.totalSyncs) * 100 : 0
  }));

  const healthScoreData = integrationMetrics.map(metric => ({
    name: metric.name,
    healthScore: metric.healthScore,
    uptime: metric.uptime
  }));

  const alertSummary = monitoringDashboard.alerts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Integration Analytics</h2>
          <p className="text-gray-600">
            Monitor performance and health across all your integrations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Integrations</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalIntegrations}</div>
            <p className="text-xs text-muted-foreground">
              {overview.activeIntegrations} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Syncs</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalSyncs}</div>
            <p className="text-xs text-muted-foreground">
              In selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhook Deliveries</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalWebhooks}</div>
            <p className="text-xs text-muted-foreground">
              Real-time events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(monitoringDashboard.overview.averageUptime)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average uptime
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Summary */}
      {alertSummary.total > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Active Alerts ({alertSummary.total})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              {alertSummary.byLevel.critical > 0 && (
                <Badge variant="destructive">
                  {alertSummary.byLevel.critical} Critical
                </Badge>
              )}
              {alertSummary.byLevel.error > 0 && (
                <Badge variant="destructive">
                  {alertSummary.byLevel.error} Error
                </Badge>
              )}
              {alertSummary.byLevel.warning > 0 && (
                <Badge variant="secondary">
                  {alertSummary.byLevel.warning} Warning
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Analytics Tabs */}
      <Tabs value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="syncs">Sync Performance</TabsTrigger>
          <TabsTrigger value="webhooks">Webhook Analytics</TabsTrigger>
          <TabsTrigger value="health">Health Monitoring</TabsTrigger>
          <TabsTrigger value="usage">Usage Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="syncs" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Integration Status Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Integration Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={integrationStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {integrationStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Sync Success Rate */}
            <Card>
              <CardHeader>
                <CardTitle>Sync Success Rate by Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={syncPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="successRate" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Sync Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Sync Volume by Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={syncPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="successful" stackId="a" fill="#00C49F" />
                  <Bar dataKey="failed" stackId="a" fill="#FF8042" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Webhooks</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.totalWebhooks}</div>
                <p className="text-xs text-muted-foreground">
                  Events delivered
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98.5%</div>
                <p className="text-xs text-muted-foreground">
                  Delivery success
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">245ms</div>
                <p className="text-xs text-muted-foreground">
                  Average latency
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Webhook Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Webhook Delivery Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={syncPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Health Score Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Health Score by Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={healthScoreData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="healthScore" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Uptime Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Uptime by Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={healthScoreData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[90, 100]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="uptime" stroke="#0088FE" fill="#0088FE" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Health Status List */}
          <Card>
            <CardHeader>
              <CardTitle>Integration Health Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monitoringDashboard.healthChecks.map((hc, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {hc.status === "healthy" ? (
                        <Wifi className="h-5 w-5 text-green-500" />
                      ) : (
                        <WifiOff className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium">{hc.name}</p>
                        <p className="text-sm text-gray-500">{hc.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{hc.uptime.toFixed(1)}% uptime</p>
                        <p className="text-xs text-gray-500">
                          Last check: {new Date(hc.lastCheck).toLocaleTimeString()}
                        </p>
                      </div>
                      <Badge variant={hc.status === "healthy" ? "default" : "destructive"}>
                        {hc.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Calls</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.totalApiCalls}</div>
                <p className="text-xs text-muted-foreground">
                  Total requests
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Transferred</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.4 GB</div>
                <p className="text-xs text-muted-foreground">
                  This period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rate Limit Usage</CardTitle>
                <Gauge className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">34%</div>
                <p className="text-xs text-muted-foreground">
                  Average utilization
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Integration Usage Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Usage by Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrationMetrics.map((metric, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{metric.name}</p>
                      <p className="text-sm text-gray-500">{metric.type}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{metric.totalSyncs} syncs</p>
                        <p className="text-xs text-gray-500">
                          {metric.webhookDeliveries} webhook events
                        </p>
                      </div>
                      <div className="w-32">
                        <Progress value={metric.healthScore} className="h-2" />
                        <p className="text-xs text-center mt-1">{metric.healthScore}% health</p>
                      </div>
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
