"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Globe, 
  Clock, 
  Users, 
  TrendingUp, 
  Settings,
  CalendarIcon,
  BarChart3,
  Zap
} from 'lucide-react';

interface TimezoneData {
  timezone: string;
  recipientCount: number;
  optimalHours: number[];
  avgEngagement: number;
  currentTime: string;
}

interface ScheduleSettings {
  targetHour: number;
  respectTimezones: boolean;
  maxDailyEmails: number;
  minHoursBetween: number;
  avoidWeekends: boolean;
}

export function TimezoneScheduler() {
  const [activeTab, setActiveTab] = useState('overview');
  const [settings, setSettings] = useState<ScheduleSettings>({
    targetHour: 10,
    respectTimezones: true,
    maxDailyEmails: 1000,
    minHoursBetween: 2,
    avoidWeekends: true
  });

  // Mock timezone data - in real app this would come from API
  const [timezoneData] = useState<TimezoneData[]>([
    {
      timezone: 'America/New_York',
      recipientCount: 1247,
      optimalHours: [9, 14, 16],
      avgEngagement: 24.5,
      currentTime: new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' })
    },
    {
      timezone: 'Europe/London',
      recipientCount: 892,
      optimalHours: [10, 15, 17],
      avgEngagement: 22.1,
      currentTime: new Date().toLocaleTimeString('en-US', { timeZone: 'Europe/London' })
    },
    {
      timezone: 'Asia/Tokyo',
      recipientCount: 634,
      optimalHours: [8, 13, 18],
      avgEngagement: 28.3,
      currentTime: new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Tokyo' })
    },
    {
      timezone: 'America/Los_Angeles',
      recipientCount: 756,
      optimalHours: [11, 14, 16],
      avgEngagement: 26.7,
      currentTime: new Date().toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles' })
    }
  ]);

  const [selectedTimezone, setSelectedTimezone] = useState('America/New_York');
  const [schedulePreview, setSchedulePreview] = useState<any[]>([]);

  useEffect(() => {
    // Update current times every minute
    const interval = setInterval(() => {
      // In real app, this would update the timezone data
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    generateSchedulePreview();
  }, [settings, selectedTimezone]);

  const generateSchedulePreview = () => {
    const selectedTzData = timezoneData.find(tz => tz.timezone === selectedTimezone);
    if (!selectedTzData) return;

    // Generate preview of when emails would be sent
    const preview = [];
    for (let i = 0; i < 7; i++) { // Next 7 days
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      if (settings.avoidWeekends && (date.getDay() === 0 || date.getDay() === 6)) {
        continue;
      }

      const sendTime = new Date(date);
      sendTime.setHours(settings.targetHour, 0, 0, 0);

      preview.push({
        date: date.toLocaleDateString(),
        time: sendTime.toLocaleTimeString(),
        recipients: selectedTzData.recipientCount,
        engagement: selectedTzData.avgEngagement
      });
    }
    
    setSchedulePreview(preview);
  };

  const calculateGlobalSendWindow = () => {
    let totalRecipients = 0;
    let weightedEngagement = 0;

    timezoneData.forEach(tz => {
      totalRecipients += tz.recipientCount;
      weightedEngagement += tz.avgEngagement * tz.recipientCount;
    });

    const avgEngagement = weightedEngagement / totalRecipients;
    const estimatedDuration = Math.ceil(totalRecipients / settings.maxDailyEmails * 24); // hours

    return {
      totalRecipients,
      avgEngagement: avgEngagement.toFixed(1),
      estimatedDuration
    };
  };

  const handleOptimizeSchedule = () => {
    toast.success("Schedule optimized based on recipient engagement patterns!");
    
    // Find the timezone with highest engagement
    const bestTz = timezoneData.reduce((best, current) => 
      current.avgEngagement > best.avgEngagement ? current : best
    );
    
    setSettings(prev => ({
      ...prev,
      targetHour: bestTz.optimalHours[0]
    }));
  };

  const handleSaveSettings = () => {
    toast.success("Timezone scheduling settings saved successfully!");
  };

  const globalStats = calculateGlobalSendWindow();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Timezone-Aware Scheduling</h2>
          <p className="text-gray-600">
            Optimize email delivery times across different time zones for maximum engagement
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleOptimizeSchedule} variant="outline">
            <Zap className="h-4 w-4 mr-2" />
            Auto-Optimize
          </Button>
          <Button onClick={handleSaveSettings}>
            <Settings className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Global Overview</TabsTrigger>
          <TabsTrigger value="timezone">Timezone Analysis</TabsTrigger>
          <TabsTrigger value="settings">Schedule Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Global Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="text-center">
                <Globe className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <CardTitle>Total Recipients</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-bold text-blue-600">{globalStats.totalRecipients.toLocaleString()}</div>
                <p className="text-sm text-gray-600">Across {timezoneData.length} timezones</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <TrendingUp className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <CardTitle>Avg Engagement</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-bold text-green-600">{globalStats.avgEngagement}%</div>
                <p className="text-sm text-gray-600">Weighted average</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Clock className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                <CardTitle>Send Duration</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-bold text-purple-600">{globalStats.estimatedDuration}h</div>
                <p className="text-sm text-gray-600">Estimated time</p>
              </CardContent>
            </Card>
          </div>

          {/* Timezone Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Timezone Distribution</CardTitle>
              <CardDescription>
                Real-time view of your recipients across different time zones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {timezoneData.map((tz) => (
                  <div key={tz.timezone} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{tz.timezone.replace('_', ' ')}</h3>
                        <p className="text-sm text-gray-600">Current: {tz.currentTime}</p>
                      </div>
                      <Badge variant="outline">{tz.recipientCount} recipients</Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Engagement Rate:</span>
                        <span className="font-medium text-green-600">{tz.avgEngagement}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Optimal Hours:</span>
                        <div className="flex gap-1">
                          {tz.optimalHours.map(hour => (
                            <Badge key={hour} variant="secondary" className="text-xs">
                              {hour}:00
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timezone" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Timezone Analysis</CardTitle>
                  <CardDescription>
                    Detailed analysis for specific timezone
                  </CardDescription>
                </div>
                <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezoneData.map(tz => (
                      <SelectItem key={tz.timezone} value={tz.timezone}>
                        {tz.timezone.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {schedulePreview.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">Upcoming Send Schedule</h4>
                  <div className="space-y-2">
                    {schedulePreview.map((preview, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-4">
                          <CalendarIcon className="h-4 w-4 text-gray-500" />
                          <div>
                            <span className="font-medium">{preview.date}</span>
                            <span className="text-gray-600 ml-2">{preview.time}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span>{preview.recipients} recipients</span>
                          <Badge variant="secondary">{preview.engagement}% engagement</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Configuration</CardTitle>
              <CardDescription>
                Configure how emails are scheduled across time zones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Target Send Hour</Label>
                    <div className="flex items-center space-x-4 mt-2">
                      <Slider
                        value={[settings.targetHour]}
                        onValueChange={([value]) => setSettings(prev => ({ ...prev, targetHour: value }))}
                        max={23}
                        min={0}
                        step={1}
                        className="flex-1"
                      />
                      <Badge variant="outline" className="w-16 text-center">
                        {settings.targetHour}:00
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label>Max Daily Emails</Label>
                    <Input
                      type="number"
                      value={settings.maxDailyEmails}
                      onChange={(e) => setSettings(prev => ({ ...prev, maxDailyEmails: parseInt(e.target.value) }))}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Minimum Hours Between Sends</Label>
                    <div className="flex items-center space-x-4 mt-2">
                      <Slider
                        value={[settings.minHoursBetween]}
                        onValueChange={([value]) => setSettings(prev => ({ ...prev, minHoursBetween: value }))}
                        max={24}
                        min={1}
                        step={1}
                        className="flex-1"
                      />
                      <Badge variant="outline" className="w-16 text-center">
                        {settings.minHoursBetween}h
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Respect Recipient Timezones</h4>
                      <p className="text-sm text-gray-600">Send emails at optimal local times</p>
                    </div>
                    <Button
                      size="sm"
                      variant={settings.respectTimezones ? "default" : "outline"}
                      onClick={() => setSettings(prev => ({ ...prev, respectTimezones: !prev.respectTimezones }))}
                    >
                      {settings.respectTimezones ? "Enabled" : "Disabled"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Avoid Weekends</h4>
                      <p className="text-sm text-gray-600">Skip Saturday and Sunday sends</p>
                    </div>
                    <Button
                      size="sm"
                      variant={settings.avoidWeekends ? "default" : "outline"}
                      onClick={() => setSettings(prev => ({ ...prev, avoidWeekends: !prev.avoidWeekends }))}
                    >
                      {settings.avoidWeekends ? "Enabled" : "Disabled"}
                    </Button>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Optimization Tip</h4>
                    <p className="text-sm text-blue-800">
                      Based on your data, sending at {timezoneData[0].optimalHours[0]}:00 in recipient time zones 
                      could improve engagement by up to 15%.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
