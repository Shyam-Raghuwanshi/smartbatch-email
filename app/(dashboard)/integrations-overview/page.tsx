"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoogleSheetsStatus } from "@/components/integrations/GoogleSheetsStatus";
import { IntegrationPollingSettings } from "@/components/settings/IntegrationPollingSettings";
import { 
  Globe, 
  RefreshCw, 
  Settings, 
  Plus,
  ArrowRight 
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();
  
  const integrations = useQuery(api.integrations.getUserIntegrations);
  const pollingSettings = useQuery(api.integrationPolling.getUserPollingSettings);
  
  const connectedIntegrations = integrations?.filter(i => i.status === "connected") || [];
  const googleSheetsIntegrations = integrations?.filter(i => i.type === "google_sheets") || [];
  const activePolling = pollingSettings?.filter(s => s.enabled) || [];

  const handleManageSettings = () => {
    router.push("/settings?tab=integrations");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Integrations
        </h2>
        <p className="mt-2 text-sm text-gray-700">
          Connect external services and manage data syncing.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="google-sheets">Google Sheets</TabsTrigger>
          <TabsTrigger value="settings">Auto-sync Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Globe className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{connectedIntegrations.length}</p>
                    <p className="text-sm text-gray-600">Connected Integrations</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <RefreshCw className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{activePolling.length}</p>
                    <p className="text-sm text-gray-600">Auto-sync Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Settings className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{googleSheetsIntegrations.length}</p>
                    <p className="text-sm text-gray-600">Google Sheets</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common integration tasks and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="justify-between h-auto p-4"
                  onClick={() => router.push("/contacts")}
                >
                  <div className="text-left">
                    <div className="font-medium">Import Contacts</div>
                    <div className="text-sm text-gray-500">Upload CSV or connect Google Sheets</div>
                  </div>
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <Button 
                  variant="outline" 
                  className="justify-between h-auto p-4"
                  onClick={handleManageSettings}
                >
                  <div className="text-left">
                    <div className="font-medium">Auto-sync Settings</div>
                    <div className="text-sm text-gray-500">Configure polling intervals</div>
                  </div>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Connected Integrations */}
          {connectedIntegrations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Connected Integrations</CardTitle>
                <CardDescription>
                  Your active integrations and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GoogleSheetsStatus onConfigure={handleManageSettings} />
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {connectedIntegrations.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Globe className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No integrations connected</h3>
                <p className="text-gray-500 mb-6">
                  Connect your first integration to start syncing data automatically.
                </p>
                <Button onClick={() => router.push("/contacts")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Integration
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="google-sheets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Google Sheets Integrations
              </CardTitle>
              <CardDescription>
                Manage your Google Sheets connections and data syncing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GoogleSheetsStatus onConfigure={handleManageSettings} />
              
              {googleSheetsIntegrations.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    No Google Sheets integrations configured yet.
                  </p>
                  <Button onClick={() => router.push("/contacts")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Connect Google Sheets
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Auto-sync Settings
              </CardTitle>
              <CardDescription>
                Configure how often your integrations sync data automatically
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {connectedIntegrations.length > 0 ? (
                <div className="space-y-4">
                  {connectedIntegrations
                    .filter(integration => integration.type === "google_sheets")
                    .map((integration) => (
                      <IntegrationPollingSettings
                        key={integration._id}
                        integration={integration}
                      />
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <RefreshCw className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No integrations to configure</h3>
                  <p className="text-gray-500 mb-6">
                    Connect some integrations first to configure their auto-sync settings.
                  </p>
                  <Button variant="outline" onClick={() => router.push("/contacts")}>
                    Add Integration
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
