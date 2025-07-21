"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  Clock,
  Globe,
  Zap,
  Settings,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

interface SchedulingInterfaceProps {
  campaignId: Id<"campaigns">;
  onSave?: () => void;
}

interface ScheduleSettings {
  type: "immediate" | "scheduled" | "recurring" | "optimal";
  timezone?: string;
  sendRate?: {
    emailsPerHour: number;
    emailsPerDay: number;
    respectTimeZones: boolean;
  };
  recurring?: {
    pattern: "daily" | "weekly" | "monthly";
    interval: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
    endDate?: number;
    maxOccurrences?: number;
  };
  optimal?: {
    useEngagementData: boolean;
    useTimeZones: boolean;
    preferredTimeSlots: Array<{
      startHour: number;
      endHour: number;
    }>;
    avoidWeekends: boolean;
    minHoursBetweenSends: number;
  };
  ispThrottling?: {
    enabled: boolean;
    rules: Array<{
      ispDomain: string;
      maxPerHour: number;
      maxPerDay: number;
    }>;
  };
}

const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Asia/Shanghai", label: "China Standard Time (CST)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
];

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export function SchedulingInterface({ campaignId, onSave }: SchedulingInterfaceProps) {
  const [settings, setSettings] = useState<ScheduleSettings>({
    type: "scheduled",
    timezone: "UTC",
    sendRate: {
      emailsPerHour: 100,
      emailsPerDay: 1000,
      respectTimeZones: true,
    },
    optimal: {
      useEngagementData: true,
      useTimeZones: true,
      preferredTimeSlots: [
        { startHour: 9, endHour: 11 },
        { startHour: 14, endHour: 16 },
      ],
      avoidWeekends: true,
      minHoursBetweenSends: 24,
    },
    ispThrottling: {
      enabled: true,
      rules: [
        { ispDomain: "gmail.com", maxPerHour: 100, maxPerDay: 2000 },
        { ispDomain: "yahoo.com", maxPerHour: 50, maxPerDay: 1000 },
        { ispDomain: "hotmail.com", maxPerHour: 50, maxPerDay: 1000 },
      ],
    },
  });

  const [scheduledDateTime, setScheduledDateTime] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const campaign = useQuery(api.campaigns.getCampaignById, { id: campaignId });
  const updateScheduleSettings = useMutation(api.emailScheduler.updateCampaignScheduleSettings);
  const ispRates = useQuery(api.emailScheduler.getISPSendRates, {
    contactEmails: [], // Would be populated with actual contact emails
  });

  useEffect(() => {
    if (campaign?.scheduleSettings) {
      setSettings(campaign.scheduleSettings);
    }
    if (campaign?.scheduledAt) {
      setScheduledDateTime(new Date(campaign.scheduledAt).toISOString().slice(0, 16));
    }
  }, [campaign]);

  const handleSave = async () => {
    try {
      await updateScheduleSettings({
        campaignId,
        scheduleSettings: settings,
      });
      
      toast.success("Schedule settings saved successfully!");
      onSave?.();
    } catch (error) {
      console.error("Error saving schedule settings:", error);
      toast.error("Failed to save schedule settings");
    }
  };

  const addTimeSlot = () => {
    if (settings.optimal) {
      setSettings({
        ...settings,
        optimal: {
          ...settings.optimal,
          preferredTimeSlots: [
            ...settings.optimal.preferredTimeSlots,
            { startHour: 9, endHour: 17 },
          ],
        },
      });
    }
  };

  const removeTimeSlot = (index: number) => {
    if (settings.optimal) {
      setSettings({
        ...settings,
        optimal: {
          ...settings.optimal,
          preferredTimeSlots: settings.optimal.preferredTimeSlots.filter((_, i) => i !== index),
        },
      });
    }
  };

  const updateTimeSlot = (index: number, field: "startHour" | "endHour", value: number) => {
    if (settings.optimal) {
      const newTimeSlots = [...settings.optimal.preferredTimeSlots];
      newTimeSlots[index] = { ...newTimeSlots[index], [field]: value };
      
      setSettings({
        ...settings,
        optimal: {
          ...settings.optimal,
          preferredTimeSlots: newTimeSlots,
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Email Scheduling Configuration
          </CardTitle>
          <CardDescription>
            Configure when and how your emails should be sent with intelligent optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={settings.type} onValueChange={(value) => setSettings({ ...settings, type: value as any })}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="immediate">Immediate</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="recurring">Recurring</TabsTrigger>
              <TabsTrigger value="optimal">Optimal</TabsTrigger>
            </TabsList>

            <TabsContent value="immediate" className="space-y-4">
              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  Emails will be sent immediately upon campaign activation. Send rate limits will still apply.
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="scheduled" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduled-datetime">Send Date & Time</Label>
                  <Input
                    id="scheduled-datetime"
                    type="datetime-local"
                    value={scheduledDateTime}
                    onChange={(e) => setScheduledDateTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={settings.timezone} onValueChange={(value) => setSettings({ ...settings, timezone: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONE_OPTIONS.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="recurring" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Recurrence Pattern</Label>
                  <Select 
                    value={settings.recurring?.pattern || "weekly"} 
                    onValueChange={(value) => 
                      setSettings({ 
                        ...settings, 
                        recurring: { 
                          ...settings.recurring, 
                          pattern: value as "daily" | "weekly" | "monthly",
                          interval: 1 
                        }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Repeat Every</Label>
                  <Input
                    type="number"
                    min="1"
                    value={settings.recurring?.interval || 1}
                    onChange={(e) => 
                      setSettings({ 
                        ...settings, 
                        recurring: { 
                          ...settings.recurring, 
                          pattern: settings.recurring?.pattern || "weekly",
                          interval: parseInt(e.target.value) || 1 
                        }
                      })
                    }
                  />
                </div>
              </div>

              {settings.recurring?.pattern === "weekly" && (
                <div>
                  <Label>Days of Week</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <Badge
                        key={day.value}
                        variant={settings.recurring?.daysOfWeek?.includes(day.value) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const currentDays = settings.recurring?.daysOfWeek || [];
                          const newDays = currentDays.includes(day.value)
                            ? currentDays.filter(d => d !== day.value)
                            : [...currentDays, day.value];
                          
                          setSettings({
                            ...settings,
                            recurring: {
                              ...settings.recurring,
                              pattern: "weekly",
                              interval: settings.recurring?.interval || 1,
                              daysOfWeek: newDays,
                            },
                          });
                        }}
                      >
                        {day.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {settings.recurring?.pattern === "monthly" && (
                <div>
                  <Label>Day of Month</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={settings.recurring?.dayOfMonth || 1}
                    onChange={(e) => 
                      setSettings({ 
                        ...settings, 
                        recurring: { 
                          ...settings.recurring, 
                          pattern: "monthly",
                          interval: settings.recurring?.interval || 1,
                          dayOfMonth: parseInt(e.target.value) || 1 
                        }
                      })
                    }
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="end-date">End Date (Optional)</Label>
                  <Input
                    id="end-date"
                    type="date"
                    onChange={(e) => {
                      const endDate = e.target.value ? new Date(e.target.value).getTime() : undefined;
                      setSettings({
                        ...settings,
                        recurring: {
                          ...settings.recurring,
                          pattern: settings.recurring?.pattern || "weekly",
                          interval: settings.recurring?.interval || 1,
                          endDate,
                        },
                      });
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="max-occurrences">Max Occurrences</Label>
                  <Input
                    id="max-occurrences"
                    type="number"
                    min="1"
                    value={settings.recurring?.maxOccurrences || ""}
                    onChange={(e) => 
                      setSettings({ 
                        ...settings, 
                        recurring: { 
                          ...settings.recurring, 
                          pattern: settings.recurring?.pattern || "weekly",
                          interval: settings.recurring?.interval || 1,
                          maxOccurrences: parseInt(e.target.value) || undefined 
                        }
                      })
                    }
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="optimal" className="space-y-4">
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  AI-powered scheduling based on recipient engagement patterns and timezone optimization.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="use-engagement">Use Engagement Data</Label>
                  <Switch
                    id="use-engagement"
                    checked={settings.optimal?.useEngagementData || false}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        optimal: { ...settings.optimal!, useEngagementData: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="use-timezones">Optimize for Timezones</Label>
                  <Switch
                    id="use-timezones"
                    checked={settings.optimal?.useTimeZones || false}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        optimal: { ...settings.optimal!, useTimeZones: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="avoid-weekends">Avoid Weekends</Label>
                  <Switch
                    id="avoid-weekends"
                    checked={settings.optimal?.avoidWeekends || false}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        optimal: { ...settings.optimal!, avoidWeekends: checked },
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Preferred Time Slots</Label>
                  <div className="space-y-2 mt-2">
                    {settings.optimal?.preferredTimeSlots.map((slot, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="23"
                          value={slot.startHour}
                          onChange={(e) => updateTimeSlot(index, "startHour", parseInt(e.target.value) || 0)}
                          className="w-20"
                        />
                        <span>to</span>
                        <Input
                          type="number"
                          min="0"
                          max="23"
                          value={slot.endHour}
                          onChange={(e) => updateTimeSlot(index, "endHour", parseInt(e.target.value) || 0)}
                          className="w-20"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeTimeSlot(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addTimeSlot}>
                      Add Time Slot
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="min-hours-between">Minimum Hours Between Sends</Label>
                  <Input
                    id="min-hours-between"
                    type="number"
                    min="1"
                    value={settings.optimal?.minHoursBetweenSends || 24}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        optimal: {
                          ...settings.optimal!,
                          minHoursBetweenSends: parseInt(e.target.value) || 24,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Send Rate Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Send Rate Configuration
          </CardTitle>
          <CardDescription>
            Control how fast emails are sent to avoid hitting ISP limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emails-per-hour">Emails per Hour</Label>
              <Input
                id="emails-per-hour"
                type="number"
                min="1"
                max="10000"
                value={settings.sendRate?.emailsPerHour || 100}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    sendRate: {
                      ...settings.sendRate!,
                      emailsPerHour: parseInt(e.target.value) || 100,
                    },
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="emails-per-day">Emails per Day</Label>
              <Input
                id="emails-per-day"
                type="number"
                min="1"
                max="100000"
                value={settings.sendRate?.emailsPerDay || 1000}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    sendRate: {
                      ...settings.sendRate!,
                      emailsPerDay: parseInt(e.target.value) || 1000,
                    },
                  })
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="respect-timezones">Respect Recipient Timezones</Label>
            <Switch
              id="respect-timezones"
              checked={settings.sendRate?.respectTimeZones || false}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  sendRate: { ...settings.sendRate!, respectTimeZones: checked },
                })
              }
            />
          </div>

          {ispRates && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Based on your contact list: {ispRates.totalRecipients} recipients, 
                estimated duration: {ispRates.estimatedDuration} hours
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* ISP Throttling */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            ISP Throttling
          </CardTitle>
          <CardDescription>
            Configure different send rates for specific email providers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="enable-throttling">Enable ISP Throttling</Label>
            <Switch
              id="enable-throttling"
              checked={settings.ispThrottling?.enabled || false}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  ispThrottling: { ...settings.ispThrottling!, enabled: checked },
                })
              }
            />
          </div>

          {settings.ispThrottling?.enabled && (
            <div className="space-y-3">
              {settings.ispThrottling.rules.map((rule, index) => (
                <div key={index} className="grid grid-cols-4 gap-2 p-3 border rounded">
                  <div>
                    <Label>ISP Domain</Label>
                    <Input
                      value={rule.ispDomain}
                      onChange={(e) => {
                        const newRules = [...settings.ispThrottling!.rules];
                        newRules[index] = { ...rule, ispDomain: e.target.value };
                        setSettings({
                          ...settings,
                          ispThrottling: { ...settings.ispThrottling!, rules: newRules },
                        });
                      }}
                    />
                  </div>
                  <div>
                    <Label>Max/Hour</Label>
                    <Input
                      type="number"
                      value={rule.maxPerHour}
                      onChange={(e) => {
                        const newRules = [...settings.ispThrottling!.rules];
                        newRules[index] = { ...rule, maxPerHour: parseInt(e.target.value) || 0 };
                        setSettings({
                          ...settings,
                          ispThrottling: { ...settings.ispThrottling!, rules: newRules },
                        });
                      }}
                    />
                  </div>
                  <div>
                    <Label>Max/Day</Label>
                    <Input
                      type="number"
                      value={rule.maxPerDay}
                      onChange={(e) => {
                        const newRules = [...settings.ispThrottling!.rules];
                        newRules[index] = { ...rule, maxPerDay: parseInt(e.target.value) || 0 };
                        setSettings({
                          ...settings,
                          ispThrottling: { ...settings.ispThrottling!, rules: newRules },
                        });
                      }}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newRules = settings.ispThrottling!.rules.filter((_, i) => i !== index);
                        setSettings({
                          ...settings,
                          ispThrottling: { ...settings.ispThrottling!, rules: newRules },
                        });
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const newRule = { ispDomain: "", maxPerHour: 50, maxPerDay: 1000 };
                  setSettings({
                    ...settings,
                    ispThrottling: {
                      ...settings.ispThrottling!,
                      rules: [...settings.ispThrottling!.rules, newRule],
                    },
                  });
                }}
              >
                Add ISP Rule
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setShowAdvanced(!showAdvanced)}>
          {showAdvanced ? "Hide" : "Show"} Advanced Options
        </Button>
        <Button onClick={handleSave}>
          <CheckCircle className="h-4 w-4 mr-2" />
          Save Schedule Settings
        </Button>
      </div>
    </div>
  );
}
