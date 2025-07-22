"use client";

import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ABTestSetup from './ABTestSetup';
import ABTestResults from './ABTestResults';
import { 
  BeakerIcon, 
  Plus, 
  Search, 
  Filter, 
  Play, 
  Pause, 
  Square, 
  BarChart3, 
  Settings, 
  Calendar, 
  Users, 
  TrendingUp, 
  Trophy, 
  Clock,
  AlertCircle,
  CheckCircle2,
  Eye,
  MoreHorizontal,
  Target
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ABTestDashboard: React.FC = () => {
  const abTests = useQuery(api.abTesting.getABTestsByUser);
  const startTest = useMutation(api.abTesting.startABTest);
  const pauseTest = useMutation(api.abTesting.pauseABTest);
  const resumeTest = useMutation(api.abTesting.resumeABTest);
  const declareWinner = useMutation(api.abTesting.declareWinnerManually);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedTestId, setSelectedTestId] = useState<Id<"abTests"> | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('tests');

  // Filter tests based on search and filters
  const filteredTests = React.useMemo(() => {
    if (!abTests) return [];
    
    return abTests.filter((test:any) => {
      const matchesSearch = test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (test.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesStatus = statusFilter === 'all' || test.status === statusFilter;
      const matchesType = typeFilter === 'all' || test.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [abTests, searchTerm, statusFilter, typeFilter]);

  // Calculate dashboard stats
  const dashboardStats = React.useMemo(() => {
    if (!abTests) return { total: 0, active: 0, completed: 0, draft: 0 };
    
    return {
      total: abTests.length,
      active: abTests.filter(t => t.status === 'active').length,
      completed: abTests.filter(t => t.status === 'completed').length,
      draft: abTests.filter(t => t.status === 'draft').length,
    };
  }, [abTests]);

  const handleTestAction = async (testId: Id<"abTests">, action: 'start' | 'pause' | 'resume') => {
    try {
      switch (action) {
        case 'start':
          await startTest({ testId });
          break;
        case 'pause':
          await pauseTest({ testId });
          break;
        case 'resume':
          await resumeTest({ testId });
          break;
      }
    } catch (error) {
      console.error(`Failed to ${action} test:`, error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'subject_line':
        return <Target className="h-4 w-4" />;
      case 'content':
        return <BarChart3 className="h-4 w-4" />;
      case 'send_time':
        return <Clock className="h-4 w-4" />;
      case 'from_name':
        return <Users className="h-4 w-4" />;
      case 'multivariate':
        return <Settings className="h-4 w-4" />;
      default:
        return <BeakerIcon className="h-4 w-4" />;
    }
  };

  const formatTestType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const calculateTestDuration = (test: any) => {
    if (!test.startedAt) return 'Not started';
    
    const duration = Math.floor((Date.now() - test.startedAt) / (1000 * 60 * 60 * 24));
    const maxDuration = test.testConfiguration.statisticalSettings.testDuration.maxDays;
    
    return `${duration}/${maxDuration} days`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BeakerIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">A/B Testing</h1>
            <p className="text-gray-600">Optimize your email campaigns with data-driven experiments</p>
          </div>
        </div>
        
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Test
        </Button>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <BeakerIcon className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium">Total Tests</span>
            </div>
            <div className="text-2xl font-bold">{dashboardStats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Play className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">Active Tests</span>
            </div>
            <div className="text-2xl font-bold">{dashboardStats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium">Completed</span>
            </div>
            <div className="text-2xl font-bold">{dashboardStats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium">Draft</span>
            </div>
            <div className="text-2xl font-bold">{dashboardStats.draft}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="tests">All Tests</TabsTrigger>
          <TabsTrigger value="active">Active Tests</TabsTrigger>
          <TabsTrigger value="completed">Completed Tests</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search tests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="subject_line">Subject Line</SelectItem>
                    <SelectItem value="content">Content</SelectItem>
                    <SelectItem value="send_time">Send Time</SelectItem>
                    <SelectItem value="from_name">From Name</SelectItem>
                    <SelectItem value="multivariate">Multivariate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tests Table */}
          <Card>
            <CardHeader>
              <CardTitle>A/B Tests</CardTitle>
              <CardDescription>
                Manage and monitor your email A/B tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredTests.length === 0 ? (
                <div className="text-center py-12">
                  <BeakerIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {abTests?.length === 0 ? 'No A/B Tests Yet' : 'No Tests Match Your Filters'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {abTests?.length === 0 
                      ? 'Create your first A/B test to start optimizing your email campaigns'
                      : 'Try adjusting your search or filter criteria'
                    }
                  </p>
                  {abTests?.length === 0 && (
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Test
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Participants</TableHead>
                      <TableHead>Primary Metric</TableHead>
                      <TableHead>Winner</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTests.map((test:any) => (
                      <TableRow key={test._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{test.name}</div>
                            {test.description && (
                              <div className="text-sm text-gray-600 truncate max-w-xs">
                                {test.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(test.type)}
                            <span className="text-sm">{formatTestType(test.type)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(test.status)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {calculateTestDuration(test)}
                          </div>
                          {test.startedAt && (
                            <div className="text-xs text-gray-500">
                              Started {new Date(test.startedAt).toLocaleDateString()}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {test.testConfiguration.audienceSettings.totalAudience.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {test.testConfiguration.audienceSettings.testPercentage}% in test
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(test.testConfiguration.successMetrics.primary)}
                            <span className="text-sm">
                              {test.testConfiguration.successMetrics.primary.replace('_', ' ')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {test.winningVariantId ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <Trophy className="h-4 w-4" />
                              <span className="text-sm">Declared</span>
                            </div>
                          ) : test.status === 'active' ? (
                            <div className="flex items-center gap-1 text-yellow-600">
                              <Clock className="h-4 w-4" />
                              <span className="text-sm">Pending</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedTestId(test._id);
                                  setShowResultsDialog(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Results
                              </DropdownMenuItem>
                              
                              {test.status === 'draft' && (
                                <DropdownMenuItem 
                                  onClick={() => handleTestAction(test._id, 'start')}
                                >
                                  <Play className="h-4 w-4 mr-2" />
                                  Start Test
                                </DropdownMenuItem>
                              )}
                              
                              {test.status === 'active' && (
                                <DropdownMenuItem 
                                  onClick={() => handleTestAction(test._id, 'pause')}
                                >
                                  <Pause className="h-4 w-4 mr-2" />
                                  Pause Test
                                </DropdownMenuItem>
                              )}
                              
                              {test.status === 'paused' && (
                                <DropdownMenuItem 
                                  onClick={() => handleTestAction(test._id, 'resume')}
                                >
                                  <Play className="h-4 w-4 mr-2" />
                                  Resume Test
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-6">
          <div className="grid gap-6">
            {abTests?.filter((test:any) => test.status === 'active').map((test:any) => (
              <Card key={test._id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {getTypeIcon(test.type)}
                        {test.name}
                      </CardTitle>
                      <CardDescription>
                        {formatTestType(test.type)} • {calculateTestDuration(test)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(test.status)}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedTestId(test._id);
                          setShowResultsDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Results
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Participants</div>
                      <div className="text-lg font-semibold">
                        {test.testConfiguration.audienceSettings.totalAudience.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Primary Metric</div>
                      <div className="text-lg font-semibold">
                        {test.testConfiguration.successMetrics.primary.replace('_', ' ')}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Duration Left</div>
                      <div className="text-lg font-semibold">
                        {test.startedAt ? 
                          Math.max(0, test.testConfiguration.statisticalSettings.testDuration.maxDays - 
                            Math.floor((Date.now() - test.startedAt) / (1000 * 60 * 60 * 24))) : 
                          test.testConfiguration.statisticalSettings.testDuration.maxDays
                        } days
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Auto Winner</div>
                      <div className="text-lg font-semibold">
                        {test.testConfiguration.statisticalSettings.automaticWinner ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {(!abTests || abTests.filter((test:any) => test.status === 'active').length === 0) && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Play className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Tests</h3>
                  <p className="text-gray-600">Start an A/B test to see real-time results here.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-6">
          <div className="grid gap-6">
            {abTests?.filter(test => test.status === 'completed').map(test => (
              <Card key={test._id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {getTypeIcon(test.type)}
                        {test.name}
                        {test.winningVariantId && (
                          <Badge className="bg-green-100 text-green-800">
                            <Trophy className="h-3 w-3 mr-1" />
                            Winner Declared
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Completed {test.completedAt ? new Date(test.completedAt).toLocaleDateString() : 'Unknown'}
                      </CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSelectedTestId(test._id);
                        setShowResultsDialog(true);
                      }}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Full Results
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Total Participants</div>
                      <div className="text-lg font-semibold">
                        {test.testConfiguration.audienceSettings.totalAudience.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Test Duration</div>
                      <div className="text-lg font-semibold">
                        {test.startedAt && test.completedAt ? 
                          Math.floor((test.completedAt - test.startedAt) / (1000 * 60 * 60 * 24)) : 
                          'Unknown'
                        } days
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Primary Metric</div>
                      <div className="text-lg font-semibold">
                        {test.testConfiguration.successMetrics.primary.replace('_', ' ')}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Significance</div>
                      <div className="text-lg font-semibold">
                        {test.testConfiguration.statisticalSettings.confidenceLevel}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {(!abTests || abTests.filter(test => test.status === 'completed').length === 0) && (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Completed Tests</h3>
                  <p className="text-gray-600">Completed A/B tests will appear here with their final results.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardContent className="p-12 text-center">
              <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Insights Coming Soon</h3>
              <p className="text-gray-600">
                Cross-test insights and recommendations will be available here to help you 
                optimize your overall testing strategy.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Test Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Create New A/B Test</DialogTitle>
            <DialogDescription>
              Set up a new A/B test to optimize your email campaigns
            </DialogDescription>
          </DialogHeader>
          <ABTestSetup 
            onTestCreated={(testId) => {
              setShowCreateDialog(false);
              setSelectedTestId(testId);
              setShowResultsDialog(true);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-auto">
          {selectedTestId && (
            <ABTestResults testId={selectedTestId} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ABTestDashboard;
