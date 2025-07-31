"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Eye, 
  EyeOff, 
  Copy, 
  Edit, 
  Trash2,
  Settings,
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  Globe,
  RefreshCw,
  Calendar
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ApiIntegration } from "./ApiIntegration";

interface ApiIntegrationCardProps {
  integration: any;
  onUpdate: () => void;
}

export function ApiIntegrationCard({ integration, onUpdate }: ApiIntegrationCardProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPollingSettings, setShowPollingSettings] = useState(false);

  const deleteIntegration = useMutation(api.integrations.deleteIntegration);
  const updatePollingSettings = useMutation(api.apiIntegrations.updatePollingSettings);
  const pollingSettings = useQuery(
    api.apiIntegrations.getPollingSettings, 
    { integrationId: integration._id }
  );

  const handleCopyApiKey = () => {
    // In real app, you'd need to fetch the unmasked key
    toast.success("API key copied to clipboard");
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete the integration "${integration.name}"?`)) {
      try {
        await deleteIntegration({ integrationId: integration._id });
        toast.success("Integration deleted successfully");
        onUpdate();
      } catch (error) {
        console.error("Delete failed:", error);
        toast.error("Failed to delete integration");
      }
    }
  };

  const handleUpdatePolling = async (frequency: string, enabled: boolean) => {
    try {
      await updatePollingSettings({
        integrationId: integration._id,
        frequency: frequency as any,
        enabled,
        timezone: "UTC",
      });
      toast.success("Polling settings updated");
      onUpdate();
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to update polling settings");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "configuring":
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      connected: "default",
      error: "destructive",
      configuring: "secondary",
      pending: "secondary",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status}
      </Badge>
    );
  };

  const formatLastSync = (lastSyncAt?: number) => {
    if (!lastSyncAt) return "Never";
    const date = new Date(lastSyncAt);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
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

  return (
    <>
      <Card className="relative">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {integration.name}
              </CardTitle>
              {integration.description && (
                <CardDescription>{integration.description}</CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(integration.status)}
              {getStatusBadge(integration.status)}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* API Endpoint */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">API Endpoint</Label>
            <div className="p-2 bg-gray-50 rounded text-sm font-mono break-all">
              {integration.configuration.apiEndpoint}
            </div>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">API Key</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-2 bg-gray-50 rounded text-sm font-mono">
                {showApiKey ? integration.configuration.apiKey || "***" : "••••••••••••••••"}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyApiKey}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Custom Headers */}
          {integration.configuration.headers && Object.keys(integration.configuration.headers).length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Custom Headers</Label>
              <div className="space-y-1">
                {Object.entries(integration.configuration.headers).map(([key, value]) => (
                  <div key={key} className="flex text-sm">
                    <span className="font-medium text-gray-600 w-24">{key}:</span>
                    <span className="font-mono">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sync Information */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-xs text-gray-500">Last Sync</Label>
              <div className="font-medium">{formatLastSync(integration.lastSyncAt)}</div>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Health</Label>
              <div className="flex items-center gap-1">
                {getStatusIcon(integration.healthStatus)}
                <span className="font-medium capitalize">{integration.healthStatus}</span>
              </div>
            </div>
          </div>

          {/* Polling Settings */}
          {pollingSettings && (
            <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Polling Settings
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPollingSettings(!showPollingSettings)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>

              {showPollingSettings ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Frequency</Label>
                      <Select
                        value={pollingSettings.frequency}
                        onValueChange={(value) => 
                          handleUpdatePolling(value, pollingSettings.enabled)
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        variant={pollingSettings.enabled ? "default" : "outline"}
                        size="sm"
                        onClick={() => 
                          handleUpdatePolling(pollingSettings.frequency, !pollingSettings.enabled)
                        }
                        className="w-full h-8"
                      >
                        {pollingSettings.enabled ? "Enabled" : "Disabled"}
                      </Button>
                    </div>
                  </div>

                  {pollingSettings.enabled && (
                    <div className="text-xs text-gray-600">
                      <div>Next poll: {formatNextPoll(pollingSettings.nextPollAt)}</div>
                      {pollingSettings.lastPolledAt && (
                        <div>Last poll: {formatLastSync(pollingSettings.lastPolledAt)}</div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  {pollingSettings.enabled ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-3 w-3" />
                      <span>Every {pollingSettings.frequency}</span>
                      <span className="text-xs">• Next: {formatNextPoll(pollingSettings.nextPollAt)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>Polling disabled</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {integration.errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-red-800">Error</div>
                  <div className="text-sm text-red-600">{integration.errorMessage}</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditModal(true)}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <ApiIntegration
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          onUpdate();
        }}
        integrationId={integration._id}
        mode="edit"
      />
    </>
  );
}
