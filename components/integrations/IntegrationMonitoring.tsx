"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  Wifi,
  WifiOff,
  Server,
  Database,
  Globe,
  Zap,
  Bell,
  Settings,
  Eye,
  Calendar,
  BarChart3
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

export function IntegrationMonitoring() {
  const [selectedIntegration, setSelectedIntegration] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("24h");

  const integrations = useQuery(api.integrations.list);
  const healthMetrics = useQuery(api.integrations.getHealthMetrics, {
    integrationId: selectedIntegration !== "all" ? selectedIntegration as Id<"integrations"> : undefined,
    timeRange
  });
  const alerts = useQuery(api.integrations.getAlerts, {
    integrationId: selectedIntegration !== "all" ? selectedIntegration as Id<"integrations"> : undefined,
    limit: 20
  });

  const runHealthCheck = useMutation(api.integrations.runHealthCheck);

  const handleHealthCheck = async (integrationId?: Id<"integrations">) => {
    try {
      await runHealthCheck({ 
        integrationId: integrationId || selectedIntegration as Id<"integrations">
      });
      toast.success("Health check completed");
    } catch (error) {
      toast.error("Health check failed");
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "offline":
        return <WifiOff className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600 bg-green-50 border-green-200";
      case "warning":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "error":
        return "text-red-600 bg-red-50 border-red-200";
      case "offline":
        return "text-gray-600 bg-gray-50 border-gray-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Integration Monitoring</h2>
          <p className="text-muted-foreground">
            Monitor the health and performance of your integrations
          </p>
        </div>
        <Button onClick={() => handleHealthCheck()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Run Health Check
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <Select value={selectedIntegration} onValueChange={setSelectedIntegration}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="All Integrations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Integrations</SelectItem>
            {integrations?.map((integration) => (
              <SelectItem key={integration._id} value={integration._id}>
                {integration.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">Last Hour</SelectItem>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <span className="text-2xl font-bold text-green-600">
                {healthMetrics?.overallHealth || "Healthy"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">All systems operational</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthMetrics?.uptime || "99.9"}%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthMetrics?.avgResponseTime || "245"}ms</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingDown className="h-3 w-3 text-green-600 mr-1" />
              12% faster than last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {alerts?.filter(a => a.status === "active").length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Integration Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Integration Health Status</span>
          </CardTitle>
          <CardDescription>
            Real-time health monitoring for all your integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {integrations && integrations.length > 0 ? (
            <div className="space-y-4">
              {integrations.map((integration) => (
                <div key={integration._id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getHealthIcon(integration.healthStatus)}
                      <div>
                        <h3 className="font-medium">{integration.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {integration.type.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(integration.healthStatus)}>
                        {integration.healthStatus}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleHealthCheck(integration._id)}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <div className="font-medium flex items-center space-x-1">
                        {integration.status === "connected" ? (
                          <Wifi className="h-3 w-3 text-green-600" />
                        ) : (
                          <WifiOff className="h-3 w-3 text-red-600" />
                        )}
                        <span>{integration.status}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-muted-foreground">Last Check:</span>
                      <div className="font-medium">
                        {integration.lastHealthCheck 
                          ? new Date(integration.lastHealthCheck).toLocaleTimeString()
                          : "Never"
                        }
                      </div>
                    </div>

                    <div>
                      <span className="text-muted-foreground">Response Time:</span>
                      <div className="font-medium">
                        {integration.responseTime ? `${integration.responseTime}ms` : "N/A"}
                      </div>
                    </div>

                    <div>
                      <span className="text-muted-foreground">Error Rate:</span>
                      <div className="font-medium">
                        {integration.errorRate ? `${integration.errorRate}%` : "0%"}
                      </div>
                    </div>
                  </div>

                  {integration.healthStatus !== "healthy" && integration.healthMessage && (
                    <Alert className="mt-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{integration.healthMessage}</AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Globe className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No integrations to monitor</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Performance Metrics</span>
          </CardTitle>
          <CardDescription>
            Track performance trends over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PerformanceChart metrics={healthMetrics} timeRange={timeRange} />
        </CardContent>
      </Card>

      {/* Active Alerts */}
      {alerts && alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Active Alerts</span>
            </CardTitle>
            <CardDescription>
              Alerts that require immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <Alert key={alert._id} className={getStatusColor(alert.severity)}>
                  <AlertCircle className="h-4 w-4" />
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <h4 className="font-medium">{alert.title}</h4>
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(alert._creationTime).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{alert.severity}</Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <span>Connection Tests</span>
          </CardTitle>
          <CardDescription>
            Test connectivity and latency to external services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConnectionTestsPanel integrations={integrations || []} />
        </CardContent>
      </Card>
    </div>
  );
}

function PerformanceChart({ metrics, timeRange }: { metrics: any; timeRange: string }) {
  if (!metrics?.performanceData) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No performance data available</p>
        </div>
      </div>
    );
  }

  // Simple bar chart for response times
  const data = metrics.performanceData.slice(-24); // Last 24 data points
  const maxValue = Math.max(...data.map((d: any) => d.responseTime));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Response Time (ms)</span>
        <span className="text-muted-foreground">
          {timeRange === "1h" ? "Last Hour" :
           timeRange === "24h" ? "Last 24 Hours" :
           timeRange === "7d" ? "Last 7 Days" : "Last 30 Days"}
        </span>
      </div>

      <div className="h-32 flex items-end space-x-1">
        {data.map((point: any, index: number) => (
          <div
            key={index}
            className="flex-1 bg-blue-500 rounded-sm min-h-[4px] hover:bg-blue-600 transition-colors"
            style={{ 
              height: `${maxValue > 0 ? (point.responseTime / maxValue) * 100 : 0}%` 
            }}
            title={`${point.responseTime}ms at ${new Date(point.timestamp).toLocaleTimeString()}`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {Math.min(...data.map((d: any) => d.responseTime))}ms
          </div>
          <p className="text-xs text-muted-foreground">Min Response</p>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">
            {Math.round(data.reduce((sum: number, d: any) => sum + d.responseTime, 0) / data.length)}ms
          </div>
          <p className="text-xs text-muted-foreground">Avg Response</p>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {Math.max(...data.map((d: any) => d.responseTime))}ms
          </div>
          <p className="text-xs text-muted-foreground">Max Response</p>
        </div>
      </div>
    </div>
  );
}

function ConnectionTestsPanel({ integrations }: { integrations: any[] }) {
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});

  const testConnection = useMutation(api.integrations.testConnection);

  const handleTest = async (integrationId: string) => {
    setTesting(prev => ({ ...prev, [integrationId]: true }));
    
    try {
      const result = await testConnection({ integrationId: integrationId as Id<"integrations"> });
      setTestResults(prev => ({ ...prev, [integrationId]: result }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        [integrationId]: { 
          success: false, 
          message: "Connection test failed",
          responseTime: null
        }
      }));
    } finally {
      setTesting(prev => ({ ...prev, [integrationId]: false }));
    }
  };

  if (integrations.length === 0) {
    return (
      <div className="text-center py-8">
        <Database className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">No integrations available for testing</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Integration</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Response Time</TableHead>
          <TableHead>Last Test</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {integrations.map((integration) => {
          const result = testResults[integration._id];
          const isLoading = testing[integration._id];
          
          return (
            <TableRow key={integration._id}>
              <TableCell>
                <div>
                  <div className="font-medium">{integration.name}</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {integration.type.replace(/_/g, " ")}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {result ? (
                  <Badge variant={result.success ? "default" : "destructive"}>
                    {result.success ? "Connected" : "Failed"}
                  </Badge>
                ) : (
                  <Badge variant="outline">Untested</Badge>
                )}
              </TableCell>
              <TableCell>
                {result?.responseTime ? `${result.responseTime}ms` : "-"}
              </TableCell>
              <TableCell>
                {result ? new Date().toLocaleTimeString() : "Never"}
              </TableCell>
              <TableCell>
                <Button
                  onClick={() => handleTest(integration._id)}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  {isLoading ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    "Test"
                  )}
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
