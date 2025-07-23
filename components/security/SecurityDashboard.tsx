"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Shield, Eye, Lock, Users, FileText, Database, Bell } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface SecurityMetrics {
  riskLevel: "low" | "medium" | "high" | "critical";
  securityScore: number;
  totalViolations: number;
  activeThreats: number;
  complianceScore: number;
  lastSecurityScan: number;
}

interface SecurityAlert {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  timestamp: number;
  resolved: boolean;
}

export const SecurityDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState(7); // days
  
  // Mock data - in real implementation, these would come from Convex queries
  const securityMetrics: SecurityMetrics = {
    riskLevel: "low",
    securityScore: 87,
    totalViolations: 3,
    activeThreats: 0,
    complianceScore: 92,
    lastSecurityScan: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
  };

  const recentAlerts: SecurityAlert[] = [
    {
      id: "1",
      severity: "medium",
      title: "Rate Limit Exceeded",
      description: "API rate limit exceeded from IP 192.168.1.100",
      timestamp: Date.now() - 30 * 60 * 1000,
      resolved: false,
    },
    {
      id: "2",
      severity: "low",
      title: "Unusual Login Pattern",
      description: "Login from new device detected",
      timestamp: Date.now() - 2 * 60 * 60 * 1000,
      resolved: true,
    },
  ];

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low": return "text-green-600 bg-green-50";
      case "medium": return "text-yellow-600 bg-yellow-50";
      case "high": return "text-orange-600 bg-orange-50";
      case "critical": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low": return "bg-blue-100 text-blue-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "critical": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor security status, compliance, and threat detection
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Configure Alerts
          </Button>
        </div>
      </div>

      {/* Security Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityMetrics.securityScore}%</div>
            <Progress value={securityMetrics.securityScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              +2% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className={getRiskColor(securityMetrics.riskLevel)}>
              {securityMetrics.riskLevel.toUpperCase()}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              {securityMetrics.activeThreats} active threats
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityMetrics.complianceScore}%</div>
            <Progress value={securityMetrics.complianceScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              GDPR & SOC2 compliant
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Violations</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityMetrics.totalViolations}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Last 7 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      {recentAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Recent Security Alerts
            </CardTitle>
            <CardDescription>
              Latest security events and notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <Alert key={alert.id} className={alert.severity === "critical" ? "border-red-200" : ""}>
                  <AlertCircle className="h-4 w-4" />
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <AlertTitle className="flex items-center">
                        {alert.title}
                        <Badge className={`ml-2 ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </Badge>
                        {alert.resolved && (
                          <Badge variant="outline" className="ml-2 bg-green-50 text-green-700">
                            Resolved
                          </Badge>
                        )}
                      </AlertTitle>
                      <AlertDescription>
                        {alert.description}
                      </AlertDescription>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleString()}
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Details Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="threats">Threat Detection</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
          <TabsTrigger value="encryption">Data Protection</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Security Health</CardTitle>
                <CardDescription>
                  Overall security posture and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Authentication</span>
                    <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Data Encryption</span>
                    <Badge className="bg-green-100 text-green-800">Strong</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Access Controls</span>
                    <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Audit Logging</span>
                    <Badge className="bg-green-100 text-green-800">Complete</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest security-related events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">Security scan completed</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">New encryption key generated</p>
                      <p className="text-xs text-muted-foreground">5 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">Rate limit threshold updated</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="threats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Threat Detection</CardTitle>
              <CardDescription>
                Real-time monitoring and threat analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Shield className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Threats</h3>
                <p className="text-muted-foreground">
                  Your system is secure. Last scan completed 2 hours ago.
                </p>
                <Button className="mt-4" variant="outline">
                  Run Security Scan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Access Control</CardTitle>
              <CardDescription>
                User permissions and role management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Two-Factor Authentication</span>
                  <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Session Management</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">API Key Rotation</span>
                  <Badge className="bg-yellow-100 text-yellow-800">Due Soon</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="encryption" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Protection</CardTitle>
              <CardDescription>
                Encryption status and data security measures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Data at Rest</span>
                  <Badge className="bg-green-100 text-green-800">
                    <Lock className="h-3 w-3 mr-1" />
                    AES-256 Encrypted
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Data in Transit</span>
                  <Badge className="bg-green-100 text-green-800">
                    <Lock className="h-3 w-3 mr-1" />
                    TLS 1.3
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Key Management</span>
                  <Badge className="bg-green-100 text-green-800">HSM Protected</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Status</CardTitle>
              <CardDescription>
                Regulatory compliance and audit readiness
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">GDPR Compliance</span>
                  <Badge className="bg-green-100 text-green-800">Compliant</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">SOC 2 Type II</span>
                  <Badge className="bg-green-100 text-green-800">Certified</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Data Retention</span>
                  <Badge className="bg-green-100 text-green-800">Automated</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Audit Logging</span>
                  <Badge className="bg-green-100 text-green-800">Complete</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityDashboard;
