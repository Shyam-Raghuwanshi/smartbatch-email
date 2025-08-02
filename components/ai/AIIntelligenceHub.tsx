"use client";

import { useState } from 'react';
import { Id } from '@/convex/_generated/dataModel';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SpamScoreAnalyzer } from './SpamScoreAnalyzer';
import { ContentOptimization } from './ContentOptimization';
import { PersonalizationEngine } from './PersonalizationEngine';
import { TemplateIntelligence } from './TemplateIntelligence';
import { ContentLibrary } from './ContentLibrary';
import { SmartRecommendations } from './SmartRecommendations';
import {
  Brain,
  Shield,
  Target,
  Library,
  Lightbulb,
  Sparkles,
  BarChart3,
  Zap,
  TrendingUp,
  Users,
  Mail,
  Settings,
  Info,
  CheckCircle,
  Cpu,
  Activity,
  Database,
  Globe,
} from 'lucide-react';

interface AIIntelligenceHubProps {
  templateId?: Id<'templates'>;
  campaignId?: Id<'campaigns'>;
  defaultTab?: string;
}

export function AIIntelligenceHub({
  templateId,
  campaignId,
  defaultTab = 'dashboard',
}: AIIntelligenceHubProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [selectedTemplate, setSelectedTemplate] = useState<Id<'templates'> | undefined>(templateId);
  const [selectedCampaign, setSelectedCampaign] = useState<Id<'campaigns'> | undefined>(campaignId);

  const intelligenceModules = [
    {
      id: 'performance-insights',
      title: 'Performance Intelligence',
      description: 'Advanced analytics and performance optimization insights',
      icon: BarChart3,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      category: 'Analytics',
      status: 'active',
      metrics: { improvement: '+23%', usage: '89%' },
    },
    {
      id: 'content-intelligence',
      title: 'Content Intelligence',
      description: 'AI-driven content analysis and recommendations',
      icon: Brain,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      category: 'Content',
      status: 'active',
      metrics: { improvement: '+34%', usage: '76%' },
    },
    {
      id: 'behavioral-intelligence',
      title: 'Behavioral Intelligence',
      description: 'User behavior analysis and predictive modeling',
      icon: Target,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      category: 'Behavior',
      status: 'active',
      metrics: { improvement: '+45%', usage: '92%' },
    },
    {
      id: 'delivery-intelligence',
      title: 'Delivery Intelligence',
      description: 'Deliverability optimization and inbox placement',
      icon: Mail,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      category: 'Delivery',
      status: 'active',
      metrics: { improvement: '+18%', usage: '95%' },
    },
    {
      id: 'automation-intelligence',
      title: 'Automation Intelligence',
      description: 'Smart workflow automation and trigger optimization',
      icon: Cpu,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50',
      category: 'Automation',
      status: 'active',
      metrics: { improvement: '+67%', usage: '84%' },
    },
    {
      id: 'predictive-intelligence',
      title: 'Predictive Intelligence',
      description: 'Machine learning predictions and trend analysis',
      icon: Activity,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      category: 'Prediction',
      status: 'active',
      metrics: { improvement: '+29%', usage: '71%' },
    },
  ];

  const handleModuleClick = (moduleId: string) => {
    setActiveTab(moduleId);
  };

  const handleTemplateSelect = (templateId: Id<'templates'>) => {
    setSelectedTemplate(templateId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-500" />
            AI Intelligence Hub
          </h1>
          <p className="text-muted-foreground mt-2">
            Advanced AI-powered insights and intelligence for comprehensive email optimization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Intelligence
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Activity className="h-3 w-3 mr-1" />
            Real-time
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="performance-insights">Performance</TabsTrigger>
          <TabsTrigger value="content-intelligence">Content</TabsTrigger>
          <TabsTrigger value="behavioral-intelligence">Behavior</TabsTrigger>
          <TabsTrigger value="delivery-intelligence">Delivery</TabsTrigger>
          <TabsTrigger value="automation-intelligence">Automation</TabsTrigger>
          <TabsTrigger value="predictive-intelligence">Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Intelligence Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {intelligenceModules.map((module) => {
              const IconComponent = module.icon;
              return (
                <Card 
                  key={module.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 group border-l-4 border-l-transparent hover:border-l-primary"
                  onClick={() => handleModuleClick(module.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-lg ${module.bgColor} group-hover:scale-110 transition-transform`}>
                        <IconComponent className={`h-6 w-6 ${module.color}`} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {module.category}
                        </Badge>
                        {module.status === 'active' && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-lg mb-2 group-hover:text-primary transition-colors">
                      {module.title}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed mb-4">
                      {module.description}
                    </CardDescription>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Improvement:</span>
                      <span className="text-green-600 font-medium">{module.metrics.improvement}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-muted-foreground">Usage:</span>
                      <span className="text-blue-600 font-medium">{module.metrics.usage}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Intelligence Metrics Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Intelligence Metrics
                </CardTitle>
                <CardDescription>
                  Real-time AI intelligence performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">96.7%</div>
                    <div className="text-sm text-muted-foreground">AI Accuracy</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">+42%</div>
                    <div className="text-sm text-muted-foreground">Avg Improvement</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">1.2M</div>
                    <div className="text-sm text-muted-foreground">Data Points</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">247ms</div>
                    <div className="text-sm text-muted-foreground">Avg Response</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Health
                </CardTitle>
                <CardDescription>
                  AI intelligence system status and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Machine Learning Models</span>
                    </div>
                    <Badge variant="outline" className="text-green-600">Optimal</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Data Pipeline</span>
                    </div>
                    <Badge variant="outline" className="text-green-600">Healthy</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Predictive Engine</span>
                    </div>
                    <Badge variant="outline" className="text-yellow-600">Training</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Intelligence APIs</span>
                    </div>
                    <Badge variant="outline" className="text-green-600">Online</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Intelligence Actions
              </CardTitle>
              <CardDescription>
                Rapid access to key AI intelligence features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto flex-col p-4 gap-2"
                  onClick={() => setActiveTab('content-intelligence')}
                >
                  <Brain className="h-6 w-6" />
                  <span className="text-sm">Analyze Content</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto flex-col p-4 gap-2"
                  onClick={() => setActiveTab('behavioral-intelligence')}
                >
                  <Target className="h-6 w-6" />
                  <span className="text-sm">Behavior Insights</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto flex-col p-4 gap-2"
                  onClick={() => setActiveTab('predictive-intelligence')}
                >
                  <Activity className="h-6 w-6" />
                  <span className="text-sm">Predictions</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto flex-col p-4 gap-2"
                  onClick={() => setActiveTab('performance-insights')}
                >
                  <BarChart3 className="h-6 w-6" />
                  <span className="text-sm">Performance</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance-insights">
          <Card>
            <CardHeader>
              <CardTitle>Performance Intelligence</CardTitle>
              <CardDescription>
                Advanced analytics and performance optimization insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Performance intelligence module provides deep insights into your email campaign performance,
                  identifying trends, bottlenecks, and optimization opportunities.
                </p>
                <SmartRecommendations 
                  templateId={selectedTemplate}
                  campaignId={selectedCampaign}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content-intelligence">
          <Card>
            <CardHeader>
              <CardTitle>Content Intelligence</CardTitle>
              <CardDescription>
                AI-driven content analysis and optimization recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Content intelligence analyzes your email content using advanced NLP and machine learning
                  to provide actionable insights for better engagement.
                </p>
                <ContentOptimization 
                  subject="Sample Subject Line"
                  content="Sample email content for optimization"
                  onOptimizationUpdate={(data) => console.log('Optimization updated:', data)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavioral-intelligence">
          <Card>
            <CardHeader>
              <CardTitle>Behavioral Intelligence</CardTitle>
              <CardDescription>
                User behavior analysis and predictive modeling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Behavioral intelligence tracks and analyzes user interactions to create detailed
                  behavioral profiles and predict future actions.
                </p>
                <PersonalizationEngine 
                  templateId={selectedTemplate}
                  onPersonalizationUpdate={(data) => console.log('Personalization updated:', data)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery-intelligence">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Intelligence</CardTitle>
              <CardDescription>
                Deliverability optimization and inbox placement analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Delivery intelligence monitors and optimizes email deliverability using advanced
                  spam detection and inbox placement strategies.
                </p>
                <SpamScoreAnalyzer 
                  subject="Sample Subject Line"
                  content="Sample email content for analysis"
                  onScoreUpdate={(score) => console.log('Spam score updated:', score)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation-intelligence">
          <Card>
            <CardHeader>
              <CardTitle>Automation Intelligence</CardTitle>
              <CardDescription>
                Smart workflow automation and trigger optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Automation intelligence optimizes your email workflows using machine learning
                  to determine the best timing, frequency, and triggers for maximum engagement.
                </p>
                <TemplateIntelligence 
                  templateId={selectedTemplate}
                  onTemplateSelect={handleTemplateSelect}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictive-intelligence">
          <Card>
            <CardHeader>
              <CardTitle>Predictive Intelligence</CardTitle>
              <CardDescription>
                Machine learning predictions and trend analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Predictive intelligence uses advanced machine learning models to forecast
                  campaign performance, user behavior, and market trends.
                </p>
                <ContentLibrary 
                  onComponentSelect={(component) => console.log('Component selected:', component)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
