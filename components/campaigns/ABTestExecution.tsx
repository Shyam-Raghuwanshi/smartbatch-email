"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  PlayIcon, 
  PauseIcon, 
  StopIcon, 
  TrophyIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  BarChart3Icon
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface ABTestExecutionProps {
  testId: Id<"abTests">;
  onTestComplete?: (testId: string, winnerId: string) => void;
}

export default function ABTestExecution({ testId, onTestComplete }: ABTestExecutionProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Queries
  const testDetails = useQuery(api.abTesting.getABTestDetails, { testId });
  const testInsights = useQuery(api.abTesting.getABTestDetails, { testId });

  // Mutations
  const startTest = useMutation(api.abTesting.startABTest);
  const pauseTest = useMutation(api.abTesting.pauseABTest);
  const sendCampaign = useMutation(api.emailService.sendABTestCampaign);
  const analyzeSignificance = useMutation(api.abTesting.analyzeStatisticalSignificance);
  const rolloutWinner = useMutation(api.abTesting.rolloutWinner);

  const test = testDetails?.test;
  const variants = testDetails?.variants || [];
  const results = testDetails?.results || [];
  const insights = testDetails?.insights || [];

  // Calculate progress
  const totalParticipants = variants.reduce((sum, variant) => sum + variant.assignedRecipients.length, 0);
  const totalSent = results.reduce((sum, result) => sum + result.metrics.sent, 0);
  const progress = totalParticipants > 0 ? (totalSent / totalParticipants) * 100 : 0;

  // Check for statistical significance
  const hasSignificantResults = results.some(result => 
    result.statisticalAnalysis?.statisticalSignificance
  );

  const winnerResult = test?.winningVariantId 
    ? results.find(r => r.variantId === test.winningVariantId)
    : null;

  const handleStartTest = async () => {
    if (!test) return;
    
    setIsStarting(true);
    try {
      await startTest({ testId });
      
      // Start sending emails
      await sendCampaign({ 
        testId,
        batchSize: 50,
        delayBetweenBatches: 30000 
      });
    } catch (error) {
      console.error("Failed to start test:", error);
    } finally {
      setIsStarting(false);
    }
  };

  const handlePauseTest = async () => {
    if (!test) return;
    
    setPausing(true);
    try {
      await pauseTest({ testId });
    } catch (error) {
      console.error("Failed to pause test:", error);
    } finally {
      setPausing(false);
    }
  };

  const handleAnalyzeSignificance = async () => {
    if (!test) return;
    
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeSignificance({ testId });
      if (analysis.hasSignificantResults) {
        // Winner was automatically declared
        onTestComplete?.(testId, analysis.analysis.find(a => a.significance?.statisticalSignificance)?.variantId);
      }
    } catch (error) {
      console.error("Failed to analyze significance:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRolloutWinner = async () => {
    if (!test?.winningVariantId) return;
    
    try {
      await rolloutWinner({ testId, rolloutPercentage: 100 });
    } catch (error) {
      console.error("Failed to rollout winner:", error);
    }
  };

  // Auto-analyze significance for active tests
  useEffect(() => {
    if (test?.status === "active" && totalSent > 100) {
      const interval = setInterval(() => {
        handleAnalyzeSignificance();
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [test?.status, totalSent]);

  if (!test) {
    return <div>Loading test details...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Test Status Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3Icon className="h-5 w-5" />
                {test.name}
              </CardTitle>
              <CardDescription>
                {test.description || "A/B Test Execution"}
              </CardDescription>
            </div>
            <Badge 
              variant={
                test.status === "active" ? "default" :
                test.status === "completed" ? "secondary" :
                test.status === "draft" ? "outline" : "destructive"
              }
            >
              {test.status.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Email Sending Progress</span>
                <span>{totalSent} / {totalParticipants} sent ({progress.toFixed(1)}%)</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {test.status === "draft" && (
                <Button onClick={handleStartTest} disabled={isStarting}>
                  <PlayIcon className="h-4 w-4 mr-2" />
                  {isStarting ? "Starting..." : "Start Test"}
                </Button>
              )}
              
              {test.status === "active" && (
                <>
                  <Button variant="outline" onClick={handlePauseTest} disabled={isPausing}>
                    <PauseIcon className="h-4 w-4 mr-2" />
                    {isPausing ? "Pausing..." : "Pause"}
                  </Button>
                  
                  <Button variant="outline" onClick={handleAnalyzeSignificance} disabled={isAnalyzing}>
                    <BarChart3Icon className="h-4 w-4 mr-2" />
                    {isAnalyzing ? "Analyzing..." : "Check Significance"}
                  </Button>
                </>
              )}

              {test.status === "completed" && test.winningVariantId && (
                <Button onClick={handleRolloutWinner}>
                  <ArrowRightIcon className="h-4 w-4 mr-2" />
                  Rollout Winner
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistical Significance Alert */}
      {hasSignificantResults && test.status === "active" && (
        <Alert>
          <TrophyIcon className="h-4 w-4" />
          <AlertDescription>
            Statistical significance detected! A winning variant has been identified.
            {test.testConfiguration.statisticalSettings.automaticWinner 
              ? " The test will be completed automatically."
              : " You can manually declare the winner or continue testing."
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Winner Declaration */}
      {test.status === "completed" && winnerResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrophyIcon className="h-5 w-5 text-yellow-500" />
              Test Winner Declared
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">
                  {variants.find(v => v._id === test.winningVariantId)?.name}
                </h4>
                <p className="text-sm text-gray-600">
                  Achieved {winnerResult.statisticalAnalysis?.lift?.toFixed(1)}% improvement 
                  in {test.testConfiguration.successMetrics.primary.replace('_', ' ')}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Sample Size:</span>
                  <span className="ml-2 font-medium">{winnerResult.statisticalAnalysis.sampleSize}</span>
                </div>
                <div>
                  <span className="text-gray-600">Confidence:</span>
                  <span className="ml-2 font-medium">
                    {((1 - (winnerResult.statisticalAnalysis.pValue || 0)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-time Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Real-time Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.slice(0, 3).map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <AlertTriangleIcon className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div>
                    <h5 className="font-medium">{insight.title}</h5>
                    <p className="text-sm text-gray-600">{insight.description}</p>
                    <span className="text-xs text-gray-500">
                      {new Date(insight.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Variant Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Variant Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {variants.map((variant) => {
              const result = results.find(r => r.variantId === variant._id);
              const isWinner = test.winningVariantId === variant._id;
              
              return (
                <div key={variant._id} className={`p-4 border rounded-lg ${isWinner ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium flex items-center gap-2">
                      {variant.name}
                      {variant.isControl && <Badge variant="outline">Control</Badge>}
                      {isWinner && <Badge className="bg-yellow-500"><TrophyIcon className="h-3 w-3 mr-1" />Winner</Badge>}
                    </h4>
                    <span className="text-sm text-gray-600">
                      {variant.assignedRecipients.length} recipients
                    </span>
                  </div>
                  
                  {result && (
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Open Rate:</span>
                        <span className="ml-2 font-medium">{result.rates.openRate.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Click Rate:</span>
                        <span className="ml-2 font-medium">{result.rates.clickRate.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Conversions:</span>
                        <span className="ml-2 font-medium">{result.metrics.conversions}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
