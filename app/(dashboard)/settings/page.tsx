"use client";

import { useState, useEffect, Suspense } from "react";
import { useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Globe, Clock, RefreshCw, Mail } from "lucide-react";
import { IntegrationPollingSettings } from "@/components/settings/IntegrationPollingSettings";
import { EmailSettingsManager } from "@/components/settings/EmailSettingsManager";
import { useSearchParams } from "next/navigation";

function SettingsContent() {
  const { isLoaded, isSignedIn } = useAuth();
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get("tab") || "email";
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Only run queries if user is authenticated and Clerk is loaded
  const integrations = useQuery(
    api.integrations.getUserIntegrations,
    isLoaded && isSignedIn ? {} : "skip"
  );
  const pollingSettings = useQuery(
    api.integrationPolling.getUserPollingSettings,
    isLoaded && isSignedIn ? {} : "skip"
  );
  
  // Filter to show only integrations that support polling
  const pollableIntegrations = integrations?.filter((i:any) => 
    (i.type === "google_sheets" || i.type === "api_endpoint") && 
    (i.status === "connected" || i.status === "active")
  ) || [];

  // Update tab when URL param changes
  useEffect(() => {
    const urlTab = searchParams?.get("tab") || "email";
    console.log('useEffect - URL tab:', urlTab, 'Current activeTab:', activeTab);
    if (urlTab !== activeTab) {
      console.log('Setting activeTab to:', urlTab);
      setActiveTab(urlTab);
    }
  }, [searchParams]);

  // Debug logging
  console.log('Current activeTab:', activeTab);
  console.log('URL tab:', searchParams?.get("tab"));
  console.log('Auth status:', { isLoaded, isSignedIn });

  // Show loading state while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex-shrink-0 px-6 py-4 border-b bg-white">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Settings
          </h2>
          <p className="mt-2 text-sm text-gray-700">
            Loading...
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!isSignedIn) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex-shrink-0 px-6 py-4 border-b bg-white">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Settings
          </h2>
          <p className="mt-2 text-sm text-gray-700">
            Please sign in to access settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 px-6 py-4 border-b bg-white">
        <h2 className="text-2xl pb-2 font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Settings
        </h2>
        <p className="mt-2 text-sm text-gray-700">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => {
            console.log('Tab changed to:', value);
            setActiveTab(value);
            // Update URL to reflect the current tab
            window.history.pushState({}, '', `/settings?tab=${value}`);
          }}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="flex-shrink-0 px-6 py-3 border-b bg-gray-50">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="email">Email Settings</TabsTrigger>
              <TabsTrigger value="integrations">Integration Settings</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto">
            <TabsContent value="email" className="h-full p-6 m-0">
              <div className="max-w-4xl mx-auto">
                <EmailSettingsManager />
              </div>
            </TabsContent>

            <TabsContent value="integrations" className="h-full p-6 m-0">
              <div className="max-w-4xl mx-auto">
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
                    {pollableIntegrations && pollableIntegrations.length > 0 ? (
                      <div className="space-y-4">
                        {pollableIntegrations.map((integration:any) => (
                          <IntegrationPollingSettings
                            key={integration._id}
                            integration={integration}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Globe className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No connected integrations found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Connect Google Sheets or API integrations to enable automatic syncing.
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
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex-shrink-0 px-6 py-4 border-b bg-white">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Settings
          </h2>
          <p className="mt-2 text-sm text-gray-700">
            Loading settings...
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
