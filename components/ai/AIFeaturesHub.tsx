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
} from 'lucide-react';

interface AIFeaturesHubProps {
  templateId?: Id<'templates'>;
  campaignId?: Id<'campaigns'>;
  defaultTab?: string;
}

export function AIFeaturesHub({
  templateId,
  campaignId,
  defaultTab = 'overview',
}: AIFeaturesHubProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [selectedTemplate, setSelectedTemplate] = useState<Id<'templates'> | undefined>(templateId);
  const [selectedCampaign, setSelectedCampaign] = useState<Id<'campaigns'> | undefined>(campaignId);

  const features = [
    {
      id: 'spam-analysis',
      title: 'Spam Score Analysis',
      description: 'Real-time spam detection and deliverability optimization',
      icon: Shield,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      category: 'Quality',
      status: 'active',
    },
    {
      id: 'content-optimization',
      title: 'Content Optimization',
      description: 'AI-powered suggestions for better engagement',
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      category: 'Performance',
      status: 'active',
    },
    {
      id: 'personalization',
      title: 'Personalization Engine',
      description: 'Dynamic content and behavioral targeting',
      icon: Target,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      category: 'Targeting',
      status: 'active',
    },
    {
      id: 'template-intelligence',
      title: 'Template Intelligence',
      description: 'Performance-based template recommendations',
      icon: Brain,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      category: 'Intelligence',
      status: 'active',
    },
    {
      id: 'content-library',
      title: 'Content Library',
      description: 'Reusable components and AI-generated content',
      icon: Library,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      category: 'Content',
      status: 'active',
    },
    {
      id: 'smart-recommendations',
      title: 'Smart Recommendations',
      description: 'Comprehensive optimization insights',
      icon: Lightbulb,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      category: 'Insights',
      status: 'active',
    },
  ];

  const handleFeatureClick = (featureId: string) => {
    setActiveTab(featureId);
  };

  const handleTemplateSelect = (templateId: Id<'templates'>) => {
    setSelectedTemplate(templateId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Features Hub</h1>
          <p className="text-muted-foreground">
            Comprehensive AI-powered tools for email optimization and automation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Powered
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="spam-analysis">Spam Analysis</TabsTrigger>
          <TabsTrigger value="content-optimization">Optimization</TabsTrigger>
          <TabsTrigger value="personalization">Personalization</TabsTrigger>
          <TabsTrigger value="template-intelligence">Templates</TabsTrigger>
          <TabsTrigger value="content-library">Library</TabsTrigger>
          <TabsTrigger value="smart-recommendations">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <Card 
                  key={feature.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 group"
                  onClick={() => handleFeatureClick(feature.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-lg ${feature.bgColor} group-hover:scale-110 transition-transform`}>
                        <IconComponent className={`h-6 w-6 ${feature.color}`} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {feature.category}
                        </Badge>
                        {feature.status === 'active' && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-lg mb-2 group-hover:text-primary transition-colors">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Quick Stats
              </CardTitle>
              <CardDescription>
                Overview of your AI-powered email optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">94%</div>
                  <div className="text-sm text-muted-foreground">Avg Deliverability</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">67</div>
                  <div className="text-sm text-muted-foreground">Templates Analyzed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">152</div>
                  <div className="text-sm text-muted-foreground">Components Created</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">89%</div>
                  <div className="text-sm text-muted-foreground">Optimization Score</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-medium">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Analyze Your Content</h4>
                    <p className="text-sm text-muted-foreground">
                      Start with the Spam Analysis tool to check deliverability and get improvement suggestions.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-medium">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">Optimize Performance</h4>
                    <p className="text-sm text-muted-foreground">
                      Use Content Optimization to improve subject lines, CTAs, and mobile responsiveness.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-medium">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Personalize Content</h4>
                    <p className="text-sm text-muted-foreground">
                      Leverage the Personalization Engine for dynamic content and behavioral targeting.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-medium">
                    4
                  </div>
                  <div>
                    <h4 className="font-medium">Build Your Library</h4>
                    <p className="text-sm text-muted-foreground">
                      Create reusable components and generate AI content in the Content Library.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spam-analysis">
          <SpamScoreAnalyzer 
            subject="Sample Subject Line"
            content="Sample email content for analysis"
            onScoreUpdate={(score) => console.log('Spam score updated:', score)}
          />
        </TabsContent>

        <TabsContent value="content-optimization">
          <ContentOptimization 
            subject="Sample Subject Line"
            content="Sample email content for optimization"
            onOptimizationUpdate={(data) => console.log('Optimization updated:', data)}
          />
        </TabsContent>

        <TabsContent value="personalization">
          <PersonalizationEngine 
            templateId={selectedTemplate}
            onPersonalizationUpdate={(data) => console.log('Personalization updated:', data)}
          />
        </TabsContent>

        <TabsContent value="template-intelligence">
          <TemplateIntelligence 
            templateId={selectedTemplate}
            onTemplateSelect={handleTemplateSelect}
          />
        </TabsContent>

        <TabsContent value="content-library">
          <ContentLibrary 
            onComponentSelect={(component) => console.log('Component selected:', component)}
          />
        </TabsContent>

        <TabsContent value="smart-recommendations">
          <SmartRecommendations 
            templateId={selectedTemplate}
            campaignId={selectedCampaign}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
