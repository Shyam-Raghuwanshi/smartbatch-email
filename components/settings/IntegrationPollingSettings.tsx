"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Clock, 
  RefreshCw, 
  Globe, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Calendar,
  Trash2,
  MoreHorizontal
} from "lucide-react";
import { toast } from "sonner";

interface IntegrationPollingSettingsProps {
  integration: any;
}

export function IntegrationPollingSettings({ integration }: IntegrationPollingSettingsProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const updatePollingSettings = useMutation(api.integrationPolling.updatePollingSettings);
  const deleteIntegration = useMutation(api.integrations.deleteIntegration);
  const pollingSettings = useQuery(
    api.integrationPolling.getPollingSettings, 
    isLoaded && isSignedIn ? { integrationId: integration._id } : "skip"
  );
  const syncHistory = useQuery(
    api.integrationPolling.getSyncHistory,
    isLoaded && isSignedIn ? { integrationId: integration._id, limit: 5 } : "skip"
  );

  const handleUpdateFrequency = async (frequency: string) => {
    if (!pollingSettings) return;
    
    setIsUpdating(true);
    try {
      await updatePollingSettings({
        integrationId: integration._id,
        frequency: frequency as any,
        enabled: pollingSettings.enabled,
        timezone: pollingSettings.timezone || "UTC",
      });
      toast.success("Polling frequency updated");
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to update polling frequency");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleEnabled = async (enabled: boolean) => {
    if (!pollingSettings) return;
    
    setIsUpdating(true);
    try {
      await updatePollingSettings({
        integrationId: integration._id,
        frequency: pollingSettings.frequency,
        enabled,
        timezone: pollingSettings.timezone || "UTC",
      });
      toast.success(`Polling ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error("Update failed:", error);
      toast.error(`Failed to ${enabled ? 'enable' : 'disable'} polling`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteIntegration = async () => {
    setIsDeleting(true);
    try {
      await deleteIntegration({ integrationId: integration._id });
      toast.success(`Integration "${integration.name}" deleted successfully`);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete integration");
    } finally {
      setIsDeleting(false);
    }
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case "api_endpoint":
        return <Globe className="h-5 w-5 text-green-600" />;
      case "google_sheets":
        return <Globe className="h-5 w-5 text-blue-600" />;
      default:
        return <RefreshCw className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const formatNextPoll = (nextPollAt?: number) => {
    if (!nextPollAt) return "Not scheduled";
    const date = new Date(nextPollAt);
    const now = new Date();
    const diffMs = nextPollAt - now.getTime();
    
    if (diffMs < 0) return "Overdue";
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `In ${diffHours}h ${diffMinutes}m`;
    } else {
      return `In ${diffMinutes}m`;
    }
  };

  const formatLastPoll = (lastPolledAt?: number) => {
    if (!lastPolledAt) return "Never";
    const date = new Date(lastPolledAt);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  if (!pollingSettings) {
    return (
      <Card className="opacity-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getIntegrationIcon(integration.type)}
              <div>
                <div className="font-medium">{integration.name}</div>
                <div className="text-sm text-gray-500">Loading polling settings...</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getIntegrationIcon(integration.type)}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{integration.name}</span>
                    {getStatusIcon(integration.status)}
                    <Badge variant={integration.status === "active" ? "default" : "secondary"}>
                      {integration.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500 capitalize">
                    {integration.type.replace("_", " ")} Integration
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Label htmlFor={`enabled-${integration._id}`} className="text-sm">
                  Auto-sync
                </Label>
                <Switch
                  id={`enabled-${integration._id}`}
                  checked={pollingSettings.enabled}
                  onCheckedChange={handleToggleEnabled}
                  disabled={isUpdating}
                />
                
                {/* Actions Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={isDeleting}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Integration
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

          {/* Polling Configuration */}
          {pollingSettings.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Frequency</Label>
                <Select
                  value={pollingSettings.frequency}
                  onValueChange={handleUpdateFrequency}
                  disabled={isUpdating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15min">Every 15 Minutes</SelectItem>
                    <SelectItem value="30min">Every 30 Minutes</SelectItem>
                    <SelectItem value="hourly">Every Hour</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Next Sync</Label>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>{formatNextPoll(pollingSettings.nextPollAt)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Last Sync</Label>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>{formatLastPoll(pollingSettings.lastPolledAt)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Disabled State */}
          {!pollingSettings.enabled && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Automatic syncing is disabled. Data will only be fetched manually.</span>
              </div>
            </div>
          )}

          {/* Sync History */}
          {syncHistory && syncHistory.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Recent Sync Activity</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {syncHistory.map((sync: any) => (
                  <div key={sync._id} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      {sync.status === "completed" ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : sync.status === "failed" ? (
                        <XCircle className="h-3 w-3 text-red-500" />
                      ) : (
                        <RefreshCw className="h-3 w-3 text-blue-500 animate-spin" />
                      )}
                      <span>
                        {sync.data.successfulRecords || 0} contacts synced
                      </span>
                    </div>
                    <span className="text-gray-500">
                      {new Date(sync.completedAt || sync.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Integration-specific info */}
          {integration.type === "api_endpoint" && integration.configuration?.apiEndpoint && (
            <div className="text-xs text-gray-500 font-mono bg-gray-100 p-2 rounded">
              {integration.configuration.apiEndpoint}
            </div>
          )}
          
          {integration.type === "google_sheets" && integration.configuration?.spreadsheetId && (
            <div className="text-xs text-gray-500">
              Spreadsheet: {integration.configuration.title || integration.configuration.spreadsheetId}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    
    {/* Delete Confirmation Dialog */}
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Integration</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the "{integration.name}" integration? 
            This action cannot be undone and will remove all associated data including sync history, 
            polling settings, and webhook configurations.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteIntegration}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Integration
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
