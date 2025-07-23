'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import {
  Users,
  UserPlus,
  UserMinus,
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';

interface CohortAnalysisProps {
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export default function CohortAnalysis({ dateRange }: CohortAnalysisProps) {
  const [selectedMetric, setSelectedMetric] = useState('retention');
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedCohortSize, setSelectedCohortSize] = useState('12');

  // Mock data - in real app, this would come from Convex
  const cohortOverview = {
    totalCohorts: 12,
    averageRetention: 68.5,
    strongestCohort: 'January 2024',
    weakestCohort: 'March 2024',
    retentionTrend: 'improving'
  };

  // Cohort retention table data
  const cohortRetentionData = [
    {
      cohort: 'Jan 2024',
      size: 1250,
      month0: 100,
      month1: 82.4,
      month2: 71.2,
      month3: 64.8,
      month4: 58.9,
      month5: 54.3,
      month6: 49.7
    },
    {
      cohort: 'Feb 2024',
      size: 1180,
      month0: 100,
      month1: 85.1,
      month2: 73.6,
      month3: 67.4,
      month4: 61.8,
      month5: 56.2,
      month6: null
    },
    {
      cohort: 'Mar 2024',
      size: 980,
      month0: 100,
      month1: 78.6,
      month2: 65.3,
      month3: 58.1,
      month4: 52.7,
      month5: null,
      month6: null
    },
    {
      cohort: 'Apr 2024',
      size: 1420,
      month0: 100,
      month1: 87.3,
      month2: 76.8,
      month3: 69.2,
      month4: null,
      month5: null,
      month6: null
    },
    {
      cohort: 'May 2024',
      size: 1330,
      month0: 100,
      month1: 84.9,
      month2: 74.1,
      month3: null,
      month4: null,
      month5: null,
      month6: null
    },
    {
      cohort: 'Jun 2024',
      size: 1560,
      month0: 100,
      month1: 89.7,
      month2: null,
      month3: null,
      month4: null,
      month5: null,
      month6: null
    }
  ];

  const retentionTrends = [
    { period: 'Month 1', jan: 82.4, feb: 85.1, mar: 78.6, apr: 87.3, may: 84.9, jun: 89.7 },
    { period: 'Month 2', jan: 71.2, feb: 73.6, mar: 65.3, apr: 76.8, may: 74.1, jun: null },
    { period: 'Month 3', jan: 64.8, feb: 67.4, mar: 58.1, apr: 69.2, may: null, jun: null },
    { period: 'Month 4', jan: 58.9, feb: 61.8, mar: 52.7, apr: null, may: null, jun: null },
    { period: 'Month 5', jan: 54.3, feb: 56.2, mar: null, apr: null, may: null, jun: null },
    { period: 'Month 6', jan: 49.7, feb: null, mar: null, apr: null, may: null, jun: null }
  ];

  const cohortComparison = [
    { cohort: 'Q1 2024', retention30: 78.2, retention90: 62.1, ltv: 245, engagement: 68 },
    { cohort: 'Q2 2024', retention30: 82.6, retention90: 67.4, ltv: 289, engagement: 74 },
    { cohort: 'Q3 2024', retention30: 85.9, retention90: 71.2, ltv: 312, engagement: 79 },
    { cohort: 'Q4 2024', retention30: 88.1, retention90: 74.8, ltv: 338, engagement: 82 }
  ];

  const segmentCohorts = [
    {
      segment: 'Newsletter Subscribers',
      cohorts: [
        { month: 'Jan', size: 450, retention: 72.4 },
        { month: 'Feb', size: 420, retention: 75.1 },
        { month: 'Mar', size: 380, retention: 68.9 },
        { month: 'Apr', size: 520, retention: 78.2 }
      ]
    },
    {
      segment: 'Product Users',
      cohorts: [
        { month: 'Jan', size: 320, retention: 84.2 },
        { month: 'Feb', size: 290, retention: 87.6 },
        { month: 'Mar', size: 250, retention: 81.3 },
        { month: 'Apr', size: 380, retention: 89.1 }
      ]
    },
    {
      segment: 'Free Trial',
      cohorts: [
        { month: 'Jan', size: 480, retention: 45.8 },
        { month: 'Feb', size: 470, retention: 48.2 },
        { month: 'Mar', size: 350, retention: 42.1 },
        { month: 'Apr', size: 520, retention: 51.7 }
      ]
    }
  ];

  const engagementCohorts = [
    { period: 'Week 1', high: 95, medium: 87, low: 72 },
    { period: 'Week 2', high: 89, medium: 78, low: 58 },
    { period: 'Week 3', high: 84, medium: 71, low: 47 },
    { period: 'Week 4', high: 81, medium: 65, low: 39 },
    { period: 'Month 2', high: 76, medium: 58, low: 28 },
    { period: 'Month 3', high: 72, medium: 52, low: 21 }
  ];

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const getRetentionColor = (value: number | null) => {
    if (value === null) return 'bg-gray-100';
    if (value >= 80) return 'bg-green-100 text-green-800';
    if (value >= 60) return 'bg-yellow-100 text-yellow-800';
    if (value >= 40) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const formatRetentionValue = (value: number | null) => {
    if (value === null) return '-';
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Cohort Analysis</h2>
          <p className="text-gray-600">Track subscriber retention and behavior over time</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Cohorts</p>
                <p className="text-2xl font-bold">{cohortOverview.totalCohorts}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-sm text-gray-600 mt-2">Active cohorts tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Retention</p>
                <p className="text-2xl font-bold text-green-600">{cohortOverview.averageRetention}%</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-sm text-green-600">+2.3% from last period</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Best Cohort</p>
                <p className="text-lg font-bold">{cohortOverview.strongestCohort}</p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-sm text-gray-600 mt-2">Highest retention rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Trend</p>
                <p className="text-lg font-bold text-green-600 capitalize">{cohortOverview.retentionTrend}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-sm text-gray-600 mt-2">Overall direction</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="retention-table" className="space-y-4">
        <TabsList>
          <TabsTrigger value="retention-table">Retention Table</TabsTrigger>
          <TabsTrigger value="trends">Retention Trends</TabsTrigger>
          <TabsTrigger value="comparison">Cohort Comparison</TabsTrigger>
          <TabsTrigger value="segments">By Segment</TabsTrigger>
          <TabsTrigger value="engagement">Engagement Cohorts</TabsTrigger>
        </TabsList>

        <TabsContent value="retention-table">
          <Card>
            <CardHeader>
              <CardTitle>Cohort Retention Table</CardTitle>
              <CardDescription>
                Percentage of subscribers remaining active in each period after acquisition
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Cohort</th>
                      <th className="text-left p-3 font-medium">Size</th>
                      <th className="text-center p-3 font-medium">Month 0</th>
                      <th className="text-center p-3 font-medium">Month 1</th>
                      <th className="text-center p-3 font-medium">Month 2</th>
                      <th className="text-center p-3 font-medium">Month 3</th>
                      <th className="text-center p-3 font-medium">Month 4</th>
                      <th className="text-center p-3 font-medium">Month 5</th>
                      <th className="text-center p-3 font-medium">Month 6</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohortRetentionData.map((cohort, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{cohort.cohort}</td>
                        <td className="p-3">{cohort.size.toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded text-sm ${getRetentionColor(cohort.month0)}`}>
                            {formatRetentionValue(cohort.month0)}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded text-sm ${getRetentionColor(cohort.month1)}`}>
                            {formatRetentionValue(cohort.month1)}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded text-sm ${getRetentionColor(cohort.month2)}`}>
                            {formatRetentionValue(cohort.month2)}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded text-sm ${getRetentionColor(cohort.month3)}`}>
                            {formatRetentionValue(cohort.month3)}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded text-sm ${getRetentionColor(cohort.month4)}`}>
                            {formatRetentionValue(cohort.month4)}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded text-sm ${getRetentionColor(cohort.month5)}`}>
                            {formatRetentionValue(cohort.month5)}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded text-sm ${getRetentionColor(cohort.month6)}`}>
                            {formatRetentionValue(cohort.month6)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 rounded"></div>
                  <span>80%+ retention</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-100 rounded"></div>
                  <span>60-79% retention</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-100 rounded"></div>
                  <span>40-59% retention</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 rounded"></div>
                  <span>&lt;40% retention</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Retention Curve Trends</CardTitle>
              <CardDescription>Compare retention patterns across different cohorts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={retentionTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="jan" stroke={COLORS[0]} strokeWidth={2} name="Jan 2024" />
                    <Line type="monotone" dataKey="feb" stroke={COLORS[1]} strokeWidth={2} name="Feb 2024" />
                    <Line type="monotone" dataKey="mar" stroke={COLORS[2]} strokeWidth={2} name="Mar 2024" />
                    <Line type="monotone" dataKey="apr" stroke={COLORS[3]} strokeWidth={2} name="Apr 2024" />
                    <Line type="monotone" dataKey="may" stroke={COLORS[4]} strokeWidth={2} name="May 2024" />
                    <Line type="monotone" dataKey="jun" stroke={COLORS[5]} strokeWidth={2} name="Jun 2024" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Quarterly Cohort Comparison</CardTitle>
              <CardDescription>Compare key metrics across quarterly cohorts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-80">
                  <h3 className="text-lg font-medium mb-4">Retention Rates</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cohortComparison}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="cohort" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="retention30" fill="#3B82F6" name="30-day Retention" />
                      <Bar dataKey="retention90" fill="#10B981" name="90-day Retention" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="h-80">
                  <h3 className="text-lg font-medium mb-4">Lifetime Value</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cohortComparison}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="cohort" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="ltv" 
                        stroke="#8B5CF6" 
                        fill="#8B5CF6" 
                        fillOpacity={0.6}
                        name="LTV ($)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                {cohortComparison.map((cohort, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h3 className="font-medium text-lg mb-3">{cohort.cohort}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">30-day</span>
                        <span className="font-medium">{cohort.retention30}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">90-day</span>
                        <span className="font-medium">{cohort.retention90}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">LTV</span>
                        <span className="font-medium">${cohort.ltv}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Engagement</span>
                        <span className="font-medium">{cohort.engagement}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments">
          <Card>
            <CardHeader>
              <CardTitle>Segment-Based Cohort Analysis</CardTitle>
              <CardDescription>Retention patterns across different subscriber segments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {segmentCohorts.map((segment, segmentIndex) => (
                  <div key={segmentIndex} className="p-4 border rounded-lg">
                    <h3 className="font-medium text-lg mb-4">{segment.segment}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {segment.cohorts.map((cohort, cohortIndex) => (
                        <div key={cohortIndex} className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">{cohort.month} 2024</p>
                          <p className="text-2xl font-bold">{cohort.retention}%</p>
                          <p className="text-sm text-gray-600">{cohort.size} subscribers</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement">
          <Card>
            <CardHeader>
              <CardTitle>Engagement-Based Cohorts</CardTitle>
              <CardDescription>Retention by initial engagement level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={engagementCohorts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="high" 
                      stroke="#10B981" 
                      strokeWidth={3} 
                      name="High Engagement"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="medium" 
                      stroke="#F59E0B" 
                      strokeWidth={3} 
                      name="Medium Engagement"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="low" 
                      stroke="#EF4444" 
                      strokeWidth={3} 
                      name="Low Engagement"
                    />
                    <ReferenceLine y={50} stroke="#94A3B8" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg bg-green-50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <h3 className="font-medium">High Engagement</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Users who opened 3+ emails in first week
                  </p>
                  <p className="text-2xl font-bold text-green-600">72%</p>
                  <p className="text-sm text-gray-600">3-month retention</p>
                </div>

                <div className="p-4 border rounded-lg bg-yellow-50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                    <h3 className="font-medium">Medium Engagement</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Users who opened 1-2 emails in first week
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">52%</p>
                  <p className="text-sm text-gray-600">3-month retention</p>
                </div>

                <div className="p-4 border rounded-lg bg-red-50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <h3 className="font-medium">Low Engagement</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Users who opened 0 emails in first week
                  </p>
                  <p className="text-2xl font-bold text-red-600">21%</p>
                  <p className="text-sm text-gray-600">3-month retention</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
