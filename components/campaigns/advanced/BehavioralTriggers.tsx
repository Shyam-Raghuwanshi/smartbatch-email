"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, Zap, Settings, Plus } from 'lucide-react';

// Performance imports
import { usePerformanceMonitor, ComponentSkeleton } from '@/components/ui/performance';

export function BehavioralTriggers() {
  const renderTime = usePerformanceMonitor("BehavioralTriggers");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Behavioral Triggers</h2>
          <p className="text-muted-foreground">
            Set up automated campaigns based on user behavior and engagement patterns
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Trigger
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg">Email Engagement</CardTitle>
            </div>
            <CardDescription>
              Trigger campaigns based on email opens, clicks, and engagement patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Triggers</span>
                <Badge variant="secondary">3</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Triggered</span>
                <span className="text-sm font-medium">1,247</span>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                <Settings className="h-3 w-3 mr-1" />
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg">Website Activity</CardTitle>
            </div>
            <CardDescription>
              React to page visits, form submissions, and user interactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Triggers</span>
                <Badge variant="secondary">5</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Triggered</span>
                <span className="text-sm font-medium">892</span>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                <Settings className="h-3 w-3 mr-1" />
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-lg">Purchase Behavior</CardTitle>
            </div>
            <CardDescription>
              Trigger campaigns based on purchase history and shopping patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Triggers</span>
                <Badge variant="secondary">2</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Triggered</span>
                <span className="text-sm font-medium">456</span>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                <Settings className="h-3 w-3 mr-1" />
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <div className="mx-auto w-24 h-24 mb-4 rounded-full bg-muted flex items-center justify-center">
            <Target className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Advanced Behavioral Triggered Campaigns</h3>
          <p className="text-muted-foreground mb-4">
            This component is under development. Advanced behavioral trigger functionality will be available soon.
          </p>
          <Button variant="outline">
            Learn More
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
