"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Scan,
  Lock,
  Key,
  FileText,
  Download,
  RefreshCw,
  Play,
  Pause,
  Eye,
  EyeOff,
  Settings
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { formatDistanceToNow } from 'date-fns';
import type { Id } from '@/convex/_generated/dataModel';

interface SecurityDashboardProps {
  userId: Id<'users'>;
  integrationId?: Id<'integrations'>;
}

export default function SecurityDashboard({ userId, integrationId }: SecurityDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedScan, setSelectedScan] = useState<any>(null);
  const [showDetails, setShowDetails] = useState<{ [key: string]: boolean }>({});

  // Queries
  const securityScans = useQuery(api.securityScanning.getSecurityScans, {
    userId,
    integrationId,
  });

  const securityAlerts = useQuery(api.securityScanning.getSecurityAlerts, {
    userId,
    integrationId,
  });

  const complianceStatus = useQuery(api.securityScanning.getComplianceStatus, {
    userId,
    integrationId,
  });

  const vulnerabilityReport = useQuery(api.securityScanning.getVulnerabilityReport, {
    userId,
    integrationId,
  });

  // Mutations
  const runSecurityScan = useMutation(api.securityScanning.runSecurityScan);
  const acknowledgeAlert = useMutation(api.securityScanning.acknowledgeAlert);
  const resolveVulnerability = useMutation(api.securityScanning.resolveVulnerability);

  const handleRunScan = async (scanType: string) => {
    try {
      await runSecurityScan({
        userId,
        integrationId,
        scanType,
      });
    } catch (error) {
      console.error('Security scan failed:', error);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await acknowledgeAlert({
        alertId,
        userId,
      });
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const toggleDetails = (id: string) => {
    setShowDetails(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'info': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'running': return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getComplianceScore = (compliance: any) => {
    if (!compliance) return 0;
    const total = compliance.totalChecks || 0;
    const passed = compliance.passedChecks || 0;
    return total > 0 ? Math.round((passed / total) * 100) : 0;
  };

  const scanTypes = [
    { id: 'vulnerability', name: 'Vulnerability Scan', icon: Shield },
    { id: 'authentication', name: 'Authentication Check', icon: Lock },
    { id: 'authorization', name: 'Authorization Review', icon: Key },
    { id: 'data_encryption', name: 'Data Encryption', icon: Lock },
    { id: 'api_security', name: 'API Security', icon: Shield },
    { id: 'compliance', name: 'Compliance Check', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Security Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor security posture and maintain compliance with automated scanning and threat detection
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => handleRunScan('comprehensive')}>
            <Scan className="h-4 w-4 mr-2" />
            Run Scan
          </Button>
        </div>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Security Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {vulnerabilityReport?.securityScore || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {vulnerabilityReport?.securityScore >= 90 ? 'Excellent' :
               vulnerabilityReport?.securityScore >= 80 ? 'Good' :
               vulnerabilityReport?.securityScore >= 70 ? 'Fair' : 'Needs Attention'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {securityAlerts?.filter((alert: any) => alert.status === 'active').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {securityAlerts?.filter((alert: any) => alert.severity === 'critical').length || 0} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <XCircle className="h-4 w-4 mr-2" />
              Vulnerabilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {vulnerabilityReport?.totalVulnerabilities || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {vulnerabilityReport?.criticalVulnerabilities || 0} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {getComplianceScore(complianceStatus)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {complianceStatus?.passedChecks || 0} of {complianceStatus?.totalChecks || 0} checks
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="scans">Security Scans</TabsTrigger>
          <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Recent Security Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Activity</CardTitle>
              <CardDescription>
                Latest security scans and threat detections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityScans?.slice(0, 5).map((scan: any) => (
                  <div key={scan._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {getStatusIcon(scan.status)}
                      </div>
                      <div>
                        <p className="font-medium">{scan.scanType.replace('_', ' ').toUpperCase()}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(scan.createdAt)} ago
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getSeverityColor(scan.riskLevel)}>
                        {scan.issuesFound} issues
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedScan(scan)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Security Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Security Trend</CardTitle>
              <CardDescription>
                Security score trend over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-48 flex items-center justify-center border rounded-lg bg-muted/10">
                  <div className="text-center">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Security trend chart would go here</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-green-600">+5%</div>
                    <div className="text-sm text-muted-foreground">This Week</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-blue-600">+12%</div>
                    <div className="text-sm text-muted-foreground">This Month</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-purple-600">+28%</div>
                    <div className="text-sm text-muted-foreground">This Quarter</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scans" className="space-y-4">
          {/* Scan Types */}
          <Card>
            <CardHeader>
              <CardTitle>Available Security Scans</CardTitle>
              <CardDescription>
                Run different types of security assessments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scanTypes.map((scanType) => {
                  const Icon = scanType.icon;
                  return (
                    <div key={scanType.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{scanType.name}</span>
                        </div>
                        <Button size="sm" onClick={() => handleRunScan(scanType.id)}>
                          <Play className="h-4 w-4 mr-1" />
                          Run
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Comprehensive {scanType.name.toLowerCase()} assessment
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Scans */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Scans</CardTitle>
              <CardDescription>
                History of security scans and their results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityScans?.map((scan: any) => (
                  <div key={scan._id} className="border rounded-lg">
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer"
                      onClick={() => toggleDetails(scan._id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {getStatusIcon(scan.status)}
                        </div>
                        <div>
                          <p className="font-medium">{scan.scanType.replace('_', ' ').toUpperCase()}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(scan.createdAt)} ago • 
                            Duration: {scan.duration || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getSeverityColor(scan.riskLevel)}>
                          {scan.issuesFound} issues
                        </Badge>
                        <Badge variant="outline">
                          {scan.status}
                        </Badge>
                        {showDetails[scan._id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </div>
                    </div>
                    
                    {showDetails[scan._id] && (
                      <div className="px-4 pb-4 border-t">
                        <div className="pt-4 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <div className="text-sm text-muted-foreground">Scan Type</div>
                              <div className="font-medium">{scan.scanType.replace('_', ' ')}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Risk Level</div>
                              <Badge className={getSeverityColor(scan.riskLevel)}>
                                {scan.riskLevel}
                              </Badge>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Issues Found</div>
                              <div className="font-medium">{scan.issuesFound}</div>
                            </div>
                          </div>
                          
                          {scan.findings && scan.findings.length > 0 && (
                            <div>
                              <div className="text-sm text-muted-foreground mb-2">Key Findings:</div>
                              <div className="space-y-2">
                                {scan.findings.slice(0, 3).map((finding: any, index: number) => (
                                  <div key={index} className="flex items-start space-x-2">
                                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                                    <div className="text-sm">
                                      <div className="font-medium">{finding.title}</div>
                                      <div className="text-muted-foreground">{finding.description}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {scan.recommendations && scan.recommendations.length > 0 && (
                            <div>
                              <div className="text-sm text-muted-foreground mb-2">Recommendations:</div>
                              <ul className="text-sm space-y-1">
                                {scan.recommendations.slice(0, 3).map((rec: string, index: number) => (
                                  <li key={index} className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vulnerabilities" className="space-y-4">
          {/* Vulnerability Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Vulnerability Summary</CardTitle>
              <CardDescription>
                Overview of identified security vulnerabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {['critical', 'high', 'medium', 'low'].map((severity) => (
                  <div key={severity} className="text-center">
                    <div className={`text-2xl font-bold ${
                      severity === 'critical' ? 'text-red-600' :
                      severity === 'high' ? 'text-orange-600' :
                      severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                    }`}>
                      {vulnerabilityReport?.vulnerabilities?.filter((v: any) => v.severity === severity).length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground capitalize">{severity}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Vulnerability List */}
          <Card>
            <CardHeader>
              <CardTitle>Vulnerabilities</CardTitle>
              <CardDescription>
                Detailed list of security vulnerabilities requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vulnerabilityReport?.vulnerabilities?.map((vuln: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={getSeverityColor(vuln.severity)}>
                            {vuln.severity}
                          </Badge>
                          <span className="font-medium">{vuln.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{vuln.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Category</div>
                            <div className="font-medium">{vuln.category}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">CVSS Score</div>
                            <div className="font-medium">{vuln.cvssScore || 'N/A'}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Affected Component</div>
                            <div className="font-medium">{vuln.component}</div>
                          </div>
                        </div>

                        {vuln.recommendations && (
                          <div className="mt-3">
                            <div className="text-sm text-muted-foreground mb-1">Remediation:</div>
                            <p className="text-sm">{vuln.recommendations}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col space-y-2 ml-4">
                        <Button size="sm" variant="outline">
                          <FileText className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                        <Button size="sm" onClick={() => resolveVulnerability({ vulnerabilityId: vuln.id })}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          {/* Compliance Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Status</CardTitle>
              <CardDescription>
                Current compliance standing across different frameworks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">Overall Compliance Score</span>
                  <div className="text-2xl font-bold text-blue-600">
                    {getComplianceScore(complianceStatus)}%
                  </div>
                </div>
                <Progress value={getComplianceScore(complianceStatus)} className="w-full" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {complianceStatus?.frameworks?.map((framework: any, index: number) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{framework.name}</span>
                        <Badge variant={framework.status === 'compliant' ? 'default' : 'secondary'}>
                          {framework.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {framework.passedChecks} of {framework.totalChecks} checks passed
                      </div>
                      <Progress 
                        value={(framework.passedChecks / framework.totalChecks) * 100} 
                        className="mt-2 h-2"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compliance Issues */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Issues</CardTitle>
              <CardDescription>
                Areas requiring attention to maintain compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {complianceStatus?.issues?.map((issue: any, index: number) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="h-5 w-5 text-orange-500 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-medium">{issue.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm">
                          <span className="text-muted-foreground">Framework: {issue.framework}</span>
                          <Badge className={getSeverityColor(issue.severity)}>
                            {issue.severity}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {/* Active Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Security Alerts</CardTitle>
              <CardDescription>
                Real-time security alerts and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityAlerts?.map((alert: any) => (
                  <Alert key={alert._id} className={`border-l-4 ${
                    alert.severity === 'critical' ? 'border-l-red-500' :
                    alert.severity === 'high' ? 'border-l-orange-500' :
                    alert.severity === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className={`h-5 w-5 mt-1 ${
                          alert.severity === 'critical' ? 'text-red-500' :
                          alert.severity === 'high' ? 'text-orange-500' :
                          alert.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                        }`} />
                        <div>
                          <AlertDescription className="font-medium">
                            {alert.title}
                          </AlertDescription>
                          <AlertDescription className="mt-1 text-muted-foreground">
                            {alert.description}
                          </AlertDescription>
                          <div className="flex items-center space-x-4 mt-2 text-sm">
                            <span className="text-muted-foreground">
                              {formatDistanceToNow(alert.createdAt)} ago
                            </span>
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            <Badge variant="outline">
                              {alert.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      {alert.status === 'active' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAcknowledgeAlert(alert._id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Scan Details Modal */}
      {selectedScan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Scan Details: {selectedScan.scanType.replace('_', ' ').toUpperCase()}</span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedScan(null)}>
                  ×
                </Button>
              </CardTitle>
              <CardDescription>
                Comprehensive results from {selectedScan.scanType} security scan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Scan Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedScan.status)}
                    <span className="font-medium capitalize">{selectedScan.status}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Issues Found</div>
                  <div className="font-medium">{selectedScan.issuesFound}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Risk Level</div>
                  <Badge className={getSeverityColor(selectedScan.riskLevel)}>
                    {selectedScan.riskLevel}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Duration</div>
                  <div className="font-medium">{selectedScan.duration || 'N/A'}</div>
                </div>
              </div>

              <Separator />

              {/* Detailed Findings */}
              {selectedScan.findings && selectedScan.findings.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">Detailed Findings</h3>
                  <div className="space-y-3">
                    {selectedScan.findings.map((finding: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="h-5 w-5 text-orange-500 mt-1" />
                          <div className="flex-1">
                            <h4 className="font-medium">{finding.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{finding.description}</p>
                            {finding.severity && (
                              <div className="mt-2">
                                <Badge className={getSeverityColor(finding.severity)}>
                                  {finding.severity}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {selectedScan.recommendations && selectedScan.recommendations.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">Recommendations</h3>
                  <ul className="space-y-2">
                    {selectedScan.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
                <Button>
                  <Scan className="h-4 w-4 mr-2" />
                  Rescan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
