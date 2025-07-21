"use client";

import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  Users, 
  Eye, 
  MousePointer, 
  Crown,
  AlertTriangle,
  CheckCircle2,
  Brain,
  Zap,
  Calendar,
  ArrowRight,
  Trophy,
  Percent,
  Info
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface ABTestResultsProps {
  testId: Id<"abTests">;
}

const ABTestResults: React.FC<ABTestResultsProps> = ({ testId }) => {
  const testDetails = useQuery(api.abTesting.getABTestDetails, { testId });
  const [activeTab, setActiveTab] = useState('overview');

  if (!testDetails) {
    return <div>Loading test results...</div>;
  }

  const { test, variants, results, insights } = testDetails;

  // Calculate overall test metrics
  const totalSent = results.reduce((sum, r) => sum + r.metrics.sent, 0);
  const totalOpened = results.reduce((sum, r) => sum + r.metrics.opened, 0);
  const totalClicked = results.reduce((sum, r) => sum + r.metrics.clicked, 0);
  const totalConversions = results.reduce((sum, r) => sum + r.metrics.conversions, 0);

  const overallOpenRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
  const overallClickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
  const overallConversionRate = totalSent > 0 ? (totalConversions / totalSent) * 100 : 0;

  // Find control and best performing variant
  const controlVariant = variants.find(v => v.isControl);
  const controlResult = results.find(r => r.variantId === controlVariant?._id);
  
  const primaryMetric = test.testConfiguration.successMetrics.primary;
  const bestVariantResult = results.reduce((best, current) => {
    const bestRate = getMetricRate(best, primaryMetric);
    const currentRate = getMetricRate(current, primaryMetric);
    return currentRate > bestRate ? current : best;
  });

  const bestVariant = variants.find(v => v._id === bestVariantResult.variantId);

  // Test status and duration
  const testDuration = test.startedAt ? Math.floor((Date.now() - test.startedAt) / (1000 * 60 * 60 * 24)) : 0;
  const maxDuration = test.testConfiguration.statisticalSettings.testDuration.maxDays;
  const durationProgress = (testDuration / maxDuration) * 100;

  // Statistical significance summary
  const significantResults = results.filter(r => r.statisticalAnalysis.statisticalSignificance);
  const hasSignificantWinner = significantResults.length > 0;

  function getMetricRate(result: any, metric: string): number {
    switch (metric) {
      case 'open_rate': return result.rates.openRate;
      case 'click_rate': return result.rates.clickRate;
      case 'conversion_rate': return result.rates.conversionRate;
      default: return 0;
    }
  }

  function getMetricIcon(metric: string) {
    switch (metric) {
      case 'open_rate': return <Eye className="h-4 w-4" />;
      case 'click_rate': return <MousePointer className="h-4 w-4" />;
      case 'conversion_rate': return <Target className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  // Prepare chart data
  const performanceChartData = results.map(result => {
    const variant = variants.find(v => v._id === result.variantId);
    return {
      name: variant?.name || 'Unknown',
      openRate: result.rates.openRate,
      clickRate: result.rates.clickRate,
      conversionRate: result.rates.conversionRate,
      isControl: variant?.isControl || false,
    };
  });

  const confidenceIntervalData = results.map(result => {
    const variant = variants.find(v => v._id === result.variantId);
    return {
      name: variant?.name || 'Unknown',
      rate: getMetricRate(result, primaryMetric),
      lower: result.statisticalAnalysis.confidenceInterval.lower,
      upper: result.statisticalAnalysis.confidenceInterval.upper,
      isSignificant: result.statisticalAnalysis.statisticalSignificance,
    };
  });

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            {test.name}
          </h1>
          <div className="flex items-center gap-4 mt-2">
            {getStatusBadge(test.status)}
            <Badge variant="outline">
              {test.type.replace('_', ' ').toUpperCase()}
            </Badge>
            <span className="text-gray-600">
              Day {testDuration} of {maxDuration}
            </span>
          </div>
        </div>
        
        {test.winningVariantId && (
          <div className="text-right">
            <div className="flex items-center gap-2 text-green-600">
              <Trophy className="h-5 w-5" />
              <span className="font-medium">Winner Declared</span>
            </div>
            <p className="text-sm text-gray-600">
              {variants.find(v => v._id === test.winningVariantId)?.name}
            </p>
          </div>
        )}
      </div>

      {/* Key Insights Alert */}
      {insights.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {insights.slice(0, 3).map(insight => (
                <div key={insight._id} className="flex items-center gap-2">
                  <span className="font-medium">{insight.title}:</span>
                  <span>{insight.description}</span>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium">Total Participants</span>
            </div>
            <div className="text-2xl font-bold">{totalSent.toLocaleString()}</div>
            <div className="text-xs text-gray-600 mt-1">
              {results.reduce((sum, r) => sum + r.statisticalAnalysis.sampleSize, 0).toLocaleString()} assigned
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">Overall Open Rate</span>
            </div>
            <div className="text-2xl font-bold">{overallOpenRate.toFixed(1)}%</div>
            <div className="text-xs text-gray-600 mt-1">
              {totalOpened.toLocaleString()} opens
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <MousePointer className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium">Overall Click Rate</span>
            </div>
            <div className="text-2xl font-bold">{overallClickRate.toFixed(1)}%</div>
            <div className="text-xs text-gray-600 mt-1">
              {totalClicked.toLocaleString()} clicks
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-medium">Overall Conversion</span>
            </div>
            <div className="text-2xl font-bold">{overallConversionRate.toFixed(1)}%</div>
            <div className="text-xs text-gray-600 mt-1">
              {totalConversions.toLocaleString()} conversions
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Test Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Duration Progress</span>
                <span>{testDuration} / {maxDuration} days</span>
              </div>
              <Progress value={Math.min(durationProgress, 100)} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Started:</span>
                <div className="font-medium">
                  {test.startedAt ? new Date(test.startedAt).toLocaleDateString() : 'Not started'}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Estimated End:</span>
                <div className="font-medium">
                  {test.startedAt ? 
                    new Date(test.startedAt + maxDuration * 24 * 60 * 60 * 1000).toLocaleDateString() : 
                    'TBD'
                  }
                </div>
              </div>
              <div>
                <span className="text-gray-600">Significance:</span>
                <div className="font-medium">
                  {hasSignificantWinner ? (
                    <span className="text-green-600">Achieved</span>
                  ) : (
                    <span className="text-yellow-600">Pending</span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Auto-declare:</span>
                <div className="font-medium">
                  {test.testConfiguration.statisticalSettings.automaticWinner ? 'Enabled' : 'Disabled'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Performance Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Comparison</CardTitle>
              <CardDescription>
                Compare key metrics across all variants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
                    />
                    <Legend />
                    <Bar dataKey="openRate" fill="#3B82F6" name="Open Rate" />
                    <Bar dataKey="clickRate" fill="#10B981" name="Click Rate" />
                    <Bar dataKey="conversionRate" fill="#F59E0B" name="Conversion Rate" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Winner Highlight */}
          {bestVariant && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Crown className="h-5 w-5" />
                  Current Best Performer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-lg font-bold text-green-800">{bestVariant.name}</div>
                    <div className="text-sm text-green-600">
                      {bestVariant.isControl ? 'Control Variant' : 'Test Variant'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-green-700">Primary Metric</div>
                    <div className="text-lg font-bold text-green-800">
                      {getMetricRate(bestVariantResult, primaryMetric).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-green-700">Statistical Significance</div>
                    <div className="flex items-center gap-1">
                      {bestVariantResult.statisticalAnalysis.statisticalSignificance ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-600" />
                      )}
                      <span className="text-sm font-medium">
                        {bestVariantResult.statisticalAnalysis.statisticalSignificance ? 'Significant' : 'Pending'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-green-700">Improvement vs Control</div>
                    <div className="text-lg font-bold text-green-800">
                      {controlResult && bestVariantResult.statisticalAnalysis.lift ? 
                        `+${bestVariantResult.statisticalAnalysis.lift.toFixed(1)}%` : 
                        'N/A'
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Variants Tab */}
        <TabsContent value="variants" className="space-y-6">
          <div className="grid gap-6">
            {results.map((result, index) => {
              const variant = variants.find(v => v._id === result.variantId);
              if (!variant) return null;

              const lift = result.statisticalAnalysis.lift;
              const isWinner = test.winningVariantId === variant._id;

              return (
                <Card key={variant._id} className={isWinner ? "border-gold border-2" : ""}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="flex items-center gap-2">
                          {variant.name}
                          {variant.isControl && (
                            <Badge variant="outline">Control</Badge>
                          )}
                          {isWinner && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Trophy className="h-3 w-3 mr-1" />
                              Winner
                            </Badge>
                          )}
                        </CardTitle>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Traffic Allocation</div>
                        <div className="font-medium">{variant.trafficAllocation}%</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Variant Configuration */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium mb-2">Configuration</h5>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-gray-600">Subject:</span>
                            <span className="ml-2 font-medium">{variant.campaignConfig.subject}</span>
                          </div>
                          {variant.campaignConfig.fromName && (
                            <div>
                              <span className="text-gray-600">From Name:</span>
                              <span className="ml-2 font-medium">{variant.campaignConfig.fromName}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Performance Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {result.metrics.sent.toLocaleString()}
                          </div>
                          <div className="text-xs text-blue-700">Sent</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {result.rates.openRate.toFixed(1)}%
                          </div>
                          <div className="text-xs text-green-700">Open Rate</div>
                          {lift && !variant.isControl && (
                            <div className="text-xs text-gray-600">
                              {lift > 0 ? '+' : ''}{lift.toFixed(1)}% vs control
                            </div>
                          )}
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {result.rates.clickRate.toFixed(1)}%
                          </div>
                          <div className="text-xs text-purple-700">Click Rate</div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            {result.rates.conversionRate.toFixed(1)}%
                          </div>
                          <div className="text-xs text-orange-700">Conversion Rate</div>
                        </div>
                      </div>

                      {/* Statistical Analysis */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium mb-2">Statistical Analysis</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Sample Size:</span>
                            <div className="font-medium">{result.statisticalAnalysis.sampleSize}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Significance:</span>
                            <div className="flex items-center gap-1">
                              {result.statisticalAnalysis.statisticalSignificance ? (
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                              ) : (
                                <Clock className="h-3 w-3 text-yellow-600" />
                              )}
                              <span className="font-medium">
                                {result.statisticalAnalysis.statisticalSignificance ? 'Yes' : 'No'}
                              </span>
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">P-Value:</span>
                            <div className="font-medium">
                              {result.statisticalAnalysis.pValue?.toFixed(4) || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Confidence Interval:</span>
                            <div className="font-medium text-xs">
                              [{result.statisticalAnalysis.confidenceInterval.lower.toFixed(1)}%, {result.statisticalAnalysis.confidenceInterval.upper.toFixed(1)}%]
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-6">
          {/* Confidence Intervals Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Confidence Intervals</CardTitle>
              <CardDescription>
                {test.testConfiguration.statisticalSettings.confidenceLevel}% confidence intervals for {primaryMetric.replace('_', ' ')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={confidenceIntervalData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={['dataMin - 5', 'dataMax + 5']} />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
                    />
                    <Bar dataKey="rate" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Statistical Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Confidence Level:</span>
                  <span className="font-medium">{test.testConfiguration.statisticalSettings.confidenceLevel}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Min. Detectable Effect:</span>
                  <span className="font-medium">{test.testConfiguration.statisticalSettings.minimumDetectableEffect}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Primary Metric:</span>
                  <span className="font-medium">{primaryMetric.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Test Duration:</span>
                  <span className="font-medium">{test.testConfiguration.statisticalSettings.testDuration.type}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Power Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Required Sample Size:</span>
                  <span className="font-medium">{test.testConfiguration.statisticalSettings.testDuration.minSampleSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Sample Size:</span>
                  <span className="font-medium">{totalSent}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Power Achieved:</span>
                  <span className="font-medium">
                    {totalSent >= test.testConfiguration.statisticalSettings.testDuration.minSampleSize ? 
                      '80%+' : 
                      `${Math.min(80, (totalSent / test.testConfiguration.statisticalSettings.testDuration.minSampleSize) * 80).toFixed(0)}%`
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type I Error (α):</span>
                  <span className="font-medium">{((100 - test.testConfiguration.statisticalSettings.confidenceLevel) / 100).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bayesian Analysis */}
          {test.testConfiguration.bayesianSettings && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Bayesian Analysis
                </CardTitle>
                <CardDescription>
                  Advanced statistical analysis using Bayesian methods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.map(result => {
                    const variant = variants.find(v => v._id === result.variantId);
                    if (!variant || !result.bayesianAnalysis) return null;

                    return (
                      <div key={variant._id} className="border rounded-lg p-4">
                        <h5 className="font-medium mb-2">{variant.name}</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Probability to be Best:</span>
                            <div className="font-medium">{(result.bayesianAnalysis.probabilityToBeBest * 100).toFixed(1)}%</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Expected Loss:</span>
                            <div className="font-medium">{result.bayesianAnalysis.expectedLoss.toFixed(2)}%</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Posterior Probability:</span>
                            <div className="font-medium">{(result.bayesianAnalysis.posteriorProbability * 100).toFixed(1)}%</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Credible Interval:</span>
                            <div className="font-medium text-xs">
                              [{result.bayesianAnalysis.credibleInterval.lower.toFixed(1)}%, {result.bayesianAnalysis.credibleInterval.upper.toFixed(1)}%]
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="space-y-4">
            {insights.map(insight => (
              <Card key={insight._id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {insight.severity === 'critical' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                      {insight.severity === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                      {insight.severity === 'info' && <Info className="h-5 w-5 text-blue-500" />}
                      {insight.title}
                    </CardTitle>
                    <Badge variant={insight.severity === 'critical' ? 'destructive' : 'outline'}>
                      {insight.insightType.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{insight.description}</p>
                  {insight.actionRequired && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800 font-medium">Action Required</p>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(insight.createdAt).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            ))}

            {insights.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Info className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Insights Yet</h3>
                  <p className="text-gray-600">
                    Insights will appear here as your test gathers more data and statistical patterns emerge.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Settings</CardTitle>
              <CardDescription>
                Current configuration for this A/B test
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h5 className="font-medium">Basic Information</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Test Name:</span>
                    <div className="font-medium">{test.name}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Test Type:</span>
                    <div className="font-medium">{test.type.replace('_', ' ')}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <div className="font-medium">{new Date(test.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <div className="font-medium">{test.status}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="font-medium">Audience Configuration</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Audience:</span>
                    <div className="font-medium">{test.testConfiguration.audienceSettings.totalAudience.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Test Percentage:</span>
                    <div className="font-medium">{test.testConfiguration.audienceSettings.testPercentage}%</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="font-medium">Success Metrics</h5>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Primary Metric:</span>
                    <div className="font-medium">{test.testConfiguration.successMetrics.primary.replace('_', ' ')}</div>
                  </div>
                  {test.testConfiguration.successMetrics.secondary && test.testConfiguration.successMetrics.secondary.length > 0 && (
                    <div>
                      <span className="text-gray-600">Secondary Metrics:</span>
                      <div className="font-medium">
                        {test.testConfiguration.successMetrics.secondary.map(metric => metric.replace('_', ' ')).join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ABTestResults;
