"use client";

import React, { useState } from "react";
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Eye, 
  EyeOff, 
  Copy, 
  Edit, 
  Download, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Settings,
  Loader2,
  Key,
  Globe,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ApiIntegrationProps {
  isOpen: boolean;
  onClose: () => void;
  integrationId?: Id<"integrations">;
  mode: "create" | "edit";
}

export function ApiIntegration({ isOpen, onClose, integrationId, mode }: ApiIntegrationProps) {
  const [step, setStep] = useState<"setup" | "test" | "preview" | "success">("setup");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    apiEndpoint: "",
    apiKey: "",
    headers: {} as Record<string, string>,
  });
  const [newHeaderKey, setNewHeaderKey] = useState("");
  const [newHeaderValue, setNewHeaderValue] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const createApiIntegration = useMutation(api.apiIntegrations.createApiIntegration);
  const updateApiIntegration = useMutation(api.apiIntegrations.updateApiIntegration);
  const testConnection = useAction(api.apiIntegrations.testApiConnection);
  const fetchData = useAction(api.apiIntegrations.fetchFromApiEndpoint);

  // Load existing integration data if editing
  const existingIntegration = integrationId ? useQuery(api.integrations.getById, { integrationId }) : null;

  // Initialize form data when editing
  React.useEffect(() => {
    if (mode === "edit" && existingIntegration) {
      setFormData({
        name: existingIntegration.name,
        description: existingIntegration.description || "",
        apiEndpoint: existingIntegration.configuration.apiEndpoint || "",
        apiKey: "", // Don't pre-fill for security
        headers: existingIntegration.configuration.headers || {},
      });
    }
  }, [mode, existingIntegration]);

  const handleAddHeader = () => {
    if (newHeaderKey && newHeaderValue) {
      setFormData(prev => ({
        ...prev,
        headers: {
          ...prev.headers,
          [newHeaderKey]: newHeaderValue,
        },
      }));
      setNewHeaderKey("");
      setNewHeaderValue("");
    }
  };

  const handleRemoveHeader = (key: string) => {
    setFormData(prev => ({
      ...prev,
      headers: Object.fromEntries(
        Object.entries(prev.headers).filter(([k]) => k !== key)
      ),
    }));
  };

  const handleTestConnection = async () => {
    if (!formData.apiEndpoint || !formData.apiKey) {
      toast.error("Please fill in API endpoint and API key");
      return;
    }

    setTesting(true);
    try {
      const result = await testConnection({
        apiEndpoint: formData.apiEndpoint,
        apiKey: formData.apiKey,
        headers: formData.headers,
      });

      setTestResult(result);
      if (result.success) {
        toast.success("Connection test successful!");
        setStep("preview");
      } else {
        toast.error(`Connection test failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Test failed:", error);
      toast.error("Connection test failed");
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.apiEndpoint || !formData.apiKey) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      if (mode === "create") {
        const integrationId = await createApiIntegration({
          name: formData.name,
          description: formData.description,
          apiEndpoint: formData.apiEndpoint,
          apiKey: formData.apiKey,
          headers: formData.headers,
          permissions: ["read_contacts"],
        });

        // Fetch initial data
        try {
          await fetchData({ integrationId });
        } catch (error) {
          console.warn("Initial data fetch failed:", error);
        }

        toast.success("API integration created successfully!");
      } else if (integrationId) {
        await updateApiIntegration({
          integrationId,
          name: formData.name,
          description: formData.description,
          apiEndpoint: formData.apiEndpoint,
          apiKey: formData.apiKey || undefined,
          headers: formData.headers,
        });

        toast.success("API integration updated successfully!");
      }

      setStep("success");
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Failed to save integration");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyApiKey = () => {
    if (formData.apiKey) {
      navigator.clipboard.writeText(formData.apiKey);
      toast.success("API key copied to clipboard");
    }
  };

  const renderPreviewData = () => {
    if (!testResult?.success || !testResult.preview) return null;

    const data = testResult.preview;
    const isArray = Array.isArray(data);
    const items = isArray ? data : [data];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Data Preview</h4>
          <Badge variant="secondary">
            {testResult.totalRecords} record{testResult.totalRecords !== 1 ? 's' : ''}
          </Badge>
        </div>
        
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {items[0] && Object.keys(items[0]).map((key) => (
                  <TableHead key={key} className="font-medium">
                    {key}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.slice(0, 5).map((item, index) => (
                <TableRow key={index}>
                  {Object.values(item).map((value, valueIndex) => (
                    <TableCell key={valueIndex} className="max-w-[200px] truncate">
                      {typeof value === 'object' 
                        ? JSON.stringify(value)
                        : String(value)
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {isArray && data.length > 5 && (
          <p className="text-sm text-gray-500">
            Showing first 5 of {data.length} records
          </p>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {mode === "create" ? "Add API Integration" : "Edit API Integration"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Connect to any API endpoint to import contacts automatically"
              : "Update your API integration settings"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {step === "setup" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Integration Name *</Label>
                  <Input
                    id="name"
                    placeholder="My API Integration"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Optional description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endpoint">API Endpoint URL *</Label>
                <Input
                  id="endpoint"
                  placeholder="https://api.example.com/contacts"
                  value={formData.apiEndpoint}
                  onChange={(e) => setFormData(prev => ({ ...prev, apiEndpoint: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apikey">API Key *</Label>
                <div className="relative">
                  <Input
                    id="apikey"
                    type={showApiKey ? "text" : "password"}
                    placeholder={mode === "edit" ? "Enter new API key to update" : "Enter your API key"}
                    value={formData.apiKey}
                    onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="pr-20"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="h-6 w-6 p-0"
                    >
                      {showApiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                    {formData.apiKey && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyApiKey}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Custom Headers (Optional)</Label>
                
                {Object.entries(formData.headers).length > 0 && (
                  <div className="space-y-2">
                    {Object.entries(formData.headers).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <span className="font-medium text-sm">{key}:</span>
                        <span className="text-sm">{value}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveHeader(key)}
                          className="ml-auto h-6 w-6 p-0"
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    placeholder="Header name"
                    value={newHeaderKey}
                    onChange={(e) => setNewHeaderKey(e.target.value)}
                  />
                  <Input
                    placeholder="Header value"
                    value={newHeaderValue}
                    onChange={(e) => setNewHeaderValue(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddHeader}
                    disabled={!newHeaderKey || !newHeaderValue}
                  >
                    Add
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleTestConnection} 
                  disabled={testing || !formData.apiEndpoint || !formData.apiKey}
                  className="flex-1"
                >
                  {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Test Connection
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onClose}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {step === "test" && testResult && (
            <div className="space-y-4">
              {testResult.success ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Connection successful! Status: {testResult.status}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    Connection failed: {testResult.error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button onClick={() => setStep("setup")} variant="outline">
                  Back to Setup
                </Button>
                {testResult.success && (
                  <Button onClick={() => setStep("preview")}>
                    Continue
                  </Button>
                )}
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Preview</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Review the data that will be imported from your API endpoint.
                </p>
              </div>

              {renderPreviewData()}

              <div className="flex gap-2">
                <Button onClick={() => setStep("setup")} variant="outline">
                  Back to Setup
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="flex-1"
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mode === "create" ? "Create Integration" : "Update Integration"}
                </Button>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-medium">Integration {mode === "create" ? "Created" : "Updated"}!</h3>
                <p className="text-sm text-gray-600">
                  Your API integration is now active and will automatically fetch data based on your polling settings.
                </p>
              </div>
              <Button onClick={onClose} className="w-full">
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
