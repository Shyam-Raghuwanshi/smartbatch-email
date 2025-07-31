"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AutoSyncBadge } from "./AutoSyncStatus";
import { 
  Globe, 
  CheckCircle, 
  Clock, 
  Settings, 
  RefreshCw,
  ExternalLink 
} from "lucide-react";

interface GoogleSheetsStatusProps {
  onConfigure?: () => void;
}

export function GoogleSheetsStatus({ onConfigure }: GoogleSheetsStatusProps) {
  const integrations = useQuery(api.integrations.getUserIntegrations);
  
  const googleSheetsIntegrations = integrations?.filter(
    integration => integration.type === "google_sheets"
  ) || [];

  const connectedIntegrations = googleSheetsIntegrations.filter(
    integration => integration.status === "connected"
  );

  if (googleSheetsIntegrations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Google Sheets Integration
          </CardTitle>
          <CardDescription>
            No Google Sheets integrations configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Connect your Google Sheets to automatically sync contact data.
          </p>
          <Button variant="outline" className="w-full">
            <Globe className="h-4 w-4 mr-2" />
            Connect Google Sheets
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {googleSheetsIntegrations.map((integration) => (
        <Card key={integration._id} className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                <div>
                  <CardTitle className="text-base">{integration.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {integration.configuration?.title || integration.configuration?.spreadsheetId}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={integration.status === "connected" ? "default" : "secondary"}
                  className="text-xs"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {integration.status === "connected" ? "Connected" : integration.status}
                </Badge>
                {integration.status === "connected" && (
                  <AutoSyncBadge integrationId={integration._id} className="text-xs" />
                )}
              </div>
            </div>
          </CardHeader>
          
          {integration.status === "connected" && (
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      Last sync: {
                        integration.lastSyncAt 
                          ? new Date(integration.lastSyncAt).toLocaleDateString()
                          : "Never"
                      }
                    </span>
                  </div>
                  {integration.configuration?.sheetName && (
                    <div className="flex items-center gap-1">
                      <span>Sheet: {integration.configuration.sheetName}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {integration.configuration?.spreadsheetId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(
                        `https://docs.google.com/spreadsheets/d/${integration.configuration.spreadsheetId}`,
                        '_blank'
                      )}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Open Sheet
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onConfigure}
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
      
      {connectedIntegrations.length > 0 && (
        <div className="text-center pt-2">
          <Button variant="ghost" size="sm" onClick={onConfigure}>
            <Settings className="h-4 w-4 mr-2" />
            Manage Auto-sync Settings
          </Button>
        </div>
      )}
    </div>
  );
}
