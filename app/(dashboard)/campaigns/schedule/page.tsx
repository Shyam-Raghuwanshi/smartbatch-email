"use client";

import React, { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Eye,
  Users,
  Mail,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

type ScheduleStatus = "pending" | "processed" | "skipped" | "failed";

const statusConfig = {
  pending: {
    label: "Pending",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Clock,
  },
  processed: {
    label: "Sent",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
  skipped: {
    label: "Skipped",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: AlertCircle,
  },
  failed: {
    label: "Failed",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
};

export default function SchedulePage() {
  const [statusFilter, setStatusFilter] = useState<ScheduleStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const scheduleData = useQuery(api.emailScheduler.getScheduleEntriesWithCampaigns, {
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  // Get current user for testing
  const getCurrentUser = useQuery(api.users.getCurrentUser);
  const createTestCampaigns = useMutation(api.testSchedule.createTestScheduledCampaigns);
  const syncSchedules = useMutation(api.emailScheduler.syncCampaignSchedules);

  const handleCreateTestCampaigns = async () => {
    if (!getCurrentUser) {
      toast.error("Please log in first");
      return;
    }
    
    try {
      const result = await createTestCampaigns({ userId: getCurrentUser._id });
      toast.success(`Created ${result.length} test scheduled campaigns!`);
    } catch (error) {
      console.error('Error creating test campaigns:', error);
      toast.error("Failed to create test campaigns");
    }
  };

  const handleSyncSchedules = async () => {
    try {
      const result = await syncSchedules();
      if (result.created > 0) {
        toast.success(`Synced ${result.created} campaign schedules!`);
      } else {
        toast.info("All campaign schedules are already synced");
      }
    } catch (error) {
      console.error('Error syncing schedules:', error);
      toast.error("Failed to sync schedules");
    }
  };

  const filteredSchedules = scheduleData?.filter((schedule) => {
    const matchesSearch = 
      schedule.campaign?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.campaign?.settings.subject.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  }) || [];

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  };

  const getTimeUntilSend = (scheduledAt: number) => {
    const now = Date.now();
    const timeDiff = scheduledAt - now;
    
    if (timeDiff <= 0) return "Overdue";
    
    const days = Math.floor(timeDiff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((timeDiff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((timeDiff % (60 * 60 * 1000)) / (60 * 1000));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getScheduleStats = () => {
    const total = filteredSchedules.length;
    const pending = filteredSchedules.filter(s => s.status === "pending").length;
    const processed = filteredSchedules.filter(s => s.status === "processed").length;
    const failed = filteredSchedules.filter(s => s.status === "failed").length;
    const skipped = filteredSchedules.filter(s => s.status === "skipped").length;

    return { total, pending, processed, failed, skipped };
  };

  const stats = getScheduleStats();

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Schedule</h1>
            <p className="text-gray-600">
              Manage your scheduled and recurring campaigns
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSyncSchedules} variant="outline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Sync Schedules
            </Button>
            <Button onClick={handleCreateTestCampaigns} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Test Campaigns
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sent</p>
                  <p className="text-2xl font-bold text-green-600">{stats.processed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Skipped</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.skipped}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search by campaign name or subject..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={(value: ScheduleStatus | "all") => setStatusFilter(value)}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processed">Sent</SelectItem>
                    <SelectItem value="skipped">Skipped</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scheduled Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Scheduled Campaigns
            </CardTitle>
            <CardDescription>
              Manage your scheduled and recurring campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredSchedules.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No schedules found</h3>
                <p className="text-gray-600">
                  {searchQuery || statusFilter !== "all" 
                    ? "Try adjusting your search or filter criteria."
                    : "Create a scheduled campaign to see it here."
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Scheduled For</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSchedules.map((schedule) => {
                      const StatusIcon = statusConfig[schedule.status].icon;
                      const isUpcoming = schedule.status === "pending" && schedule.scheduledAt > Date.now();
                      
                      return (
                        <TableRow key={schedule._id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{schedule.campaign?.name || "Unnamed Campaign"}</div>
                              <div className="text-sm text-gray-600 flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {schedule.campaign?.settings.subject || "No subject"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={`flex items-center gap-1 ${statusConfig[schedule.status].color}`}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {statusConfig[schedule.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm">{formatDateTime(schedule.scheduledAt)}</div>
                              {isUpcoming && (
                                <div className="text-xs text-blue-600">
                                  in {getTimeUntilSend(schedule.scheduledAt)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-gray-500" />
                              <span>{schedule.recipientCount || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600">
                              {formatDateTime(schedule.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  // Navigate to campaign details
                                  window.location.href = `/campaigns/${schedule.campaignId}`;
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
