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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Copy,
  Eye,
  EyeOff,
  Key,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Settings,
  Shield,
  Trash2,
  Calendar,
  Activity,
  AlertTriangle
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function ApiKeyManager() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<Id<"apiKeys"> | null>(null);
  const [showKeyValues, setShowKeyValues] = useState<Record<string, boolean>>({});

  const apiKeys = useQuery(api.apiKeys.list);
  const keyUsage = useQuery(api.apiKeys.getUsageStats);

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeyValues(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Key Management</h2>
          <p className="text-muted-foreground">
            Generate and manage API keys for external integrations
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Generate API Key
        </Button>
      </div>

      <Tabs defaultValue="keys" className="space-y-4">
        <TabsList>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          <ApiKeysList 
            apiKeys={apiKeys || []}
            showKeyValues={showKeyValues}
            onToggleVisibility={toggleKeyVisibility}
            onEdit={setEditingKey}
          />
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <UsageAnalytics usage={keyUsage} />
        </TabsContent>

        <TabsContent value="documentation" className="space-y-4">
          <ApiDocumentation />
        </TabsContent>
      </Tabs>

      <ApiKeyCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {editingKey && (
        <ApiKeyEditModal
          isOpen={true}
          onClose={() => setEditingKey(null)}
          keyId={editingKey}
        />
      )}
    </div>
  );
}

function ApiKeysList({ 
  apiKeys, 
  showKeyValues, 
  onToggleVisibility, 
  onEdit 
}: { 
  apiKeys: any[];
  showKeyValues: Record<string, boolean>;
  onToggleVisibility: (keyId: string) => void;
  onEdit: (id: Id<"apiKeys">) => void;
}) {
  const deleteApiKey = useMutation(api.apiKeys.delete);
  const regenerateApiKey = useMutation(api.apiKeys.regenerate);

  const handleDelete = async (keyId: Id<"apiKeys">) => {
    try {
      await deleteApiKey({ keyId });
      toast.success("API key deleted successfully");
    } catch (error) {
      toast.error("Failed to delete API key");
    }
  };

  const handleRegenerate = async (keyId: Id<"apiKeys">) => {
    try {
      await regenerateApiKey({ keyId });
      toast.success("API key regenerated successfully");
    } catch (error) {
      toast.error("Failed to regenerate API key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("API key copied to clipboard");
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return `${key.substring(0, 4)}${"*".repeat(key.length - 8)}${key.substring(key.length - 4)}`;
  };

  if (apiKeys.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Key className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No API keys created</h3>
          <p className="text-muted-foreground text-center mb-4">
            Generate your first API key to start integrating with external services
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {apiKeys.map((apiKey) => (
        <Card key={apiKey._id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  apiKey.isActive ? "bg-green-500" : "bg-gray-400"
                }`} />
                <div>
                  <CardTitle className="text-lg">{apiKey.name}</CardTitle>
                  <CardDescription>{apiKey.description}</CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={apiKey.isActive ? "default" : "secondary"}>
                  {apiKey.isActive ? "Active" : "Inactive"}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(apiKey._id)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRegenerate(apiKey._id)}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(apiKey._id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">API Key</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <code className="bg-muted px-3 py-2 rounded text-sm font-mono flex-1">
                      {showKeyValues[apiKey._id] ? apiKey.key : maskApiKey(apiKey.key)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleVisibility(apiKey._id)}
                    >
                      {showKeyValues[apiKey._id] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(apiKey.key)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Permissions</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {apiKey.permissions.map((permission: string) => (
                      <Badge key={permission} variant="outline" className="text-xs">
                        {permission.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(apiKey._creationTime).toLocaleDateString()}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last used:</span>
                  <span>
                    {apiKey.lastUsedAt 
                      ? new Date(apiKey.lastUsedAt).toLocaleDateString()
                      : "Never"
                    }
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Usage this month:</span>
                  <span className="font-medium">
                    {apiKey.currentPeriodUsage?.toLocaleString() || 0} requests
                  </span>
                </div>

                {apiKey.rateLimit && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Rate limit:</span>
                    <span>{apiKey.rateLimit.requests}/{apiKey.rateLimit.period}</span>
                  </div>
                )}

                {apiKey.expiresAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Expires:</span>
                    <div className="flex items-center space-x-1">
                      {new Date(apiKey.expiresAt) < new Date() && (
                        <AlertTriangle className="h-3 w-3 text-red-500" />
                      )}
                      <span className={
                        new Date(apiKey.expiresAt) < new Date() ? "text-red-500" : ""
                      }>
                        {new Date(apiKey.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function UsageAnalytics({ usage }: { usage: any }) {
  if (!usage) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Activity className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Loading usage analytics...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.totalRequests?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.activeKeys || 0}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.successRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rate Limited</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{usage.rateLimited || 0}</div>
            <p className="text-xs text-muted-foreground">Requests blocked</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Key Usage Breakdown</CardTitle>
          <CardDescription>
            Request volume by API key over the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>API Key</TableHead>
                <TableHead>Requests</TableHead>
                <TableHead>Success Rate</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usage.keyBreakdown?.map((key: any) => (
                <TableRow key={key.keyId}>
                  <TableCell className="font-medium">{key.name}</TableCell>
                  <TableCell>{key.requests.toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={`${
                      key.successRate >= 95 ? "text-green-600" :
                      key.successRate >= 90 ? "text-yellow-600" : "text-red-600"
                    }`}>
                      {key.successRate}%
                    </span>
                  </TableCell>
                  <TableCell>{key.lastUsed}</TableCell>
                  <TableCell>
                    <Badge variant={key.isActive ? "default" : "secondary"}>
                      {key.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              )) || []}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ApiDocumentation() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Code copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>
            All API requests must include your API key in the Authorization header
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Authorization Header</Label>
            <div className="flex items-center space-x-2 mt-1">
              <code className="bg-muted px-3 py-2 rounded text-sm font-mono flex-1">
                Authorization: Bearer YOUR_API_KEY
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard("Authorization: Bearer YOUR_API_KEY")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label>Base URL</Label>
            <div className="flex items-center space-x-2 mt-1">
              <code className="bg-muted px-3 py-2 rounded text-sm font-mono flex-1">
                https://api.smartbatch.com/v1
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard("https://api.smartbatch.com/v1")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Common Endpoints</CardTitle>
          <CardDescription>
            Frequently used API endpoints for contact and campaign management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold mb-2">Contacts</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span><Badge variant="outline">GET</Badge> /contacts</span>
                <span className="text-muted-foreground">List all contacts</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span><Badge variant="outline">POST</Badge> /contacts</span>
                <span className="text-muted-foreground">Create a new contact</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span><Badge variant="outline">PUT</Badge> /contacts/:id</span>
                <span className="text-muted-foreground">Update a contact</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span><Badge variant="outline">DELETE</Badge> /contacts/:id</span>
                <span className="text-muted-foreground">Delete a contact</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Campaigns</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span><Badge variant="outline">GET</Badge> /campaigns</span>
                <span className="text-muted-foreground">List all campaigns</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span><Badge variant="outline">POST</Badge> /campaigns</span>
                <span className="text-muted-foreground">Create a new campaign</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span><Badge variant="outline">POST</Badge> /campaigns/:id/send</span>
                <span className="text-muted-foreground">Send a campaign</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Example Usage</CardTitle>
          <CardDescription>
            Code examples for common integration scenarios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Create a Contact (JavaScript)</Label>
            <div className="relative mt-1">
              <pre className="bg-muted p-4 rounded text-sm overflow-auto">
{`const response = await fetch('https://api.smartbatch.com/v1/contacts', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    customFields: {
      company: 'Acme Corp'
    }
  })
});

const contact = await response.json();
console.log('Created contact:', contact);`}
              </pre>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(`const response = await fetch('https://api.smartbatch.com/v1/contacts', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    customFields: {
      company: 'Acme Corp'
    }
  })
});

const contact = await response.json();
console.log('Created contact:', contact);`)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label>Send a Campaign (Python)</Label>
            <div className="relative mt-1">
              <pre className="bg-muted p-4 rounded text-sm overflow-auto">
{`import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

data = {
    'name': 'Welcome Campaign',
    'subject': 'Welcome to SmartBatch!',
    'content': '<h1>Welcome!</h1><p>Thanks for joining us.</p>',
    'recipients': ['john@example.com', 'jane@example.com']
}

response = requests.post(
    'https://api.smartbatch.com/v1/campaigns',
    headers=headers,
    json=data
)

campaign = response.json()
print(f"Created campaign: {campaign['id']}")`}
              </pre>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(`import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

data = {
    'name': 'Welcome Campaign',
    'subject': 'Welcome to SmartBatch!',
    'content': '<h1>Welcome!</h1><p>Thanks for joining us.</p>',
    'recipients': ['john@example.com', 'jane@example.com']
}

response = requests.post(
    'https://api.smartbatch.com/v1/campaigns',
    headers=headers,
    json=data
)

campaign = response.json()
print(f"Created campaign: {campaign['id']}")`)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ApiKeyCreateModal({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
    expiresAt: "",
    rateLimit: {
      enabled: false,
      requests: 1000,
      period: "hour" as "minute" | "hour" | "day"
    }
  });

  const createApiKey = useMutation(api.apiKeys.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const apiKey = await createApiKey({
        name: formData.name,
        description: formData.description,
        permissions: formData.permissions,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).getTime() : undefined,
        rateLimit: formData.rateLimit.enabled ? formData.rateLimit : undefined,
      });
      
      toast.success("API key created successfully");
      onClose();
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        permissions: [],
        expiresAt: "",
        rateLimit: {
          enabled: false,
          requests: 1000,
          period: "hour"
        }
      });
    } catch (error) {
      toast.error("Failed to create API key");
    }
  };

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const availablePermissions = [
    { key: "read_contacts", label: "Read Contacts", description: "View contact information" },
    { key: "write_contacts", label: "Write Contacts", description: "Create and update contacts" },
    { key: "delete_contacts", label: "Delete Contacts", description: "Remove contacts" },
    { key: "read_campaigns", label: "Read Campaigns", description: "View campaign information" },
    { key: "write_campaigns", label: "Write Campaigns", description: "Create and update campaigns" },
    { key: "send_campaigns", label: "Send Campaigns", description: "Send email campaigns" },
    { key: "read_analytics", label: "Read Analytics", description: "Access analytics data" },
    { key: "webhook_events", label: "Webhook Events", description: "Receive webhook notifications" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate New API Key</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Integration Key"
                required
              />
            </div>

            <div>
              <Label htmlFor="expiresAt">Expires At (Optional)</Label>
              <Input
                id="expiresAt"
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this API key will be used for"
              rows={3}
            />
          </div>

          <div>
            <Label>Permissions</Label>
            <div className="grid grid-cols-1 gap-3 mt-2">
              {availablePermissions.map((permission) => (
                <div key={permission.key} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    id={permission.key}
                    checked={formData.permissions.includes(permission.key)}
                    onChange={() => togglePermission(permission.key)}
                    className="mt-0.5"
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

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="rateLimitEnabled"
                checked={formData.rateLimit.enabled}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({
                    ...prev,
                    rateLimit: { ...prev.rateLimit, enabled: checked }
                  }))
                }
              />
              <Label htmlFor="rateLimitEnabled">Enable Rate Limiting</Label>
            </div>

            {formData.rateLimit.enabled && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div>
                  <Label htmlFor="requests">Requests</Label>
                  <Input
                    id="requests"
                    type="number"
                    value={formData.rateLimit.requests}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      rateLimit: { ...prev.rateLimit, requests: parseInt(e.target.value) }
                    }))}
                    min="1"
                  />
                </div>

                <div>
                  <Label htmlFor="period">Per</Label>
                  <Select
                    value={formData.rateLimit.period}
                    onValueChange={(value: "minute" | "hour" | "day") => 
                      setFormData(prev => ({
                        ...prev,
                        rateLimit: { ...prev.rateLimit, period: value }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minute">Minute</SelectItem>
                      <SelectItem value="hour">Hour</SelectItem>
                      <SelectItem value="day">Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Generate API Key</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ApiKeyEditModal({ 
  isOpen, 
  onClose, 
  keyId 
}: { 
  isOpen: boolean;
  onClose: () => void;
  keyId: Id<"apiKeys">;
}) {
  // Similar implementation to create modal but for editing
  // Would fetch existing API key data and populate form
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit API Key</DialogTitle>
        </DialogHeader>
        <p>Edit API key implementation would go here...</p>
      </DialogContent>
    </Dialog>
  );
}
