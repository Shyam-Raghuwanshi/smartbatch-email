"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  TrendingUp,
  Clock,
  Globe,
  Users,
  Mail,
  BarChart3,
  Zap,
  Calendar,
  Target,
  AlertCircle,
} from "lucide-react";

interface OptimalTimingAnalyzerProps {
  campaignId?: Id<"campaigns">;
  contactEmails: string[];
  onOptimalTimeSelected?: (dateTime: Date, timezone: string, confidence: number) => void;
}

interface OptimalTimeSlot {
  hour: number;
  dayOfWeek: number;
  timezone: string;
  confidence: number;
  estimatedEngagement: number;
  recipientCount: number;
  reasons: string[];
}

interface EngagementData {
  hour: number;
  dayOfWeek: number;
  openRate: number;
  clickRate: number;
  volume: number;
}

const DAYS_OF_WEEK = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

const HOUR_LABELS = [
  "12 AM", "1 AM", "2 AM", "3 AM", "4 AM", "5 AM",
  "6 AM", "7 AM", "8 AM", "9 AM", "10 AM", "11 AM",
  "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM",
  "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM"
];

// Mock engagement data - in real implementation, this would come from historical data
const MOCK_ENGAGEMENT_DATA: EngagementData[] = [
  // Monday
  { hour: 9, dayOfWeek: 1, openRate: 0.35, clickRate: 0.08, volume: 1200 },
  { hour: 10, dayOfWeek: 1, openRate: 0.32, clickRate: 0.07, volume: 1500 },
  { hour: 14, dayOfWeek: 1, openRate: 0.28, clickRate: 0.06, volume: 1800 },
  { hour: 15, dayOfWeek: 1, openRate: 0.30, clickRate: 0.07, volume: 1600 },
  
  // Tuesday
  { hour: 9, dayOfWeek: 2, openRate: 0.38, clickRate: 0.09, volume: 1400 },
  { hour: 10, dayOfWeek: 2, openRate: 0.35, clickRate: 0.08, volume: 1700 },
  { hour: 14, dayOfWeek: 2, openRate: 0.31, clickRate: 0.07, volume: 1900 },
  { hour: 15, dayOfWeek: 2, openRate: 0.33, clickRate: 0.08, volume: 1750 },
  
  // Wednesday
  { hour: 9, dayOfWeek: 3, openRate: 0.36, clickRate: 0.08, volume: 1300 },
  { hour: 10, dayOfWeek: 3, openRate: 0.33, clickRate: 0.07, volume: 1600 },
  { hour: 14, dayOfWeek: 3, openRate: 0.29, clickRate: 0.06, volume: 1850 },
  { hour: 15, dayOfWeek: 3, openRate: 0.31, clickRate: 0.07, volume: 1700 },
  
  // Thursday
  { hour: 9, dayOfWeek: 4, openRate: 0.37, clickRate: 0.09, volume: 1350 },
  { hour: 10, dayOfWeek: 4, openRate: 0.34, clickRate: 0.08, volume: 1650 },
  { hour: 14, dayOfWeek: 4, openRate: 0.30, clickRate: 0.07, volume: 1800 },
  { hour: 15, dayOfWeek: 4, openRate: 0.32, clickRate: 0.08, volume: 1720 },
  
  // Friday
  { hour: 9, dayOfWeek: 5, openRate: 0.33, clickRate: 0.07, volume: 1100 },
  { hour: 10, dayOfWeek: 5, openRate: 0.30, clickRate: 0.06, volume: 1400 },
  { hour: 14, dayOfWeek: 5, openRate: 0.25, clickRate: 0.05, volume: 1600 },
  { hour: 15, dayOfWeek: 5, openRate: 0.27, clickRate: 0.06, volume: 1500 },
];

export function OptimalTimingAnalyzer({ 
  campaignId, 
  contactEmails, 
  onOptimalTimeSelected 
}: OptimalTimingAnalyzerProps) {
  const [selectedTimezone, setSelectedTimezone] = useState("UTC");
  const [analysisType, setAnalysisType] = useState<"engagement" | "timezone" | "combined">("combined");
  const [includeWeekends, setIncludeWeekends] = useState(false);
  const [optimalTimeSlots, setOptimalTimeSlots] = useState<OptimalTimeSlot[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Get ISP send rate recommendations
  const ispRates = useQuery(api.emailScheduler.getISPSendRates, {
    contactEmails: contactEmails.slice(0, 100), // Sample for analysis
  });

  // Get optimal send times from API
  const optimalTimes = useQuery(
    api.emailScheduler.calculateOptimalSendTimes,
    campaignId ? { campaignId, timezone: selectedTimezone } : "skip"
  );

  useEffect(() => {
    if (contactEmails.length > 0) {
      analyzeOptimalTimes();
    }
  }, [contactEmails, analysisType, includeWeekends, selectedTimezone]);

  const analyzeOptimalTimes = async () => {
    setIsAnalyzing(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const slots: OptimalTimeSlot[] = [];
    
    // Analyze different time slots based on historical engagement data
    MOCK_ENGAGEMENT_DATA.forEach(data => {
      if (!includeWeekends && (data.dayOfWeek === 0 || data.dayOfWeek === 6)) {
        return;
      }
      
      const confidence = calculateConfidence(data);
      const estimatedEngagement = (data.openRate + data.clickRate) * 100;
      const reasons = generateReasons(data, analysisType);
      
      if (confidence > 0.6) { // Only include high-confidence slots
        slots.push({
          hour: data.hour,
          dayOfWeek: data.dayOfWeek,
          timezone: selectedTimezone,
          confidence: confidence * 100,
          estimatedEngagement,
          recipientCount: Math.floor(contactEmails.length * 0.8), // Estimate based on timezone
          reasons,
        });
      }
    });
    
    // Sort by confidence and estimated engagement
    slots.sort((a, b) => (b.confidence * b.estimatedEngagement) - (a.confidence * a.estimatedEngagement));
    
    setOptimalTimeSlots(slots.slice(0, 5)); // Top 5 recommendations
    setIsAnalyzing(false);
  };

  const calculateConfidence = (data: EngagementData): number => {
    const volumeScore = Math.min(data.volume / 2000, 1); // Normalize volume
    const engagementScore = (data.openRate + data.clickRate) / 0.5; // Normalize engagement
    const timeScore = getTimeScore(data.hour);
    const dayScore = getDayScore(data.dayOfWeek);
    
    return (volumeScore * 0.3 + engagementScore * 0.4 + timeScore * 0.2 + dayScore * 0.1);
  };

  const getTimeScore = (hour: number): number => {
    // Business hours get higher scores
    if (hour >= 9 && hour <= 11) return 1.0; // Morning peak
    if (hour >= 14 && hour <= 16) return 0.9; // Afternoon peak
    if (hour >= 8 && hour <= 17) return 0.7; // Business hours
    return 0.3; // Off hours
  };

  const getDayScore = (dayOfWeek: number): number => {
    // Tuesday-Thursday typically perform best
    if (dayOfWeek >= 2 && dayOfWeek <= 4) return 1.0;
    if (dayOfWeek === 1 || dayOfWeek === 5) return 0.8; // Monday/Friday
    return includeWeekends ? 0.5 : 0.2; // Weekends
  };

  const generateReasons = (data: EngagementData, type: string): string[] => {
    const reasons: string[] = [];
    
    if (data.openRate > 0.3) {
      reasons.push(`High open rate (${(data.openRate * 100).toFixed(1)}%)`);
    }
    
    if (data.clickRate > 0.07) {
      reasons.push(`Strong click-through rate (${(data.clickRate * 100).toFixed(1)}%)`);
    }
    
    if (data.volume > 1500) {
      reasons.push("High email volume tolerance");
    }
    
    if (data.hour >= 9 && data.hour <= 11) {
      reasons.push("Peak morning engagement window");
    } else if (data.hour >= 14 && data.hour <= 16) {
      reasons.push("Afternoon attention peak");
    }
    
    if (data.dayOfWeek >= 2 && data.dayOfWeek <= 4) {
      reasons.push("Mid-week optimal day");
    }
    
    return reasons;
  };

  const handleSelectOptimalTime = (slot: OptimalTimeSlot) => {
    const nextOccurrence = getNextOccurrence(slot.dayOfWeek, slot.hour);
    onOptimalTimeSelected?.(nextOccurrence, slot.timezone, slot.confidence);
  };

  const getNextOccurrence = (dayOfWeek: number, hour: number): Date => {
    const now = new Date();
    const targetDate = new Date();
    
    // Calculate days until target day of week
    const daysUntilTarget = (dayOfWeek - now.getDay() + 7) % 7;
    targetDate.setDate(now.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
    targetDate.setHours(hour, 0, 0, 0);
    
    return targetDate;
  };

  const getEngagementHeatmap = () => {
    const heatmap: number[][] = Array(7).fill(null).map(() => Array(24).fill(0));
    
    MOCK_ENGAGEMENT_DATA.forEach(data => {
      heatmap[data.dayOfWeek][data.hour] = (data.openRate + data.clickRate) * 100;
    });
    
    return heatmap;
  };

  const heatmapData = getEngagementHeatmap();

  return (
    <div className="space-y-6">
      {/* Analysis Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Optimal Timing Analysis
          </CardTitle>
          <CardDescription>
            AI-powered recommendations based on engagement patterns and recipient behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="analysis-type">Analysis Type</Label>
              <Select value={analysisType} onValueChange={(value: any) => setAnalysisType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="engagement">Engagement Data Only</SelectItem>
                  <SelectItem value="timezone">Timezone Optimization</SelectItem>
                  <SelectItem value="combined">Combined Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="timezone">Primary Timezone</Label>
              <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="include-weekends">Include Weekends</Label>
              <Switch
                id="include-weekends"
                checked={includeWeekends}
                onCheckedChange={setIncludeWeekends}
              />
            </div>
          </div>
          
          <Button onClick={analyzeOptimalTimes} disabled={isAnalyzing} className="w-full">
            {isAnalyzing ? (
              <>
                <Zap className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4 mr-2" />
                Analyze Optimal Times
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recipient Insights */}
      {contactEmails.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{contactEmails.length}</p>
                  <p className="text-sm text-gray-600">Total Recipients</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Globe className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{optimalTimes?.length || 0}</p>
                  <p className="text-sm text-gray-600">Timezones Detected</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {ispRates ? `${Math.round(ispRates.estimatedDuration)}h` : "TBD"}
                  </p>
                  <p className="text-sm text-gray-600">Estimated Duration</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Optimal Time Recommendations */}
      {optimalTimeSlots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recommended Send Times
            </CardTitle>
            <CardDescription>
              Top recommendations based on engagement data and recipient analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {optimalTimeSlots.map((slot, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="text-lg px-2 py-1">
                          #{index + 1}
                        </Badge>
                        <div>
                          <p className="font-semibold">
                            {DAYS_OF_WEEK[slot.dayOfWeek]} at {HOUR_LABELS[slot.hour]}
                          </p>
                          <p className="text-sm text-gray-600">
                            {slot.timezone} • {slot.recipientCount} recipients
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-600">Confidence Score</p>
                          <div className="flex items-center gap-2">
                            <Progress value={slot.confidence} className="flex-1" />
                            <span className="text-sm font-medium">
                              {Math.round(slot.confidence)}%
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-600">Est. Engagement</p>
                          <div className="flex items-center gap-2">
                            <Progress value={slot.estimatedEngagement} className="flex-1" />
                            <span className="text-sm font-medium">
                              {Math.round(slot.estimatedEngagement)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-1">Why this time:</p>
                        <div className="flex flex-wrap gap-1">
                          {slot.reasons.map((reason, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleSelectOptimalTime(slot)}
                      className="ml-4"
                      variant={index === 0 ? "default" : "outline"}
                    >
                      {index === 0 ? "Use Best Time" : "Select"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Engagement Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Engagement Heatmap
          </CardTitle>
          <CardDescription>
            Historical engagement patterns by day and time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-25 gap-1 min-w-[800px]">
              {/* Header row with hours */}
              <div></div>
              {HOUR_LABELS.map((hour, index) => (
                <div key={index} className="text-xs text-center p-1 font-medium">
                  {hour.split(' ')[0]}
                </div>
              ))}
              
              {/* Data rows */}
              {DAYS_OF_WEEK.map((day, dayIndex) => (
                <React.Fragment key={dayIndex}>
                  <div className="text-xs font-medium py-2 pr-2 text-right">
                    {day}
                  </div>
                  {Array.from({ length: 24 }, (_, hourIndex) => {
                    const value = heatmapData[dayIndex]?.[hourIndex] || 0;
                    const intensity = Math.min(value / 50, 1); // Normalize to 0-1
                    
                    return (
                      <div
                        key={hourIndex}
                        className="h-8 rounded text-xs flex items-center justify-center text-white font-medium"
                        style={{
                          backgroundColor: `rgba(59, 130, 246, ${intensity})`,
                        }}
                        title={`${day} ${HOUR_LABELS[hourIndex]}: ${value.toFixed(1)}% engagement`}
                      >
                        {value > 0 ? Math.round(value) : ""}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 rounded"></div>
                <span>Low engagement</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-400 rounded"></div>
                <span>Medium engagement</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-600 rounded"></div>
                <span>High engagement</span>
              </div>
            </div>
            <p>All times shown in {selectedTimezone}</p>
          </div>
        </CardContent>
      </Card>

      {/* ISP Considerations */}
      {ispRates && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              ISP Distribution & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-3">Email Provider Breakdown</h4>
                <div className="space-y-2">
                  {ispRates.ispBreakdown.map((isp, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">{isp.domain}</span>
                      <div className="text-right">
                        <p className="text-sm">{isp.recipientCount} recipients</p>
                        <p className="text-xs text-gray-600">
                          Max: {isp.maxPerHour}/hr
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Sending Recommendations</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Recommended Rate</p>
                      <p className="text-xs text-gray-600">
                        {ispRates.recommendedRate} emails/hour for optimal delivery
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Estimated Duration</p>
                      <p className="text-xs text-gray-600">
                        {ispRates.estimatedDuration} hours to send all emails
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Best Practice</p>
                      <p className="text-xs text-gray-600">
                        Spread sends across multiple optimal time windows
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
