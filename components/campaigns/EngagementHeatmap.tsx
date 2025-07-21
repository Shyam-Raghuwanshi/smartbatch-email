"use client";

import React, { useMemo } from 'react';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Thermometer, Clock, Calendar, TrendingUp, Eye, MousePointer } from 'lucide-react';
import { Id } from "@/convex/_generated/dataModel";

interface EngagementHeatmapProps {
  campaignId: Id<"campaigns">;
  days?: number;
  onDaysChange?: (days: number) => void;
}

export function EngagementHeatmap({ campaignId, days = 7, onDaysChange }: EngagementHeatmapProps) {
  const heatmapData = useQuery(api.campaignMonitoring.getCampaignEngagementHeatmap, { 
    campaignId, 
    days 
  });
  
  const processedData = useMemo(() => {
    if (!heatmapData) return { grid: [], maxEngagement: 0, stats: null };
    
    // Create a 2D grid [day][hour]
    const grid = Array(days).fill(null).map(() => Array(24).fill(null));
    let maxEngagement = 0;
    let totalOpens = 0;
    let totalClicks = 0;
    let totalSent = 0;
    
    heatmapData.forEach(item => {
      grid[item.day][item.hour] = item;
      maxEngagement = Math.max(maxEngagement, item.engagement);
      totalOpens += item.opens;
      totalClicks += item.clicks;
      totalSent += item.sent;
    });
    
    // Find best performing times
    const sortedByEngagement = [...heatmapData]
      .filter(item => item.engagement > 0)
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 5);
    
    const hourlyStats = Array(24).fill(null).map((_, hour) => {
      const hourData = heatmapData.filter(item => item.hour === hour);
      const totalEngagement = hourData.reduce((sum, item) => sum + item.engagement, 0);
      const avgEngagement = hourData.length > 0 ? totalEngagement / hourData.length : 0;
      const totalHourOpens = hourData.reduce((sum, item) => sum + item.opens, 0);
      const totalHourClicks = hourData.reduce((sum, item) => sum + item.clicks, 0);
      
      return {
        hour,
        avgEngagement,
        opens: totalHourOpens,
        clicks: totalHourClicks,
      };
    });
    
    const stats = {
      totalOpens,
      totalClicks,
      totalSent,
      avgOpenRate: totalSent > 0 ? (totalOpens / totalSent) * 100 : 0,
      avgClickRate: totalOpens > 0 ? (totalClicks / totalOpens) * 100 : 0,
      bestTimes: sortedByEngagement,
      hourlyStats,
    };
    
    return { grid, maxEngagement, stats };
  }, [heatmapData, days]);
  
  const getEngagementColor = (engagement: number, maxEngagement: number) => {
    if (engagement === 0) return 'bg-gray-100';
    
    const intensity = engagement / maxEngagement;
    if (intensity >= 0.8) return 'bg-green-500';
    if (intensity >= 0.6) return 'bg-green-400';
    if (intensity >= 0.4) return 'bg-green-300';
    if (intensity >= 0.2) return 'bg-green-200';
    return 'bg-green-100';
  };
  
  const getHourLabel = (hour: number) => {
    return hour === 0 ? '12 AM' : 
           hour < 12 ? `${hour} AM` : 
           hour === 12 ? '12 PM' : 
           `${hour - 12} PM`;
  };
  
  const getDayLabel = (dayIndex: number) => {
    const date = new Date();
    date.setDate(date.getDate() - dayIndex);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };
  
  if (!heatmapData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5" />
            Engagement Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="h-5 w-5" />
                Engagement Heatmap
              </CardTitle>
              <CardDescription>
                Email engagement patterns by day and time
              </CardDescription>
            </div>
            <Select value={days.toString()} onValueChange={(value) => onDaysChange?.(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {processedData.stats && (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{processedData.stats.totalSent}</div>
                  <div className="text-sm text-blue-600">Emails Sent</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{processedData.stats.totalOpens}</div>
                  <div className="text-sm text-green-600">Opens</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{processedData.stats.totalClicks}</div>
                  <div className="text-sm text-purple-600">Clicks</div>
                </div>
                <div className="text-center p-3 bg-indigo-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">
                    {processedData.stats.avgOpenRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-indigo-600">Avg Open Rate</div>
                </div>
              </div>
              
              {/* Heatmap Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Engagement by Time</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Low</span>
                    <div className="flex gap-1">
                      <div className="w-3 h-3 bg-gray-100 rounded"></div>
                      <div className="w-3 h-3 bg-green-100 rounded"></div>
                      <div className="w-3 h-3 bg-green-200 rounded"></div>
                      <div className="w-3 h-3 bg-green-300 rounded"></div>
                      <div className="w-3 h-3 bg-green-400 rounded"></div>
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                    </div>
                    <span>High</span>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <div className="min-w-max">
                    {/* Hour labels */}
                    <div className="flex">
                      <div className="w-20"></div>
                      {Array.from({ length: 24 }, (_, hour) => (
                        <div key={hour} className="w-8 text-xs text-center text-gray-500 p-1">
                          {hour % 4 === 0 ? getHourLabel(hour).split(' ')[0] : ''}
                        </div>
                      ))}
                    </div>
                    
                    {/* Heatmap rows */}
                    {processedData.grid.map((row, dayIndex) => (
                      <div key={dayIndex} className="flex items-center">
                        <div className="w-20 text-xs text-gray-700 pr-2 text-right">
                          {getDayLabel(dayIndex)}
                        </div>
                        {row.map((cell, hour) => (
                          <div
                            key={hour}
                            className={`w-8 h-8 m-0.5 rounded ${
                              cell ? getEngagementColor(cell.engagement, processedData.maxEngagement) : 'bg-gray-100'
                            } cursor-pointer transition-all hover:scale-110`}
                            title={cell ? 
                              `${getDayLabel(dayIndex)} ${getHourLabel(hour)}\n` +
                              `Opens: ${cell.opens}, Clicks: ${cell.clicks}\n` +
                              `Sent: ${cell.sent}, Engagement: ${(cell.engagement * 100).toFixed(1)}%` :
                              'No data'
                            }
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Best Performing Times */}
      {processedData.stats?.bestTimes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Best Performing Times
            </CardTitle>
            <CardDescription>
              Times with highest engagement rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {processedData.stats.bestTimes.map((time, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <div>
                      <div className="font-medium">
                        {getDayLabel(time.day)} at {getHourLabel(time.hour)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {time.opens} opens, {time.clicks} clicks from {time.sent} emails
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {(time.engagement * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">engagement</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Hourly Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Hourly Performance
          </CardTitle>
          <CardDescription>
            Average engagement by hour of day
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {processedData.stats?.hourlyStats.map((hourStat, index) => {
              const isActive = hourStat.avgEngagement > 0;
              const maxHourlyEngagement = Math.max(...processedData.stats.hourlyStats.map(h => h.avgEngagement));
              const barWidth = maxHourlyEngagement > 0 ? (hourStat.avgEngagement / maxHourlyEngagement) * 100 : 0;
              
              return (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-16 text-sm text-gray-600 text-right">
                    {getHourLabel(hourStat.hour)}
                  </div>
                  <div className="flex-1 relative">
                    <div className="h-8 bg-gray-100 rounded">
                      {barWidth > 0 && (
                        <div 
                          className="h-full bg-gradient-to-r from-blue-400 to-green-400 rounded"
                          style={{ width: `${barWidth}%` }}
                        />
                      )}
                    </div>
                    {isActive && (
                      <div className="absolute inset-0 flex items-center px-2 text-sm">
                        <span className="text-white font-medium">
                          {(hourStat.avgEngagement * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="w-24 text-right">
                    <div className="flex items-center justify-end gap-2 text-xs text-gray-600">
                      <Eye className="h-3 w-3" />
                      <span>{hourStat.opens}</span>
                      <MousePointer className="h-3 w-3" />
                      <span>{hourStat.clicks}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
