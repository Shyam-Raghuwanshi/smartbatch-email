"use client";

import { useState } from "react";
import ABTestDashboard from "@/components/campaigns/ABTestDashboard";
import ABTestSetup from "@/components/campaigns/ABTestSetup";
import ABTestResults from "@/components/campaigns/ABTestResults";
import AdvancedTesting from "@/components/campaigns/AdvancedTesting";
import ABTestExecution from "@/components/campaigns/ABTestExecution";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Beaker, BeakerIcon, BrainIcon, ChartBarIcon, PlayIcon } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

export default function ABTestingPage() {
  const [activeTestId, setActiveTestId] = useState<Id<"abTests"> | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Get A/B tests overview
  const abTests = useQuery(api.abTesting.getABTestsByUser);
  const dashboardStats = {
    total: abTests?.length || 0,
    active: abTests?.filter((test: any) => test.status === 'active').length || 0,
    completed: abTests?.filter((test: any) => test.status === 'completed').length || 0,
    draft: abTests?.filter((test: any) => test.status === 'draft').length || 0,
  };

  const handleTestCreated = (testId: Id<"abTests">) => {
    setActiveTestId(testId);
    setActiveTab("execution");
  };

  const handleTestComplete = (testId: string, winnerId: string) => {
    setActiveTab("results");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BeakerIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">A/B Testing Center</h1>
            <p className="text-gray-600">
              Optimize your email campaigns with data-driven experiments
            </p>
          </div>
        </div>
        <Badge variant="secondary">
          {dashboardStats.active} Active • {dashboardStats.total} Total
        </Badge>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <ChartBarIcon className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="setup" className="flex items-center gap-2">
            <Beaker className="h-4 w-4" />
            Create Test
          </TabsTrigger>
          <TabsTrigger value="execution" className="flex items-center gap-2">
            <PlayIcon className="h-4 w-4" />
            Execute
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <ChartBarIcon className="h-4 w-4" />
            Results
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <BrainIcon className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <ABTestDashboard />
        </TabsContent>

        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BeakerIcon className="h-5 w-5" />
                Create New A/B Test
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ABTestSetup
                onTestCreated={handleTestCreated}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="execution" className="space-y-6">
          {activeTestId ? (
            <ABTestExecution
              testId={activeTestId}
              onTestComplete={handleTestComplete}
            />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <PlayIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a Test to Execute
                  </h3>
                  <p className="text-gray-600">
                    Choose a test from the dashboard to manage its execution.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {activeTestId ? (
            <ABTestResults testId={activeTestId} />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <ChartBarIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a Test to View Results
                  </h3>
                  <p className="text-gray-600">
                    Choose a test from the dashboard to see detailed results and analysis.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainIcon className="h-5 w-5" />
                Advanced Testing Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AdvancedTesting testType="multivariate" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
