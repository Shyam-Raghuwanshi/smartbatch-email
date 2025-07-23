"use client";

import React, { useState, useCallback, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mail,
  Clock,
  GitBranch,
  Users,
  Settings,
  Plus,
  Trash2,
  Edit,
  Play,
  Save,
  Eye,
  Calendar,
  Timer,
  ArrowDown,
  ArrowRight,
  Zap,
  AlertCircle,
  Target,
  TrendingUp,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Types for the drip campaign builder
export interface DripCampaignNode {
  id: string;
  type: 'trigger' | 'email' | 'delay' | 'condition' | 'action';
  position: { x: number; y: number };
  data: {
    title: string;
    description?: string;
    config: any;
  };
  connections: string[]; // IDs of connected nodes
}

export interface DripCampaignFlow {
  id: string;
  name: string;
  description: string;
  nodes: DripCampaignNode[];
  triggers: CampaignTrigger[];
  settings: {
    isActive: boolean;
    maxDuration: number; // days
    maxEmailsPerContact: number;
    respectUnsubscribe: boolean;
    timezoneAware: boolean;
    sendingWindow: {
      start: string; // HH:MM
      end: string; // HH:MM
      daysOfWeek: number[]; // 0-6
    };
  };
  goals: CampaignGoal[];
  createdAt: number;
  updatedAt: number;
}

export interface CampaignTrigger {
  id: string;
  type: 'contact_created' | 'tag_added' | 'email_opened' | 'link_clicked' | 'date_based' | 'behavior' | 'custom';
  name: string;
  conditions: any;
  delay: number; // minutes
}

export interface CampaignGoal {
  id: string;
  name: string;
  type: 'email_opened' | 'email_clicked' | 'link_clicked' | 'tag_added' | 'custom_event';
  target: number;
  config: any;
}

// Node templates for the visual editor
const nodeTemplates = {
  trigger: {
    icon: Zap,
    color: 'bg-blue-500',
    title: 'Trigger',
    description: 'Start point for the campaign'
  },
  email: {
    icon: Mail,
    color: 'bg-green-500',
    title: 'Email',
    description: 'Send an email to contacts'
  },
  delay: {
    icon: Clock,
    color: 'bg-yellow-500',
    title: 'Wait',
    description: 'Wait for a specific duration'
  },
  condition: {
    icon: GitBranch,
    color: 'bg-purple-500',
    title: 'Condition',
    description: 'Branch based on conditions'
  },
  action: {
    icon: Settings,
    color: 'bg-orange-500',
    title: 'Action',
    description: 'Perform an action on contact'
  }
};

interface DripCampaignBuilderProps {
  initialFlow?: DripCampaignFlow;
  onSave: (flow: DripCampaignFlow) => void;
  onPreview: (flow: DripCampaignFlow) => void;
}

export function DripCampaignBuilder({ 
  initialFlow, 
  onSave, 
  onPreview 
}: DripCampaignBuilderProps) {
  const [flow, setFlow] = useState<DripCampaignFlow>(initialFlow || {
    id: `flow_${Date.now()}`,
    name: 'New Drip Campaign',
    description: '',
    nodes: [],
    triggers: [],
    settings: {
      isActive: false,
      maxDuration: 30,
      maxEmailsPerContact: 10,
      respectUnsubscribe: true,
      timezoneAware: true,
      sendingWindow: {
        start: '09:00',
        end: '17:00',
        daysOfWeek: [1, 2, 3, 4, 5] // Monday to Friday
      }
    },
    goals: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  const [selectedNode, setSelectedNode] = useState<DripCampaignNode | null>(null);
  const [isEditingNode, setIsEditingNode] = useState(false);
  const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Add new node to the canvas
  const addNode = useCallback((type: keyof typeof nodeTemplates, position: { x: number; y: number }) => {
    const template = nodeTemplates[type];
    const newNode: DripCampaignNode = {
      id: `node_${Date.now()}`,
      type,
      position,
      data: {
        title: template.title,
        description: template.description,
        config: getDefaultConfig(type)
      },
      connections: []
    };

    setFlow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
      updatedAt: Date.now()
    }));
  }, []);

  // Get default configuration for each node type
  const getDefaultConfig = (type: string) => {
    switch (type) {
      case 'trigger':
        return {
          triggerType: 'contact_created',
          conditions: {},
          delay: 0
        };
      case 'email':
        return {
          templateId: null,
          subject: '',
          content: '',
          personalizeFields: [],
          trackOpens: true,
          trackClicks: true
        };
      case 'delay':
        return {
          duration: 24,
          unit: 'hours'
        };
      case 'condition':
        return {
          field: 'tags',
          operator: 'contains',
          value: '',
          trueAction: 'continue',
          falseAction: 'exit'
        };
      case 'action':
        return {
          actionType: 'add_tag',
          tag: '',
          field: '',
          value: ''
        };
      default:
        return {};
    }
  };

  // Update node configuration
  const updateNode = useCallback((nodeId: string, updates: Partial<DripCampaignNode>) => {
    setFlow(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      ),
      updatedAt: Date.now()
    }));
  }, []);

  // Delete node
  const deleteNode = useCallback((nodeId: string) => {
    setFlow(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => node.id !== nodeId),
      updatedAt: Date.now()
    }));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  }, [selectedNode]);

  // Connect nodes
  const connectNodes = useCallback((fromId: string, toId: string) => {
    setFlow(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === fromId 
          ? { ...node, connections: [...node.connections, toId] }
          : node
      ),
      updatedAt: Date.now()
    }));
  }, []);

  // Handle drag and drop for node creation
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedNodeType || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const position = {
      x: e.clientX - rect.left - 100, // Center the node
      y: e.clientY - rect.top - 50
    };

    addNode(draggedNodeType as keyof typeof nodeTemplates, position);
    setDraggedNodeType(null);
  }, [draggedNodeType, addNode]);

  // Save flow
  const handleSave = () => {
    onSave(flow);
  };

  // Preview flow
  const handlePreview = () => {
    onPreview(flow);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar with node palette */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Campaign Builder</h3>
          
          {/* Campaign Settings */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-sm">Campaign Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="campaign-name">Name</Label>
                <Input
                  id="campaign-name"
                  value={flow.name}
                  onChange={(e) => setFlow(prev => ({
                    ...prev,
                    name: e.target.value,
                    updatedAt: Date.now()
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="campaign-description">Description</Label>
                <Textarea
                  id="campaign-description"
                  value={flow.description}
                  onChange={(e) => setFlow(prev => ({
                    ...prev,
                    description: e.target.value,
                    updatedAt: Date.now()
                  }))}
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is-active">Active</Label>
                <Switch
                  id="is-active"
                  checked={flow.settings.isActive}
                  onCheckedChange={(checked) => setFlow(prev => ({
                    ...prev,
                    settings: { ...prev.settings, isActive: checked },
                    updatedAt: Date.now()
                  }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Node Palette */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-sm">Add Elements</CardTitle>
              <CardDescription>
                Drag elements to the canvas to build your campaign flow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(nodeTemplates).map(([type, template]) => {
                  const Icon = template.icon;
                  return (
                    <div
                      key={type}
                      draggable
                      onDragStart={() => setDraggedNodeType(type)}
                      className="flex items-center gap-3 p-3 border rounded-lg cursor-move hover:bg-gray-50 transition-colors"
                    >
                      <div className={`p-2 rounded-lg ${template.color} text-white`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{template.title}</p>
                        <p className="text-xs text-gray-600">{template.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Campaign Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Flow Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Nodes:</span>
                  <Badge variant="outline">{flow.nodes.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Email Steps:</span>
                  <Badge variant="outline">
                    {flow.nodes.filter(n => n.type === 'email').length}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Conditions:</span>
                  <Badge variant="outline">
                    {flow.nodes.filter(n => n.type === 'condition').length}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Max Duration:</span>
                  <Badge variant="outline">{flow.settings.maxDuration} days</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">{flow.name}</h2>
            <Badge variant={flow.settings.isActive ? "default" : "secondary"}>
              {flow.settings.isActive ? "Active" : "Draft"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Campaign
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 relative overflow-auto bg-gray-50"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          style={{
            backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        >
          {flow.nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Zap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Start Building Your Campaign
                </h3>
                <p className="text-gray-500 mb-4">
                  Drag elements from the sidebar to create your automated campaign flow
                </p>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Start by adding a trigger to define when your campaign should start
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          )}

          {/* Render nodes */}
          {flow.nodes.map((node) => {
            const template = nodeTemplates[node.type];
            const Icon = template.icon;
            
            return (
              <div
                key={node.id}
                className={`absolute cursor-pointer ${
                  selectedNode?.id === node.id ? 'ring-2 ring-blue-500' : ''
                }`}
                style={{
                  left: node.position.x,
                  top: node.position.y,
                  transform: 'translate(-50%, -50%)'
                }}
                onClick={() => setSelectedNode(node)}
              >
                <Card className="w-48 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${template.color} text-white`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{node.data.title}</p>
                        <p className="text-xs text-gray-600 truncate">
                          {node.data.description || template.description}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNode(node.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {/* Node specific content preview */}
                    <div className="text-xs text-gray-600">
                      {node.type === 'email' && (
                        <p>Subject: {node.data.config.subject || 'Not set'}</p>
                      )}
                      {node.type === 'delay' && (
                        <p>Wait: {node.data.config.duration} {node.data.config.unit}</p>
                      )}
                      {node.type === 'condition' && (
                        <p>If {node.data.config.field} {node.data.config.operator} {node.data.config.value}</p>
                      )}
                      {node.type === 'action' && (
                        <p>Action: {node.data.config.actionType}</p>
                      )}
                      {node.type === 'trigger' && (
                        <p>Trigger: {node.data.config.triggerType}</p>
                      )}
                    </div>

                    {/* Connections indicator */}
                    {node.connections.length > 0 && (
                      <div className="mt-2 flex items-center gap-1">
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <Badge variant="outline" className="text-xs">
                          {node.connections.length} connection{node.connections.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Connection points */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 w-3 h-3 bg-blue-500 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-crosshair" />
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2 w-3 h-3 bg-green-500 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-crosshair" />
              </div>
            );
          })}

          {/* Render connections */}
          {flow.nodes.map((node) => 
            node.connections.map((connectionId) => {
              const targetNode = flow.nodes.find(n => n.id === connectionId);
              if (!targetNode) return null;

              return (
                <svg
                  key={`${node.id}-${connectionId}`}
                  className="absolute inset-0 pointer-events-none"
                  style={{ zIndex: -1 }}
                >
                  <line
                    x1={node.position.x}
                    y1={node.position.y + 24} // Bottom of source node
                    x2={targetNode.position.x}
                    y2={targetNode.position.y - 24} // Top of target node
                    stroke="#3b82f6"
                    strokeWidth={2}
                    markerEnd="url(#arrowhead)"
                  />
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill="#3b82f6"
                      />
                    </marker>
                  </defs>
                </svg>
              );
            })
          )}
        </div>
      </div>

      {/* Node Configuration Panel */}
      {selectedNode && (
        <NodeConfigurationPanel
          node={selectedNode}
          onUpdate={(updates) => updateNode(selectedNode.id, updates)}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}

// Node Configuration Panel Component
interface NodeConfigurationPanelProps {
  node: DripCampaignNode;
  onUpdate: (updates: Partial<DripCampaignNode>) => void;
  onClose: () => void;
}

function NodeConfigurationPanel({ node, onUpdate, onClose }: NodeConfigurationPanelProps) {
  const updateConfig = (configUpdates: any) => {
    onUpdate({
      data: {
        ...node.data,
        config: { ...node.data.config, ...configUpdates }
      }
    });
  };

  const updateTitle = (title: string) => {
    onUpdate({
      data: { ...node.data, title }
    });
  };

  const updateDescription = (description: string) => {
    onUpdate({
      data: { ...node.data, description }
    });
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Configure Node</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        <div className="space-y-4">
          {/* Basic Info */}
          <div>
            <Label htmlFor="node-title">Title</Label>
            <Input
              id="node-title"
              value={node.data.title}
              onChange={(e) => updateTitle(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="node-description">Description</Label>
            <Textarea
              id="node-description"
              value={node.data.description || ''}
              onChange={(e) => updateDescription(e.target.value)}
              rows={2}
            />
          </div>

          <Separator />

          {/* Type-specific configuration */}
          {node.type === 'trigger' && (
            <TriggerConfiguration config={node.data.config} onChange={updateConfig} />
          )}
          
          {node.type === 'email' && (
            <EmailConfiguration config={node.data.config} onChange={updateConfig} />
          )}
          
          {node.type === 'delay' && (
            <DelayConfiguration config={node.data.config} onChange={updateConfig} />
          )}
          
          {node.type === 'condition' && (
            <ConditionConfiguration config={node.data.config} onChange={updateConfig} />
          )}
          
          {node.type === 'action' && (
            <ActionConfiguration config={node.data.config} onChange={updateConfig} />
          )}
        </div>
      </div>
    </div>
  );
}

// Configuration components for each node type
function TriggerConfiguration({ config, onChange }: { config: any; onChange: (updates: any) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Trigger Type</Label>
        <Select
          value={config.triggerType || 'contact_created'}
          onValueChange={(value) => onChange({ triggerType: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="contact_created">Contact Created</SelectItem>
            <SelectItem value="tag_added">Tag Added</SelectItem>
            <SelectItem value="email_opened">Email Opened</SelectItem>
            <SelectItem value="link_clicked">Link Clicked</SelectItem>
            <SelectItem value="date_based">Date Based</SelectItem>
            <SelectItem value="behavior">Behavior Based</SelectItem>
            <SelectItem value="custom">Custom Event</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Initial Delay (minutes)</Label>
        <Input
          type="number"
          min="0"
          value={config.delay || 0}
          onChange={(e) => onChange({ delay: parseInt(e.target.value) || 0 })}
        />
      </div>
    </div>
  );
}

function EmailConfiguration({ config, onChange }: { config: any; onChange: (updates: any) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Subject Line</Label>
        <Input
          value={config.subject || ''}
          onChange={(e) => onChange({ subject: e.target.value })}
          placeholder="Enter email subject"
        />
      </div>

      <div>
        <Label>Email Content</Label>
        <Textarea
          value={config.content || ''}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder="Enter email content"
          rows={6}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>Track Opens</Label>
        <Switch
          checked={config.trackOpens || false}
          onCheckedChange={(checked) => onChange({ trackOpens: checked })}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>Track Clicks</Label>
        <Switch
          checked={config.trackClicks || false}
          onCheckedChange={(checked) => onChange({ trackClicks: checked })}
        />
      </div>
    </div>
  );
}

function DelayConfiguration({ config, onChange }: { config: any; onChange: (updates: any) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Duration</Label>
        <Input
          type="number"
          min="1"
          value={config.duration || 24}
          onChange={(e) => onChange({ duration: parseInt(e.target.value) || 24 })}
        />
      </div>

      <div>
        <Label>Time Unit</Label>
        <Select
          value={config.unit || 'hours'}
          onValueChange={(value) => onChange({ unit: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="minutes">Minutes</SelectItem>
            <SelectItem value="hours">Hours</SelectItem>
            <SelectItem value="days">Days</SelectItem>
            <SelectItem value="weeks">Weeks</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function ConditionConfiguration({ config, onChange }: { config: any; onChange: (updates: any) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Field to Check</Label>
        <Select
          value={config.field || 'tags'}
          onValueChange={(value) => onChange({ field: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tags">Tags</SelectItem>
            <SelectItem value="email_opened">Email Opened</SelectItem>
            <SelectItem value="email_clicked">Email Clicked</SelectItem>
            <SelectItem value="custom_field">Custom Field</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Operator</Label>
        <Select
          value={config.operator || 'contains'}
          onValueChange={(value) => onChange({ operator: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="contains">Contains</SelectItem>
            <SelectItem value="equals">Equals</SelectItem>
            <SelectItem value="not_contains">Does not contain</SelectItem>
            <SelectItem value="exists">Exists</SelectItem>
            <SelectItem value="not_exists">Does not exist</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Value</Label>
        <Input
          value={config.value || ''}
          onChange={(e) => onChange({ value: e.target.value })}
          placeholder="Enter value to check"
        />
      </div>
    </div>
  );
}

function ActionConfiguration({ config, onChange }: { config: any; onChange: (updates: any) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Action Type</Label>
        <Select
          value={config.actionType || 'add_tag'}
          onValueChange={(value) => onChange({ actionType: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="add_tag">Add Tag</SelectItem>
            <SelectItem value="remove_tag">Remove Tag</SelectItem>
            <SelectItem value="update_field">Update Field</SelectItem>
            <SelectItem value="send_webhook">Send Webhook</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(config.actionType === 'add_tag' || config.actionType === 'remove_tag') && (
        <div>
          <Label>Tag</Label>
          <Input
            value={config.tag || ''}
            onChange={(e) => onChange({ tag: e.target.value })}
            placeholder="Enter tag name"
          />
        </div>
      )}

      {config.actionType === 'update_field' && (
        <>
          <div>
            <Label>Field Name</Label>
            <Input
              value={config.field || ''}
              onChange={(e) => onChange({ field: e.target.value })}
              placeholder="Enter field name"
            />
          </div>
          <div>
            <Label>Field Value</Label>
            <Input
              value={config.value || ''}
              onChange={(e) => onChange({ value: e.target.value })}
              placeholder="Enter field value"
            />
          </div>
        </>
      )}
    </div>
  );
}

export default DripCampaignBuilder;
