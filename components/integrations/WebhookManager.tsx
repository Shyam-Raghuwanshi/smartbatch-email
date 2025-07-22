"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Copy, 
  ExternalLink, 
  MoreHorizontal, 
  Plus, 
  RefreshCw,
  Settings,
  Trash2,
  Webhook,
  XCircle
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface WebhookManagerProps {
  integrationId?: Id<"integrations">;
}

export function WebhookManager({ integrationId }: WebhookManagerProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Id<"webhookEndpoints"> | null>(null);
  const [selectedWebhook, setSelectedWebhook] = useState<Id<"webhookEndpoints"> | null>(null);

  const webhooks = useQuery(api.webhooks.list, integrationId ? { integrationId } : {});
  const webhookLogs = useQuery(
    api.webhooks.getLogs,
    selectedWebhook ? { webhookId: selectedWebhook, limit: 50 } : "skip"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Webhook Manager</h2>
          <p className="text-muted-foreground">
            Configure webhook endpoints to receive real-time events
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Webhook
        </Button>
      </div>

      <Tabs defaultValue="endpoints" className="space-y-4">
        <TabsList>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints" className="space-y-4">
          <WebhookEndpointsList 
            webhooks={webhooks || []}
            onEdit={setEditingWebhook}
            onSelect={setSelectedWebhook}
          />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <WebhookLogsList 
            logs={webhookLogs || []}
            webhooks={webhooks || []}
            onSelectWebhook={setSelectedWebhook}
            selectedWebhook={selectedWebhook}
          />
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <WebhookTesting webhooks={webhooks || []} />
        </TabsContent>
      </Tabs>

      <WebhookCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        integrationId={integrationId}
      />

      {editingWebhook && (
        <WebhookEditModal
          isOpen={true}
          onClose={() => setEditingWebhook(null)}
          webhookId={editingWebhook}
        />
      )}
    </div>
  );
}

function WebhookEndpointsList({ 
  webhooks, 
  onEdit, 
  onSelect 
}: { 
  webhooks: any[];
  onEdit: (id: Id<"webhookEndpoints">) => void;
  onSelect: (id: Id<"webhookEndpoints">) => void;
}) {
  const deleteWebhook = useMutation(api.webhooks.delete);

  const handleDelete = async (webhookId: Id<"webhookEndpoints">) => {
    try {
      await deleteWebhook({ webhookId });
      toast.success("Webhook deleted successfully");
    } catch (error) {
      toast.error("Failed to delete webhook");
    }
  };

  const copyWebhookUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Webhook URL copied to clipboard");
  };

  if (webhooks.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Webhook className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No webhooks configured</h3>
          <p className="text-muted-foreground text-center mb-4">
            Create your first webhook endpoint to start receiving real-time events
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {webhooks.map((webhook) => (
        <Card key={webhook._id} className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  webhook.isActive ? "bg-green-500" : "bg-gray-400"
                }`} />
                <div>
                  <CardTitle className="text-lg">{webhook.name}</CardTitle>
                  <CardDescription>{webhook.description}</CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={webhook.isActive ? "default" : "secondary"}>
                  {webhook.isActive ? "Active" : "Inactive"}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onSelect(webhook._id)}>
                      View Logs
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(webhook._id)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => copyWebhookUrl(webhook.url)}>
                      Copy URL
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(webhook._id)}
                      className="text-red-600"
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">URL:</span>
                <div className="flex items-center space-x-2">
                  <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                    {webhook.url}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyWebhookUrl(webhook.url)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Events:</span>
                <div className="flex flex-wrap gap-1">
                  {webhook.events.slice(0, 3).map((event: string) => (
                    <Badge key={event} variant="outline" className="text-xs">
                      {event}
                    </Badge>
                  ))}
                  {webhook.events.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{webhook.events.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last delivery:</span>
                <span className="font-medium">
                  {webhook.lastDeliveryAt 
                    ? new Date(webhook.lastDeliveryAt).toLocaleDateString()
                    : "Never"
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function WebhookLogsList({ 
  logs, 
  webhooks, 
  onSelectWebhook, 
  selectedWebhook 
}: { 
  logs: any[];
  webhooks: any[];
  onSelectWebhook: (id: Id<"webhookEndpoints"> | null) => void;
  selectedWebhook: Id<"webhookEndpoints"> | null;
}) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Select
          value={selectedWebhook || "all"}
          onValueChange={(value) => onSelectWebhook(value === "all" ? null : value as Id<"webhookEndpoints">)}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by webhook" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Webhooks</SelectItem>
            {webhooks.map((webhook) => (
              <SelectItem key={webhook._id} value={webhook._id}>
                {webhook.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Logs</CardTitle>
          <CardDescription>
            View webhook delivery attempts and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No delivery logs found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Webhook</TableHead>
                  <TableHead>Response Code</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(log.status)}
                        <span className="capitalize">{log.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.eventType}</Badge>
                    </TableCell>
                    <TableCell>
                      {webhooks.find(w => w._id === log.webhookId)?.name || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <code className="text-sm">{log.responseStatus || "-"}</code>
                    </TableCell>
                    <TableCell>
                      {new Date(log._creationTime).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {log.duration ? `${log.duration}ms` : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function WebhookTesting({ webhooks }: { webhooks: any[] }) {
  const [selectedWebhook, setSelectedWebhook] = useState<string>("");
  const [testEvent, setTestEvent] = useState("contact.created");
  const [testPayload, setTestPayload] = useState(JSON.stringify({
    event: "contact.created",
    data: {
      id: "contact_123",
      email: "test@example.com",
      firstName: "John",
      lastName: "Doe"
    },
    timestamp: new Date().toISOString()
  }, null, 2));
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const sendTestWebhook = useMutation(api.webhooks.sendTest);

  const handleSendTest = async () => {
    if (!selectedWebhook) {
      toast.error("Please select a webhook endpoint");
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      const payload = JSON.parse(testPayload);
      const result = await sendTestWebhook({
        webhookId: selectedWebhook as Id<"webhookEndpoints">,
        eventType: testEvent,
        payload
      });
      
      setTestResult(result);
      toast.success("Test webhook sent successfully");
    } catch (error) {
      toast.error("Failed to send test webhook");
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Webhook Delivery</CardTitle>
          <CardDescription>
            Send test events to your webhook endpoints to verify they're working correctly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="webhook-select">Webhook Endpoint</Label>
              <Select value={selectedWebhook} onValueChange={setSelectedWebhook}>
                <SelectTrigger>
                  <SelectValue placeholder="Select webhook to test" />
                </SelectTrigger>
                <SelectContent>
                  {webhooks.filter(w => w.isActive).map((webhook) => (
                    <SelectItem key={webhook._id} value={webhook._id}>
                      {webhook.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="event-select">Event Type</Label>
              <Select value={testEvent} onValueChange={setTestEvent}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contact.created">Contact Created</SelectItem>
                  <SelectItem value="contact.updated">Contact Updated</SelectItem>
                  <SelectItem value="contact.deleted">Contact Deleted</SelectItem>
                  <SelectItem value="campaign.sent">Campaign Sent</SelectItem>
                  <SelectItem value="email.opened">Email Opened</SelectItem>
                  <SelectItem value="email.clicked">Email Clicked</SelectItem>
                  <SelectItem value="sync.completed">Sync Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="test-payload">Test Payload (JSON)</Label>
            <Textarea
              id="test-payload"
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              className="font-mono text-sm"
              rows={10}
            />
          </div>

          <Button onClick={handleSendTest} disabled={isLoading || !selectedWebhook}>
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                Send Test Event
              </>
            )}
          </Button>

          {testResult && (
            <Card className={testResult.success ? "border-green-200" : "border-red-200"}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {testResult.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span>Test Result</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-3 rounded text-sm overflow-auto">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function WebhookCreateModal({ 
  isOpen, 
  onClose, 
  integrationId 
}: { 
  isOpen: boolean;
  onClose: () => void;
  integrationId?: Id<"integrations">;
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    url: "",
    secret: "",
    events: [] as string[],
    isActive: true,
  });

  const createWebhook = useMutation(api.webhooks.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createWebhook({
        ...formData,
        integrationId,
      });
      toast.success("Webhook created successfully");
      onClose();
      setFormData({
        name: "",
        description: "",
        url: "",
        secret: "",
        events: [],
        isActive: true,
      });
    } catch (error) {
      toast.error("Failed to create webhook");
    }
  };

  const toggleEvent = (event: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  const availableEvents = [
    { key: "contact.created", label: "Contact Created" },
    { key: "contact.updated", label: "Contact Updated" },
    { key: "contact.deleted", label: "Contact Deleted" },
    { key: "campaign.sent", label: "Campaign Sent" },
    { key: "email.opened", label: "Email Opened" },
    { key: "email.clicked", label: "Email Clicked" },
    { key: "sync.completed", label: "Integration Sync Completed" },
    { key: "sync.failed", label: "Integration Sync Failed" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Webhook Endpoint</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Webhook"
                required
              />
            </div>

            <div>
              <Label htmlFor="url">Webhook URL *</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://api.example.com/webhook"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this webhook is used for"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="secret">Secret Key (Optional)</Label>
            <Input
              id="secret"
              type="password"
              value={formData.secret}
              onChange={(e) => setFormData(prev => ({ ...prev, secret: e.target.value }))}
              placeholder="Used to verify webhook authenticity"
            />
          </div>

          <div>
            <Label>Events to Subscribe</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {availableEvents.map((event) => (
                <div key={event.key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={event.key}
                    checked={formData.events.includes(event.key)}
                    onChange={() => toggleEvent(event.key)}
                    className="rounded"
                  />
                  <Label htmlFor={event.key} className="text-sm">
                    {event.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create Webhook</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function WebhookEditModal({ 
  isOpen, 
  onClose, 
  webhookId 
}: { 
  isOpen: boolean;
  onClose: () => void;
  webhookId: Id<"webhookEndpoints">;
}) {
  // Similar implementation to create modal but for editing
  // Would fetch existing webhook data and populate form
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Webhook</DialogTitle>
        </DialogHeader>
        <p>Edit webhook implementation would go here...</p>
      </DialogContent>
    </Dialog>
  );
}
