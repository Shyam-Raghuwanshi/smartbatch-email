"use client";

import React, { useState, useEffect } from 'react';
import { useAction, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Lightbulb,
  Target,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Zap
} from 'lucide-react';

interface SpamScoreAnalyzerProps {
  subject: string;
  content: string;
  fromName?: string;
  fromEmail?: string;
  onScoreUpdate?: (score: number, suggestions: string[]) => void;
}

export function SpamScoreAnalyzer({ 
  subject, 
  content, 
  fromName, 
  fromEmail, 
  onScoreUpdate 
}: SpamScoreAnalyzerProps) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoAnalyze, setAutoAnalyze] = useState(true);

  const analyzeSpamScore = useAction(api.contentAnalysis.analyzeSpamScore);
  const spamWordsList = useQuery(api.contentAnalysis.getSpamWordsList);

  useEffect(() => {
    if (autoAnalyze && (subject || content)) {
      handleAnalyze();
    }
  }, [subject, content, fromName, fromEmail, autoAnalyze]);

  const handleAnalyze = async () => {
    if (!subject && !content) return;

    setIsAnalyzing(true);
    try {
      const result = await analyzeSpamScore({
        subject: subject || '',
        content: content || '',
        fromName,
        fromEmail
      });

      setAnalysis(result);
      onScoreUpdate?.(result.spamScore, result.suggestions);
    } catch (error) {
      console.error('Error analyzing spam score:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return <CheckCircle className="h-5 w-5" />;
      case 'medium': return <AlertTriangle className="h-5 w-5" />;
      case 'high': return <XCircle className="h-5 w-5" />;
      default: return <Shield className="h-5 w-5" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Spam Score Analysis</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Analyze
              </>
            )}
          </Button>
        </div>
        <CardDescription>
          Real-time analysis of your email content for spam triggers and deliverability issues
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {analysis ? (
          <>
            {/* Spam Score Overview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getRiskIcon(analysis.riskLevel)}
                  <div>
                    <div className="font-semibold text-lg">{analysis.spamScore}/100</div>
                    <div className="text-sm text-gray-600">Spam Score</div>
                  </div>
                </div>
                <Badge className={getRiskLevelColor(analysis.riskLevel)}>
                  {analysis.riskLevel.toUpperCase()} RISK
                </Badge>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Deliverability Score</span>
                  <span>{100 - analysis.spamScore}/100</span>
                </div>
                <Progress 
                  value={100 - analysis.spamScore} 
                  className="h-2"
                />
              </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="issues">Issues</TabsTrigger>
                <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
                <TabsTrigger value="words">Spam Words</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {/* Score Breakdown */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Score Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Subject Line</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{analysis.analysis.subjectScore}/100</span>
                        {analysis.analysis.subjectScore > 20 ? (
                          <TrendingUp className="h-4 w-4 text-red-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Content</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{analysis.analysis.contentScore}/100</span>
                        {analysis.analysis.contentScore > 20 ? (
                          <TrendingUp className="h-4 w-4 text-red-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Sender Information</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{analysis.analysis.fromScore}/100</span>
                        {analysis.analysis.fromScore > 10 ? (
                          <TrendingUp className="h-4 w-4 text-red-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Assessment */}
                <Alert className={getRiskLevelColor(analysis.riskLevel)}>
                  {getRiskIcon(analysis.riskLevel)}
                  <AlertDescription>
                    <strong>Risk Level: {analysis.riskLevel.toUpperCase()}</strong>
                    <br />
                    {analysis.riskLevel === 'low' && 'Your email has a low spam risk and should deliver well.'}
                    {analysis.riskLevel === 'medium' && 'Your email has moderate spam risk. Consider addressing the highlighted issues.'}
                    {analysis.riskLevel === 'high' && 'Your email has high spam risk and may be blocked by email filters.'}
                  </AlertDescription>
                </Alert>
              </TabsContent>

              <TabsContent value="issues" className="space-y-4">
                {analysis.issues.length > 0 ? (
                  <div className="space-y-3">
                    {analysis.issues.map((issue: string, index: number) => (
                      <Alert key={index} className="border-orange-200 bg-orange-50">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-800">
                          {issue}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600">No issues detected! Your email looks good.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="suggestions" className="space-y-4">
                {analysis.suggestions.length > 0 ? (
                  <div className="space-y-3">
                    {analysis.suggestions.map((suggestion: string, index: number) => (
                      <Alert key={index} className="border-blue-200 bg-blue-50">
                        <Lightbulb className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          {suggestion}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600">Your email is well optimized!</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="words" className="space-y-4">
                {analysis.blacklistedWords.length > 0 ? (
                  <div>
                    <h4 className="font-medium mb-3">Detected Spam Words</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.blacklistedWords.map((word: string, index: number) => (
                        <Badge key={index} variant="destructive" className="text-xs">
                          {word}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 mt-3">
                      Consider replacing these words with more natural alternatives.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600">No spam words detected in your content.</p>
                  </div>
                )}

                {/* Common Spam Words Reference */}
                {spamWordsList && (
                  <div className="mt-8">
                    <h4 className="font-medium mb-3">Spam Words to Avoid</h4>
                    <Tabs defaultValue="high" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="high">High Risk</TabsTrigger>
                        <TabsTrigger value="medium">Medium Risk</TabsTrigger>
                        <TabsTrigger value="common">Common Triggers</TabsTrigger>
                      </TabsList>

                      <TabsContent value="high">
                        <div className="flex flex-wrap gap-1">
                          {spamWordsList.highRisk.map((word: string, index: number) => (
                            <Badge key={index} variant="destructive" className="text-xs">
                              {word}
                            </Badge>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="medium">
                        <div className="flex flex-wrap gap-1">
                          {spamWordsList.mediumRisk.map((word: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {word}
                            </Badge>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="common">
                        <div className="space-y-2">
                          {spamWordsList.commonTriggers.map((trigger: string, index: number) => (
                            <div key={index} className="text-sm text-gray-600 italic">
                              • {trigger}
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              {subject || content ? 'Click "Analyze" to check your email for spam triggers' : 'Add subject line or content to analyze spam score'}
            </p>
            {(subject || content) && (
              <Button onClick={handleAnalyze} disabled={isAnalyzing}>
                <Zap className="h-4 w-4 mr-2" />
                Analyze Content
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
