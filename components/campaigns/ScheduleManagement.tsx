"use client";

import React, { useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Play,
  Pause,
  Square,
  MoreVertical,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface ScheduleManagementProps {
  onScheduleUpdate?: () => void;
}

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

export function ScheduleManagement({ onScheduleUpdate }: ScheduleManagementProps) {
  const [statusFilter, setStatusFilter] = useState<ScheduleStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchedule, setSelectedSchedule] = useState<Id<"campaignSchedules"> | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const scheduledCampaigns = useQuery(api.emailScheduler.getScheduledCampaigns, {
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const updateScheduleStatus = useMutation(api.emailScheduler.updateScheduleStatus);

  const filteredSchedules = scheduledCampaigns?.filter((schedule) => {
    const matchesSearch = 
      schedule.campaign?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.campaign?.settings.subject.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  }) || [];

  const handleStatusChange = async (scheduleId: Id<"campaignSchedules">, status: ScheduleStatus) => {
    try {
      await updateScheduleStatus({ scheduleId, status });
      toast.success(`Schedule ${status === "skipped" ? "paused" : status} successfully`);
      onScheduleUpdate?.();
    } catch (error) {
      console.error("Error updating schedule status:", error);
      toast.error("Failed to update schedule status");
    }
  };

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

  const getUpcomingSchedules = () => {
    return filteredSchedules
      .filter(s => s.status === "pending" && s.scheduledAt > Date.now())
      .sort((a, b) => a.scheduledAt - b.scheduledAt)
      .slice(0, 5);
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
  const upcomingSchedules = getUpcomingSchedules();

  return (
    <div className="space-y-6">
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

      {/* Upcoming Schedules */}
      {upcomingSchedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Next 5 Scheduled Sends</CardTitle>
            <CardDescription>
              Campaigns scheduled to send in the near future
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingSchedules.map((schedule) => (
                <div
                  key={schedule._id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="font-medium">{schedule.campaign?.name}</p>
                      <p className="text-sm text-gray-600">
                        {formatDateTime(schedule.scheduledAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {getTimeUntilSend(schedule.scheduledAt)}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(schedule._id, "skipped")}
                        >
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(schedule._id, "failed")}
                        >
                          <Square className="h-4 w-4 mr-2" />
                          Cancel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Schedules</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by campaign name or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">Filter by Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as ScheduleStatus | "all")}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
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

      {/* Schedules Table */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Campaigns</CardTitle>
          <CardDescription>
            Manage your scheduled and recurring campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scheduled For</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSchedules.map((schedule) => {
                const config = statusConfig[schedule.status];
                const StatusIcon = config.icon;

                return (
                  <TableRow key={schedule._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{schedule.campaign?.name}</p>
                        <p className="text-sm text-gray-600">
                          {schedule.campaign?.settings.subject}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={config.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{formatDateTime(schedule.scheduledAt)}</p>
                        {schedule.status === "pending" && (
                          <p className="text-sm text-gray-600">
                            in {getTimeUntilSend(schedule.scheduledAt)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {schedule.recipientCount || "TBD"}
                    </TableCell>
                    <TableCell>
                      {formatDateTime(schedule.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          
                          {schedule.status === "pending" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => setSelectedSchedule(schedule._id)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Schedule
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(schedule._id, "skipped")}
                              >
                                <Pause className="h-4 w-4 mr-2" />
                                Pause
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(schedule._id, "failed")}
                                className="text-red-600"
                              >
                                <Square className="h-4 w-4 mr-2" />
                                Cancel
                              </DropdownMenuItem>
                            </>
                          )}

                          {schedule.status === "skipped" && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(schedule._id, "pending")}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Resume
                            </DropdownMenuItem>
                          )}

                          {schedule.status === "failed" && schedule.errorMessage && (
                            <DropdownMenuItem>
                              <AlertCircle className="h-4 w-4 mr-2" />
                              View Error
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredSchedules.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No schedules found</h3>
              <p className="text-gray-600">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your filters to see more results."
                  : "Create a scheduled campaign to see it here."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Schedule Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Schedule</DialogTitle>
            <DialogDescription>
              Modify the scheduled send time for this campaign
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-datetime">New Send Date & Time</Label>
              <Input
                id="new-datetime"
                type="datetime-local"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsEditDialogOpen(false)}>
                Update Schedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
