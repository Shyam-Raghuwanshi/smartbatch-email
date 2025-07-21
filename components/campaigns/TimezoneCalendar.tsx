"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Globe,
  Clock,
  Users,
  TrendingUp,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface TimezoneCalendarProps {
  selectedDate?: Date;
  selectedTime?: string;
  onDateTimeChange: (date: Date, timezone: string) => void;
  recipientEmails?: string[];
}

interface TimezoneInfo {
  timezone: string;
  recipientCount: number;
  optimalHours: number[];
  avgEngagement: number;
}

const POPULAR_TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)", offset: 0 },
  { value: "America/New_York", label: "Eastern Time (ET)", offset: -5 },
  { value: "America/Chicago", label: "Central Time (CT)", offset: -6 },
  { value: "America/Denver", label: "Mountain Time (MT)", offset: -7 },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)", offset: -8 },
  { value: "Europe/London", label: "London (GMT)", offset: 0 },
  { value: "Europe/Paris", label: "Central European Time (CET)", offset: 1 },
  { value: "Europe/Berlin", label: "Berlin (CET)", offset: 1 },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)", offset: 9 },
  { value: "Asia/Shanghai", label: "China Standard Time (CST)", offset: 8 },
  { value: "Asia/Dubai", label: "Gulf Standard Time (GST)", offset: 4 },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)", offset: 10 },
];

const OPTIMAL_HOURS = [
  { hour: 6, label: "6:00 AM", score: 60 },
  { hour: 7, label: "7:00 AM", score: 70 },
  { hour: 8, label: "8:00 AM", score: 85 },
  { hour: 9, label: "9:00 AM", score: 95 },
  { hour: 10, label: "10:00 AM", score: 90 },
  { hour: 11, label: "11:00 AM", score: 80 },
  { hour: 12, label: "12:00 PM", score: 70 },
  { hour: 13, label: "1:00 PM", score: 65 },
  { hour: 14, label: "2:00 PM", score: 85 },
  { hour: 15, label: "3:00 PM", score: 90 },
  { hour: 16, label: "4:00 PM", score: 85 },
  { hour: 17, label: "5:00 PM", score: 75 },
  { hour: 18, label: "6:00 PM", score: 60 },
  { hour: 19, label: "7:00 PM", score: 50 },
  { hour: 20, label: "8:00 PM", score: 40 },
];

export function TimezoneCalendar({ 
  selectedDate = new Date(), 
  selectedTime = "09:00",
  onDateTimeChange,
  recipientEmails = []
}: TimezoneCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTimezone, setSelectedTimezone] = useState("UTC");
  const [detectedTimezone, setDetectedTimezone] = useState("");
  const [showOptimalTimes, setShowOptimalTimes] = useState(true);

  // Detect user's timezone
  useEffect(() => {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setDetectedTimezone(userTimezone);
    setSelectedTimezone(userTimezone);
  }, []);

  // Get optimal send times if we have recipient data
  const optimalTimes = useQuery(
    api.emailScheduler.calculateOptimalSendTimes,
    recipientEmails.length > 0 ? {
      campaignId: "" as any, // This would be passed from parent
      timezone: selectedTimezone,
    } : "skip"
  );

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDateObj = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDateObj));
      currentDateObj.setDate(currentDateObj.getDate() + 1);
    }

    return days;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleDateSelect = (date: Date) => {
    if (isPastDate(date)) return;
    
    const [hours, minutes] = selectedTime.split(":");
    const newDateTime = new Date(date);
    newDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    onDateTimeChange(newDateTime, selectedTimezone);
  };

  const handleTimeChange = (time: string) => {
    const [hours, minutes] = time.split(":");
    const newDateTime = new Date(selectedDate);
    newDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    onDateTimeChange(newDateTime, selectedTimezone);
  };

  const handleTimezoneChange = (timezone: string) => {
    setSelectedTimezone(timezone);
    onDateTimeChange(selectedDate, timezone);
  };

  const getOptimalHourScore = (hour: number) => {
    const optimalHour = OPTIMAL_HOURS.find(h => h.hour === hour);
    return optimalHour?.score || 50;
  };

  const formatTimeInTimezone = (date: Date, timezone: string) => {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  const getTimezonePreview = () => {
    const [hours, minutes] = selectedTime.split(":");
    const testDate = new Date(selectedDate);
    testDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    return POPULAR_TIMEZONES.slice(0, 6).map(tz => ({
      timezone: tz.label,
      time: formatTimeInTimezone(testDate, tz.value),
    }));
  };

  const calendarDays = generateCalendarDays();
  const timezonePreview = getTimezonePreview();

  return (
    <div className="space-y-6">
      {/* Timezone Detection */}
      {detectedTimezone && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-600" />
              <span className="text-sm">
                Detected timezone: <strong>{detectedTimezone}</strong>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTimezoneChange(detectedTimezone)}
              >
                Use This
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Select Date
                </CardTitle>
                <CardDescription>
                  {currentDate.toLocaleDateString("en-US", { 
                    month: "long", 
                    year: "numeric" 
                  })}
                </CardDescription>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    newDate.setMonth(newDate.getMonth() - 1);
                    setCurrentDate(newDate);
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    newDate.setMonth(newDate.getMonth() + 1);
                    setCurrentDate(newDate);
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => (
                <button
                  key={index}
                  onClick={() => handleDateSelect(date)}
                  disabled={isPastDate(date)}
                  className={`
                    p-2 text-sm rounded-md transition-colors
                    ${!isCurrentMonth(date) ? "text-gray-300" : "text-gray-900"}
                    ${isToday(date) ? "bg-blue-100 text-blue-900 font-semibold" : ""}
                    ${isSelected(date) ? "bg-blue-600 text-white" : ""}
                    ${isPastDate(date) ? "text-gray-300 cursor-not-allowed" : "hover:bg-gray-100"}
                    ${!isPastDate(date) && !isSelected(date) ? "hover:bg-gray-100" : ""}
                  `}
                >
                  {date.getDate()}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Time and Timezone Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time & Timezone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Time Selection */}
            <div>
              <Label htmlFor="time-select">Select Time</Label>
              <Input
                id="time-select"
                type="time"
                value={selectedTime}
                onChange={(e) => handleTimeChange(e.target.value)}
              />
            </div>

            {/* Timezone Selection */}
            <div>
              <Label htmlFor="timezone-select">Timezone</Label>
              <Select value={selectedTimezone} onValueChange={handleTimezoneChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POPULAR_TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Optimal Time Recommendations */}
            {showOptimalTimes && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Optimal Send Times</Label>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {OPTIMAL_HOURS.filter(h => h.score >= 80).slice(0, 6).map((hour) => (
                    <Button
                      key={hour.hour}
                      variant="outline"
                      size="sm"
                      onClick={() => handleTimeChange(`${hour.hour.toString().padStart(2, '0')}:00`)}
                      className="justify-between"
                    >
                      <span>{hour.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {hour.score}%
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Timezone Preview */}
            <div>
              <Label>Global Time Preview</Label>
              <div className="space-y-2 mt-2">
                {timezonePreview.map((preview, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{preview.timezone}</span>
                    <span className="font-medium">{preview.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recipient Analysis */}
      {recipientEmails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recipient Analysis
            </CardTitle>
            <CardDescription>
              Timezone distribution and engagement insights for your recipients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{recipientEmails.length}</div>
                <div className="text-sm text-gray-600">Total Recipients</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {optimalTimes?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Timezones Detected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">85%</div>
                <div className="text-sm text-gray-600">Avg. Engagement</div>
              </div>
            </div>

            {optimalTimes && optimalTimes.length > 0 && (
              <div className="mt-4">
                <Label>Timezone Distribution</Label>
                <div className="space-y-2 mt-2">
                  {optimalTimes.map((tz, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{tz.timezone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{tz.recipientCount} recipients</Badge>
                        <Badge variant="secondary">
                          {Math.round(tz.avgEngagement * 100)}% engagement
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Selected DateTime Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Selected Send Time</p>
              <p className="text-lg font-semibold">
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric", 
                  month: "long",
                  day: "numeric"
                })} at {selectedTime}
              </p>
              <p className="text-sm text-gray-600">
                Timezone: {selectedTimezone}
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {getOptimalHourScore(parseInt(selectedTime.split(':')[0]))}% Optimal
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
