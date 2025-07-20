"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, UserX, TrendingUp, Building, Tag } from "lucide-react";

interface ContactStatsData {
  total: number;
  active: number;
  inactive: number;
  engaged: number;
  companyDistribution: [string, number][];
  tagDistribution: [string, number][];
}

interface ContactStatsProps {
  stats: ContactStatsData;
}

export function ContactStats({ stats }: ContactStatsProps) {
  const engagementRate = useMemo(() => {
    return stats.total > 0 ? Math.round((stats.engaged / stats.total) * 100) : 0;
  }, [stats.total, stats.engaged]);

  const topCompanies = stats.companyDistribution.slice(0, 5);
  const topTags = stats.tagDistribution.slice(0, 5);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Contacts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {stats.active} active, {stats.inactive} inactive
          </p>
        </CardContent>
      </Card>

      {/* Active Contacts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Contacts</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.active.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total
          </p>
        </CardContent>
      </Card>

      {/* Engaged Contacts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recently Engaged</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.engaged.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {engagementRate}% engagement rate
          </p>
        </CardContent>
      </Card>

      {/* Top Companies */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Companies</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {topCompanies.slice(0, 3).map(([company, count]) => (
              <div key={company} className="flex items-center justify-between text-sm">
                <span className="truncate">{company === "Unknown" ? "No Company" : company}</span>
                <span className="text-muted-foreground">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Tags */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Popular Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {topTags.map(([tag, count]) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag} ({count})
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Company Distribution */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Building className="h-4 w-4" />
            Company Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topCompanies.map(([company, count]) => {
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={company} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate">
                      {company === "Unknown" ? "No Company" : company}
                    </span>
                    <span className="text-muted-foreground">
                      {count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
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
