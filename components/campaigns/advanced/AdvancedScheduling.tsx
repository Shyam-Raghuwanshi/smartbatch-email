"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Settings, Plus, Repeat } from 'lucide-react';

// Performance imports
import { usePerformanceMonitor } from '@/components/ui/performance';

export function AdvancedScheduling() {
  const renderTime = usePerformanceMonitor("AdvancedScheduling");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Scheduling</h2>
          <p className="text-muted-foreground">
            Create sophisticated scheduling rules and time-based campaign automation
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Schedule
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg">Time-Based Triggers</CardTitle>
            </div>
            <CardDescription>
              Schedule campaigns for specific dates and times
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Schedules</span>
                <Badge variant="secondary">8</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Next Execution</span>
                <span className="text-sm font-medium">2 hours</span>
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
              <Repeat className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg">Recurring Campaigns</CardTitle>
            </div>
            <CardDescription>
              Set up daily, weekly, or monthly recurring email campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Recurring</span>
                <Badge variant="secondary">12</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Sent</span>
                <span className="text-sm font-medium">45,678</span>
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
              <Clock className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-lg">Smart Timing</CardTitle>
            </div>
            <CardDescription>
              AI-powered optimal send time detection for each contact
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Optimization Rate</span>
                <Badge variant="secondary">87%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Avg. Improvement</span>
                <span className="text-sm font-medium">+23%</span>
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
            <Calendar className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Advanced Scheduling Engine</h3>
          <p className="text-muted-foreground mb-4">
            This component is under development. Advanced scheduling features with timezone optimization and smart delivery windows will be available soon.
          </p>
          <Button variant="outline">
            Learn More
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
