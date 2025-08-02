"use client";

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { 
  Mail, 
  Clock, 
  Users, 
  Settings, 
  Plus,
  GitBranch,
  Zap,
  Filter,
  Calendar,
  Target,
  ArrowRight,
  ArrowDown,
  Play,
  Pause,
  Edit,
  Trash2,
  Copy,
  Save,
  Eye
} from 'lucide-react';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'email' | 'delay' | 'condition' | 'action';
  position: { x: number; y: number };
  data: {
    title: string;
    description?: string;
    config: Record<string, any>;
  };
  connections: string[];
}

interface DripCampaign {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  trigger: {
    type: 'signup' | 'purchase' | 'behavior' | 'date' | 'segment';
    config: Record<string, any>;
  };
  nodes: WorkflowNode[];
  settings: {
    timezone: string;
    respectQuietHours: boolean;
    quietHours: { start: string; end: string };
    frequency: 'immediate' | 'daily' | 'weekly';
  };
  stats: {
    subscribers: number;
    sent: number;
    opens: number;
    clicks: number;
    conversions: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const nodeTypes = [
  {
    type: 'trigger',
    label: 'Trigger',
    icon: Zap,
    color: 'bg-green-100 border-green-300 text-green-800',
    description: 'Start point of the workflow'
  },
  {
    type: 'email',
    label: 'Email',
    icon: Mail,
    color: 'bg-blue-100 border-blue-300 text-blue-800',
    description: 'Send an email'
  },
  {
    type: 'delay',
    label: 'Wait',
    icon: Clock,
    color: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    description: 'Add a time delay'
  },
  {
    type: 'condition',
    label: 'Condition',
    icon: GitBranch,
    color: 'bg-purple-100 border-purple-300 text-purple-800',
    description: 'Branch based on conditions'
  },
  {
    type: 'action',
    label: 'Action',
    icon: Target,
    color: 'bg-orange-100 border-orange-300 text-orange-800',
    description: 'Perform an action'
  }
];

export default function DripCampaignBuilder() {
  // Backend queries
  const workflows = useQuery(api.workflows.getUserWorkflows);
  const templates = useQuery(api.templates.getTemplatesByUser);
  const contacts = useQuery(api.contacts.getContactsByUser);
  
  // Mutations
  const createWorkflow = useMutation(api.workflows.createWorkflow);
  const updateWorkflow = useMutation(api.workflows.updateWorkflow);
  const deleteWorkflow = useMutation(api.workflows.deleteWorkflow);

  // Convert backend workflows to DripCampaign format
  const campaigns = React.useMemo(() => {
    if (!workflows) return [];
    
    return workflows
      .filter((w: any) => w.type === 'drip' || w.type === 'email_sequence')
      .map((workflow: any) => ({
        id: workflow._id,
        name: workflow.name,
        description: workflow.description || '',
        status: workflow.status as 'draft' | 'active' | 'paused' | 'completed',
        trigger: {
          type: workflow.triggers?.[0]?.event || 'signup',
          config: workflow.triggers?.[0]?.config || {}
        },
        nodes: workflow.steps?.map((step: any, index: number) => ({
          id: step.id || `step-${index}`,
          type: step.type || 'action',
          position: { x: 100, y: index * 120 + 50 },
          data: {
            title: step.name || `Step ${index + 1}`,
            description: step.description,
            config: step.config || {}
          },
          connections: step.nextSteps || []
        })) || [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 50 },
            data: {
              title: 'Campaign Trigger',
              description: 'When to start this campaign',
              config: {}
            },
            connections: []
          }
        ],
        settings: {
          timezone: workflow.settings?.timezone || 'America/New_York',
          respectQuietHours: workflow.settings?.respectQuietHours || true,
          quietHours: workflow.settings?.quietHours || { start: '22:00', end: '08:00' },
          frequency: workflow.settings?.frequency || 'immediate'
        },
        stats: {
          subscribers: 0, // Would come from executions
          sent: 0,
          opens: 0,
          clicks: 0,
          conversions: 0
        },
        createdAt: new Date(workflow.createdAt),
        updatedAt: new Date(workflow.updatedAt)
      }));
  }, [workflows]);

  const [selectedCampaign, setSelectedCampaign] = useState<DripCampaign | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const openBuilder = (campaign?: DripCampaign) => {
    if (campaign) {
      setSelectedCampaign(campaign);
    } else {
      // Create new campaign
      const newCampaign: DripCampaign = {
        id: 'new-' + Date.now().toString(),
        name: 'New Drip Campaign',
        description: '',
        status: 'draft',
        trigger: {
          type: 'signup',
          config: {}
        },
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 50 },
            data: {
              title: 'Campaign Trigger',
              description: 'When to start this campaign',
              config: { event: 'contact_created' }
            },
            connections: []
          }
        ],
        settings: {
          timezone: 'America/New_York',
          respectQuietHours: true,
          quietHours: { start: '22:00', end: '08:00' },
          frequency: 'immediate'
        },
        stats: {
          subscribers: 0,
          sent: 0,
          opens: 0,
          clicks: 0,
          conversions: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setSelectedCampaign(newCampaign);
    }
    setIsBuilderOpen(true);
  };

  const addNode = (type: string) => {
    if (!selectedCampaign) return;

    const newNode: WorkflowNode = {
      id: `${type}-${Date.now()}`,
      type: type as any,
      position: { x: 100, y: selectedCampaign.nodes.length * 100 + 50 },
      data: {
        title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        config: {}
      },
      connections: []
    };

    setSelectedCampaign({
      ...selectedCampaign,
      nodes: [...selectedCampaign.nodes, newNode]
    });
  };

  const updateNode = (nodeId: string, updates: Partial<WorkflowNode>) => {
    if (!selectedCampaign) return;

    setSelectedCampaign({
      ...selectedCampaign,
      nodes: selectedCampaign.nodes.map(node =>
        node.id === nodeId ? { ...node, ...updates } : node
      )
    });
  };

  const deleteNode = (nodeId: string) => {
    if (!selectedCampaign) return;

    setSelectedCampaign({
      ...selectedCampaign,
      nodes: selectedCampaign.nodes.filter(node => node.id !== nodeId)
    });
  };

  const saveCampaign = async () => {
    if (!selectedCampaign) return;
    
    setIsCreating(true);
    try {
      const workflowData = {
        name: selectedCampaign.name,
        description: selectedCampaign.description,
        trigger: {
          type: 'custom' as const,
          configuration: selectedCampaign.trigger.config
        },
        actions: selectedCampaign.nodes.map((node, index) => ({
          type: 'custom' as const,
          configuration: {
            nodeId: node.id,
            nodeType: node.type,
            title: node.data.title,
            description: node.data.description,
            config: node.data.config,
            nextSteps: node.connections
          },
          order: index
        }))
      };

      if (selectedCampaign.id.startsWith('new-')) {
        // Create new workflow
        await createWorkflow(workflowData);
      } else {
        // Update existing workflow
        await updateWorkflow({
          workflowId: selectedCampaign.id as any as any,
          trigger: workflowData.trigger,
          name: workflowData.name,
          description: workflowData.description,
          actions: workflowData.actions
        });
      }
      
      setIsBuilderOpen(false);
      setSelectedCampaign(null);
    } catch (error) {
      console.error('Failed to save campaign:', error);
    } finally {
      setIsCreating(false);
    }
  };

  if (isBuilderOpen && selectedCampaign) {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => setIsBuilderOpen(false)}>
                ← Back to Campaigns
              </Button>
              <div>
                <h1 className="text-xl font-semibold">{selectedCampaign.name}</h1>
                <p className="text-sm text-gray-500">Visual Workflow Editor</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge 
                variant={selectedCampaign.status === 'active' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {selectedCampaign.status}
              </Badge>
              <Button variant="outline" size="sm">
                <Play className="h-4 w-4 mr-2" />
                Test
              </Button>
              <Button onClick={saveCampaign} disabled={isCreating}>
                <Save className="h-4 w-4 mr-2" />
                {isCreating ? 'Saving...' : 'Save Campaign'}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Canvas Area */}
          <div className="flex-1 p-8">
            <div className="max-w-md mx-auto">
              {/* Campaign Trigger Node */}
              <Card className="border-2 border-blue-300 bg-blue-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-blue-500 rounded-md">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-lg">Campaign Trigger</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    When to start this campaign
                  </p>
                  <div className="p-3 bg-white rounded border">
                    <div className="text-sm font-medium">
                      Event: {selectedCampaign.trigger.type.replace('_', ' ').charAt(0).toUpperCase() + selectedCampaign.trigger.type.slice(1)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Triggers when a new {selectedCampaign.trigger.type} occurs
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Workflow Elements Panel */}
          <div className="w-80 bg-white border-l border-gray-200 p-6">
            <Tabs defaultValue="nodes" className="h-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="nodes">Add Nodes</TabsTrigger>
                <TabsTrigger value="properties">Properties</TabsTrigger>
              </TabsList>

              <TabsContent value="nodes" className="mt-6">
                <div>
                  <h4 className="font-medium mb-4">Workflow Elements</h4>
                  <div className="space-y-3">
                    {nodeTypes.map((nodeType) => {
                      const Icon = nodeType.icon;
                      return (
                        <div
                          key={nodeType.type}
                          className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => addNode(nodeType.type)}
                        >
                          <div className={`p-2 rounded-md ${nodeType.color} text-white mr-3`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{nodeType.label}</div>
                            <div className="text-xs text-gray-500">{nodeType.description}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="properties" className="mt-6">
                <div>
                  <h4 className="font-medium mb-4">Properties</h4>
                  {selectedNode ? (
                    <div className="space-y-4">
                      <div>
                        <Label>Node Title</Label>
                        <Input 
                          value={selectedNode.data.title}
                          onChange={(e) => updateNode(selectedNode.id, {
                            data: { ...selectedNode.data, title: e.target.value }
                          })}
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea 
                          value={selectedNode.data.description || ''}
                          onChange={(e) => updateNode(selectedNode.id, {
                            data: { ...selectedNode.data, description: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      Select a node to edit its properties
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Drip Campaigns</h2>
          <p className="text-muted-foreground">
            Create automated email sequences with visual workflow builder
          </p>
        </div>
        <Button onClick={() => openBuilder()}>
          <Plus className="h-4 w-4 mr-2" />
          Create Drip Campaign
        </Button>
      </div>

      {/* Campaign List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {campaigns.map((campaign: any) => (
          <Card key={campaign.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{campaign.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {campaign.description}
                  </CardDescription>
                </div>
                <Badge 
                  variant={campaign.status === 'active' ? 'default' : 'secondary'}
                  className="ml-2"
                >
                  {campaign.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Trigger:</span>
                  <span className="font-medium capitalize">
                    {campaign.trigger.type.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Steps:</span>
                  <span className="font-medium">{campaign.nodes.length}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {((campaign.stats.opens / campaign.stats.sent) * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Open Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {((campaign.stats.clicks / campaign.stats.sent) * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Click Rate</div>
                  </div>
                </div>

                <div className="flex space-x-2 pt-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => openBuilder(campaign)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Clone
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                  >
                    {campaign.status === 'active' ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {campaigns.length === 0 && (
        <div className="text-center py-12">
          <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No drip campaigns yet</h3>
          <p className="text-gray-500 mb-4">
            Create your first automated email sequence to engage your subscribers.
          </p>
          <Button onClick={() => openBuilder()}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Campaign
          </Button>
        </div>
      )}
    </div>
  );
}
