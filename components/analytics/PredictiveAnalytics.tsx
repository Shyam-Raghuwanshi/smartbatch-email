'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Brain,
  Target,
  Clock,
  Users,
  Mail,
  AlertTriangle,
  Lightbulb,
  Zap,
  Calendar,
  Filter,
  Download,
  Star,
  ArrowRight,
  ChevronRight
} from 'lucide-react';

interface PredictiveAnalyticsProps {
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export default function PredictiveAnalytics({ dateRange }: PredictiveAnalyticsProps) {
  const [selectedModel, setSelectedModel] = useState('churn');

  // Mock data - in real app, this would come from ML models in Convex
  const predictionOverview = {
    churnRisk: 23.5,
    optimalSendTime: '2:00 PM',
    predictedRevenue: 45200,
    modelAccuracy: 87.3,
    trendsDetected: 8
  };

  const churnPredictions = [
    { segment: 'New Subscribers', risk: 15.2, count: 1250, factors: ['Low engagement', 'No purchases'] },
    { segment: 'Active Users', risk: 8.7, count: 3400, factors: ['Decreasing opens', 'Time since last click'] },
    { segment: 'VIP Customers', risk: 5.1, count: 890, factors: ['Subscription fatigue', 'Price sensitivity'] },
    { segment: 'Dormant Users', risk: 67.3, count: 670, factors: ['No activity 30+ days', 'Multiple bounces'] }
  ];

  const churnFactors = [
    { factor: 'Days since last open', importance: 0.34, impact: 'High' },
    { factor: 'Email frequency preference', importance: 0.28, impact: 'High' },
    { factor: 'Click-through rate decline', importance: 0.19, impact: 'Medium' },
    { factor: 'Unsubscribe page visits', importance: 0.11, impact: 'Medium' },
    { factor: 'Complaint history', importance: 0.08, impact: 'Low' }
  ];

  const sendTimeOptimization = [
    { hour: '6 AM', predicted: 12.5, actual: 11.8, confidence: 78 },
    { hour: '9 AM', predicted: 28.3, actual: 26.9, confidence: 85 },
    { hour: '12 PM', predicted: 31.7, actual: 33.2, confidence: 82 },
    { hour: '2 PM', predicted: 35.9, actual: 35.1, confidence: 91 },
    { hour: '5 PM', predicted: 29.4, actual: 28.7, confidence: 87 },
    { hour: '8 PM', predicted: 22.1, actual: 21.3, confidence: 79 }
  ];

  const contentPerformance = [
    { 
      type: 'Product Updates', 
      predicted: 4.2, 
      actual: 4.1, 
      trend: 'stable',
      recommendation: 'Maintain current strategy'
    },
    { 
      type: 'Promotional', 
      predicted: 6.8, 
      actual: 5.9, 
      trend: 'declining',
      recommendation: 'Reduce frequency, improve targeting'
    },
    { 
      type: 'Educational', 
      predicted: 3.9, 
      actual: 4.7, 
      trend: 'improving',
      recommendation: 'Increase share of content mix'
    },
    { 
      type: 'Newsletter', 
      predicted: 2.1, 
      actual: 2.8, 
      trend: 'improving',
      recommendation: 'Enhance personalization'
    }
  ];

  const revenueForecasts = [
    { month: 'Feb 2024', predicted: 42000, lower: 38000, upper: 46000, actual: 41200 },
    { month: 'Mar 2024', predicted: 45000, lower: 41000, upper: 49000, actual: 44800 },
    { month: 'Apr 2024', predicted: 48000, lower: 44000, upper: 52000, actual: null },
    { month: 'May 2024', predicted: 51000, lower: 47000, upper: 55000, actual: null },
    { month: 'Jun 2024', predicted: 54000, lower: 50000, upper: 58000, actual: null }
  ];

  const anomalyDetection = [
    {
      date: '2024-01-15',
      metric: 'Open Rate',
      value: 45.2,
      expected: 32.1,
      severity: 'positive',
      explanation: 'Subject line A/B test winner performed exceptionally well'
    },
    {
      date: '2024-01-18',
      metric: 'Bounce Rate',
      value: 8.9,
      expected: 2.3,
      severity: 'negative',
      explanation: 'List hygiene issue detected in recent import'
    },
    {
      date: '2024-01-22',
      metric: 'Unsubscribe Rate',
      value: 0.1,
      expected: 0.4,
      severity: 'positive',
      explanation: 'Improved content relevance reducing opt-outs'
    }
  ];

  const segmentPredictions = [
    {
      segment: 'High-Value Customers',
      currentSize: 1250,
      predictedGrowth: 8.5,
      churnRisk: 5.2,
      revenue: 125000,
      engagement: 78
    },
    {
      segment: 'New Subscribers',
      currentSize: 2340,
      predictedGrowth: 15.3,
      churnRisk: 22.1,
      revenue: 45000,
      engagement: 65
    },
    {
      segment: 'Re-engaged Users',
      currentSize: 890,
      predictedGrowth: -5.2,
      churnRisk: 18.7,
      revenue: 23000,
      engagement: 42
    }
  ];

  const mlInsights = [
    {
      type: 'Opportunity',
      title: 'Send Time Optimization',
      description: 'Sending at 2 PM could increase open rates by 12%',
      impact: 'High',
      effort: 'Low',
      confidence: 91
    },
    {
      type: 'Warning',
      title: 'Churn Risk Increase',
      description: 'VIP segment showing early churn signals',
      impact: 'High',
      effort: 'Medium',
      confidence: 78
    },
    {
      type: 'Insight',
      title: 'Content Performance',
      description: 'Educational content outperforming promotional by 35%',
      impact: 'Medium',
      effort: 'Low',
      confidence: 85
    },
    {
      type: 'Recommendation',
      title: 'Segmentation Refinement',
      description: 'New behavioral segments identified for better targeting',
      impact: 'Medium',
      effort: 'High',
      confidence: 73
    }
  ];

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  const getRiskColor = (risk: number) => {
    if (risk < 10) return 'text-green-600';
    if (risk < 25) return 'text-yellow-600';
    if (risk < 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRiskBadge = (risk: number) => {
    if (risk < 10) return <Badge className="bg-green-100 text-green-800">Low Risk</Badge>;
    if (risk < 25) return <Badge className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>;
    if (risk < 50) return <Badge className="bg-orange-100 text-orange-800">High Risk</Badge>;
    return <Badge className="bg-red-100 text-red-800">Critical Risk</Badge>;
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'Opportunity': return <Lightbulb className="h-5 w-5 text-blue-500" />;
      case 'Warning': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'Insight': return <Brain className="h-5 w-5 text-purple-500" />;
      case 'Recommendation': return <Target className="h-5 w-5 text-green-500" />;
      default: return <Zap className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Predictive Analytics</h2>
          <p className="text-gray-600">AI-powered insights and future performance predictions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Models
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Churn Risk</p>
                <p className={`text-2xl font-bold ${getRiskColor(predictionOverview.churnRisk)}`}>
                  {predictionOverview.churnRisk}%
                </p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
            <div className="mt-2">
              {getRiskBadge(predictionOverview.churnRisk)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Optimal Send Time</p>
                <p className="text-2xl font-bold text-blue-600">{predictionOverview.optimalSendTime}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-sm text-gray-600 mt-2">+12% open rate boost</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue Forecast</p>
                <p className="text-2xl font-bold text-green-600">
                  ${predictionOverview.predictedRevenue.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-sm text-gray-600 mt-2">Next 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Model Accuracy</p>
                <p className="text-2xl font-bold text-purple-600">{predictionOverview.modelAccuracy}%</p>
              </div>
              <Brain className="h-8 w-8 text-purple-500" />
            </div>
            <div className="mt-2">
              <Progress value={predictionOverview.modelAccuracy} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Insights</p>
                <p className="text-2xl font-bold">{predictionOverview.trendsDetected}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
            <p className="text-sm text-gray-600 mt-2">New recommendations</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="churn" className="space-y-4">
        <TabsList>
          <TabsTrigger value="churn">Churn Prediction</TabsTrigger>
          <TabsTrigger value="send-time">Send Time</TabsTrigger>
          <TabsTrigger value="content">Content Performance</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Forecast</TabsTrigger>
          <TabsTrigger value="anomalies">Anomaly Detection</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="churn">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Churn Risk by Segment</CardTitle>
                <CardDescription>Predicted probability of subscribers churning in next 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {churnPredictions.map((segment, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">{segment.segment}</h3>
                        {getRiskBadge(segment.risk)}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-600">Churn Risk</p>
                          <p className={`text-xl font-bold ${getRiskColor(segment.risk)}`}>
                            {segment.risk}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Subscribers</p>
                          <p className="text-xl font-bold">{segment.count.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Key Risk Factors:</p>
                        <div className="flex flex-wrap gap-1">
                          {segment.factors.map((factor, factorIndex) => (
                            <Badge key={factorIndex} variant="secondary" className="text-xs">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Churn Factor Analysis</CardTitle>
                <CardDescription>Most important factors in predicting churn</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {churnFactors.map((factor, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{factor.factor}</p>
                        <Badge 
                          variant="outline" 
                          className={`text-xs mt-1 ${
                            factor.impact === 'High' ? 'border-red-200 text-red-700' :
                            factor.impact === 'Medium' ? 'border-yellow-200 text-yellow-700' :
                            'border-gray-200 text-gray-700'
                          }`}
                        >
                          {factor.impact} Impact
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{Math.round(factor.importance * 100)}%</p>
                        <p className="text-sm text-gray-600">importance</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="send-time">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Send Time Optimization</CardTitle>
                <CardDescription>Predicted vs actual performance by hour</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sendTimeOptimization}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="predicted" fill="#3B82F6" name="Predicted %" />
                      <Bar dataKey="actual" fill="#10B981" name="Actual %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prediction Confidence</CardTitle>
                <CardDescription>Model confidence levels for each time slot</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sendTimeOptimization.map((time, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{time.hour}</p>
                        <p className="text-sm text-gray-600">
                          Predicted: {time.predicted}% | Actual: {time.actual}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{time.confidence}%</p>
                        <div className="w-20 mt-1">
                          <Progress value={time.confidence} className="h-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Content Performance Predictions</CardTitle>
              <CardDescription>Predicted engagement rates and optimization recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {contentPerformance.map((content, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h3 className="font-medium text-lg mb-3">{content.type}</h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Predicted CTR</span>
                        <span className="font-bold">{content.predicted}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Actual CTR</span>
                        <span className="font-bold">{content.actual}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Trend</span>
                        <Badge 
                          className={
                            content.trend === 'improving' ? 'bg-green-100 text-green-800' :
                            content.trend === 'declining' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }
                        >
                          {content.trend}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">{content.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Forecasting</CardTitle>
              <CardDescription>Predicted revenue with confidence intervals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueForecasts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="upper" 
                      stackId="1" 
                      stroke="none" 
                      fill="#E5E7EB" 
                      name="Upper Bound"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="predicted" 
                      stackId="2" 
                      stroke="#3B82F6" 
                      fill="#3B82F6" 
                      fillOpacity={0.6}
                      name="Predicted"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="lower" 
                      stackId="3" 
                      stroke="none" 
                      fill="#F3F4F6" 
                      name="Lower Bound"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="#10B981" 
                      strokeWidth={3} 
                      name="Actual"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies">
          <Card>
            <CardHeader>
              <CardTitle>Anomaly Detection</CardTitle>
              <CardDescription>Unusual patterns detected in your email metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {anomalyDetection.map((anomaly, index) => (
                  <Alert key={index} className={`border-l-4 ${
                    anomaly.severity === 'positive' ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {anomaly.severity === 'positive' ? 
                          <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" /> :
                          <TrendingDown className="h-5 w-5 text-red-500 mt-0.5" />
                        }
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{anomaly.metric} Anomaly</h3>
                            <Badge variant="outline" className="text-xs">
                              {anomaly.date}
                            </Badge>
                          </div>
                          <AlertDescription className="text-sm">
                            {anomaly.explanation}
                          </AlertDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${
                          anomaly.severity === 'positive' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {anomaly.value}%
                        </p>
                        <p className="text-sm text-gray-600">vs {anomaly.expected}% expected</p>
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>AI-Generated Insights</CardTitle>
                <CardDescription>Actionable recommendations from machine learning analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mlInsights.map((insight, index) => (
                    <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        {getInsightIcon(insight.type)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">{insight.title}</h3>
                            <Badge 
                              className={
                                insight.impact === 'High' ? 'bg-red-100 text-red-800' :
                                insight.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }
                            >
                              {insight.impact} Impact
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <span className="text-xs text-gray-500">Effort: {insight.effort}</span>
                              <span className="text-xs text-gray-500">Confidence: {insight.confidence}%</span>
                            </div>
                            <Button variant="outline" size="sm">
                              <span className="text-xs">Apply</span>
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Segment Growth Predictions</CardTitle>
                <CardDescription>Forecasted changes in audience segments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {segmentPredictions.map((segment, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <h3 className="font-medium text-lg mb-3">{segment.segment}</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Current Size</p>
                          <p className="text-xl font-bold">{segment.currentSize.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Predicted Growth</p>
                          <p className={`text-xl font-bold ${
                            segment.predictedGrowth > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {segment.predictedGrowth > 0 ? '+' : ''}{segment.predictedGrowth}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Churn Risk</p>
                          <p className={`text-xl font-bold ${getRiskColor(segment.churnRisk)}`}>
                            {segment.churnRisk}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Revenue</p>
                          <p className="text-xl font-bold">${segment.revenue.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
