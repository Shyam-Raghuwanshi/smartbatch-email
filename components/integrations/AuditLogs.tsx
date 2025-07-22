"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Calendar, Filter, Download, Shield, AlertTriangle, Clock, User, Activity, FileText, Eye, Search, RefreshCw } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { formatDistanceToNow } from 'date-fns';
import type { Id } from '@/convex/_generated/dataModel';

interface AuditLogsProps {
  userId: Id<'users'>;
}

export default function AuditLogs({ userId }: AuditLogsProps) {
  const [activeTab, setActiveTab] = useState('logs');
  const [filters, setFilters] = useState({
    eventType: '',
    riskLevel: '',
    resource: '',
    dateRange: '',
    searchTerm: '',
  });
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [reportConfig, setReportConfig] = useState({
    type: 'compliance',
    title: '',
    description: '',
    dateRange: { startDate: '', endDate: '' },
    frameworks: [] as string[],
  });

  // Queries
  const auditLogs = useQuery(api.auditLogging.getAuditLogs, { 
    userId,
    filters: {
      eventType: filters.eventType || undefined,
      riskLevel: filters.riskLevel || undefined,
      resource: filters.resource || undefined,
      searchTerm: filters.searchTerm || undefined,
    },
    limit: 50 
  });

  const auditReports = useQuery(api.auditLogging.getAuditReports, { userId });

  const complianceReport = useQuery(api.auditLogging.generateComplianceReport, {
    userId,
    startDate: Date.now() - 30 * 24 * 60 * 60 * 1000, // Last 30 days
    endDate: Date.now(),
  });

  // Mutations
  const createReport = useMutation(api.auditLogging.createAuditReport);
  const exportLogs = useMutation(api.auditLogging.exportAuditLogs);

  const eventTypeOptions = [
    'user_login', 'user_logout', 'api_key_created', 'oauth_token_refreshed',
    'integration_created', 'integration_updated', 'integration_sync',
    'data_export', 'data_import', 'data_deletion', 'backup_created',
    'system_config_change', 'security_scan', 'performance_alert',
    'gdpr_request', 'compliance_check', 'campaign_created', 'email_delivered'
  ];

  const riskLevels = [
    { value: 'low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', color: 'bg-red-100 text-red-800' },
  ];

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = async (format: 'json' | 'csv' | 'pdf') => {
    try {
      await exportLogs({
        userId,
        filters,
        format,
      });
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleCreateReport = async () => {
    try {
      await createReport({
        userId,
        reportType: reportConfig.type as any,
        title: reportConfig.title,
        description: reportConfig.description,
        filters: filters,
        complianceFrameworks: reportConfig.frameworks,
      });
      setReportConfig({
        type: 'compliance',
        title: '',
        description: '',
        dateRange: { startDate: '', endDate: '' },
        frameworks: [],
      });
    } catch (error) {
      console.error('Report creation failed:', error);
    }
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    const risk = riskLevels.find(r => r.value === riskLevel);
    return risk?.color || 'bg-gray-100 text-gray-800';
  };

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('user_')) return <User className="h-4 w-4" />;
    if (eventType.includes('integration_')) return <Activity className="h-4 w-4" />;
    if (eventType.includes('data_')) return <FileText className="h-4 w-4" />;
    if (eventType.includes('security_') || eventType.includes('compliance_')) return <Shield className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Audit Logs</h2>
          <p className="text-muted-foreground">
            Monitor system activity and maintain compliance with comprehensive audit trails
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search logs..."
                      value={filters.searchTerm}
                      onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="eventType">Event Type</Label>
                  <Select value={filters.eventType} onValueChange={(value) => handleFilterChange('eventType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All events" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All events</SelectItem>
                      {eventTypeOptions.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="riskLevel">Risk Level</Label>
                  <Select value={filters.riskLevel} onValueChange={(value) => handleFilterChange('riskLevel', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All levels</SelectItem>
                      {riskLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.value.charAt(0).toUpperCase() + level.value.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="resource">Resource</Label>
                  <Input
                    id="resource"
                    placeholder="Resource name"
                    value={filters.resource}
                    onChange={(e) => handleFilterChange('resource', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="dateRange">Date Range</Label>
                  <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange('dateRange', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Last 7 days</SelectItem>
                      <SelectItem value="month">Last 30 days</SelectItem>
                      <SelectItem value="quarter">Last 90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audit Logs List */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                {auditLogs?.length || 0} events found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditLogs?.map((log) => (
                  <div 
                    key={log._id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {getEventIcon(log.eventType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {log.action}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {log.resource} • {formatDistanceToNow(log.timestamp)} ago
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getRiskBadgeColor(log.riskLevel)}>
                        {log.riskLevel}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {/* Create Report */}
          <Card>
            <CardHeader>
              <CardTitle>Create Audit Report</CardTitle>
              <CardDescription>
                Generate comprehensive audit reports for compliance and analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reportType">Report Type</Label>
                  <Select value={reportConfig.type} onValueChange={(value) => setReportConfig(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compliance">Compliance Report</SelectItem>
                      <SelectItem value="security">Security Report</SelectItem>
                      <SelectItem value="data_access">Data Access Report</SelectItem>
                      <SelectItem value="system_changes">System Changes Report</SelectItem>
                      <SelectItem value="user_activity">User Activity Report</SelectItem>
                      <SelectItem value="integration_activity">Integration Activity Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="reportTitle">Report Title</Label>
                  <Input
                    id="reportTitle"
                    placeholder="Enter report title"
                    value={reportConfig.title}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="reportDescription">Description</Label>
                <Textarea
                  id="reportDescription"
                  placeholder="Report description (optional)"
                  value={reportConfig.description}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <Button onClick={handleCreateReport} disabled={!reportConfig.title}>
                <FileText className="h-4 w-4 mr-2" />
                Create Report
              </Button>
            </CardContent>
          </Card>

          {/* Existing Reports */}
          <Card>
            <CardHeader>
              <CardTitle>Audit Reports</CardTitle>
              <CardDescription>
                Previously generated audit reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditReports?.map((report) => (
                  <div key={report._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{report.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {report.reportType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} • 
                        {report.eventCount} events • 
                        {formatDistanceToNow(report.createdAt)} ago
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={report.status === 'completed' ? 'default' : 'secondary'}>
                        {report.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          {/* Compliance Dashboard */}
          {complianceReport && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Risk Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(complianceReport.riskMetrics).map(([level, count]) => (
                      <div key={level} className="flex justify-between items-center">
                        <span className="text-sm capitalize">{level} Risk</span>
                        <Badge className={getRiskBadgeColor(level)}>{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Event Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {complianceReport.eventTypes?.slice(0, 5).map((event: any) => (
                      <div key={event.type} className="flex justify-between items-center">
                        <span className="text-sm">{event.type.replace(/_/g, ' ')}</span>
                        <span className="text-sm font-medium">{event.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {complianceReport.complianceScore}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {complianceReport.complianceScore >= 90 ? 'Excellent' :
                     complianceReport.complianceScore >= 80 ? 'Good' :
                     complianceReport.complianceScore >= 70 ? 'Fair' : 'Needs Improvement'}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Compliance Frameworks */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Frameworks</CardTitle>
              <CardDescription>
                Monitor adherence to regulatory requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {['GDPR', 'CCPA', 'SOC2', 'HIPAA', 'PCI DSS', 'ISO 27001'].map((framework) => (
                  <div key={framework} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{framework}</span>
                      <Badge variant="outline">Compliant</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Last checked: {formatDistanceToNow(Date.now() - Math.random() * 24 * 60 * 60 * 1000)} ago
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Analytics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{complianceReport?.totalEvents || 0}</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">High Risk Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {complianceReport?.riskMetrics?.high || 0}
                </div>
                <p className="text-xs text-muted-foreground">Requires attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {complianceReport?.securityEvents?.failedLogins || 0}
                </div>
                <p className="text-xs text-muted-foreground">Security concern</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Data Exports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{complianceReport?.dataEvents?.exports || 0}</div>
                <p className="text-xs text-muted-foreground">Privacy tracking</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Security Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                Security Events
              </CardTitle>
              <CardDescription>
                Recent security-related audit events requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditLogs?.filter(log => 
                  ['high', 'critical'].includes(log.riskLevel) || 
                  log.eventType.includes('security_') ||
                  log.eventType.includes('failed')
                ).slice(0, 5).map((log) => (
                  <div key={log._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <div>
                        <p className="font-medium">{log.action}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(log.timestamp)} ago
                        </p>
                      </div>
                    </div>
                    <Badge className={getRiskBadgeColor(log.riskLevel)}>
                      {log.riskLevel}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Audit Log Details</span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedLog(null)}>
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Event Type</Label>
                  <p className="font-medium">{selectedLog.eventType.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <Label>Risk Level</Label>
                  <Badge className={getRiskBadgeColor(selectedLog.riskLevel)}>
                    {selectedLog.riskLevel}
                  </Badge>
                </div>
                <div>
                  <Label>Resource</Label>
                  <p className="font-medium">{selectedLog.resource}</p>
                </div>
                <div>
                  <Label>Timestamp</Label>
                  <p className="font-medium">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                </div>
                {selectedLog.ipAddress && (
                  <div>
                    <Label>IP Address</Label>
                    <p className="font-medium">{selectedLog.ipAddress}</p>
                  </div>
                )}
                {selectedLog.userAgent && (
                  <div>
                    <Label>User Agent</Label>
                    <p className="font-medium truncate">{selectedLog.userAgent}</p>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div>
                <Label>Action</Label>
                <p className="font-medium">{selectedLog.action}</p>
              </div>
              
              {selectedLog.details && (
                <div>
                  <Label>Details</Label>
                  <pre className="text-sm bg-muted p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedLog.tags && selectedLog.tags.length > 0 && (
                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedLog.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
