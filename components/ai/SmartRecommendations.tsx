"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Brain,
  Lightbulb,
  TrendingUp,
  Target,
  Zap,
  Star,
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  Users,
  BarChart3,
  Sparkles,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Share,
  Filter,
  Calendar,
  Palette,
  Type,
  MousePointer,
  Shield,
} from 'lucide-react';

interface SmartRecommendationsProps {
  templateId?: Id<'templates'>;
  campaignId?: Id<'campaigns'>;
  context?: 'template' | 'campaign' | 'general';
}

export function SmartRecommendations({
  templateId,
  campaignId,
  context = 'general',
}: SmartRecommendationsProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [timeframe, setTimeframe] = useState<string>('7d');

  // Mutations for getting recommendations from different engines
  const getSpamRecommendations = useMutation(api.contentAnalysis.analyzeSpamScore);
  const getPersonalizationRecommendations = useMutation(api.personalizationEngine.generatePersonalizedContent);
  const getTemplateRecommendations = useMutation(api.templateIntelligence.analyzeTemplatePerformance);
  const getContentRecommendations = useMutation(api.contentLibrary.getComponents);

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [priorityScore, setPriorityScore] = useState<number>(0);
  const [implementationPlan, setImplementationPlan] = useState<any[]>([]);
  const [savedRecommendations, setSavedRecommendations] = useState<string[]>([]);

  useEffect(() => {
    if (templateId || campaignId) {
      handleGetRecommendations();
    }
  }, [templateId, campaignId, context]);

  const handleGetRecommendations = async () => {
    setIsAnalyzing(true);
    try {
      const allRecommendations: any[] = [];

      // Get spam score recommendations
      if (templateId) {
        try {
          const spamResult = await getSpamRecommendations({ 
            subject: "Sample Subject Line",
            content: "Sample content for analysis"
          });
          if (spamResult.suggestions) {
            spamResult.suggestions.forEach((suggestion: string, index: number) => {
              allRecommendations.push({
                id: `spam-${Date.now()}-${index}`,
                category: 'spam',
                type: 'critical',
                title: 'Spam Score Improvement',
                description: suggestion,
                priority: 'high',
                estimatedImpact: 'high',
                timeToImplement: '5-15 minutes',
                source: 'Spam Analysis',
                icon: Shield,
              });
            });
          }
        } catch (error) {
          console.error('Error getting spam recommendations:', error);
        }

        // Get personalization recommendations
        try {
          // This is a placeholder since we need actual contact data
          // In a real implementation, we'd get the template content and pass a real contact ID
          const personalizationRecommendations = [
            {
              id: `personalization-1`,
              category: 'personalization',
              type: 'suggestion',
              title: 'Add Dynamic Personalization',
              description: 'Include personalized greetings and dynamic content based on user behavior.',
              priority: 'medium',
              estimatedImpact: 'high',
              timeToImplement: '10-30 minutes',
              source: 'Personalization Engine',
              icon: Target,
            },
            {
              id: `personalization-2`,
              category: 'personalization',
              type: 'suggestion',
              title: 'Segment-Based Content',
              description: 'Customize content based on audience segments and engagement patterns.',
              priority: 'medium',
              estimatedImpact: 'medium',
              timeToImplement: '15-45 minutes',
              source: 'Personalization Engine',
              icon: Target,
            }
          ];
          allRecommendations.push(...personalizationRecommendations);
        } catch (error) {
          console.error('Error getting personalization recommendations:', error);
        }

        // Get template intelligence recommendations
        try {
          const templateResult = await getTemplateRecommendations({ templateId });
          if (templateResult.recommendations) {
            templateResult.recommendations.forEach((suggestion: any) => {
              allRecommendations.push({
                id: `template-${Date.now()}-${Math.random()}`,
                category: 'template',
                type: 'optimization',
                title: suggestion.title || 'Template Optimization',
                description: suggestion.description || 'Optimize template based on performance data',
                priority: suggestion.priority || 'medium',
                estimatedImpact: suggestion.expectedImpact || 'medium',
                timeToImplement: '15-45 minutes',
                source: 'Template Intelligence',
                icon: Brain,
              });
            });
          }
        } catch (error) {
          console.error('Error getting template recommendations:', error);
        }
      }

      // Add some general best practices recommendations
      const generalRecommendations = [
        {
          id: 'general-1',
          category: 'design',
          type: 'best-practice',
          title: 'Optimize for Mobile',
          description: 'Ensure your email renders perfectly on mobile devices with responsive design principles.',
          priority: 'high',
          estimatedImpact: 'high',
          timeToImplement: '30-60 minutes',
          source: 'Best Practices',
          icon: Palette,
        },
        {
          id: 'general-2',
          category: 'content',
          type: 'optimization',
          title: 'A/B Test Subject Lines',
          description: 'Test different subject line variations to improve open rates.',
          priority: 'medium',
          estimatedImpact: 'high',
          timeToImplement: '15-30 minutes',
          source: 'Best Practices',
          icon: Type,
        },
        {
          id: 'general-3',
          category: 'cta',
          type: 'optimization',
          title: 'Improve CTA Placement',
          description: 'Position your primary CTA above the fold and use contrasting colors.',
          priority: 'medium',
          estimatedImpact: 'medium',
          timeToImplement: '10-20 minutes',
          source: 'Best Practices',
          icon: MousePointer,
        },
      ];

      allRecommendations.push(...generalRecommendations);

      // Sort by priority and impact
      const sortedRecommendations = allRecommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const impactOrder = { high: 3, medium: 2, low: 1 };
        
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
        const aImpact = impactOrder[a.estimatedImpact as keyof typeof impactOrder] || 1;
        const bImpact = impactOrder[b.estimatedImpact as keyof typeof impactOrder] || 1;
        
        return (bPriority + bImpact) - (aPriority + aImpact);
      });

      setRecommendations(sortedRecommendations);
      
      // Calculate priority score based on recommendations
      const highPriorityCount = sortedRecommendations.filter(r => r.priority === 'high').length;
      const totalCount = sortedRecommendations.length;
      const score = Math.max(0, 100 - (highPriorityCount / totalCount) * 100);
      setPriorityScore(Math.round(score));

      // Generate implementation plan
      const plan = sortedRecommendations.slice(0, 5).map((rec, index) => ({
        step: index + 1,
        title: rec.title,
        category: rec.category,
        timeEstimate: rec.timeToImplement,
        priority: rec.priority,
      }));
      setImplementationPlan(plan);

    } catch (error) {
      console.error('Error getting recommendations:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveRecommendation = (recommendationId: string) => {
    setSavedRecommendations(prev => 
      prev.includes(recommendationId) 
        ? prev.filter(id => id !== recommendationId)
        : [...prev, recommendationId]
    );
  };

  const getRecommendationIcon = (category: string, IconComponent?: any) => {
    if (IconComponent) return <IconComponent className="h-4 w-4" />;
    
    switch (category) {
      case 'spam': return <Shield className="h-4 w-4" />;
      case 'personalization': return <Target className="h-4 w-4" />;
      case 'template': return <Brain className="h-4 w-4" />;
      case 'design': return <Palette className="h-4 w-4" />;
      case 'content': return <Type className="h-4 w-4" />;
      case 'cta': return <MousePointer className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const filteredRecommendations = selectedCategory === 'all' 
    ? recommendations 
    : recommendations.filter(rec => rec.category === selectedCategory);

  const categories = ['all', 'spam', 'personalization', 'template', 'design', 'content', 'cta'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Smart Recommendations</h2>
          <p className="text-muted-foreground">
            AI-powered insights and optimization suggestions
          </p>
        </div>
        <Button onClick={handleGetRecommendations} disabled={isAnalyzing}>
          {isAnalyzing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" />
              Refresh Analysis
            </>
          )}
        </Button>
      </div>

      {priorityScore > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Optimization Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Health</span>
                <Badge variant={priorityScore >= 80 ? 'default' : priorityScore >= 60 ? 'secondary' : 'destructive'}>
                  {priorityScore}/100
                </Badge>
              </div>
              <Progress value={priorityScore} className="w-full" />
              <p className="text-sm text-muted-foreground">
                {priorityScore >= 80 
                  ? "Excellent! Your content is well-optimized." 
                  : priorityScore >= 60 
                  ? "Good optimization with room for improvement." 
                  : "Multiple optimization opportunities identified."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="recommendations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="plan">Implementation Plan</TabsTrigger>
          <TabsTrigger value="saved">Saved Items</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Smart Recommendations
              </CardTitle>
              <CardDescription>
                Prioritized suggestions to improve your email performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map((category) => (
                  <Badge
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </Badge>
                ))}
              </div>

              <div className="space-y-3">
                {filteredRecommendations.map((recommendation) => (
                  <Card key={recommendation.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-muted rounded-lg">
                          {getRecommendationIcon(recommendation.category, recommendation.icon)}
                        </div>
                        
                        <div className="space-y-2 flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{recommendation.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {recommendation.description}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2 ml-4">
                              <Badge variant={getPriorityBadgeVariant(recommendation.priority)}>
                                {recommendation.priority}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSaveRecommendation(recommendation.id)}
                              >
                                <Bookmark 
                                  className={`h-4 w-4 ${
                                    savedRecommendations.includes(recommendation.id) 
                                      ? 'fill-current' 
                                      : ''
                                  }`} 
                                />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{recommendation.timeToImplement}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              <span>Impact: {recommendation.estimatedImpact}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-xs">
                                {recommendation.source}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {filteredRecommendations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {isAnalyzing ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2"></div>
                        <span>Analyzing your content for recommendations...</span>
                      </div>
                    ) : (
                      <div>
                        <Lightbulb className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No recommendations available for the selected category.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Implementation Plan
              </CardTitle>
              <CardDescription>
                Step-by-step guide to implement top recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {implementationPlan.length > 0 ? (
                <div className="space-y-4">
                  {implementationPlan.map((step, index) => (
                    <div key={step.step} className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                        {step.step}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{step.title}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {step.category}
                            </Badge>
                            <Badge variant={getPriorityBadgeVariant(step.priority)}>
                              {step.priority}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{step.timeEstimate}</span>
                        </div>
                      </div>
                      
                      {index < implementationPlan.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Total estimated time:
                    </span>
                    <Badge variant="outline">
                      {implementationPlan.reduce((total, step) => {
                        const time = step.timeEstimate.match(/\d+/);
                        return total + (time ? parseInt(time[0]) : 0);
                      }, 0)} minutes
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Generate recommendations first to see your implementation plan.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bookmark className="h-5 w-5" />
                Saved Recommendations
              </CardTitle>
              <CardDescription>
                Recommendations you've bookmarked for later implementation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {savedRecommendations.length > 0 ? (
                <div className="space-y-3">
                  {recommendations
                    .filter(rec => savedRecommendations.includes(rec.id))
                    .map((recommendation) => (
                      <Card key={recommendation.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-muted rounded-lg">
                              {getRecommendationIcon(recommendation.category, recommendation.icon)}
                            </div>
                            <div>
                              <h4 className="font-medium">{recommendation.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {recommendation.description}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSaveRecommendation(recommendation.id)}
                          >
                            <Bookmark className="h-4 w-4 fill-current" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bookmark className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No saved recommendations yet. Bookmark items from the recommendations tab.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
