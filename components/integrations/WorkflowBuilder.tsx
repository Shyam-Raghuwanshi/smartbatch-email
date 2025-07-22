"use client";

import { useState, useCallback } from "react";
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
import { 
  ArrowDown,
  ArrowRight,
  Clock,
  GitBranch,
  Mail,
  MoreHorizontal,
  Play,
  Plus,
  Settings,
  Trash2,
  Users,
  Webhook,
  Zap,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Pause,
  Activity
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface WorkflowNode {
  id: string;
  type: "trigger" | "condition" | "action" | "delay";
  config: Record<string, any>;
  position: { x: number; y: number };
  connections: string[];
}

interface Workflow {
  _id: Id<"workflows">;
  name: string;
  description?: string;
  isActive: boolean;
  trigger: any;
  nodes: WorkflowNode[];
  _creationTime: number;
}

export function WorkflowBuilder() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Id<"workflows"> | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Id<"workflows"> | null>(null);

  const workflows = useQuery(api.workflows.list);
  const workflowExecutions = useQuery(
    api.workflows.getExecutions,
    selectedWorkflow ? { workflowId: selectedWorkflow, limit: 20 } : "skip"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workflow Automation</h2>
          <p className="text-muted-foreground">
            Create automated workflows to trigger actions based on events
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="executions">Execution History</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          <WorkflowsList 
            workflows={workflows || []}
            onEdit={setEditingWorkflow}
            onSelect={setSelectedWorkflow}
          />
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <WorkflowExecutions 
            executions={workflowExecutions || []}
            workflows={workflows || []}
            selectedWorkflow={selectedWorkflow}
            onSelectWorkflow={setSelectedWorkflow}
          />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <WorkflowTemplates onCreateFromTemplate={setIsCreateModalOpen} />
        </TabsContent>
      </Tabs>

      <WorkflowCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {editingWorkflow && (
        <WorkflowEditModal
          isOpen={true}
          onClose={() => setEditingWorkflow(null)}
          workflowId={editingWorkflow}
        />
      )}
    </div>
  );
}

function WorkflowsList({ 
  workflows, 
  onEdit, 
  onSelect 
}: { 
  workflows: Workflow[];
  onEdit: (id: Id<"workflows">) => void;
  onSelect: (id: Id<"workflows">) => void;
}) {
  const deleteWorkflow = useMutation(api.workflows.delete);
  const toggleWorkflow = useMutation(api.workflows.toggleActive);
  const executeWorkflow = useMutation(api.workflows.execute);

  const handleDelete = async (workflowId: Id<"workflows">) => {
    try {
      await deleteWorkflow({ workflowId });
      toast.success("Workflow deleted successfully");
    } catch (error) {
      toast.error("Failed to delete workflow");
    }
  };

  const handleToggle = async (workflowId: Id<"workflows">, isActive: boolean) => {
    try {
      await toggleWorkflow({ workflowId, isActive: !isActive });
      toast.success(`Workflow ${!isActive ? "activated" : "deactivated"} successfully`);
    } catch (error) {
      toast.error("Failed to update workflow status");
    }
  };

  const handleExecute = async (workflowId: Id<"workflows">) => {
    try {
      await executeWorkflow({ workflowId, payload: {} });
      toast.success("Workflow executed successfully");
    } catch (error) {
      toast.error("Failed to execute workflow");
    }
  };

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case "contact_created":
      case "contact_updated":
        return <Users className="h-4 w-4" />;
      case "email_opened":
      case "email_clicked":
        return <Mail className="h-4 w-4" />;
      case "webhook":
        return <Webhook className="h-4 w-4" />;
      case "schedule":
        return <Clock className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  if (workflows.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Zap className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No workflows created</h3>
          <p className="text-muted-foreground text-center mb-4">
            Create your first automated workflow to streamline your email marketing
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {workflows.map((workflow) => (
        <Card key={workflow._id} className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  workflow.isActive ? "bg-green-500" : "bg-gray-400"
                }`} />
                <div>
                  <CardTitle className="text-lg">{workflow.name}</CardTitle>
                  <CardDescription>{workflow.description}</CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={workflow.isActive ? "default" : "secondary"}>
                  {workflow.isActive ? "Active" : "Inactive"}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(workflow._id)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExecute(workflow._id)}>
                      <Play className="h-4 w-4 mr-2" />
                      Test Run
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onSelect(workflow._id)}>
                      <Activity className="h-4 w-4 mr-2" />
                      View Executions
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleToggle(workflow._id, workflow.isActive)}
                    >
                      {workflow.isActive ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(workflow._id)}
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
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Trigger:</span>
                <div className="flex items-center space-x-2">
                  {getTriggerIcon(workflow.trigger.type)}
                  <span className="font-medium">
                    {workflow.trigger.type.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Actions:</span>
                <span className="font-medium">
                  {workflow.nodes?.filter(n => n.type === "action").length || 0} actions
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Created:</span>
                <span className="font-medium">
                  {new Date(workflow._creationTime).toLocaleDateString()}
                </span>
              </div>

              {/* Simple workflow visualization */}
              <div className="border rounded p-3 bg-muted/50">
                <WorkflowVisualization workflow={workflow} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function WorkflowVisualization({ workflow }: { workflow: Workflow }) {
  const nodes = workflow.nodes || [];
  const actionNodes = nodes.filter(n => n.type === "action");
  
  return (
    <div className="flex items-center space-x-2 text-xs">
      <div className="flex items-center space-x-1 bg-blue-100 px-2 py-1 rounded">
        <Zap className="h-3 w-3 text-blue-600" />
        <span className="text-blue-800">Trigger</span>
      </div>
      
      {actionNodes.length > 0 && (
        <>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <div className="flex items-center space-x-1">
            {actionNodes.slice(0, 3).map((node, index) => (
              <div key={index} className="flex items-center space-x-1 bg-green-100 px-2 py-1 rounded">
                <Mail className="h-3 w-3 text-green-600" />
                <span className="text-green-800">Action</span>
              </div>
            ))}
            {actionNodes.length > 3 && (
              <span className="text-muted-foreground">+{actionNodes.length - 3} more</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function WorkflowExecutions({ 
  executions, 
  workflows, 
  selectedWorkflow, 
  onSelectWorkflow 
}: { 
  executions: any[];
  workflows: Workflow[];
  selectedWorkflow: Id<"workflows"> | null;
  onSelectWorkflow: (id: Id<"workflows"> | null) => void;
}) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "running":
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Select
          value={selectedWorkflow || "all"}
          onValueChange={(value) => onSelectWorkflow(value === "all" ? null : value as Id<"workflows">)}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by workflow" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Workflows</SelectItem>
            {workflows.map((workflow) => (
              <SelectItem key={workflow._id} value={workflow._id}>
                {workflow.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {executions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Activity className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No executions found</p>
            </CardContent>
          </Card>
        ) : (
          executions.map((execution) => (
            <Card key={execution._id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(execution.status)}
                    <div>
                      <CardTitle className="text-base">
                        {workflows.find(w => w._id === execution.workflowId)?.name || "Unknown Workflow"}
                      </CardTitle>
                      <CardDescription>
                        Triggered by {execution.trigger.type} • {new Date(execution._creationTime).toLocaleString()}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      execution.status === "completed" ? "default" :
                      execution.status === "failed" ? "destructive" : "secondary"
                    }
                  >
                    {execution.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{execution.duration ? `${execution.duration}ms` : "N/A"}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Steps completed:</span>
                    <span>{execution.completedSteps}/{execution.totalSteps}</span>
                  </div>

                  {execution.error && (
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <div className="flex items-center space-x-2 text-red-700">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-medium">Error</span>
                      </div>
                      <p className="text-sm text-red-600 mt-1">{execution.error}</p>
                    </div>
                  )}

                  {execution.result && (
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <div className="flex items-center space-x-2 text-green-700">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="font-medium">Success</span>
                      </div>
                      <pre className="text-xs text-green-600 mt-1 overflow-auto">
                        {JSON.stringify(execution.result, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function WorkflowTemplates({ 
  onCreateFromTemplate 
}: { 
  onCreateFromTemplate: (open: boolean) => void;
}) {
  const templates = [
    {
      id: "welcome_series",
      name: "Welcome Email Series",
      description: "Send a series of welcome emails to new contacts",
      trigger: "Contact Created",
      actions: ["Send Email", "Wait 2 Days", "Send Email", "Wait 1 Week", "Send Email"],
      icon: <Mail className="h-6 w-6" />,
      color: "bg-blue-500"
    },
    {
      id: "engagement_followup",
      name: "Engagement Follow-up",
      description: "Follow up with contacts who opened but didn't click",
      trigger: "Email Opened",
      actions: ["Check Click Status", "Wait 1 Day", "Send Follow-up"],
      icon: <GitBranch className="h-6 w-6" />,
      color: "bg-green-500"
    },
    {
      id: "reactivation_campaign",
      name: "Re-engagement Campaign",
      description: "Re-engage inactive contacts with special offers",
      trigger: "Schedule",
      actions: ["Find Inactive Contacts", "Send Special Offer", "Track Response"],
      icon: <Clock className="h-6 w-6" />,
      color: "bg-orange-500"
    },
    {
      id: "integration_sync",
      name: "Integration Sync",
      description: "Sync new contacts to external CRM when created",
      trigger: "Contact Created",
      actions: ["Validate Contact", "Sync to CRM", "Send Notification"],
      icon: <Webhook className="h-6 w-6" />,
      color: "bg-purple-500"
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Workflow Templates</h3>
        <p className="text-muted-foreground">
          Get started quickly with pre-built workflow templates
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg text-white ${template.color}`}>
                  {template.icon}
                </div>
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center space-x-2 text-sm mb-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Trigger:</span>
                  <span>{template.trigger}</span>
                </div>
                
                <div className="text-sm">
                  <span className="font-medium text-muted-foreground">Actions:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {template.actions.map((action, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {action}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => onCreateFromTemplate(true)}
                className="w-full"
                variant="outline"
              >
                Use Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function WorkflowCreateModal({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    trigger: {
      type: "",
      config: {}
    },
    nodes: [] as WorkflowNode[],
    isActive: true
  });

  const createWorkflow = useMutation(api.workflows.create);

  const triggerTypes = [
    { 
      value: "contact_created", 
      label: "Contact Created", 
      description: "When a new contact is added",
      icon: <Users className="h-4 w-4" />
    },
    { 
      value: "contact_updated", 
      label: "Contact Updated", 
      description: "When a contact is modified",
      icon: <Users className="h-4 w-4" />
    },
    { 
      value: "email_opened", 
      label: "Email Opened", 
      description: "When a recipient opens an email",
      icon: <Mail className="h-4 w-4" />
    },
    { 
      value: "email_clicked", 
      label: "Email Clicked", 
      description: "When a recipient clicks a link",
      icon: <Mail className="h-4 w-4" />
    },
    { 
      value: "webhook", 
      label: "Webhook", 
      description: "When a webhook is received",
      icon: <Webhook className="h-4 w-4" />
    },
    { 
      value: "schedule", 
      label: "Schedule", 
      description: "At a specific time or interval",
      icon: <Clock className="h-4 w-4" />
    }
  ];

  const actionTypes = [
    { 
      value: "send_email", 
      label: "Send Email", 
      description: "Send an email to contacts",
      icon: <Mail className="h-4 w-4" />
    },
    { 
      value: "add_to_list", 
      label: "Add to List", 
      description: "Add contact to a specific list",
      icon: <Users className="h-4 w-4" />
    },
    { 
      value: "webhook", 
      label: "Send Webhook", 
      description: "Send data to external service",
      icon: <Webhook className="h-4 w-4" />
    },
    { 
      value: "delay", 
      label: "Wait", 
      description: "Wait for a specific duration",
      icon: <Clock className="h-4 w-4" />
    }
  ];

  const handleSubmit = async () => {
    try {
      await createWorkflow({
        name: formData.name,
        description: formData.description,
        trigger: formData.trigger,
        actions: formData.nodes.filter(n => n.type === "action").map(n => n.config),
        isActive: formData.isActive
      });
      
      toast.success("Workflow created successfully");
      onClose();
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        trigger: { type: "", config: {} },
        nodes: [],
        isActive: true
      });
      setStep(0);
    } catch (error) {
      toast.error("Failed to create workflow");
    }
  };

  const addAction = () => {
    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type: "action",
      config: { type: "send_email" },
      position: { x: 0, y: formData.nodes.length * 100 },
      connections: []
    };
    
    setFormData(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }));
  };

  const removeNode = (nodeId: string) => {
    setFormData(prev => ({
      ...prev,
      nodes: prev.nodes.filter(n => n.id !== nodeId)
    }));
  };

  const steps = ["Basic Info", "Trigger", "Actions", "Review"];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Workflow</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center space-x-2">
            {steps.map((stepName, index) => (
              <div key={index} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  index <= step 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-200 text-gray-600"
                }`}>
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    index < step ? "bg-blue-600" : "bg-gray-200"
                  }`} />
                )}
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Step {step + 1} of {steps.length}
            </h3>
            <h2 className="text-lg font-semibold">{steps[step]}</h2>
          </div>

          {/* Step Content */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Workflow Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Welcome Email Series"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this workflow does"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label>Choose Trigger</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {triggerTypes.map((trigger) => (
                    <Card 
                      key={trigger.value}
                      className={`cursor-pointer transition-colors ${
                        formData.trigger.type === trigger.value 
                          ? "border-blue-500 bg-blue-50" 
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        trigger: { type: trigger.value, config: {} }
                      }))}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          {trigger.icon}
                          <div>
                            <h4 className="font-medium">{trigger.label}</h4>
                            <p className="text-sm text-muted-foreground">{trigger.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Actions</Label>
                <Button onClick={addAction} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Action
                </Button>
              </div>

              <div className="space-y-3">
                {formData.nodes.map((node, index) => (
                  <Card key={node.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium">#{index + 1}</span>
                          <Select
                            value={node.config.type || ""}
                            onValueChange={(value) => {
                              const updatedNodes = [...formData.nodes];
                              updatedNodes[index].config.type = value;
                              setFormData(prev => ({ ...prev, nodes: updatedNodes }));
                            }}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Select action" />
                            </SelectTrigger>
                            <SelectContent>
                              {actionTypes.map((action) => (
                                <SelectItem key={action.value} value={action.value}>
                                  <div className="flex items-center space-x-2">
                                    {action.icon}
                                    <span>{action.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          onClick={() => removeNode(node.id)}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {formData.nodes.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No actions added yet. Click "Add Action" to get started.
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Workflow Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Name:</span>
                    <span className="font-medium">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trigger:</span>
                    <span className="font-medium">
                      {triggerTypes.find(t => t.value === formData.trigger.type)?.label || "None"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Actions:</span>
                    <span className="font-medium">{formData.nodes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant={formData.isActive ? "default" : "secondary"}>
                      {formData.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="border rounded p-4 bg-muted/50">
                <h4 className="font-medium mb-2">Workflow Flow</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <span>Trigger: {triggerTypes.find(t => t.value === formData.trigger.type)?.label}</span>
                  </div>
                  {formData.nodes.map((node, index) => (
                    <div key={node.id} className="flex items-center space-x-2 text-sm ml-6">
                      <ArrowDown className="h-3 w-3 text-muted-foreground" />
                      <span>Action {index + 1}: {actionTypes.find(a => a.value === node.config.type)?.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
            >
              Previous
            </Button>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              
              {step === steps.length - 1 ? (
                <Button onClick={handleSubmit}>
                  Create Workflow
                </Button>
              ) : (
                <Button 
                  onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
                  disabled={
                    (step === 0 && !formData.name) ||
                    (step === 1 && !formData.trigger.type)
                  }
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

function WorkflowEditModal({ 
  isOpen, 
  onClose, 
  workflowId 
}: { 
  isOpen: boolean;
  onClose: () => void;
  workflowId: Id<"workflows">;
}) {
  // Similar implementation to create modal but for editing
  // Would fetch existing workflow data and populate form
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Workflow</DialogTitle>
        </DialogHeader>
        <p>Edit workflow implementation would go here...</p>
      </DialogContent>
    </Dialog>
  );
}
