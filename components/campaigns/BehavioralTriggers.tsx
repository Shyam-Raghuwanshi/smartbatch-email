"use client";

import React, { useState } from 'react';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MousePointer,
  Mail,
  ShoppingCart,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  Target,
  Zap,
  Settings,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  BarChart3,
  Globe,
  Link,
  FileText,
  CreditCard,
  Eye,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

// Types for behavioral triggers
export interface BehavioralTrigger {
  id: string;
  name: string;
  description: string;
  type: 'website_activity' | 'email_engagement' | 'purchase_behavior' | 'custom_event';
  isActive: boolean;
  conditions: TriggerCondition[];
  actions: TriggerAction[];
  frequency: 'once' | 'multiple' | 'daily' | 'weekly';
  cooldownPeriod: number; // hours
  priority: number; // 1-10
  statistics: {
    totalTriggers: number;
    totalSent: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  };
  createdAt: number;
  updatedAt: number;
}

export interface TriggerCondition {
  id: string;
  type: 'page_visited' | 'time_on_site' | 'pages_viewed' | 'email_opened' | 'email_clicked' | 'purchase_made' | 'cart_abandoned' | 'form_submitted' | 'custom';
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains' | 'exists' | 'not_exists';
  value: string | number;
  timeWindow?: number; // minutes
  metadata?: Record<string, any>;
}

export interface TriggerAction {
  id: string;
  type: 'send_email' | 'add_tag' | 'remove_tag' | 'update_field' | 'send_webhook' | 'create_task';
  config: Record<string, any>;
  delay: number; // minutes
}

// Pre-built trigger templates
const triggerTemplates = [
  {
    id: 'page_visit_followup',
    name: 'Page Visit Follow-up',
    description: 'Send email when someone visits a specific page',
    type: 'website_activity' as const,
    icon: Globe,
    color: 'bg-blue-500',
    conditions: [
      {
        id: 'condition_1',
        type: 'page_visited' as const,
        operator: 'equals' as const,
        value: '/pricing',
        timeWindow: 60
      }
    ],
    actions: [
      {
        id: 'action_1',
        type: 'send_email' as const,
        config: {
          subject: 'Questions about our pricing?',
          template: 'pricing_followup'
        },
        delay: 30
      }
    ]
  },
  {
    id: 'cart_abandonment',
    name: 'Cart Abandonment',
    description: 'Trigger when cart is abandoned for more than 1 hour',
    type: 'purchase_behavior' as const,
    icon: ShoppingCart,
    color: 'bg-orange-500',
    conditions: [
      {
        id: 'condition_1',
        type: 'cart_abandoned' as const,
        operator: 'greater_than' as const,
        value: 60,
        timeWindow: 1440
      }
    ],
    actions: [
      {
        id: 'action_1',
        type: 'send_email' as const,
        config: {
          subject: 'You left something behind...',
          template: 'cart_abandonment'
        },
        delay: 60
      }
    ]
  },
  {
    id: 'email_engagement',
    name: 'Email Engagement Follow-up',
    description: 'Follow up on email opens without clicks',
    type: 'email_engagement' as const,
    icon: Mail,
    color: 'bg-green-500',
    conditions: [
      {
        id: 'condition_1',
        type: 'email_opened' as const,
        operator: 'equals' as const,
        value: 'true',
        timeWindow: 1440
      },
      {
        id: 'condition_2',
        type: 'email_clicked' as const,
        operator: 'equals' as const,
        value: 'false',
        timeWindow: 1440
      }
    ],
    actions: [
      {
        id: 'action_1',
        type: 'send_email' as const,
        config: {
          subject: 'Did you have any questions?',
          template: 'engagement_followup'
        },
        delay: 1440
      }
    ]
  },
  {
    id: 'high_value_visitor',
    name: 'High-Value Visitor',
    description: 'Engage visitors who spend significant time on site',
    type: 'website_activity' as const,
    icon: TrendingUp,
    color: 'bg-purple-500',
    conditions: [
      {
        id: 'condition_1',
        type: 'time_on_site' as const,
        operator: 'greater_than' as const,
        value: 300, // 5 minutes
        timeWindow: 60
      },
      {
        id: 'condition_2',
        type: 'pages_viewed' as const,
        operator: 'greater_than' as const,
        value: 3,
        timeWindow: 60
      }
    ],
    actions: [
      {
        id: 'action_1',
        type: 'add_tag' as const,
        config: { tag: 'high_intent' },
        delay: 0
      },
      {
        id: 'action_2',
        type: 'send_email' as const,
        config: {
          subject: 'I noticed you\'re interested in our solution',
          template: 'high_intent_visitor'
        },
        delay: 60
      }
    ]
  }
];

interface BehavioralTriggersProps {
  triggers?: BehavioralTrigger[];
  onCreateTrigger: (trigger: Omit<BehavioralTrigger, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateTrigger: (id: string, updates: Partial<BehavioralTrigger>) => void;
  onDeleteTrigger: (id: string) => void;
}

export function BehavioralTriggers({
  triggers = [],
  onCreateTrigger,
  onUpdateTrigger,
  onDeleteTrigger
}: BehavioralTriggersProps) {
  const [activeTab, setActiveTab] = useState<string>('active');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTrigger, setSelectedTrigger] = useState<BehavioralTrigger | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const activeTriggers = triggers.filter(t => t.isActive);
  const inactiveTriggers = triggers.filter(t => !t.isActive);

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'website_activity': return Globe;
      case 'email_engagement': return Mail;
      case 'purchase_behavior': return ShoppingCart;
      case 'custom_event': return Zap;
      default: return Target;
    }
  };

  const getTriggerColor = (type: string) => {
    switch (type) {
      case 'website_activity': return 'bg-blue-500';
      case 'email_engagement': return 'bg-green-500';
      case 'purchase_behavior': return 'bg-orange-500';
      case 'custom_event': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Behavioral Triggers</h2>
          <p className="text-gray-600">
            Automate actions based on customer behavior and engagement patterns
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Trigger
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Triggers</p>
                <p className="text-2xl font-bold">{activeTriggers.length}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Triggered</p>
                <p className="text-2xl font-bold">
                  {triggers.reduce((sum, t) => sum + t.statistics.totalTriggers, 0)}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Emails Sent</p>
                <p className="text-2xl font-bold">
                  {triggers.reduce((sum, t) => sum + t.statistics.totalSent, 0)}
                </p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Mail className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Open Rate</p>
                <p className="text-2xl font-bold">
                  {triggers.length > 0 
                    ? Math.round(triggers.reduce((sum, t) => sum + t.statistics.openRate, 0) / triggers.length)
                    : 0}%
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Triggers Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">
            Active Triggers ({activeTriggers.length})
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Inactive Triggers ({inactiveTriggers.length})
          </TabsTrigger>
          <TabsTrigger value="templates">
            Templates ({triggerTemplates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeTriggers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Zap className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No Active Triggers
                </h3>
                <p className="text-gray-500 text-center mb-4">
                  Create your first behavioral trigger to start automating based on customer actions
                </p>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Trigger
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTriggers.map((trigger) => (
                <TriggerCard
                  key={trigger.id}
                  trigger={trigger}
                  onEdit={() => {
                    setSelectedTrigger(trigger);
                    setIsEditMode(true);
                  }}
                  onToggle={() => onUpdateTrigger(trigger.id, { isActive: !trigger.isActive })}
                  onDelete={() => onDeleteTrigger(trigger.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          {inactiveTriggers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Pause className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No Inactive Triggers
                </h3>
                <p className="text-gray-500 text-center">
                  All your triggers are currently active and working
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inactiveTriggers.map((trigger) => (
                <TriggerCard
                  key={trigger.id}
                  trigger={trigger}
                  onEdit={() => {
                    setSelectedTrigger(trigger);
                    setIsEditMode(true);
                  }}
                  onToggle={() => onUpdateTrigger(trigger.id, { isActive: !trigger.isActive })}
                  onDelete={() => onDeleteTrigger(trigger.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {triggerTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onUse={() => {
                  const newTrigger: Omit<BehavioralTrigger, 'id' | 'createdAt' | 'updatedAt'> = {
                    name: template.name,
                    description: template.description,
                    type: template.type,
                    isActive: false, // Start as inactive
                    conditions: template.conditions,
                    actions: template.actions,
                    frequency: 'once',
                    cooldownPeriod: 24,
                    priority: 5,
                    statistics: {
                      totalTriggers: 0,
                      totalSent: 0,
                      openRate: 0,
                      clickRate: 0,
                      conversionRate: 0
                    }
                  };
                  onCreateTrigger(newTrigger);
                }}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Trigger Modal */}
      <Dialog open={isCreateModalOpen || isEditMode} onOpenChange={(open) => {
        if (!open) {
          setIsCreateModalOpen(false);
          setIsEditMode(false);
          setSelectedTrigger(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Edit Trigger' : 'Create New Trigger'}
            </DialogTitle>
            <DialogDescription>
              Set up behavioral triggers to automate actions based on customer behavior
            </DialogDescription>
          </DialogHeader>
          
          <TriggerBuilder
            initialTrigger={selectedTrigger}
            onSave={(trigger) => {
              if (isEditMode && selectedTrigger) {
                onUpdateTrigger(selectedTrigger.id, trigger);
              } else {
                onCreateTrigger(trigger);
              }
              setIsCreateModalOpen(false);
              setIsEditMode(false);
              setSelectedTrigger(null);
            }}
            onCancel={() => {
              setIsCreateModalOpen(false);
              setIsEditMode(false);
              setSelectedTrigger(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Trigger Card Component
interface TriggerCardProps {
  trigger: BehavioralTrigger;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}

function TriggerCard({ trigger, onEdit, onToggle, onDelete }: TriggerCardProps) {
  const Icon = getTriggerIcon(trigger.type);
  const colorClass = getTriggerColor(trigger.type);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-lg ${colorClass} text-white`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-1">
            <Badge variant={trigger.isActive ? "default" : "secondary"}>
              {trigger.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Priority {trigger.priority}
            </Badge>
          </div>
        </div>
        <CardTitle className="text-lg">{trigger.name}</CardTitle>
        <CardDescription className="text-sm">
          {trigger.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-semibold text-gray-900">{trigger.statistics.totalTriggers}</div>
            <div className="text-gray-600">Triggered</div>
          </div>
          <div>
            <div className="font-semibold text-gray-900">{trigger.statistics.totalSent}</div>
            <div className="text-gray-600">Emails Sent</div>
          </div>
          <div>
            <div className="font-semibold text-green-600">{trigger.statistics.openRate}%</div>
            <div className="text-gray-600">Open Rate</div>
          </div>
          <div>
            <div className="font-semibold text-blue-600">{trigger.statistics.clickRate}%</div>
            <div className="text-gray-600">Click Rate</div>
          </div>
        </div>

        {/* Conditions Summary */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="font-medium text-sm mb-2">Conditions:</h4>
          <div className="text-xs text-gray-600">
            {trigger.conditions.length} condition{trigger.conditions.length !== 1 ? 's' : ''} configured
          </div>
        </div>

        {/* Actions Summary */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="font-medium text-sm mb-2">Actions:</h4>
          <div className="text-xs text-gray-600">
            {trigger.actions.length} action{trigger.actions.length !== 1 ? 's' : ''} configured
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggle}
            className={`flex-1 ${trigger.isActive ? 'text-orange-600' : 'text-green-600'}`}
          >
            {trigger.isActive ? (
              <>
                <Pause className="h-3 w-3 mr-1" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-3 w-3 mr-1" />
                Activate
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete} className="text-red-600">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Template Card Component
interface TemplateCardProps {
  template: any;
  onUse: () => void;
}

function TemplateCard({ template, onUse }: TemplateCardProps) {
  const Icon = template.icon;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className={`p-2 rounded-lg ${template.color} text-white w-fit`}>
          <Icon className="h-5 w-5" />
        </div>
        <CardTitle className="text-lg">{template.name}</CardTitle>
        <CardDescription className="text-sm">
          {template.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-600 space-y-1">
            <div>• {template.conditions.length} condition{template.conditions.length !== 1 ? 's' : ''}</div>
            <div>• {template.actions.length} action{template.actions.length !== 1 ? 's' : ''}</div>
            <div>• Type: {template.type.replace('_', ' ')}</div>
          </div>
        </div>

        <Button onClick={onUse} className="w-full">
          <Play className="h-4 w-4 mr-2" />
          Use Template
        </Button>
      </CardContent>
    </Card>
  );
}

// Trigger Builder Component
interface TriggerBuilderProps {
  initialTrigger?: BehavioralTrigger | null;
  onSave: (trigger: Omit<BehavioralTrigger, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

function TriggerBuilder({ initialTrigger, onSave, onCancel }: TriggerBuilderProps) {
  const [trigger, setTrigger] = useState<Omit<BehavioralTrigger, 'id' | 'createdAt' | 'updatedAt'>>({
    name: initialTrigger?.name || '',
    description: initialTrigger?.description || '',
    type: initialTrigger?.type || 'website_activity',
    isActive: initialTrigger?.isActive || false,
    conditions: initialTrigger?.conditions || [],
    actions: initialTrigger?.actions || [],
    frequency: initialTrigger?.frequency || 'once',
    cooldownPeriod: initialTrigger?.cooldownPeriod || 24,
    priority: initialTrigger?.priority || 5,
    statistics: initialTrigger?.statistics || {
      totalTriggers: 0,
      totalSent: 0,
      openRate: 0,
      clickRate: 0,
      conversionRate: 0
    }
  });

  const handleSave = () => {
    if (!trigger.name || trigger.conditions.length === 0 || trigger.actions.length === 0) {
      alert('Please fill in all required fields');
      return;
    }
    onSave(trigger);
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="trigger-name">Trigger Name*</Label>
          <Input
            id="trigger-name"
            value={trigger.name}
            onChange={(e) => setTrigger(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter trigger name"
          />
        </div>
        
        <div>
          <Label htmlFor="trigger-description">Description</Label>
          <Textarea
            id="trigger-description"
            value={trigger.description}
            onChange={(e) => setTrigger(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe what this trigger does"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Trigger Type</Label>
            <Select
              value={trigger.type}
              onValueChange={(value) => setTrigger(prev => ({ ...prev, type: value as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="website_activity">Website Activity</SelectItem>
                <SelectItem value="email_engagement">Email Engagement</SelectItem>
                <SelectItem value="purchase_behavior">Purchase Behavior</SelectItem>
                <SelectItem value="custom_event">Custom Event</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Frequency</Label>
            <Select
              value={trigger.frequency}
              onValueChange={(value) => setTrigger(prev => ({ ...prev, frequency: value as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once">Once per contact</SelectItem>
                <SelectItem value="multiple">Multiple times</SelectItem>
                <SelectItem value="daily">Once per day</SelectItem>
                <SelectItem value="weekly">Once per week</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Priority (1-10)</Label>
            <Slider
              value={[trigger.priority]}
              onValueChange={(value) => setTrigger(prev => ({ ...prev, priority: value[0] }))}
              min={1}
              max={10}
              step={1}
              className="mt-2"
            />
            <div className="text-sm text-gray-600 mt-1">Current: {trigger.priority}</div>
          </div>
          
          <div>
            <Label>Cooldown Period (hours)</Label>
            <Input
              type="number"
              min="0"
              value={trigger.cooldownPeriod}
              onChange={(e) => setTrigger(prev => ({ ...prev, cooldownPeriod: parseInt(e.target.value) || 0 }))}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="is-active">Activate trigger immediately</Label>
          <Switch
            id="is-active"
            checked={trigger.isActive}
            onCheckedChange={(checked) => setTrigger(prev => ({ ...prev, isActive: checked }))}
          />
        </div>
      </div>

      <Separator />

      {/* Conditions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Conditions</h3>
          <Button
            onClick={() => {
              const newCondition: TriggerCondition = {
                id: `condition_${Date.now()}`,
                type: 'page_visited',
                operator: 'equals',
                value: '',
                timeWindow: 60
              };
              setTrigger(prev => ({
                ...prev,
                conditions: [...prev.conditions, newCondition]
              }));
            }}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Condition
          </Button>
        </div>

        {trigger.conditions.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Add at least one condition to define when this trigger should fire
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {trigger.conditions.map((condition, index) => (
              <ConditionBuilder
                key={condition.id}
                condition={condition}
                onChange={(updates) => {
                  setTrigger(prev => ({
                    ...prev,
                    conditions: prev.conditions.map(c => 
                      c.id === condition.id ? { ...c, ...updates } : c
                    )
                  }));
                }}
                onRemove={() => {
                  setTrigger(prev => ({
                    ...prev,
                    conditions: prev.conditions.filter(c => c.id !== condition.id)
                  }));
                }}
              />
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Actions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Actions</h3>
          <Button
            onClick={() => {
              const newAction: TriggerAction = {
                id: `action_${Date.now()}`,
                type: 'send_email',
                config: {},
                delay: 0
              };
              setTrigger(prev => ({
                ...prev,
                actions: [...prev.actions, newAction]
              }));
            }}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Action
          </Button>
        </div>

        {trigger.actions.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Add at least one action to define what happens when this trigger fires
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {trigger.actions.map((action, index) => (
              <ActionBuilder
                key={action.id}
                action={action}
                onChange={(updates) => {
                  setTrigger(prev => ({
                    ...prev,
                    actions: prev.actions.map(a => 
                      a.id === action.id ? { ...a, ...updates } : a
                    )
                  }));
                }}
                onRemove={() => {
                  setTrigger(prev => ({
                    ...prev,
                    actions: prev.actions.filter(a => a.id !== action.id)
                  }));
                }}
              />
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Footer Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save Trigger
        </Button>
      </div>
    </div>
  );
}

// Condition Builder Component
interface ConditionBuilderProps {
  condition: TriggerCondition;
  onChange: (updates: Partial<TriggerCondition>) => void;
  onRemove: () => void;
}

function ConditionBuilder({ condition, onChange, onRemove }: ConditionBuilderProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-4">
          <h4 className="font-medium">Condition</h4>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Type</Label>
            <Select
              value={condition.type}
              onValueChange={(value) => onChange({ type: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="page_visited">Page Visited</SelectItem>
                <SelectItem value="time_on_site">Time on Site</SelectItem>
                <SelectItem value="pages_viewed">Pages Viewed</SelectItem>
                <SelectItem value="email_opened">Email Opened</SelectItem>
                <SelectItem value="email_clicked">Email Clicked</SelectItem>
                <SelectItem value="purchase_made">Purchase Made</SelectItem>
                <SelectItem value="cart_abandoned">Cart Abandoned</SelectItem>
                <SelectItem value="form_submitted">Form Submitted</SelectItem>
                <SelectItem value="custom">Custom Event</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Operator</Label>
            <Select
              value={condition.operator}
              onValueChange={(value) => onChange({ operator: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equals">Equals</SelectItem>
                <SelectItem value="not_equals">Not Equals</SelectItem>
                <SelectItem value="greater_than">Greater Than</SelectItem>
                <SelectItem value="less_than">Less Than</SelectItem>
                <SelectItem value="contains">Contains</SelectItem>
                <SelectItem value="not_contains">Not Contains</SelectItem>
                <SelectItem value="exists">Exists</SelectItem>
                <SelectItem value="not_exists">Not Exists</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Value</Label>
            <Input
              value={condition.value.toString()}
              onChange={(e) => onChange({ value: e.target.value })}
              placeholder="Enter condition value"
            />
          </div>

          <div>
            <Label>Time Window (minutes)</Label>
            <Input
              type="number"
              min="1"
              value={condition.timeWindow || 60}
              onChange={(e) => onChange({ timeWindow: parseInt(e.target.value) || 60 })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Action Builder Component
interface ActionBuilderProps {
  action: TriggerAction;
  onChange: (updates: Partial<TriggerAction>) => void;
  onRemove: () => void;
}

function ActionBuilder({ action, onChange, onRemove }: ActionBuilderProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-4">
          <h4 className="font-medium">Action</h4>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Action Type</Label>
            <Select
              value={action.type}
              onValueChange={(value) => onChange({ type: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="send_email">Send Email</SelectItem>
                <SelectItem value="add_tag">Add Tag</SelectItem>
                <SelectItem value="remove_tag">Remove Tag</SelectItem>
                <SelectItem value="update_field">Update Field</SelectItem>
                <SelectItem value="send_webhook">Send Webhook</SelectItem>
                <SelectItem value="create_task">Create Task</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Delay (minutes)</Label>
            <Input
              type="number"
              min="0"
              value={action.delay}
              onChange={(e) => onChange({ delay: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        {/* Action-specific configuration */}
        {action.type === 'send_email' && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <Label>Email Subject</Label>
              <Input
                value={action.config.subject || ''}
                onChange={(e) => onChange({ 
                  config: { ...action.config, subject: e.target.value }
                })}
                placeholder="Email subject line"
              />
            </div>
            <div>
              <Label>Template ID</Label>
              <Input
                value={action.config.template || ''}
                onChange={(e) => onChange({ 
                  config: { ...action.config, template: e.target.value }
                })}
                placeholder="Template identifier"
              />
            </div>
          </div>
        )}

        {(action.type === 'add_tag' || action.type === 'remove_tag') && (
          <div className="mt-4">
            <Label>Tag Name</Label>
            <Input
              value={action.config.tag || ''}
              onChange={(e) => onChange({ 
                config: { ...action.config, tag: e.target.value }
              })}
              placeholder="Tag to add/remove"
            />
          </div>
        )}

        {action.type === 'update_field' && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <Label>Field Name</Label>
              <Input
                value={action.config.field || ''}
                onChange={(e) => onChange({ 
                  config: { ...action.config, field: e.target.value }
                })}
                placeholder="Field to update"
              />
            </div>
            <div>
              <Label>Field Value</Label>
              <Input
                value={action.config.value || ''}
                onChange={(e) => onChange({ 
                  config: { ...action.config, value: e.target.value }
                })}
                placeholder="New field value"
              />
            </div>
          </div>
        )}

        {action.type === 'send_webhook' && (
          <div className="mt-4">
            <Label>Webhook URL</Label>
            <Input
              value={action.config.url || ''}
              onChange={(e) => onChange({ 
                config: { ...action.config, url: e.target.value }
              })}
              placeholder="https://your-webhook-url.com"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper functions (moved outside components to avoid recreation)
function getTriggerIcon(type: string) {
  switch (type) {
    case 'website_activity': return Globe;
    case 'email_engagement': return Mail;
    case 'purchase_behavior': return ShoppingCart;
    case 'custom_event': return Zap;
    default: return Target;
  }
}

function getTriggerColor(type: string) {
  switch (type) {
    case 'website_activity': return 'bg-blue-500';
    case 'email_engagement': return 'bg-green-500';
    case 'purchase_behavior': return 'bg-orange-500';
    case 'custom_event': return 'bg-purple-500';
    default: return 'bg-gray-500';
  }
}

export default BehavioralTriggers;
