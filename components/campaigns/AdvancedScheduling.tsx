"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { TimePicker } from '@/components/ui/time-picker';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Globe, 
  TrendingUp, 
  Settings,
  Plus,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle,
  Pause,
  Play
} from 'lucide-react';
import { format } from 'date-fns';

interface SchedulingRule {
  id: string;
  name: string;
  type: 'seasonal' | 'event' | 'timezone' | 'frequency';
  config: Record<string, any>;
  isActive: boolean;
  priority: number;
  campaigns: string[];
  createdAt: Date;
}

interface SeasonalCampaign {
  id: string;
  name: string;
  season: 'spring' | 'summer' | 'fall' | 'winter' | 'holiday';
  startDate: Date;
  endDate: Date;
  timezone: string;
  frequency: string;
  targetAudience: string[];
}

interface EventBasedSchedule {
  id: string;
  name: string;
  eventType: 'birthday' | 'anniversary' | 'custom';
  triggerOffset: number; // days before/after event
  repeatYearly: boolean;
  timeOfDay: string;
  timezone: string;
}

interface TimezoneOptimization {
  id: string;
  name: string;
  enabled: boolean;
  targetTimezones: string[];
  optimalSendTimes: Record<string, string>; // timezone -> time
  adjustForDST: boolean;
}

interface FrequencyCapping {
  id: string;
  name: string;
  maxEmailsPerDay: number;
  maxEmailsPerWeek: number;
  maxEmailsPerMonth: number;
  cooldownPeriod: number; // hours
  priorityRules: Array<{
    campaignType: string;
    priority: number;
  }>;
}

export default function AdvancedScheduling() {
  const [activeTab, setActiveTab] = useState('seasonal');
  const [schedulingRules, setSchedulingRules] = useState<SchedulingRule[]>([]);
  const [seasonalCampaigns, setSeasonalCampaigns] = useState<SeasonalCampaign[]>([
    {
      id: '1',
      name: 'Black Friday Campaign',
      season: 'fall',
      startDate: new Date('2024-11-01'),
      endDate: new Date('2024-11-30'),
      timezone: 'America/New_York',
      frequency: 'weekly',
      targetAudience: ['high_value_customers', 'engaged_subscribers']
    }
  ]);

  const [timezoneOptimization, setTimezoneOptimization] = useState<TimezoneOptimization>({
    id: '1',
    name: 'Global Send Time Optimization',
    enabled: true,
    targetTimezones: ['America/New_York', 'Europe/London', 'Asia/Tokyo'],
    optimalSendTimes: {
      'America/New_York': '10:00',
      'Europe/London': '14:00',
      'Asia/Tokyo': '09:00'
    },
    adjustForDST: true
  });

  const [frequencyCapping, setFrequencyCapping] = useState<FrequencyCapping>({
    id: '1',
    name: 'Default Frequency Limits',
    maxEmailsPerDay: 2,
    maxEmailsPerWeek: 5,
    maxEmailsPerMonth: 15,
    cooldownPeriod: 4,
    priorityRules: [
      { campaignType: 'transactional', priority: 1 },
      { campaignType: 'welcome', priority: 2 },
      { campaignType: 'promotional', priority: 3 }
    ]
  });

  const seasons = [
    { value: 'spring', label: 'Spring (Mar-May)', color: 'bg-green-100 text-green-800' },
    { value: 'summer', label: 'Summer (Jun-Aug)', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'fall', label: 'Fall (Sep-Nov)', color: 'bg-orange-100 text-orange-800' },
    { value: 'winter', label: 'Winter (Dec-Feb)', color: 'bg-blue-100 text-blue-800' },
    { value: 'holiday', label: 'Holiday Season', color: 'bg-red-100 text-red-800' }
  ];

  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Australia/Sydney'
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Advanced Scheduling</h2>
          <p className="text-muted-foreground">
            Optimize send times and manage campaign frequency across global audiences
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Rule
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="seasonal">Seasonal Planning</TabsTrigger>
          <TabsTrigger value="events">Event-Based</TabsTrigger>
          <TabsTrigger value="timezone">Timezone Optimization</TabsTrigger>
          <TabsTrigger value="frequency">Frequency Capping</TabsTrigger>
        </TabsList>

        <TabsContent value="seasonal" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {seasons.map((season) => {
              const campaignCount = seasonalCampaigns.filter(c => c.season === season.value).length;
              return (
                <Card key={season.value} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge className={season.color}>{season.value}</Badge>
                      <span className="text-sm text-muted-foreground">{campaignCount} campaigns</span>
                    </div>
                    <CardTitle className="text-sm">{season.label}</CardTitle>
                  </CardHeader>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Seasonal Campaigns</CardTitle>
              <CardDescription>
                Plan and schedule campaigns around seasonal events and holidays
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {seasonalCampaigns.map((campaign) => {
                  const season = seasons.find(s => s.value === campaign.season);
                  return (
                    <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <CalendarIcon className="h-6 w-6 text-gray-600" />
                        <div>
                          <h4 className="font-medium">{campaign.name}</h4>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Badge className={season?.color}>{season?.label}</Badge>
                            <span>•</span>
                            <span>{format(campaign.startDate, 'MMM d')} - {format(campaign.endDate, 'MMM d')}</span>
                            <span>•</span>
                            <span>{campaign.frequency}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Seasonal Insights</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Best performing season:</span>
                    <span className="ml-2 font-medium">Holiday Season</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Average open rate increase:</span>
                    <span className="ml-2 font-medium">23%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Users className="h-5 w-5 mr-2" />
                  Birthday Campaigns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Active campaigns:</span>
                    <span className="font-medium">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Scheduled emails:</span>
                    <span className="font-medium">1,247</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg. open rate:</span>
                    <span className="font-medium text-green-600">45.2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Anniversary Emails
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Active campaigns:</span>
                    <span className="font-medium">2</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Scheduled emails:</span>
                    <span className="font-medium">892</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg. open rate:</span>
                    <span className="font-medium text-green-600">38.7%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Settings className="h-5 w-5 mr-2" />
                  Custom Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Active campaigns:</span>
                    <span className="font-medium">5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Scheduled emails:</span>
                    <span className="font-medium">2,156</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg. open rate:</span>
                    <span className="font-medium text-green-600">41.9%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Event-Based Schedule Configuration</CardTitle>
              <CardDescription>
                Set up automated campaigns triggered by customer events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="event-type">Event Type</Label>
                    <Select defaultValue="birthday">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="birthday">Birthday</SelectItem>
                        <SelectItem value="anniversary">Anniversary</SelectItem>
                        <SelectItem value="signup">Account Anniversary</SelectItem>
                        <SelectItem value="custom">Custom Event</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="trigger-offset">Send Timing</Label>
                    <div className="flex items-center space-x-2">
                      <Input type="number" defaultValue="0" className="w-20" />
                      <Select defaultValue="days_before">
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="days_before">days before</SelectItem>
                          <SelectItem value="days_after">days after</SelectItem>
                          <SelectItem value="on_date">on the date</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-muted-foreground">the event</span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="send-time">Send Time</Label>
                    <Input type="time" defaultValue="10:00" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select defaultValue="America/New_York">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timezones.map((tz) => (
                          <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <Label>Repeat annually</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <Label>Respect user timezone</Label>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button>Create Event Schedule</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timezone" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                Global Send Time Optimization
              </CardTitle>
              <CardDescription>
                Automatically optimize send times for different time zones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Timezone Optimization</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatically adjust send times for optimal engagement
                  </p>
                </div>
                <Switch 
                  checked={timezoneOptimization.enabled}
                  onCheckedChange={(checked) => setTimezoneOptimization({
                    ...timezoneOptimization,
                    enabled: checked
                  })}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Target Timezones</h4>
                  <div className="space-y-2">
                    {timezoneOptimization.targetTimezones.map((tz) => (
                      <div key={tz} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{tz}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Input 
                            type="time" 
                            value={timezoneOptimization.optimalSendTimes[tz] || '10:00'}
                            onChange={(e) => setTimezoneOptimization({
                              ...timezoneOptimization,
                              optimalSendTimes: {
                                ...timezoneOptimization.optimalSendTimes,
                                [tz]: e.target.value
                              }
                            })}
                            className="w-24 h-8"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Optimization Settings</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="dst-adjustment">Adjust for Daylight Saving Time</Label>
                      <Switch 
                        id="dst-adjustment"
                        checked={timezoneOptimization.adjustForDST}
                        onCheckedChange={(checked) => setTimezoneOptimization({
                          ...timezoneOptimization,
                          adjustForDST: checked
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Send Window Flexibility</Label>
                      <div className="px-3">
                        <Slider
                          defaultValue={[30]}
                          max={120}
                          step={15}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>15 min</span>
                          <span>2 hours</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Optimization Priority</Label>
                      <Select defaultValue="engagement">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="engagement">Maximum Engagement</SelectItem>
                          <SelectItem value="delivery">Delivery Rate</SelectItem>
                          <SelectItem value="conversion">Conversion Rate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium text-green-900">Optimization Results</h4>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-green-700">Open rate improvement:</span>
                    <span className="ml-2 font-medium">+18.5%</span>
                  </div>
                  <div>
                    <span className="text-green-700">Click rate improvement:</span>
                    <span className="ml-2 font-medium">+12.3%</span>
                  </div>
                  <div>
                    <span className="text-green-700">Unsubscribe reduction:</span>
                    <span className="ml-2 font-medium">-8.7%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="frequency" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Send Frequency Management
              </CardTitle>
              <CardDescription>
                Control how often customers receive emails to prevent fatigue
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Frequency Limits</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="daily-limit">Maximum emails per day</Label>
                      <div className="flex items-center space-x-2">
                        <Slider
                          value={[frequencyCapping.maxEmailsPerDay]}
                          onValueChange={([value]) => setFrequencyCapping({
                            ...frequencyCapping,
                            maxEmailsPerDay: value
                          })}
                          max={10}
                          step={1}
                          className="flex-1"
                        />
                        <span className="w-12 text-sm font-medium">
                          {frequencyCapping.maxEmailsPerDay}
                        </span>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="weekly-limit">Maximum emails per week</Label>
                      <div className="flex items-center space-x-2">
                        <Slider
                          value={[frequencyCapping.maxEmailsPerWeek]}
                          onValueChange={([value]) => setFrequencyCapping({
                            ...frequencyCapping,
                            maxEmailsPerWeek: value
                          })}
                          max={20}
                          step={1}
                          className="flex-1"
                        />
                        <span className="w-12 text-sm font-medium">
                          {frequencyCapping.maxEmailsPerWeek}
                        </span>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="monthly-limit">Maximum emails per month</Label>
                      <div className="flex items-center space-x-2">
                        <Slider
                          value={[frequencyCapping.maxEmailsPerMonth]}
                          onValueChange={([value]) => setFrequencyCapping({
                            ...frequencyCapping,
                            maxEmailsPerMonth: value
                          })}
                          max={50}
                          step={1}
                          className="flex-1"
                        />
                        <span className="w-12 text-sm font-medium">
                          {frequencyCapping.maxEmailsPerMonth}
                        </span>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="cooldown">Cooldown period (hours)</Label>
                      <div className="flex items-center space-x-2">
                        <Slider
                          value={[frequencyCapping.cooldownPeriod]}
                          onValueChange={([value]) => setFrequencyCapping({
                            ...frequencyCapping,
                            cooldownPeriod: value
                          })}
                          max={24}
                          step={1}
                          className="flex-1"
                        />
                        <span className="w-12 text-sm font-medium">
                          {frequencyCapping.cooldownPeriod}h
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Priority Rules</h4>
                  <p className="text-sm text-muted-foreground">
                    When frequency limits are reached, emails are sent based on priority
                  </p>
                  
                  <div className="space-y-2">
                    {frequencyCapping.priorityRules.map((rule, index) => (
                      <div key={rule.campaignType} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{rule.priority}</Badge>
                          <span className="text-sm capitalize">
                            {rule.campaignType.replace('_', ' ')}
                          </span>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button variant="outline" size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Priority Rule
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">1,247</div>
                    <p className="text-xs text-muted-foreground">Emails queued</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">89</div>
                    <p className="text-xs text-muted-foreground">Frequency capped</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">23%</div>
                    <p className="text-xs text-muted-foreground">Engagement increase</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
