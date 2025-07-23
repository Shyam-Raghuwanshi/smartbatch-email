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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Brain,
  Trophy,
  TrendingUp,
  Star,
  Clock,
  Mail,
  Users,
  BarChart3,
  Lightbulb,
  Target,
  Zap,
  CheckCircle,
  AlertCircle,
  Info,
  Search,
  Filter,
} from 'lucide-react';

interface TemplateIntelligenceProps {
  templateId?: Id<'templates'>;
  industry?: string;
  onTemplateSelect?: (templateId: Id<'templates'>) => void;
}

export function TemplateIntelligence({
  templateId,
  industry,
  onTemplateSelect,
}: TemplateIntelligenceProps) {
  const [selectedIndustry, setSelectedIndustry] = useState(industry || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'performance' | 'usage' | 'date'>('performance');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeTemplate = useMutation(api.templateIntelligence.analyzeTemplatePerformance);
  const getRankedTemplates = useMutation(api.templateIntelligence.getRankedTemplates);
  const getTemplateSuggestions = useMutation(api.templateIntelligence.getTemplateSuggestions);
  const generateTemplate = useMutation(api.templateIntelligence.generateIndustryTemplate);
  const analyzeABTest = useMutation(api.templateIntelligence.analyzeABTestResults);

  const templates = useQuery(api.templates.list);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [rankedTemplates, setRankedTemplates] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [abTestResults, setABTestResults] = useState<any>(null);

  useEffect(() => {
    if (templates && templates.length > 0) {
      handleGetRankedTemplates();
    }
  }, [templates, sortBy, selectedIndustry]);

  const handleAnalyzeTemplate = async () => {
    if (!templateId) return;

    setIsAnalyzing(true);
    try {
      const result = await analyzeTemplate({ templateId });
      setPerformanceData(result);
    } catch (error) {
      console.error('Error analyzing template:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGetRankedTemplates = async () => {
    try {
      const result = await getRankedTemplates({
        industry: selectedIndustry || undefined,
        sortBy,
      });
      setRankedTemplates(result.templates || []);
    } catch (error) {
      console.error('Error getting ranked templates:', error);
    }
  };

  const handleGetSuggestions = async () => {
    if (!templateId) return;

    try {
      const result = await getTemplateSuggestions({ templateId });
      setSuggestions(result.suggestions || []);
    } catch (error) {
      console.error('Error getting suggestions:', error);
    }
  };

  const handleGenerateTemplate = async () => {
    if (!selectedIndustry) return;

    setIsAnalyzing(true);
    try {
      const result = await generateTemplate({ industry: selectedIndustry });
      // Handle generated template result
      console.log('Generated template:', result);
    } catch (error) {
      console.error('Error generating template:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeABTest = async () => {
    if (!templateId) return;

    try {
      const result = await analyzeABTest({ templateId });
      setABTestResults(result);
    } catch (error) {
      console.error('Error analyzing A/B test:', error);
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const filteredTemplates = rankedTemplates.filter(template =>
    template.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.industry?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Retail', 'Education',
    'Real Estate', 'Manufacturing', 'Consulting', 'Marketing', 'Other'
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Template Intelligence</h2>
          <p className="text-muted-foreground">
            AI-powered template performance analysis and recommendations
          </p>
        </div>
        <Button onClick={handleAnalyzeTemplate} variant="outline" disabled={!templateId}>
          <Brain className="h-4 w-4 mr-2" />
          Analyze Template
        </Button>
      </div>

      {performanceData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Template Performance Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Performance Score</span>
                <Badge variant={getPerformanceBadge(performanceData.score)}>
                  {performanceData.score}/100
                </Badge>
              </div>
              <Progress value={performanceData.score} className="w-full" />
              
              {performanceData.breakdown && (
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Open Rate Score</span>
                      <span className={getPerformanceColor(performanceData.breakdown.openRate)}>
                        {performanceData.breakdown.openRate}/40
                      </span>
                    </div>
                    <Progress value={(performanceData.breakdown.openRate / 40) * 100} className="h-2" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Click Rate Score</span>
                      <span className={getPerformanceColor(performanceData.breakdown.clickRate)}>
                        {performanceData.breakdown.clickRate}/30
                      </span>
                    </div>
                    <Progress value={(performanceData.breakdown.clickRate / 30) * 100} className="h-2" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Usage Frequency</span>
                      <span className={getPerformanceColor(performanceData.breakdown.usageFrequency)}>
                        {performanceData.breakdown.usageFrequency}/20
                      </span>
                    </div>
                    <Progress value={(performanceData.breakdown.usageFrequency / 20) * 100} className="h-2" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Engagement Score</span>
                      <span className={getPerformanceColor(performanceData.breakdown.engagement)}>
                        {performanceData.breakdown.engagement}/10
                      </span>
                    </div>
                    <Progress value={(performanceData.breakdown.engagement / 10) * 100} className="h-2" />
                  </div>
                </div>
              )}

              {performanceData.metrics && (
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {performanceData.metrics.averageOpenRate}%
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Open Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {performanceData.metrics.averageClickRate}%
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Click Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {performanceData.metrics.totalUsage}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Usage</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="rankings" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rankings">Rankings</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="generator">Generator</TabsTrigger>
          <TabsTrigger value="abtest">A/B Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="rankings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Template Performance Rankings
              </CardTitle>
              <CardDescription>
                Templates ranked by AI performance analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search templates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                
                <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Industries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Industries</SelectItem>
                    {industries.map((ind) => (
                      <SelectItem key={ind} value={ind.toLowerCase()}>
                        {ind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="usage">Usage</SelectItem>
                    <SelectItem value="date">Date Created</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                {filteredTemplates.map((template, index) => (
                  <Card 
                    key={template._id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onTemplateSelect && onTemplateSelect(template._id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              #{index + 1}
                            </Badge>
                            <h4 className="font-medium">{template.name}</h4>
                            {template.industry && (
                              <Badge variant="secondary" className="text-xs">
                                {template.industry}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {template.description || 'No description available'}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm font-medium">
                                {template.performanceScore || 0}/100
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {template.totalUsage || 0} uses
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-sm font-medium text-green-600">
                              {template.averageOpenRate || 0}%
                            </div>
                            <div className="text-xs text-muted-foreground">Open Rate</div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-sm font-medium text-blue-600">
                              {template.averageClickRate || 0}%
                            </div>
                            <div className="text-xs text-muted-foreground">Click Rate</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {filteredTemplates.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No templates found matching your criteria
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                AI Improvement Suggestions
              </CardTitle>
              <CardDescription>
                Smart recommendations to optimize template performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleGetSuggestions} 
                className="mb-4"
                disabled={!templateId}
              >
                <Brain className="h-4 w-4 mr-2" />
                Get Suggestions
              </Button>

              {suggestions.length > 0 && (
                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <Alert key={index}>
                      <div className="flex">
                        {suggestion.priority === 'high' ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : suggestion.priority === 'medium' ? (
                          <Info className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        <AlertDescription className="ml-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{suggestion.title}</p>
                              <Badge 
                                variant={
                                  suggestion.priority === 'high' ? 'destructive' :
                                  suggestion.priority === 'medium' ? 'secondary' : 'outline'
                                }
                                className="text-xs"
                              >
                                {suggestion.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                            {suggestion.expectedImpact && (
                              <Badge variant="outline" className="text-xs">
                                Expected Impact: {suggestion.expectedImpact}
                              </Badge>
                            )}
                          </div>
                        </AlertDescription>
                      </div>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                AI Template Generator
              </CardTitle>
              <CardDescription>
                Generate industry-specific templates using AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="industry">Target Industry</Label>
                <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((ind) => (
                      <SelectItem key={ind} value={ind.toLowerCase()}>
                        {ind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleGenerateTemplate} 
                disabled={!selectedIndustry || isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Template...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Generate Template
                  </>
                )}
              </Button>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  AI-generated templates are optimized for your selected industry based on 
                  performance data from similar campaigns and best practices.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="abtest" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                A/B Test Analysis
              </CardTitle>
              <CardDescription>
                Analyze A/B test results and get optimization recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleAnalyzeABTest} 
                className="mb-4"
                disabled={!templateId}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analyze A/B Tests
              </Button>

              {abTestResults && (
                <div className="space-y-4">
                  <Separator />
                  
                  {abTestResults.winner && (
                    <Alert>
                      <Trophy className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          <p className="font-medium">Winner: {abTestResults.winner.variant}</p>
                          <p className="text-sm text-muted-foreground">
                            Outperformed by {abTestResults.winner.improvement}% 
                            with {abTestResults.winner.confidence}% confidence
                          </p>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {abTestResults.recommendations && abTestResults.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Optimization Recommendations</h4>
                      {abTestResults.recommendations.map((rec: any, index: number) => (
                        <div key={index} className="p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium">{rec.title}</p>
                          <p className="text-sm text-muted-foreground">{rec.description}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {abTestResults.nextTests && abTestResults.nextTests.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Suggested Next Tests</h4>
                      <div className="flex flex-wrap gap-2">
                        {abTestResults.nextTests.map((test: string, index: number) => (
                          <Badge key={index} variant="outline">
                            {test}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
