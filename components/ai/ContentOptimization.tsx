"use client";

import React, { useState, useEffect } from 'react';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Target, 
  TrendingUp, 
  Smartphone, 
  MousePointer, 
  Clock,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Zap,
  BarChart3,
  Eye,
  Users
} from 'lucide-react';

interface ContentOptimizationProps {
  subject: string;
  content: string;
  onOptimizationUpdate?: (score: number, recommendations: any[]) => void;
}

export function ContentOptimization({ 
  subject, 
  content, 
  onOptimizationUpdate 
}: ContentOptimizationProps) {
  const [optimization, setOptimization] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [targetAudience, setTargetAudience] = useState('');
  const [campaignType, setCampaignType] = useState('');

  const getContentOptimization = useAction(api.contentAnalysis.getContentOptimization);

  const handleAnalyze = async () => {
    if (!subject && !content) return;

    setIsAnalyzing(true);
    try {
      const result = await getContentOptimization({
        subject: subject || '',
        content: content || '',
        targetAudience: targetAudience || undefined,
        campaignType: campaignType || undefined
      });

      setOptimization(result);
      onOptimizationUpdate?.(result.overallScore, result.priorityRecommendations);
    } catch (error) {
      console.error('Error analyzing content optimization:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (subject || content) {
      handleAnalyze();
    }
  }, [subject, content, targetAudience, campaignType]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'High': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'Medium': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'Low': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            <CardTitle>Content Optimization</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Zap className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4 mr-2" />
                Optimize
              </>
            )}
          </Button>
        </div>
        <CardDescription>
          AI-powered optimization suggestions for better email performance
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Configuration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="audience">Target Audience</Label>
            <Input
              id="audience"
              placeholder="e.g., Business professionals"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="campaign-type">Campaign Type</Label>
            <Select value={campaignType} onValueChange={setCampaignType}>
              <SelectTrigger>
                <SelectValue placeholder="Select campaign type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newsletter">Newsletter</SelectItem>
                <SelectItem value="promotional">Promotional</SelectItem>
                <SelectItem value="welcome">Welcome</SelectItem>
                <SelectItem value="transactional">Transactional</SelectItem>
                <SelectItem value="educational">Educational</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {optimization ? (
          <>
            {/* Overall Score */}
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(optimization.overallScore)}`}>
                {optimization.overallScore}/100
              </div>
              <Badge className={getScoreBadge(optimization.overallScore)}>
                Optimization Score
              </Badge>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                <TabsTrigger value="abtest">A/B Test Ideas</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {/* Quick Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Eye className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                      <div className={`text-2xl font-bold ${getScoreColor(optimization.optimizations.subjectLine.score)}`}>
                        {optimization.optimizations.subjectLine.score}
                      </div>
                      <div className="text-sm text-gray-600">Subject Line</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <MousePointer className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <div className={`text-2xl font-bold ${getScoreColor(optimization.optimizations.ctaPlacement.score)}`}>
                        {optimization.optimizations.ctaPlacement.score}
                      </div>
                      <div className="text-sm text-gray-600">CTA Placement</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <Smartphone className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                      <div className={`text-2xl font-bold ${getScoreColor(optimization.optimizations.mobileOptimization.score)}`}>
                        {optimization.optimizations.mobileOptimization.score}
                      </div>
                      <div className="text-sm text-gray-600">Mobile</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <Users className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                      <div className={`text-2xl font-bold ${getScoreColor(optimization.optimizations.personalization.score)}`}>
                        {optimization.optimizations.personalization.score}
                      </div>
                      <div className="text-sm text-gray-600">Personal</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Priority Recommendations */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Priority Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {optimization.priorityRecommendations.slice(0, 3).map((rec: any, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                        {getPriorityIcon(rec.priority)}
                        <div className="flex-1">
                          <div className="font-medium text-sm">{rec.suggestion}</div>
                          <div className="text-xs text-gray-600 mt-1">{rec.impact}</div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {rec.priority}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="detailed" className="space-y-4">
                {/* Subject Line Analysis */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Subject Line Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-3">
                      <span>Score</span>
                      <Badge className={getScoreBadge(optimization.optimizations.subjectLine.score)}>
                        {optimization.optimizations.subjectLine.score}/100
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {optimization.optimizations.subjectLine.suggestions.map((suggestion: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span>{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Email Length Analysis */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Email Length Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-3">
                      <span>Word Count: {optimization.optimizations.emailLength.wordCount}</span>
                      <Badge className={getScoreBadge(optimization.optimizations.emailLength.score)}>
                        {optimization.optimizations.emailLength.score}/100
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {optimization.optimizations.emailLength.suggestions.map((suggestion: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span>{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* CTA Analysis */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MousePointer className="h-4 w-4" />
                      Call-to-Action Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-3">
                      <span>CTAs Found: {optimization.optimizations.ctaPlacement.ctaCount}</span>
                      <Badge className={getScoreBadge(optimization.optimizations.ctaPlacement.score)}>
                        {optimization.optimizations.ctaPlacement.score}/100
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {optimization.optimizations.ctaPlacement.suggestions.map((suggestion: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span>{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Mobile Optimization */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Mobile Optimization
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-3">
                      <span>Mobile Score</span>
                      <Badge className={getScoreBadge(optimization.optimizations.mobileOptimization.score)}>
                        {optimization.optimizations.mobileOptimization.score}/100
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {optimization.optimizations.mobileOptimization.suggestions.map((suggestion: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span>{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Personalization */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Personalization
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-3">
                      <span>Personal Elements: {optimization.optimizations.personalization.personalizationCount}</span>
                      <Badge className={getScoreBadge(optimization.optimizations.personalization.score)}>
                        {optimization.optimizations.personalization.score}/100
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {optimization.optimizations.personalization.suggestions.map((suggestion: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span>{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-4">
                {optimization.priorityRecommendations.map((rec: any, index: number) => (
                  <Alert key={index} className="border-l-4 border-l-blue-500">
                    <div className="flex items-start gap-3">
                      {getPriorityIcon(rec.priority)}
                      <div className="flex-1">
                        <AlertDescription>
                          <div className="font-medium text-sm mb-1">{rec.suggestion}</div>
                          <div className="text-xs text-gray-600">{rec.impact}</div>
                        </AlertDescription>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {rec.priority} Priority
                      </Badge>
                    </div>
                  </Alert>
                ))}
              </TabsContent>

              <TabsContent value="abtest" className="space-y-4">
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    Based on your content analysis, here are some A/B test ideas to improve performance:
                  </div>

                  {optimization.optimizations.subjectLine.score < 80 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Subject Line A/B Test</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div><strong>Current:</strong> {subject}</div>
                          <div><strong>Test Variation:</strong> Try shorter/longer versions, add personalization, or use urgency</div>
                          <div className="text-xs text-gray-600">Expected Impact: 15-25% improvement in open rates</div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {optimization.optimizations.ctaPlacement.score < 80 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">CTA Button A/B Test</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div><strong>Test:</strong> Different button colors, text, and placement</div>
                          <div><strong>Variations:</strong> "Get Started" vs "Learn More" vs "Try Now"</div>
                          <div className="text-xs text-gray-600">Expected Impact: 10-30% improvement in click rates</div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {optimization.optimizations.personalization.score < 60 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Personalization A/B Test</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div><strong>Test:</strong> Add recipient name, company, or location</div>
                          <div><strong>Variations:</strong> Generic vs personalized content blocks</div>
                          <div className="text-xs text-gray-600">Expected Impact: 5-15% improvement in engagement</div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              {subject || content ? 'Click "Optimize" to get AI-powered suggestions' : 'Add subject line or content to get optimization suggestions'}
            </p>
            {(subject || content) && (
              <Button onClick={handleAnalyze} disabled={isAnalyzing}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Analyze Content
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
