"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Clock, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";

interface AutoSyncStatusProps {
  integrationId: Id<"integrations">;
  className?: string;
}

export function AutoSyncStatus({ integrationId, className }: AutoSyncStatusProps) {
  const pollingSettings = useQuery(
    api.integrationPolling.getPollingSettings,
    { integrationId }
  );

  if (!pollingSettings) {
    return (
      <Badge variant="secondary" className={className}>
        <Clock className="w-3 h-3 mr-1" />
        Manual Only
      </Badge>
    );
  }

  const getStatusInfo = () => {
    if (!pollingSettings.enabled) {
      return {
        variant: "secondary" as const,
        icon: Clock,
        text: "Manual Only",
        description: "Auto-sync is disabled"
      };
    }

    const now = Date.now();
    const nextPoll = pollingSettings.nextPollAt;
    const retryCount = pollingSettings.retryCount || 0;

    if (retryCount > 0) {
      return {
        variant: "destructive" as const,
        icon: AlertTriangle,
        text: `Retrying (${retryCount}/3)`,
        description: "Last sync failed, retrying"
      };
    }

    if (nextPoll && nextPoll > now) {
      const timeLeft = nextPoll - now;
      const minutes = Math.floor(timeLeft / (1000 * 60));
      const hours = Math.floor(minutes / 60);
      
      let timeText;
      if (hours > 0) {
        timeText = `${hours}h ${minutes % 60}m`;
      } else if (minutes > 0) {
        timeText = `${minutes}m`;
      } else {
        timeText = "< 1m";
      }

      return {
        variant: "default" as const,
        icon: RefreshCw,
        text: `Next: ${timeText}`,
        description: `Auto-sync every ${pollingSettings.frequency}`
      };
    }

    return {
      variant: "default" as const,
      icon: CheckCircle,
      text: "Active",
      description: `Auto-sync every ${pollingSettings.frequency}`
    };
  };

  const { variant, icon: Icon, text, description } = getStatusInfo();

  return (
    <div className={className}>
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {text}
      </Badge>
      <div className="text-xs text-gray-500 mt-1">
        {description}
      </div>
    </div>
  );
}

// Simplified version for inline use
export function AutoSyncBadge({ integrationId, className }: AutoSyncStatusProps) {
  const pollingSettings = useQuery(
    api.integrationPolling.getPollingSettings,
    { integrationId }
  );

  if (!pollingSettings?.enabled) {
    return (
      <Badge variant="secondary" className={className}>
        <Clock className="w-3 h-3 mr-1" />
        Manual
      </Badge>
    );
  }

  const retryCount = pollingSettings.retryCount || 0;
  if (retryCount > 0) {
    return (
      <Badge variant="destructive" className={className}>
        <AlertTriangle className="w-3 h-3 mr-1" />
        Error
      </Badge>
    );
  }

  return (
    <Badge variant="default" className={className}>
      <RefreshCw className="w-3 h-3 mr-1" />
      Auto-sync
    </Badge>
  );
}
