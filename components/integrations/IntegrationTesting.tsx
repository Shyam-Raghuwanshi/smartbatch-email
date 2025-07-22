"use client";

import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Play, 
  Pause, 
  Settings, 
  Download, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  BarChart3,
  Calendar,
  Filter,
  RefreshCw,
  Plus,
  Eye,
  Edit,
  Trash2,
  TestTube,
  Shield,
  Zap,
  Database,
  Globe,
  Lock
} from 'lucide-react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

interface IntegrationTestingProps {
  userId: Id<"users">;
}

const testTypeIcons = {
  connectivity: Globe,
  authentication: Lock,
  data_sync: Database,
  webhooks: Zap,
  rate_limiting: Shield,
  error_handling: AlertTriangle,
  performance: BarChart3,
  data_integrity: CheckCircle,
  security: Shield,
  compliance: CheckCircle
};

const statusColors = {
  running: 'bg-blue-500',
  passed: 'bg-green-500',
  failed: 'bg-red-500',
  skipped: 'bg-gray-500',
  error: 'bg-orange-500'
};

export const IntegrationTesting: React.FC<IntegrationTestingProps> = ({ userId }) => {
  const [selectedIntegration, setSelectedIntegration] = useState<string>('all');
  const [selectedTestType, setSelectedTestType] = useState<string>('all');
  const [selectedTest, setSelectedTest] = useState<Id<"integrationTests"> | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showExecutionDetails, setShowExecutionDetails] = useState<Id<"integrationTestExecutions"> | null>(null);

  // Queries
  const integrations = useQuery(api.integrations.getUserIntegrations, { userId });
  const tests = useQuery(api.integrationTesting.getIntegrationTests, { 
    integrationId: selectedIntegration === 'all' ? undefined : selectedIntegration as Id<"integrations">
  });
  const recentExecutions = useQuery(api.integrationTesting.getRecentTestExecutions, { limit: 20 });
  const testMetrics = useQuery(api.integrationTesting.getTestMetrics, {});

  // Mutations
  const createTest = useMutation(api.integrationTesting.createIntegrationTest);
  const runTest = useMutation(api.integrationTesting.runIntegrationTest);
  const updateTest = useMutation(api.integrationTesting.updateIntegrationTest);
  const deleteTest = useMutation(api.integrationTesting.deleteIntegrationTest);

  const filteredTests = tests?.filter(test => 
    selectedTestType === 'all' || test.type === selectedTestType
  ) || [];

  const TestCard = ({ test }: { test: any }) => {
    const IconComponent = testTypeIcons[test.type as keyof typeof testTypeIcons];
    const lastExecution = recentExecutions?.find(exec => exec.testId === test._id);

    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedTest(test._id)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <IconComponent className="w-5 h-5 text-blue-500" />
              <CardTitle className="text-lg">{test.name}</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={test.isEnabled ? "default" : "secondary"}>
                {test.isEnabled ? "Enabled" : "Disabled"}
              </Badge>
              {lastExecution && (
                <div className={`w-3 h-3 rounded-full ${statusColors[lastExecution.status]}`} />
              )}
            </div>
          </div>
          <CardDescription>{test.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Type:</span>
              <Badge variant="outline">{test.type.replace('_', ' ').toUpperCase()}</Badge>
            </div>
            {lastExecution && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Last Run:</span>
                <span>{format(new Date(lastExecution.startedAt), 'MMM d, HH:mm')}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Schedule:</span>
              <span>{test.schedule ? test.schedule.cron : 'Manual'}</span>
            </div>
          </div>
          <div className="flex space-x-2 mt-4">
            <Button 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                runTest({ testId: test._id });
              }}
              disabled={!test.isEnabled}
            >
              <Play className="w-4 h-4 mr-1" />
              Run
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTest(test._id);
              }}
            >
              <Settings className="w-4 h-4 mr-1" />
              Config
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ExecutionResultsCard = ({ execution }: { execution: any }) => {
    const statusIcon = {
      running: <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />,
      passed: <CheckCircle className="w-4 h-4 text-green-500" />,
      failed: <XCircle className="w-4 h-4 text-red-500" />,
      skipped: <Clock className="w-4 h-4 text-gray-500" />,
      error: <AlertTriangle className="w-4 h-4 text-orange-500" />
    };

    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow" 
            onClick={() => setShowExecutionDetails(execution._id)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {statusIcon[execution.status]}
              <div>
                <div className="font-medium">Test #{execution._id.slice(-8)}</div>
                <div className="text-sm text-gray-500">
                  {format(new Date(execution.startedAt), 'MMM d, HH:mm:ss')}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium capitalize">{execution.status}</div>
              {execution.duration && (
                <div className="text-sm text-gray-500">{execution.duration}ms</div>
              )}
            </div>
          </div>
          {execution.results?.assertions && (
            <div className="mt-3 flex items-center space-x-4 text-sm">
              <span className="text-green-600">
                ✓ {execution.results.assertions.filter((a: any) => a.passed).length} passed
              </span>
              <span className="text-red-600">
                ✗ {execution.results.assertions.filter((a: any) => !a.passed).length} failed
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const MetricsOverview = () => {
    if (!testMetrics) return <div>Loading metrics...</div>;

    const successRate = testMetrics.totalExecutions > 0 
      ? ((testMetrics.passedExecutions / testMetrics.totalExecutions) * 100).toFixed(1)
      : '0';

    const pieData = [
      { name: 'Passed', value: testMetrics.passedExecutions, color: '#10b981' },
      { name: 'Failed', value: testMetrics.failedExecutions, color: '#ef4444' },
      { name: 'Error', value: testMetrics.errorExecutions, color: '#f97316' },
      { name: 'Skipped', value: testMetrics.skippedExecutions, color: '#6b7280' }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TestTube className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tests</p>
                <p className="text-2xl font-bold">{testMetrics.totalTests}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">{successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                <p className="text-2xl font-bold">{Math.round(testMetrics.averageDuration)}ms</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold">{testMetrics.executionsThisWeek}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Integration Testing</h2>
          <p className="text-gray-600">Automated testing for your integrations</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Test
        </Button>
      </div>

      <MetricsOverview />

      <Tabs defaultValue="tests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="executions">Recent Executions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-4">
          <div className="flex items-center space-x-4">
            <Select value={selectedIntegration} onValueChange={setSelectedIntegration}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by integration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Integrations</SelectItem>
                {integrations?.map((integration) => (
                  <SelectItem key={integration._id} value={integration._id}>
                    {integration.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTestType} onValueChange={setSelectedTestType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.keys(testTypeIcons).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace('_', ' ').toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTests.map((test) => (
              <TestCard key={test._id} test={test} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <div className="space-y-4">
            {recentExecutions?.map((execution) => (
              <ExecutionResultsCard key={execution._id} execution={execution} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Reports</CardTitle>
              <CardDescription>Generate and download test execution reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button>
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Results Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Passed', value: testMetrics?.passedExecutions || 0, fill: '#10b981' },
                        { name: 'Failed', value: testMetrics?.failedExecutions || 0, fill: '#ef4444' },
                        { name: 'Error', value: testMetrics?.errorExecutions || 0, fill: '#f97316' },
                        { name: 'Skipped', value: testMetrics?.skippedExecutions || 0, fill: '#6b7280' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Success Rate Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={testMetrics?.trendData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="successRate" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Test Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Integration Test</DialogTitle>
            <DialogDescription>
              Set up a new automated test for your integration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Test Name</Label>
                <Input placeholder="Enter test name" />
              </div>
              <div>
                <Label>Integration</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select integration" />
                  </SelectTrigger>
                  <SelectContent>
                    {integrations?.map((integration) => (
                      <SelectItem key={integration._id} value={integration._id}>
                        {integration.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Test Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select test type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(testTypeIcons).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace('_', ' ').toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea placeholder="Describe what this test validates" />
            </div>
            <div className="flex items-center space-x-2">
              <Switch />
              <Label>Enable automatic scheduling</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button>Create Test</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
