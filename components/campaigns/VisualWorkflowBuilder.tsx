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
  Copy
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
  const [campaigns, setCampaigns] = useState<DripCampaign[]>([
    {
      id: '1',
      name: 'Welcome Series',
      description: 'Onboard new subscribers with a 5-email sequence',
      status: 'active',
      trigger: {
        type: 'signup',
        config: { source: 'newsletter' }
      },
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          position: { x: 100, y: 50 },
          data: {
            title: 'New Subscriber',
            description: 'Newsletter signup',
            config: { source: 'newsletter' }
          },
          connections: ['email-1']
        },
        {
          id: 'email-1',
          type: 'email',
          position: { x: 100, y: 150 },
          data: {
            title: 'Welcome Email',
            description: 'Introduce your brand',
            config: { template: 'welcome-intro', subject: 'Welcome to our community!' }
          },
          connections: ['delay-1']
        }
      ],
      settings: {
        timezone: 'America/New_York',
        respectQuietHours: true,
        quietHours: { start: '22:00', end: '08:00' },
        frequency: 'immediate'
      },
      stats: {
        subscribers: 1247,
        sent: 1247,
        opens: 856,
        clicks: 234,
        conversions: 89
      },
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20')
    }
  ]);

  const [selectedCampaign, setSelectedCampaign] = useState<DripCampaign | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);

  const openBuilder = (campaign?: DripCampaign) => {
    if (campaign) {
      setSelectedCampaign(campaign);
    } else {
      // Create new campaign
      const newCampaign: DripCampaign = {
        id: Date.now().toString(),
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
              config: {}
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

  const saveCampaign = () => {
    if (!selectedCampaign) return;

    const isNew = !campaigns.find(c => c.id === selectedCampaign.id);
    
    if (isNew) {
      setCampaigns([...campaigns, selectedCampaign]);
    } else {
      setCampaigns(campaigns.map(c => 
        c.id === selectedCampaign.id ? { ...selectedCampaign, updatedAt: new Date() } : c
      ));
    }
    
    setIsBuilderOpen(false);
    setSelectedCampaign(null);
  };

  if (isBuilderOpen && selectedCampaign) {
    return (
      <div className="h-full flex flex-col">
        {/* Builder Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setIsBuilderOpen(false)}
            >
              ← Back to Campaigns
            </Button>
            <div>
              <h2 className="text-xl font-bold">{selectedCampaign.name}</h2>
              <p className="text-sm text-muted-foreground">Visual Workflow Editor</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={selectedCampaign.status === 'active' ? 'default' : 'secondary'}>
              {selectedCampaign.status}
            </Badge>
            <Button variant="outline" size="sm">
              <Play className="h-4 w-4 mr-2" />
              Test
            </Button>
            <Button onClick={saveCampaign}>
              Save Campaign
            </Button>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Workflow Canvas */}
          <div className="flex-1 bg-gray-50 relative overflow-auto">
            <div className="absolute inset-0 p-6">
              <div className="relative h-full">
                {selectedCampaign.nodes.map((node) => {
                  const nodeType = nodeTypes.find(t => t.type === node.type);
                  const Icon = nodeType?.icon || Mail;
                  
                  return (
                    <div
                      key={node.id}
                      className={`absolute w-64 p-4 bg-white border-2 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
                        selectedNode?.id === node.id ? 'ring-2 ring-blue-500' : ''
                      } ${nodeType?.color || 'bg-gray-100 border-gray-300'}`}
                      style={{
                        left: node.position.x,
                        top: node.position.y
                      }}
                      onClick={() => setSelectedNode(node)}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <Icon className="h-5 w-5" />
                        <span className="font-medium text-sm">{node.data.title}</span>
                      </div>
                      {node.data.description && (
                        <p className="text-xs text-muted-foreground mb-2">
                          {node.data.description}
                        </p>
                      )}
                      
                      {/* Node specific content */}
                      {node.type === 'email' && (
                        <div className="text-xs space-y-1">
                          <div>Subject: {node.data.config.subject || 'Not set'}</div>
                          <div>Template: {node.data.config.template || 'Not set'}</div>
                        </div>
                      )}
                      
                      {node.type === 'delay' && (
                        <div className="text-xs">
                          Wait: {node.data.config.duration || '1'} {node.data.config.unit || 'days'}
                        </div>
                      )}
                      
                      {node.type === 'condition' && (
                        <div className="text-xs">
                          If: {node.data.config.condition || 'Not set'}
                        </div>
                      )}

                      {/* Connection points */}
                      {node.connections.length > 0 && (
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                          <ArrowDown className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Properties Panel */}
          <div className="w-80 bg-white border-l">
            <Tabs defaultValue="nodes" className="h-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="nodes">Add Nodes</TabsTrigger>
                <TabsTrigger value="properties">Properties</TabsTrigger>
              </TabsList>

              <TabsContent value="nodes" className="p-4 space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Workflow Elements</h4>
                  <div className="space-y-2">
                    {nodeTypes.map((nodeType) => {
                      const Icon = nodeType.icon;
                      return (
                        <Button
                          key={nodeType.type}
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => addNode(nodeType.type)}
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {nodeType.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Pre-built Sequences</h4>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <Mail className="h-4 w-4 mr-2" />
                      Welcome Series
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <Target className="h-4 w-4 mr-2" />
                      Nurture Sequence
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      Re-engagement
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="properties" className="p-4 space-y-4">
                {selectedNode ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Node Properties</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteNode(selectedNode.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div>
                      <Label htmlFor="node-title">Title</Label>
                      <Input
                        id="node-title"
                        value={selectedNode.data.title}
                        onChange={(e) => updateNode(selectedNode.id, {
                          data: { ...selectedNode.data, title: e.target.value }
                        })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="node-description">Description</Label>
                      <Textarea
                        id="node-description"
                        value={selectedNode.data.description || ''}
                        onChange={(e) => updateNode(selectedNode.id, {
                          data: { ...selectedNode.data, description: e.target.value }
                        })}
                        rows={2}
                      />
                    </div>

                    {/* Node-specific configuration */}
                    {selectedNode.type === 'email' && (
                      <div className="space-y-3">
                        <div>
                          <Label>Email Subject</Label>
                          <Input
                            value={selectedNode.data.config.subject || ''}
                            onChange={(e) => updateNode(selectedNode.id, {
                              data: {
                                ...selectedNode.data,
                                config: { ...selectedNode.data.config, subject: e.target.value }
                              }
                            })}
                            placeholder="Enter email subject"
                          />
                        </div>
                        <div>
                          <Label>Template</Label>
                          <Select
                            value={selectedNode.data.config.template || ''}
                            onValueChange={(value) => updateNode(selectedNode.id, {
                              data: {
                                ...selectedNode.data,
                                config: { ...selectedNode.data.config, template: value }
                              }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select template" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="welcome">Welcome Template</SelectItem>
                              <SelectItem value="promotional">Promotional</SelectItem>
                              <SelectItem value="newsletter">Newsletter</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {selectedNode.type === 'delay' && (
                      <div className="space-y-3">
                        <div>
                          <Label>Duration</Label>
                          <div className="flex space-x-2">
                            <Input
                              type="number"
                              value={selectedNode.data.config.duration || 1}
                              onChange={(e) => updateNode(selectedNode.id, {
                                data: {
                                  ...selectedNode.data,
                                  config: { ...selectedNode.data.config, duration: e.target.value }
                                }
                              })}
                              className="flex-1"
                            />
                            <Select
                              value={selectedNode.data.config.unit || 'days'}
                              onValueChange={(value) => updateNode(selectedNode.id, {
                                data: {
                                  ...selectedNode.data,
                                  config: { ...selectedNode.data.config, unit: value }
                                }
                              })}
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="minutes">Min</SelectItem>
                                <SelectItem value="hours">Hours</SelectItem>
                                <SelectItem value="days">Days</SelectItem>
                                <SelectItem value="weeks">Weeks</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedNode.type === 'condition' && (
                      <div className="space-y-3">
                        <div>
                          <Label>Condition Type</Label>
                          <Select
                            value={selectedNode.data.config.type || ''}
                            onValueChange={(value) => updateNode(selectedNode.id, {
                              data: {
                                ...selectedNode.data,
                                config: { ...selectedNode.data.config, type: value }
                              }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="email_opened">Email Opened</SelectItem>
                              <SelectItem value="link_clicked">Link Clicked</SelectItem>
                              <SelectItem value="tag_added">Tag Added</SelectItem>
                              <SelectItem value="custom_field">Custom Field</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Select a node to edit its properties
                  </div>
                )}
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
        {campaigns.map((campaign) => (
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
    </div>  );
}
