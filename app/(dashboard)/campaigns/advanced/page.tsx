"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Settings, 
  Calendar, 
  Users, 
  TrendingUp,
  Zap,
  GitBranch,
  Target,
  Clock,
  Plus
} from 'lucide-react';
import { VisualWorkflowBuilder } from '@/components/campaigns/VisualWorkflowBuilder';
import { AutomatedCampaigns } from '@/components/campaigns/AutomatedCampaigns';
import { BehavioralTriggers } from '@/components/campaigns/BehavioralTriggers';
import { AdvancedScheduling } from '@/components/campaigns/AdvancedScheduling';
import { CampaignTemplates } from '@/components/campaigns/CampaignTemplates';

export default function AdvancedCampaignsPage() {
  const [activeTab, setActiveTab] = useState('drip');

  const tabStats = {
    drip: { count: 8, active: 5 },
    automated: { count: 12, active: 8 },
    behavioral: { count: 6, active: 4 },
    scheduling: { count: 15, active: 10 },
    templates: { count: 25, active: 25 }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Campaigns</h1>
          <p className="text-muted-foreground">
            Create sophisticated automated email sequences with behavioral triggers and advanced scheduling
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drip Campaigns</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tabStats.drip.count}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              {tabStats.drip.active} active
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automated</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tabStats.automated.count}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              {tabStats.automated.active} active
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Behavioral</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tabStats.behavioral.count}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              {tabStats.behavioral.active} active
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tabStats.scheduling.count}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
              {tabStats.scheduling.active} active
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tabStats.templates.count}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-1"></div>
              Available
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="drip" className="flex items-center space-x-2">
            <GitBranch className="h-4 w-4" />
            <span>Drip Builder</span>
            <Badge variant="secondary" className="ml-1">
              {tabStats.drip.count}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="automated" className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>Automated</span>
            <Badge variant="secondary" className="ml-1">
              {tabStats.automated.count}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="behavioral" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Behavioral</span>
            <Badge variant="secondary" className="ml-1">
              {tabStats.behavioral.count}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="scheduling" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Scheduling</span>
            <Badge variant="secondary" className="ml-1">
              {tabStats.scheduling.count}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <span>Templates</span>
            <Badge variant="secondary" className="ml-1">
              {tabStats.templates.count}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="drip">
          <VisualWorkflowBuilder />
        </TabsContent>

        <TabsContent value="automated">
          <AutomatedCampaigns />
        </TabsContent>

        <TabsContent value="behavioral">
          <BehavioralTriggers />
        </TabsContent>

        <TabsContent value="scheduling">
          <AdvancedScheduling />
        </TabsContent>

        <TabsContent value="templates">
          <CampaignTemplates />
        </TabsContent>
      </Tabs>
    </div>
  );
}
