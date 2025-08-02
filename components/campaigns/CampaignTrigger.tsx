"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, 
  Save,
  Eye,
  Play,
  ArrowLeft
} from 'lucide-react';

interface CampaignTriggerProps {
  campaignName?: string;
  onBack?: () => void;
  onSave?: () => void;
  onTest?: () => void;
}

export function CampaignTrigger({ 
  campaignName = "New Drip Campaign",
  onBack,
  onSave,
  onTest 
}: CampaignTriggerProps) {
  const [status, setStatus] = useState<'draft' | 'active' | 'paused'>('draft');

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{campaignName}</h1>
              <p className="text-sm text-gray-500">Visual Workflow Editor</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge 
              variant={status === 'active' ? 'default' : 'secondary'}
              className="capitalize"
            >
              {status}
            </Badge>
            <Button variant="outline" size="sm" onClick={onTest}>
              <Play className="h-4 w-4 mr-2" />
              Test
            </Button>
            <Button onClick={onSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Campaign
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Canvas Area */}
        <div className="flex-1 p-8">
          <div className="max-w-md mx-auto">
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
                <p className="text-sm text-gray-600">
                  When to start this campaign
                </p>
                <div className="mt-4 p-3 bg-white rounded border">
                  <div className="text-sm font-medium">Event: Contact Created</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Triggers when a new contact is added
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
                  {[
                    { type: 'trigger', label: 'Trigger', icon: Zap, color: 'bg-green-500' },
                    { type: 'email', label: 'Email', color: 'bg-blue-500' },
                    { type: 'wait', label: 'Wait', color: 'bg-yellow-500' },
                    { type: 'condition', label: 'Condition', color: 'bg-purple-500' },
                    { type: 'action', label: 'Action', color: 'bg-orange-500' }
                  ].map((element) => {
                    const Icon = element.icon || Zap;
                    return (
                      <div
                        key={element.type}
                        className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className={`p-2 rounded-md ${element.color} text-white mr-3`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{element.label}</div>
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
                <div className="text-sm text-gray-500">
                  Select a node to edit its properties
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
