"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Plus, Globe, CheckCircle, AlertTriangle, RefreshCw, Download } from "lucide-react";
import { ApiIntegration } from "@/components/integrations/ApiIntegration";

export function ApiIntegrationsTab() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const apiIntegrations = useQuery(api.apiIntegrations.getUserApiIntegrations);

  const handleDownloadDocs = () => {
    // This would download API documentation
    const docContent = `
API Integration Documentation

Endpoint: https://api.smartbatch.com/v1/contacts/import
Method: POST
Headers:
  Authorization: Bearer YOUR_API_KEY
  Content-Type: application/json

Body Format:
{
  "contacts": [
    {
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "company": "Acme Corp",
      "position": "Developer",
      "tags": ["lead", "premium"]
    }
  ]
}

Response:
{
  "success": true,
  "imported": 1,
  "failed": 0,
  "errors": []
}
    `;

    const blob = new Blob([docContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'smartbatch-api-documentation.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (apiIntegrations === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">API Integrations</h3>
          <p className="text-sm text-gray-600">
            Connect external APIs to automatically import contacts
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add API Integration
        </Button>
      </div>

      {/* Existing Integrations */}
      {apiIntegrations && apiIntegrations.length > 0 ? (
        <div className="space-y-3">
          {apiIntegrations.map((integration) => (
            <Card key={integration._id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium">{integration.name}</div>
                    <div className="text-sm text-gray-600 font-mono">
                      {integration.configuration.apiEndpoint}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Status Badge */}
                  <Badge 
                    variant={integration.status === "active" ? "default" : "secondary"}
                    className="flex items-center gap-1"
                  >
                    {integration.status === "active" ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <AlertTriangle className="h-3 w-3" />
                    )}
                    {integration.status}
                  </Badge>
                  
                  {/* Polling Settings */}
                  {integration.pollingSettings?.enabled && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <RefreshCw className="h-3 w-3" />
                      {integration.pollingSettings.frequency}
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Last Sync Info */}
              {integration.lastSyncAt && (
                <div className="mt-2 text-xs text-gray-500">
                  Last synced: {new Date(integration.lastSyncAt).toLocaleString()}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No API Integrations</h3>
          <p className="text-gray-600 mb-4">
            Connect to external APIs to automatically import contacts on a schedule
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First API Integration
          </Button>
        </Card>
      )}

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Manual API Access
          </CardTitle>
          <CardDescription>
            Use our API to import contacts programmatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium mb-1">API Endpoint</div>
              <div className="p-2 bg-gray-100 rounded font-mono text-sm">
                https://api.smartbatch.com/v1/contacts/import
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Your API Key</div>
              <div className="p-2 bg-gray-100 rounded font-mono text-sm">
                ••••••••••••••••
              </div>
            </div>
          </div>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Use API integrations above for automatic scheduled imports, or use manual API calls for on-demand imports.
            </AlertDescription>
          </Alert>
          
          <Button variant="outline" onClick={handleDownloadDocs}>
            <Download className="h-4 w-4 mr-2" />
            Download API Documentation
          </Button>
        </CardContent>
      </Card>

      {/* Create Integration Modal */}
      <ApiIntegration
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        mode="create"
      />
    </div>
  );
}
