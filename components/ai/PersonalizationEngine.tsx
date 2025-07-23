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
import { Textarea } from '@/components/ui/textarea';
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
  User,
  Target,
  Brain,
  Sparkles,
  TrendingUp,
  Clock,
  Mail,
  Users,
  BarChart3,
  Zap,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';

interface PersonalizationEngineProps {
  templateId?: Id<'templates'>;
  contactIds?: Id<'contacts'>[];
  onPersonalizationUpdate?: (data: any) => void;
}

export function PersonalizationEngine({
  templateId,
  contactIds,
  onPersonalizationUpdate,
}: PersonalizationEngineProps) {
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  const [customField, setCustomField] = useState('');
  const [customValue, setCustomValue] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const segmentContacts = useMutation(api.personalizationEngine.segmentContacts);
  const generatePersonalizedContent = useMutation(api.personalizationEngine.generatePersonalizedContent);
  const getRecommendations = useMutation(api.personalizationEngine.getSmartRecommendations);
  const analyzePersonalization = useMutation(api.personalizationEngine.analyzePersonalizationOpportunities);

  const contacts = useQuery(api.contacts.list);
  const [segments, setSegments] = useState<any[]>([]);
  const [personalizedContent, setPersonalizedContent] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [personalizationScore, setPersonalizationScore] = useState<any>(null);

  useEffect(() => {
    if (contacts && contacts.length > 0) {
      handleSegmentContacts();
    }
  }, [contacts]);

  const handleSegmentContacts = async () => {
    if (!contacts || contacts.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      const result = await segmentContacts({});
      setSegments(result.segments || []);
    } catch (error) {
      console.error('Error segmenting contacts:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGeneratePersonalized = async () => {
    if (!templateId) return;

    setIsAnalyzing(true);
    try {
      const result = await generatePersonalizedContent({
        templateId,
        segment: selectedSegment,
        customFields: customField && customValue ? [{ field: customField, value: customValue }] : undefined,
      });
      setPersonalizedContent(result);
      
      if (onPersonalizationUpdate) {
        onPersonalizationUpdate(result);
      }
    } catch (error) {
      console.error('Error generating personalized content:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGetRecommendations = async () => {
    if (!templateId) return;

    try {
      const result = await getRecommendations({ templateId });
      setRecommendations(result.recommendations || []);
    } catch (error) {
      console.error('Error getting recommendations:', error);
    }
  };

  const handleAnalyzePersonalization = async () => {
    if (!templateId) return;

    try {
      const result = await analyzePersonalization({ templateId });
      setPersonalizationScore(result);
    } catch (error) {
      console.error('Error analyzing personalization:', error);
    }
  };

  const getSegmentIcon = (segment: string) => {
    switch (segment) {
      case 'highEngagement': return <TrendingUp className="h-4 w-4" />;
      case 'lowEngagement': return <BarChart3 className="h-4 w-4" />;
      case 'recentlyActive': return <Clock className="h-4 w-4" />;
      case 'dormant': return <Users className="h-4 w-4" />;
      case 'frequentClickers': return <Zap className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getSegmentBadgeVariant = (segment: string) => {
    switch (segment) {
      case 'highEngagement': return 'default';
      case 'lowEngagement': return 'secondary';
      case 'recentlyActive': return 'outline';
      case 'dormant': return 'destructive';
      case 'frequentClickers': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Personalization Engine</h2>
          <p className="text-muted-foreground">
            AI-powered content personalization and audience targeting
          </p>
        </div>
        <Button onClick={handleAnalyzePersonalization} variant="outline">
          <Brain className="h-4 w-4 mr-2" />
          Analyze Opportunities
        </Button>
      </div>

      {personalizationScore && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Personalization Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Score</span>
                <Badge variant={personalizationScore.score >= 70 ? 'default' : 'secondary'}>
                  {personalizationScore.score}/100
                </Badge>
              </div>
              <Progress value={personalizationScore.score} className="w-full" />
              
              {personalizationScore.breakdown && (
                <div className="grid grid-cols-2 gap-4 pt-4">
                  {Object.entries(personalizationScore.breakdown).map(([key, value]: [string, any]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span>{value}/100</span>
                      </div>
                      <Progress value={value} className="h-2" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="segments" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="fields">Custom Fields</TabsTrigger>
        </TabsList>

        <TabsContent value="segments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Audience Segments
              </CardTitle>
              <CardDescription>
                AI-generated behavioral segments based on engagement patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAnalyzing ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Analyzing audience segments...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {segments.map((segment) => (
                    <Card 
                      key={segment.type} 
                      className={`cursor-pointer transition-colors ${
                        selectedSegment === segment.type ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedSegment(segment.type)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {getSegmentIcon(segment.type)}
                          <Badge variant={getSegmentBadgeVariant(segment.type)}>
                            {segment.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {segment.description}
                        </p>
                        <div className="flex justify-between text-sm">
                          <span>Contacts:</span>
                          <span className="font-medium">{segment.contactIds?.length || 0}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Personalized Content Generation
              </CardTitle>
              <CardDescription>
                Generate dynamic content based on audience segments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select segment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Contacts</SelectItem>
                    {segments.map((segment) => (
                      <SelectItem key={segment.type} value={segment.type}>
                        {segment.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button 
                  onClick={handleGeneratePersonalized} 
                  disabled={isAnalyzing || !templateId}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>
              </div>

              {personalizedContent && (
                <div className="space-y-4">
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Generated Personalized Content</h4>
                    
                    {personalizedContent.subjectLines && personalizedContent.subjectLines.length > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Subject Lines</Label>
                        <div className="space-y-2 mt-1">
                          {personalizedContent.subjectLines.map((subject: string, index: number) => (
                            <div key={index} className="p-3 bg-muted rounded-lg">
                              <p className="text-sm">{subject}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {personalizedContent.content && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Personalized Content</Label>
                        <div className="p-3 bg-muted rounded-lg mt-1">
                          <p className="text-sm whitespace-pre-wrap">{personalizedContent.content}</p>
                        </div>
                      </div>
                    )}

                    {personalizedContent.dynamicFields && personalizedContent.dynamicFields.length > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Dynamic Fields</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {personalizedContent.dynamicFields.map((field: string, index: number) => (
                            <Badge key={index} variant="outline">
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Smart Recommendations
              </CardTitle>
              <CardDescription>
                AI-powered suggestions to improve personalization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleGetRecommendations} 
                className="mb-4"
                disabled={!templateId}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Get Recommendations
              </Button>

              {recommendations.length > 0 && (
                <div className="space-y-3">
                  {recommendations.map((rec, index) => (
                    <Alert key={index}>
                      <div className="flex">
                        {rec.type === 'critical' ? (
                          <AlertCircle className="h-4 w-4" />
                        ) : rec.type === 'warning' ? (
                          <AlertCircle className="h-4 w-4" />
                        ) : (
                          <Info className="h-4 w-4" />
                        )}
                        <AlertDescription className="ml-2">
                          <div className="space-y-1">
                            <p className="font-medium">{rec.title}</p>
                            <p className="text-sm text-muted-foreground">{rec.description}</p>
                            {rec.impact && (
                              <Badge variant="outline" className="text-xs">
                                Impact: {rec.impact}
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

        <TabsContent value="fields" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Custom Field Personalization
              </CardTitle>
              <CardDescription>
                Use custom contact fields for advanced personalization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customField">Field Name</Label>
                  <Input
                    id="customField"
                    placeholder="e.g., company, industry, location"
                    value={customField}
                    onChange={(e) => setCustomField(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customValue">Target Value</Label>
                  <Input
                    id="customValue"
                    placeholder="e.g., Tech, Healthcare, NYC"
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                  />
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Custom fields allow for precise targeting based on specific contact attributes.
                  These can be used in combination with behavioral segments for maximum impact.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Common Personalization Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    '{{firstName}}',
                    '{{lastName}}',
                    '{{company}}',
                    '{{location}}',
                    '{{industry}}',
                    '{{lastEngagement}}',
                    '{{preferredTime}}',
                    '{{interestTopic}}'
                  ].map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => navigator.clipboard.writeText(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
