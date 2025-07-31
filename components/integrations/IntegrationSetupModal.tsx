"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, CheckCircle2, ExternalLink, Key, Link, Settings, Shield } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

interface IntegrationSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  integrationType: string;
  integrationId?: Id<"integrations">;
  mode: "create" | "edit";
}

const integrationConfigs = {
  google_sheets: {
    name: "Google Sheets",
    icon: "📊",
    description: "Sync contacts with Google Sheets for easy data management",
    requiresOAuth: true,
    fields: [
      { key: "spreadsheetId", label: "Spreadsheet ID", type: "text", required: true },
      { key: "sheetName", label: "Sheet Name", type: "text", required: false },
    ],
    permissions: ["read_contacts", "write_contacts"],
    steps: [
      "Connect your Google account",
      "Select or enter spreadsheet details",
      "Configure column mapping",
      "Test the connection"
    ]
  },
  zapier: {
    name: "Zapier",
    icon: "⚡",
    description: "Connect with thousands of apps through Zapier automation",
    requiresOAuth: false,
    fields: [
      { key: "zapierHookUrl", label: "Zapier Hook URL", type: "url", required: true },
    ],
    permissions: ["trigger_campaigns", "webhook_events"],
    steps: [
      "Create a Zap in Zapier",
      "Copy the webhook URL",
      "Configure trigger events",
      "Test the connection"
    ]
  },
  webhook: {
    name: "Custom Webhook",
    icon: "🔗",
    description: "Send data to any external service via webhooks",
    requiresOAuth: false,
    fields: [
      { key: "webhookUrl", label: "Webhook URL", type: "url", required: true },
      { key: "webhookSecret", label: "Secret Key", type: "password", required: false },
    ],
    permissions: ["webhook_events"],
    steps: [
      "Enter webhook endpoint URL",
      "Configure authentication",
      "Select events to trigger",
      "Test the webhook"
    ]
  },
  salesforce: {
    name: "Salesforce",
    icon: "☁️",
    description: "Sync contacts and leads with Salesforce CRM",
    requiresOAuth: true,
    fields: [
      { key: "instanceUrl", label: "Instance URL", type: "url", required: true },
    ],
    permissions: ["read_contacts", "write_contacts", "trigger_campaigns"],
    steps: [
      "Connect to Salesforce",
      "Configure field mapping",
      "Set sync preferences",
      "Test the connection"
    ]
  },
  hubspot: {
    name: "HubSpot",
    icon: "🟠",
    description: "Sync contacts and trigger campaigns from HubSpot",
    requiresOAuth: true,
    fields: [],
    permissions: ["read_contacts", "write_contacts", "trigger_campaigns"],
    steps: [
      "Connect to HubSpot",
      "Select contact lists",
      "Configure sync settings",
      "Test the connection"
    ]
  },
  api_key: {
    name: "API Integration",
    icon: "🔑",
    description: "Custom API integration using authentication keys",
    requiresOAuth: false,
    fields: [
      { key: "apiKey", label: "API Key", type: "password", required: true },
      { key: "apiSecret", label: "API Secret", type: "password", required: false },
      { key: "baseUrl", label: "Base URL", type: "url", required: true },
    ],
    permissions: ["read_contacts", "write_contacts"],
    steps: [
      "Enter API credentials",
      "Configure endpoints",
      "Test authentication",
      "Verify connection"
    ]
  },
  api_endpoint: {
    name: "External API",
    icon: "🌐",
    description: "Connect to external APIs to import contacts automatically",
    requiresOAuth: false,
    fields: [
      { key: "apiEndpoint", label: "API Endpoint URL", type: "url", required: true },
      { key: "apiKey", label: "API Key", type: "password", required: true },
    ],
    permissions: ["read_contacts"],
    steps: [
      "Enter API endpoint details",
      "Configure authentication",
      "Test connection",
      "Preview data"
    ]
  }
};

export function IntegrationSetupModal({ 
  isOpen, 
  onClose, 
  integrationType, 
  integrationId, 
  mode 
}: IntegrationSetupModalProps) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    configuration: {} as Record<string, any>,
    permissions: [] as string[],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const createIntegration = useMutation(api.integrations.create);
  const updateIntegration = useMutation(api.integrations.update);
  const testIntegration = useMutation(api.integrations.testConnection);
  
  const existingIntegration = useQuery(
    api.integrations.getById,
    integrationId ? { integrationId } : "skip"
  );

  const config = integrationConfigs[integrationType as keyof typeof integrationConfigs];

  // Initialize form data when editing
  useState(() => {
    if (mode === "edit" && existingIntegration) {
      setFormData({
        name: existingIntegration.name,
        description: existingIntegration.description || "",
        configuration: existingIntegration.configuration,
        permissions: existingIntegration.permissions,
      });
    } else {
      setFormData({
        name: config?.name || "",
        description: config?.description || "",
        configuration: {},
        permissions: config?.permissions || [],
      });
    }
  });

  const handleNext = () => {
    if (step < config.steps.length - 1) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleFieldChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        [key]: value
      }
    }));
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permission]
        : prev.permissions.filter(p => p !== permission)
    }));
  };

  const handleOAuthConnect = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would initiate OAuth flow
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update configuration with mock OAuth tokens
      setFormData(prev => ({
        ...prev,
        configuration: {
          ...prev.configuration,
          accessToken: "mock_access_token",
          refreshToken: "mock_refresh_token",
          expiresAt: Date.now() + 3600000, // 1 hour
        }
      }));
      
      toast.success("OAuth connection successful!");
      handleNext();
    } catch (error) {
      toast.error("OAuth connection failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      const result = await testIntegration({
        type: integrationType as any,
        configuration: formData.configuration,
      });
      
      setTestResult({
        success: result.success,
        message: result.message || (result.success ? "Connection successful!" : "Connection failed")
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: "Failed to test connection"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      if (mode === "create") {
        await createIntegration({
          type: integrationType as any,
          name: formData.name,
          description: formData.description,
          configuration: formData.configuration,
          permissions: formData.permissions,
        });
        toast.success("Integration created successfully!");
      } else if (integrationId) {
        await updateIntegration({
          integrationId,
          name: formData.name,
          description: formData.description,
          configuration: formData.configuration,
          permissions: formData.permissions,
        });
        toast.success("Integration updated successfully!");
      }
      onClose();
    } catch (error) {
      toast.error("Failed to save integration");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 0: // Basic Info / OAuth
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{config.icon}</div>
              <div>
                <h3 className="text-lg font-semibold">{config.name}</h3>
                <p className="text-sm text-muted-foreground">{config.description}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Integration Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={`My ${config.name} Integration`}
                />
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this integration will be used for"
                  rows={3}
                />
              </div>
            </div>

            {config.requiresOAuth && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>OAuth Authentication</span>
                  </CardTitle>
                  <CardDescription>
                    Connect securely to {config.name} using OAuth 2.0
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={handleOAuthConnect}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {isLoading ? "Connecting..." : `Connect to ${config.name}`}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 1: // Configuration
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Configuration</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configure the connection settings for your integration
              </p>
            </div>

            <div className="space-y-4">
              {config.fields.map((field) => (
                <div key={field.key}>
                  <Label htmlFor={field.key}>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  <Input
                    id={field.key}
                    type={field.type}
                    value={formData.configuration[field.key] || ""}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    required={field.required}
                  />
                </div>
              ))}
            </div>

            {integrationType === "google_sheets" && (
              <Card>
                <CardHeader>
                  <CardTitle>Column Mapping</CardTitle>
                  <CardDescription>
                    Map your contact fields to spreadsheet columns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {["email", "firstName", "lastName", "company"].map((field) => (
                      <div key={field} className="flex items-center space-x-3">
                        <Label className="w-20 text-sm">{field}:</Label>
                        <Input
                          placeholder={`Column for ${field}`}
                          value={formData.configuration.columnMapping?.[field] || ""}
                          onChange={(e) => handleFieldChange(`columnMapping.${field}`, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 2: // Permissions
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Permissions</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select what this integration can access in your account
              </p>
            </div>

            <div className="space-y-3">
              {[
                { key: "read_contacts", label: "Read Contacts", description: "View contact information" },
                { key: "write_contacts", label: "Write Contacts", description: "Create and update contacts" },
                { key: "trigger_campaigns", label: "Trigger Campaigns", description: "Start email campaigns" },
                { key: "read_analytics", label: "Read Analytics", description: "Access campaign analytics" },
                { key: "webhook_events", label: "Webhook Events", description: "Receive event notifications" },
              ].map((permission) => (
                <div key={permission.key} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={permission.key}
                    checked={formData.permissions.includes(permission.key)}
                    onCheckedChange={(checked) => 
                      handlePermissionChange(permission.key, checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor={permission.key} className="font-medium">
                      {permission.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{permission.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 3: // Test Connection
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Test Connection</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Verify that your integration is configured correctly
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Connection Test</CardTitle>
                <CardDescription>
                  Test the connection to ensure everything is working properly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleTestConnection}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Testing..." : "Test Connection"}
                </Button>

                {testResult && (
                  <div className={`flex items-center space-x-2 p-3 rounded-lg ${
                    testResult.success 
                      ? "bg-green-50 text-green-700 border border-green-200" 
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}>
                    {testResult.success ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <AlertCircle className="h-5 w-5" />
                    )}
                    <span className="text-sm">{testResult.message}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-2">
              <h4 className="font-medium">Integration Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Name:</span>
                  <span className="font-medium">{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="font-medium">{config.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Permissions:</span>
                  <div className="flex flex-wrap gap-1">
                    {formData.permissions.map((permission) => (
                      <Badge key={permission} variant="secondary" className="text-xs">
                        {permission.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!config) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Setup" : "Edit"} {config.name} Integration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center space-x-2">
            {config.steps.map((stepName, index) => (
              <div key={index} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  index <= step 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-200 text-gray-600"
                }`}>
                  {index + 1}
                </div>
                {index < config.steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    index < step ? "bg-blue-600" : "bg-gray-200"
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Current Step Name */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Step {step + 1} of {config.steps.length}
            </h3>
            <h2 className="text-lg font-semibold">{config.steps[step]}</h2>
          </div>

          <Separator />

          {/* Step Content */}
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={step === 0}
            >
              Previous
            </Button>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              
              {step === config.steps.length - 1 ? (
                <Button 
                  onClick={handleSave}
                  disabled={isLoading || (testResult && !testResult.success)}
                >
                  {isLoading ? "Saving..." : (mode === "create" ? "Create Integration" : "Save Changes")}
                </Button>
              ) : (
                <Button 
                  onClick={handleNext}
                  disabled={isLoading}
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
