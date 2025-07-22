"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  RefreshCw,
  Upload,
  ArrowUpDown,
  FileText,
  TrendingUp,
  Activity,
  Calendar,
  Filter
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

interface SyncHistoryProps {
  integrationId?: Id<"integrations">;
}

export function SyncHistory({ integrationId }: SyncHistoryProps) {
  const [selectedIntegration, setSelectedIntegration] = useState<string>(integrationId || "all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const integrations = useQuery(api.integrations.list);
  const syncHistory = useQuery(api.integrations.getSyncHistory, {
    integrationId: selectedIntegration !== "all" ? selectedIntegration as Id<"integrations"> : undefined,
    limit: 50
  });
  const syncStats = useQuery(api.integrations.getSyncStats);

  const triggerManualSync = useMutation(api.integrations.triggerSync);

  const handleManualSync = async (integrationId: Id<"integrations">) => {
    try {
      await triggerManualSync({ integrationId });
      toast.success("Manual sync triggered successfully");
    } catch (error) {
      toast.error("Failed to trigger sync");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "running":
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case "import":
        return <Download className="h-4 w-4 text-blue-600" />;
      case "export":
        return <Upload className="h-4 w-4 text-green-600" />;
      case "bidirectional":
        return <ArrowUpDown className="h-4 w-4 text-purple-600" />;
      default:
        return <RefreshCw className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredSyncHistory = syncHistory?.filter(sync => {
    if (statusFilter !== "all" && sync.status !== statusFilter) return false;
    if (typeFilter !== "all" && sync.syncType !== typeFilter) return false;
    return true;
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sync History</h2>
          <p className="text-muted-foreground">
            Track data synchronization between integrations and your account
          </p>
        </div>
      </div>

      {/* Sync Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Syncs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{syncStats?.totalSyncs?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{syncStats?.successRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Records Synced</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{syncStats?.recordsSynced?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {syncStats?.lastSyncTime ? new Date(syncStats.lastSyncTime).toLocaleDateString() : "Never"}
            </div>
            <p className="text-xs text-muted-foreground">Most recent</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Synchronization Activity</span>
          </CardTitle>
          <CardDescription>
            Monitor all data synchronization activities across your integrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>

            <Select value={selectedIntegration} onValueChange={setSelectedIntegration}>
              <SelectTrigger className="w-48">
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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="triggered">Triggered</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => {
                setSelectedIntegration("all");
                setStatusFilter("all");
                setTypeFilter("all");
              }}
              variant="outline"
              size="sm"
            >
              Clear Filters
            </Button>
          </div>

          {/* Sync History Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Integration</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSyncHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No sync history found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSyncHistory.map((sync) => (
                    <TableRow key={sync._id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(sync.status)}
                          <Badge 
                            variant={
                              sync.status === "completed" ? "default" :
                              sync.status === "failed" ? "destructive" :
                              sync.status === "running" ? "secondary" : "outline"
                            }
                          >
                            {sync.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {integrations?.find(i => i._id === sync.integrationId)?.name || "Unknown"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {integrations?.find(i => i._id === sync.integrationId)?.type || ""}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getDirectionIcon(sync.direction)}
                          <span className="capitalize">{sync.direction}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {sync.syncType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>
                            <span className="text-green-600">+{sync.recordsCreated || 0}</span>
                            <span className="text-muted-foreground mx-1">|</span>
                            <span className="text-blue-600">~{sync.recordsUpdated || 0}</span>
                            <span className="text-muted-foreground mx-1">|</span>
                            <span className="text-red-600">-{sync.recordsDeleted || 0}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {(sync.recordsCreated || 0) + (sync.recordsUpdated || 0) + (sync.recordsDeleted || 0)} total
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {sync.duration ? `${Math.round(sync.duration / 1000)}s` : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(sync._creationTime).toLocaleDateString()}</div>
                          <div className="text-muted-foreground">
                            {new Date(sync._creationTime).toLocaleTimeString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {sync.status === "completed" && (
                            <Button
                              onClick={() => handleManualSync(sync.integrationId)}
                              variant="ghost"
                              size="sm"
                              title="Trigger manual sync"
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Sync Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Sync Trends</span>
          </CardTitle>
          <CardDescription>
            Synchronization activity over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SyncTrendsChart stats={syncStats} />
        </CardContent>
      </Card>

      {/* Recent Sync Errors */}
      {syncStats?.recentErrors && syncStats.recentErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span>Recent Sync Errors</span>
            </CardTitle>
            <CardDescription>
              Sync failures that need attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {syncStats.recentErrors.map((error: any, index: number) => (
                <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-red-900">
                          {integrations?.find(i => i._id === error.integrationId)?.name || "Unknown Integration"}
                        </h4>
                        <span className="text-sm text-red-600">
                          {new Date(error.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-red-700">{error.message}</p>
                      {error.details && (
                        <details className="mt-2">
                          <summary className="text-sm text-red-600 cursor-pointer">
                            Show Details
                          </summary>
                          <pre className="text-xs text-red-600 mt-1 bg-red-100 p-2 rounded overflow-auto">
                            {JSON.stringify(error.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SyncTrendsChart({ stats }: { stats: any }) {
  if (!stats?.dailyTrends) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No trend data available</p>
        </div>
      </div>
    );
  }

  // Simple bar chart representation
  const maxValue = Math.max(...stats.dailyTrends.map((d: any) => d.syncCount));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-2 text-xs text-center text-muted-foreground">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
          <div key={day}>{day}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-2 h-32">
        {stats.dailyTrends.slice(-7).map((day: any, index: number) => (
          <div key={index} className="flex flex-col justify-end">
            <div 
              className="bg-blue-500 rounded-sm min-h-[4px] transition-all hover:bg-blue-600"
              style={{ 
                height: `${maxValue > 0 ? (day.syncCount / maxValue) * 100 : 0}%` 
              }}
              title={`${day.syncCount} syncs on ${day.date}`}
            />
            <div className="text-xs text-center mt-1 text-muted-foreground">
              {day.syncCount}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>7 days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}
