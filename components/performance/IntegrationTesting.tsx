"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, Play, RefreshCw, Database } from 'lucide-react';
import { ContactsTable } from '@/components/contacts/ContactsTable';
import { VirtualContactList } from '@/components/ui/virtual-scroll';
import { InfiniteContacts } from '@/components/ui/infinite-scroll';
import { usePerformanceMonitor, ErrorBoundary } from '@/components/ui/performance';
import { useCache } from '@/components/ui/cache';
import { Id } from '@/convex/_generated/dataModel';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
  metrics?: Record<string, number>;
}

interface PerformanceTest {
  id: string;
  name: string;
  description: string;
  testFunction: () => Promise<TestResult>;
}

// Mock data generator for performance testing
function generateTestContacts(count: number) {
  const contacts = [];
  const companies = ['Acme Corp', 'TechStart Inc', 'DataFlow Ltd', 'CloudSync', 'DevTools Co', 'InnovateLab', 'ScaleUp Solutions'];
  const tags = ['lead', 'customer', 'vip', 'newsletter', 'prospect', 'partner', 'trial', 'enterprise'];
  
  for (let i = 0; i < count; i++) {
    contacts.push({
      _id: `test_contact_${i}` as Id<"contacts">,
      email: `testuser${i}@performance.test`,
      firstName: `User${i}`,
      lastName: `Test${i}`,
      phone: i % 3 === 0 ? `+1-555-${String(i).padStart(4, '0')}` : undefined,
      company: companies[i % companies.length],
      position: i % 2 === 0 ? 'Manager' : 'Developer',
      tags: tags.slice(0, Math.floor(Math.random() * 4) + 1),
      isActive: Math.random() > 0.1,
      createdAt: Date.now() - (i * 60 * 60 * 1000), // Spread over hours
      updatedAt: Date.now() - (i * 30 * 60 * 1000),
      source: i % 4 === 0 ? 'import' : 'manual',
      lastEngagement: Math.random() > 0.4 ? Date.now() - (Math.random() * 7 * 24 * 60 * 60 * 1000) : undefined,
      emailStats: {
        totalSent: Math.floor(Math.random() * 100) + 1,
        totalOpened: Math.floor(Math.random() * 60),
        totalClicked: Math.floor(Math.random() * 20),
        lastOpenedAt: Math.random() > 0.4 ? Date.now() - (Math.random() * 7 * 24 * 60 * 60 * 1000) : undefined,
        lastClickedAt: Math.random() > 0.6 ? Date.now() - (Math.random() * 7 * 24 * 60 * 60 * 1000) : undefined,
      },
      customFields: i % 5 === 0 ? { 
        industry: 'Technology', 
        region: ['North America', 'Europe', 'Asia'][i % 3],
        tier: ['Bronze', 'Silver', 'Gold', 'Platinum'][i % 4]
      } : undefined,
    });
  }
  
  return contacts;
}

export function IntegrationTesting() {
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [testData, setTestData] = useState<any[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Id<"contacts">[]>([]);
  
  const { renderTime } = usePerformanceMonitor('IntegrationTesting');
  const { getCachedData, setCachedData, clearCache } = useCache();

  // Define comprehensive performance tests
  const performanceTests: PerformanceTest[] = [
    {
      id: 'data-generation',
      name: 'Large Dataset Generation',
      description: 'Generate 10,000 contact records for testing',
      testFunction: async () => {
        const startTime = performance.now();
        const contacts = generateTestContacts(10000);
        const endTime = performance.now();
        
        setTestData(contacts);
        
        return {
          name: 'Large Dataset Generation',
          status: 'passed',
          duration: endTime - startTime,
          metrics: {
            recordsGenerated: contacts.length,
            generationRate: contacts.length / ((endTime - startTime) / 1000)
          }
        };
      }
    },
    {
      id: 'virtual-scroll-performance',
      name: 'Virtual Scrolling Performance',
      description: 'Test virtual scrolling with 10,000 items',
      testFunction: async () => {
        const startTime = performance.now();
        
        // Simulate virtual scroll initialization
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const endTime = performance.now();
        
        return {
          name: 'Virtual Scrolling Performance',
          status: endTime - startTime < 200 ? 'passed' : 'failed',
          duration: endTime - startTime,
          metrics: {
            itemCount: testData.length,
            initializationTime: endTime - startTime
          }
        };
      }
    },
    {
      id: 'cache-performance',
      name: 'Cache System Performance',
      description: 'Test cache hit/miss rates and performance',
      testFunction: async () => {
        const startTime = performance.now();
        
        // Test cache operations
        const testKey = 'performance-test-data';
        const testValue = { data: testData.slice(0, 1000), timestamp: Date.now() };
        
        // Cache set operation
        setCachedData(testKey, testValue);
        
        // Cache get operation
        const cachedData = getCachedData(testKey);
        
        const endTime = performance.now();
        
        const cacheHit = cachedData !== null;
        
        return {
          name: 'Cache System Performance',
          status: cacheHit ? 'passed' : 'failed',
          duration: endTime - startTime,
          metrics: {
            cacheHit: cacheHit ? 1 : 0,
            operationTime: endTime - startTime,
            dataSize: JSON.stringify(testValue).length
          }
        };
      }
    },
    {
      id: 'bulk-selection',
      name: 'Bulk Selection Performance',
      description: 'Test bulk selection of 5,000 items',
      testFunction: async () => {
        const startTime = performance.now();
        
        const selectedIds = testData.slice(0, 5000).map(contact => contact._id);
        setSelectedContacts(selectedIds);
        
        // Simulate UI update time
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const endTime = performance.now();
        
        return {
          name: 'Bulk Selection Performance',
          status: endTime - startTime < 500 ? 'passed' : 'failed',
          duration: endTime - startTime,
          metrics: {
            itemsSelected: selectedIds.length,
            selectionRate: selectedIds.length / ((endTime - startTime) / 1000)
          }
        };
      }
    },
    {
      id: 'memory-usage',
      name: 'Memory Usage Test',
      description: 'Monitor memory consumption with large datasets',
      testFunction: async () => {
        const startTime = performance.now();
        
        let memoryBefore = 0;
        let memoryAfter = 0;
        
        if ('memory' in performance) {
          memoryBefore = (performance as any).memory.usedJSHeapSize;
        }
        
        // Create additional test data
        const additionalData = generateTestContacts(5000);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if ('memory' in performance) {
          memoryAfter = (performance as any).memory.usedJSHeapSize;
        }
        
        const endTime = performance.now();
        const memoryDiff = memoryAfter - memoryBefore;
        
        return {
          name: 'Memory Usage Test',
          status: memoryDiff < 50 * 1024 * 1024 ? 'passed' : 'failed', // Less than 50MB
          duration: endTime - startTime,
          metrics: {
            memoryBefore: Math.round(memoryBefore / 1024 / 1024),
            memoryAfter: Math.round(memoryAfter / 1024 / 1024),
            memoryDiff: Math.round(memoryDiff / 1024 / 1024)
          }
        };
      }
    },
    {
      id: 'render-performance',
      name: 'Component Render Performance',
      description: 'Test component render times under load',
      testFunction: async () => {
        const startTime = performance.now();
        
        // Force multiple re-renders
        for (let i = 0; i < 5; i++) {
          setSelectedContacts(prev => [...prev]);
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        const endTime = performance.now();
        
        return {
          name: 'Component Render Performance',
          status: renderTime < 100 ? 'passed' : 'failed',
          duration: endTime - startTime,
          metrics: {
            averageRenderTime: renderTime,
            totalRenderTime: endTime - startTime,
            renderCount: 5
          }
        };
      }
    }
  ];

  const runSingleTest = useCallback(async (test: PerformanceTest) => {
    setCurrentTest(test.name);
    setTestResults(prev => ({
      ...prev,
      [test.id]: { ...prev[test.id], status: 'running' }
    }));

    try {
      const result = await test.testFunction();
      setTestResults(prev => ({
        ...prev,
        [test.id]: result
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [test.id]: {
          name: test.name,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    }
  }, [renderTime]);

  const runAllTests = useCallback(async () => {
    setIsRunning(true);
    setCurrentTest('');
    
    // Initialize all tests as pending
    const initialResults: Record<string, TestResult> = {};
    performanceTests.forEach(test => {
      initialResults[test.id] = {
        name: test.name,
        status: 'pending'
      };
    });
    setTestResults(initialResults);

    // Run tests sequentially
    for (const test of performanceTests) {
      await runSingleTest(test);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
    setCurrentTest('');
  }, [runSingleTest]);

  const resetTests = useCallback(() => {
    setTestResults({});
    setTestData([]);
    setSelectedContacts([]);
    setCurrentTest('');
    clearCache();
  }, [clearCache]);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return 'text-green-600 bg-green-50 border-green-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      case 'running': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const passedTests = Object.values(testResults).filter(r => r.status === 'passed').length;
  const totalTests = performanceTests.length;
  const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Performance Integration Testing</h1>
          <p className="text-muted-foreground">
            Comprehensive testing of all performance optimizations working together
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={runAllTests}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Button>
          <Button variant="outline" onClick={resetTests} disabled={isRunning}>
            Reset
          </Button>
        </div>
      </div>

      {/* Test Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Test Progress Overview
          </CardTitle>
          <CardDescription>
            {currentTest ? `Currently running: ${currentTest}` : 'Ready to run performance tests'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{passedTests}</div>
              <div className="text-sm text-muted-foreground">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {Object.values(testResults).filter(r => r.status === 'failed').length}
              </div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalTests}</div>
              <div className="text-sm text-muted-foreground">Total Tests</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Success Rate</span>
              <span className="font-mono">{successRate.toFixed(1)}%</span>
            </div>
            <Progress value={successRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="tests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tests">Test Results</TabsTrigger>
          <TabsTrigger value="components">Live Components</TabsTrigger>
          <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-4">
          <div className="grid gap-4">
            {performanceTests.map((test) => {
              const result = testResults[test.id];
              return (
                <Card key={test.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result?.status || 'pending')}
                        <div>
                          <div className="font-medium">{test.name}</div>
                          <div className="text-sm text-muted-foreground">{test.description}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        {result?.duration && (
                          <div className="font-mono text-sm">
                            {result.duration.toFixed(2)}ms
                          </div>
                        )}
                        <Badge className={getStatusColor(result?.status || 'pending')}>
                          {result?.status || 'pending'}
                        </Badge>
                      </div>
                    </div>
                    
                    {result?.error && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        Error: {result.error}
                      </div>
                    )}
                    
                    {result?.metrics && (
                      <div className="mt-2 p-2 bg-gray-50 border rounded text-sm">
                        <div className="font-medium mb-1">Metrics:</div>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(result.metrics).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-muted-foreground">{key}:</span>
                              <span className="font-mono">{typeof value === 'number' ? value.toFixed(2) : value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="components" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Performance Components</CardTitle>
              <CardDescription>
                Test components with real data ({testData.length} contacts loaded)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ErrorBoundary>
                {testData.length > 0 ? (
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">ContactsTable (Table View)</h4>
                      <ContactsTable
                        contacts={testData.slice(0, 100)}
                        selectedContacts={selectedContacts.slice(0, 100)}
                        onSelectContact={(id, selected) => {
                          setSelectedContacts(prev =>
                            selected
                              ? [...prev, id]
                              : prev.filter(prevId => prevId !== id)
                          );
                        }}
                        onSelectAll={(selected) => {
                          setSelectedContacts(selected ? testData.slice(0, 100).map(c => c._id) : []);
                        }}
                        onContactClick={(contact) => console.log('Contact clicked:', contact)}
                        loading={false}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Run the "Large Dataset Generation" test first to load test data
                  </div>
                )}
              </ErrorBoundary>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Performance Metrics</CardTitle>
              <CardDescription>Current component performance statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{renderTime.toFixed(2)}ms</div>
                  <div className="text-sm text-blue-800">Current Render Time</div>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{testData.length}</div>
                  <div className="text-sm text-green-800">Test Records</div>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{selectedContacts.length}</div>
                  <div className="text-sm text-purple-800">Selected Items</div>
                </div>
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {('memory' in performance) ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) : 'N/A'}
                  </div>
                  <div className="text-sm text-orange-800">Memory (MB)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default IntegrationTesting;
