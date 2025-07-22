"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Settings, 
  Trash2, 
  Play, 
  Pause, 
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Zap,
  Globe,
  Webhook,
  Key,
  GitBranch,
  Activity,
  BarChart3,
  Download,
  Upload,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { IntegrationSetupModal } from "@/components/integrations/IntegrationSetupModal";
import { WebhookManager } from "@/components/integrations/WebhookManager";
import { ApiKeyManager } from "@/components/integrations/ApiKeyManager";
import { WorkflowBuilder } from "@/components/integrations/WorkflowBuilder";
import { SyncHistory } from "@/components/integrations/SyncHistory";
import { IntegrationMonitoring } from "@/components/integrations/IntegrationMonitoring";
import { ApiDocumentationGenerator } from "@/components/integrations/ApiDocumentationGenerator";
import { IntegrationAnalytics } from "@/components/integrations/IntegrationAnalytics";
import { IntegrationTesting } from "@/components/integrations/IntegrationTesting";
import { IntegrationMarketplace } from "@/components/integrations/IntegrationMarketplace";
import AuditLogs from "@/components/integrations/AuditLogs";

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [selectedIntegrationType, setSelectedIntegrationType] = useState<string | null>(null);
  
  const { user } = useUser();

  const integrations = useQuery(api.integrations.getUserIntegrations);
  const webhooks = useQuery(api.webhooks.getUserWebhooks);
  const apiKeys = useQuery(api.apiKeys.getUserApiKeys);
  const workflows = useQuery(api.workflows.getUserWorkflows);
  const syncHistory = useQuery(api.integrations.getIntegrationSyncs, { limit: 10 });

  const testConnection = useMutation(api.integrations.testIntegrationConnection);
  const deleteIntegration = useMutation(api.integrations.deleteIntegration);
  const startSync = useMutation(api.integrations.startSync);

  const handleTestConnection = async (integrationId: string) => {
    try {
      await testConnection({ integrationId });
    } catch (error) {
      console.error("Connection test failed:", error);
    }
  };

  const handleDeleteIntegration = async (integrationId: string) => {
    if (confirm("Are you sure you want to delete this integration?")) {
      try {
        await deleteIntegration({ integrationId });
      } catch (error) {
        console.error("Failed to delete integration:", error);
      }
    }
  };

  const handleStartSync = async (integrationId: string, type: string) => {
    try {
      await startSync({
        integrationId,
        type: type as any,
        direction: "bidirectional",
      });
    } catch (error) {
      console.error("Failed to start sync:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const availableIntegrations = [
    {
      type: "google_sheets",
      name: "Google Sheets",
      description: "Sync contacts bidirectionally with Google Sheets",
      icon: <Globe className="h-8 w-8 text-blue-500" />,
      category: "Data Sync",
      features: ["Bidirectional sync", "Auto-mapping", "Real-time updates"],
    },
    {
      type: "zapier",
      name: "Zapier",
      description: "Connect with 5000+ apps through Zapier workflows",
      icon: <Zap className="h-8 w-8 text-orange-500" />,
      category: "Automation",
      features: ["5000+ app connections", "Custom triggers", "Multi-step workflows"],
    },
    {
      type: "webhook",
      name: "Custom Webhooks",
      description: "Send real-time data to your custom endpoints",
      icon: <Webhook className="h-8 w-8 text-purple-500" />,
      category: "Developer",
      features: ["Real-time events", "Custom endpoints", "Retry logic"],
    },
    {
      type: "salesforce",
      name: "Salesforce",
      description: "Sync contacts and leads with Salesforce CRM",
      icon: <BarChart3 className="h-8 w-8 text-blue-600" />,
      category: "CRM",
      features: ["Contact sync", "Lead management", "Campaign tracking"],
    },
    {
      type: "hubspot",
      name: "HubSpot",
      description: "Integrate with HubSpot CRM and marketing tools",
      icon: <Activity className="h-8 w-8 text-orange-600" />,
      category: "CRM",
      features: ["Contact sync", "Deal tracking", "Marketing automation"],
    },
    {
      type: "api_key",
      name: "REST API",
      description: "Access SmartBatch data via our REST API",
      icon: <Key className="h-8 w-8 text-gray-600" />,
      category: "Developer",
      features: ["Full API access", "Rate limiting", "Webhooks"],
    },
  ];

  const connectedIntegrations = integrations?.filter(i => i.status === "connected") || [];
  const totalWebhooks = webhooks?.length || 0;
  const activeWebhooks = webhooks?.filter(w => w.isActive)?.length || 0;
  const totalApiKeys = apiKeys?.length || 0;
  const activeWorkflows = workflows?.filter(w => w.isActive)?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrations Hub</h1>
          <p className="text-gray-600">Connect SmartBatch with your favorite tools and services</p>
        </div>
        <Button onClick={() => setShowSetupModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Integration
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Integrations</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectedIntegrations.length}</div>
            <p className="text-xs text-muted-foreground">
              {integrations?.length || 0} total configured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Webhooks</CardTitle>
            <Webhook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeWebhooks}</div>
            <p className="text-xs text-muted-foreground">
              {totalWebhooks} total endpoints
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalApiKeys}</div>
            <p className="text-xs text-muted-foreground">
              Active API access
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeWorkflows}</div>
            <p className="text-xs text-muted-foreground">
              {workflows?.length || 0} total workflows
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-11">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="sync-history">Sync History</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="api-docs">API Docs</TabsTrigger>
          <TabsTrigger value="audit-logs">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Connected Integrations */}
          <Card>
            <CardHeader>
              <CardTitle>Connected Integrations</CardTitle>
              <CardDescription>
                Manage your active integrations and their health status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {integrations && integrations.length > 0 ? (
                <div className="space-y-4">
                  {integrations.map((integration) => (
                    <div key={integration._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(integration.status)}
                          {getHealthIcon(integration.healthStatus)}
                        </div>
                        <div>
                          <h3 className="font-medium">{integration.name}</h3>
                          <p className="text-sm text-gray-500">{integration.type}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant={integration.status === "connected" ? "default" : "secondary"}>
                              {integration.status}
                            </Badge>
                            {integration.lastSyncAt && (
                              <span className="text-xs text-gray-500">
                                Last sync: {new Date(integration.lastSyncAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestConnection(integration._id)}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartSync(integration._id, "bidirectional_sync")}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteIntegration(integration._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Globe className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No integrations yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by connecting your first integration.
                  </p>
                  <div className="mt-6">
                    <Button onClick={() => setShowSetupModal(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Integration
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Integrations */}
          <Card>
            <CardHeader>
              <CardTitle>Available Integrations</CardTitle>
              <CardDescription>
                Connect with popular tools and services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableIntegrations.map((integration) => (
                  <Card key={integration.type} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        {integration.icon}
                        <Badge variant="outline">{integration.category}</Badge>
                      </div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <CardDescription>{integration.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {integration.features.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button 
                        className="w-full mt-4" 
                        variant="outline"
                        onClick={() => {
                          setSelectedIntegrationType(integration.type);
                          setShowSetupModal(true);
                        }}
                      >
                        Connect
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Sync Activity */}
          {syncHistory && syncHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Sync Activity</CardTitle>
                <CardDescription>
                  Latest integration synchronization activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {syncHistory.slice(0, 5).map((sync) => (
                    <div key={sync._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          {sync.direction === "inbound" ? (
                            <Download className="h-4 w-4 text-blue-500" />
                          ) : sync.direction === "outbound" ? (
                            <Upload className="h-4 w-4 text-green-500" />
                          ) : (
                            <RefreshCw className="h-4 w-4 text-purple-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {sync.integration?.name} - {sync.type.replace(/_/g, " ")}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(sync.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={sync.status === "completed" ? "default" : 
                                     sync.status === "failed" ? "destructive" : "secondary"}>
                          {sync.status}
                        </Badge>
                        {sync.progress > 0 && (
                          <Progress value={sync.progress} className="w-20" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="webhooks">
          <WebhookManager />
        </TabsContent>

        <TabsContent value="api-keys">
          <ApiKeyManager />
        </TabsContent>

        <TabsContent value="workflows">
          <WorkflowBuilder />
        </TabsContent>

        <TabsContent value="sync-history">
          <SyncHistory />
        </TabsContent>

        <TabsContent value="monitoring">
          <IntegrationMonitoring />
        </TabsContent>

        <TabsContent value="testing">
          {user && <IntegrationTesting userId={user.id} />}
        </TabsContent>

        <TabsContent value="marketplace">
          {user && <IntegrationMarketplace userId={user.id} />}
        </TabsContent>

        <TabsContent value="analytics">
          {user && <IntegrationAnalytics userId={user.id} />}
        </TabsContent>

        <TabsContent value="api-docs">
          <ApiDocumentationGenerator />
        </TabsContent>

        <TabsContent value="audit-logs">
          {user?.id && <AuditLogs userId={user.id as any} />}
        </TabsContent>
      </Tabs>

      <IntegrationSetupModal
        isOpen={showSetupModal}
        onClose={() => {
          setShowSetupModal(false);
          setSelectedIntegrationType(null);
        }}
        integrationType={selectedIntegrationType || "google_sheets"}
        mode="create"
      />
    </div>
  );
}
