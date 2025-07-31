"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Globe, Clock, RefreshCw } from "lucide-react";
import { IntegrationPollingSettings } from "@/components/settings/IntegrationPollingSettings";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  
  const apiIntegrations = useQuery(api.apiIntegrations.getUserApiIntegrations);
  const googleIntegrations = useQuery(api.integrations.getUserIntegrations);
  
  const allIntegrations = [
    ...(apiIntegrations || []),
    ...(googleIntegrations?.filter(i => i.type === "google_sheets") || [])
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Settings
        </h2>
        <p className="mt-2 text-sm text-gray-700">
          Manage your account settings and preferences.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="integrations">Integration Settings</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Configure your account preferences and notification settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">General settings panel coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Integration Polling Settings
              </CardTitle>
              <CardDescription>
                Configure how often your integrations sync data automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {allIntegrations && allIntegrations.length > 0 ? (
                <div className="space-y-4">
                  {allIntegrations.map((integration) => (
                    <IntegrationPollingSettings
                      key={integration._id}
                      integration={integration}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Globe className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No integrations found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Create some integrations first to configure their polling settings.
                  </p>
                  <div className="mt-6">
                    <Button variant="outline">
                      Go to Integrations
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how you want to be notified about integration events.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Notification settings coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
