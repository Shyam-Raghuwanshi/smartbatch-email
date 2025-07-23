"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Mail, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  Shield, 
  Ban, 
  CheckCircle, 
  XCircle,
  Download,
  Upload,
  Eye,
  Settings
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface BounceRecord {
  id: string;
  emailAddress: string;
  bounceType: "soft" | "hard";
  bounceReason: string;
  bounceCode?: string;
  campaignId?: string;
  retryCount: number;
  suppressedAt?: number;
  createdAt: number;
}

interface SpamComplaint {
  id: string;
  emailAddress: string;
  complaintType: "abuse" | "fraud" | "virus" | "other";
  campaignId?: string;
  complaintSource: string;
  suppressedAt: number;
  createdAt: number;
}

interface SuppressionRecord {
  id: string;
  emailAddress: string;
  reason: "hard_bounce" | "soft_bounce_limit" | "spam_complaint" | "unsubscribe" | "manual" | "list_cleaning";
  source: string;
  suppressedAt: number;
  expiresAt?: number;
  notes?: string;
}

export const EmailComplianceDashboard: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [addSuppressionDialogOpen, setAddSuppressionDialogOpen] = useState(false);
  const [newSuppressionData, setNewSuppressionData] = useState({
    emailAddress: "",
    reason: "",
    notes: "",
  });

  // Mock data - in real implementation, these would come from Convex queries
  const complianceMetrics = {
    bounceRate: 2.3, // percentage
    spamComplaintRate: 0.1, // percentage
    suppressionListSize: 1847,
    deliveryRate: 97.6, // percentage
    lastBounceProcessed: Date.now() - 15 * 60 * 1000, // 15 minutes ago
    monthlyTrend: {
      bounces: -0.5, // percentage change
      complaints: -0.2,
      suppressions: +12,
    },
  };

  const recentBounces: BounceRecord[] = [
    {
      id: "1",
      emailAddress: "invalid@nonexistent.com",
      bounceType: "hard",
      bounceReason: "No such recipient",
      bounceCode: "550",
      retryCount: 0,
      suppressedAt: Date.now() - 30 * 60 * 1000,
      createdAt: Date.now() - 30 * 60 * 1000,
    },
    {
      id: "2",
      emailAddress: "full@mailbox.com", 
      bounceType: "soft",
      bounceReason: "Mailbox full",
      bounceCode: "452",
      retryCount: 2,
      createdAt: Date.now() - 60 * 60 * 1000,
    },
    {
      id: "3",
      emailAddress: "temp@issue.com",
      bounceType: "soft",
      bounceReason: "Temporary failure",
      bounceCode: "421",
      retryCount: 1,
      createdAt: Date.now() - 2 * 60 * 60 * 1000,
    },
  ];

  const recentComplaints: SpamComplaint[] = [
    {
      id: "1",
      emailAddress: "complainant@example.com",
      complaintType: "abuse",
      complaintSource: "Gmail Feedback Loop",
      suppressedAt: Date.now() - 2 * 60 * 60 * 1000,
      createdAt: Date.now() - 2 * 60 * 60 * 1000,
    },
  ];

  const getBounceTypeColor = (type: string) => {
    switch (type) {
      case "hard": return "bg-red-100 text-red-800";
      case "soft": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case "hard_bounce": return <XCircle className="h-4 w-4 text-red-500" />;
      case "soft_bounce_limit": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "spam_complaint": return <Ban className="h-4 w-4 text-red-500" />;
      case "unsubscribe": return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "manual": return <Settings className="h-4 w-4 text-gray-500" />;
      case "list_cleaning": return <Shield className="h-4 w-4 text-green-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <div className="h-4 w-4" />;
  };

  const handleAddSuppression = () => {
    // In real implementation, this would call a Convex mutation
    console.log("Adding suppression:", newSuppressionData);
    setAddSuppressionDialogOpen(false);
    setNewSuppressionData({ emailAddress: "", reason: "", notes: "" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Compliance</h1>
          <p className="text-muted-foreground">
            Monitor deliverability, bounces, complaints, and suppression lists
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Dialog open={addSuppressionDialogOpen} onOpenChange={setAddSuppressionDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Ban className="h-4 w-4 mr-2" />
                Add Suppression
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Email to Suppression List</DialogTitle>
                <DialogDescription>
                  Manually add an email address to the suppression list
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="emailAddress">Email Address</Label>
                  <Input
                    id="emailAddress"
                    value={newSuppressionData.emailAddress}
                    onChange={(e) => setNewSuppressionData({
                      ...newSuppressionData,
                      emailAddress: e.target.value
                    })}
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Select
                    value={newSuppressionData.reason}
                    onValueChange={(value) => setNewSuppressionData({
                      ...newSuppressionData,
                      reason: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual Addition</SelectItem>
                      <SelectItem value="list_cleaning">List Cleaning</SelectItem>
                      <SelectItem value="unsubscribe">Unsubscribe Request</SelectItem>
                      <SelectItem value="spam_complaint">Spam Complaint</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newSuppressionData.notes}
                    onChange={(e) => setNewSuppressionData({
                      ...newSuppressionData,
                      notes: e.target.value
                    })}
                    placeholder="Additional notes about the suppression..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setAddSuppressionDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddSuppression}>
                    Add to Suppression List
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Compliance Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceMetrics.deliveryRate}%</div>
            <Progress value={complianceMetrics.deliveryRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Industry standard: 95%+
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">{complianceMetrics.bounceRate}%</div>
              {getTrendIcon(complianceMetrics.monthlyTrend.bounces)}
              <span className="text-xs text-muted-foreground">
                {Math.abs(complianceMetrics.monthlyTrend.bounces)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Target: &lt;2%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spam Complaints</CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">{complianceMetrics.spamComplaintRate}%</div>
              {getTrendIcon(complianceMetrics.monthlyTrend.complaints)}
              <span className="text-xs text-muted-foreground">
                {Math.abs(complianceMetrics.monthlyTrend.complaints)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Target: &lt;0.1%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suppressed Emails</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">
                {complianceMetrics.suppressionListSize.toLocaleString()}
              </div>
              {getTrendIcon(complianceMetrics.monthlyTrend.suppressions)}
              <span className="text-xs text-muted-foreground">
                +{complianceMetrics.monthlyTrend.suppressions}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Health Status Alert */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Email Health Status: Good</AlertTitle>
        <AlertDescription>
          Your bounce rate ({complianceMetrics.bounceRate}%) and spam complaint rate ({complianceMetrics.spamComplaintRate}%) 
          are within acceptable limits. Continue monitoring for any changes.
        </AlertDescription>
      </Alert>

      {/* Compliance Details Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bounces">Bounces</TabsTrigger>
          <TabsTrigger value="complaints">Spam Complaints</TabsTrigger>
          <TabsTrigger value="suppression">Suppression List</TabsTrigger>
          <TabsTrigger value="unsubscribe">Unsubscribe</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Bounce Analysis</CardTitle>
                <CardDescription>
                  Recent bounce patterns and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Hard Bounces</span>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-red-100 text-red-800">High Priority</Badge>
                      <span className="text-sm">12 this week</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Soft Bounces</span>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-yellow-100 text-yellow-800">Monitor</Badge>
                      <span className="text-sm">45 this week</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Retry Success Rate</span>
                    <span className="text-sm font-semibold text-green-600">73%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Health</CardTitle>
                <CardDescription>
                  Key metrics and industry benchmarks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Sender Reputation</span>
                      <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Domain Authentication</span>
                      <Badge className="bg-green-100 text-green-800">Configured</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      SPF, DKIM, and DMARC properly configured
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">List Hygiene</span>
                      <Badge className="bg-green-100 text-green-800">Good</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Last cleaned: 2 weeks ago
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bounces" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Bounces</CardTitle>
              <CardDescription>
                Monitor and manage email bounces
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email Address</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Retries</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBounces.map((bounce) => (
                    <TableRow key={bounce.id}>
                      <TableCell className="font-medium">
                        {bounce.emailAddress}
                      </TableCell>
                      <TableCell>
                        <Badge className={getBounceTypeColor(bounce.bounceType)}>
                          {bounce.bounceType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <span className="text-sm">{bounce.bounceReason}</span>
                          {bounce.bounceCode && (
                            <Badge variant="outline" className="text-xs">
                              {bounce.bounceCode}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{bounce.retryCount}</TableCell>
                      <TableCell>
                        {new Date(bounce.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {bounce.suppressedAt ? (
                          <Badge className="bg-red-100 text-red-800">Suppressed</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">Active</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="complaints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Spam Complaints</CardTitle>
              <CardDescription>
                Track and respond to spam complaints
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentComplaints.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email Address</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentComplaints.map((complaint) => (
                      <TableRow key={complaint.id}>
                        <TableCell className="font-medium">
                          {complaint.emailAddress}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-red-100 text-red-800">
                            {complaint.complaintType}
                          </Badge>
                        </TableCell>
                        <TableCell>{complaint.complaintSource}</TableCell>
                        <TableCell>
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-red-100 text-red-800">
                            Auto-Suppressed
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Recent Complaints</h3>
                  <p className="text-muted-foreground">
                    Great! You haven't received any spam complaints recently.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppression" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Suppression List Management</CardTitle>
              <CardDescription>
                View and manage your email suppression list
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">
                  {complianceMetrics.suppressionListSize.toLocaleString()} suppressed email addresses
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Import List
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export List
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getReasonIcon("hard_bounce")}
                    <div>
                      <p className="font-medium">Hard Bounces</p>
                      <p className="text-sm text-muted-foreground">Permanent delivery failures</p>
                    </div>
                  </div>
                  <Badge variant="outline">847 addresses</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getReasonIcon("spam_complaint")}
                    <div>
                      <p className="font-medium">Spam Complaints</p>
                      <p className="text-sm text-muted-foreground">Recipients who marked as spam</p>
                    </div>
                  </div>
                  <Badge variant="outline">23 addresses</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getReasonIcon("unsubscribe")}
                    <div>
                      <p className="font-medium">Unsubscribes</p>
                      <p className="text-sm text-muted-foreground">Recipients who opted out</p>
                    </div>
                  </div>
                  <Badge variant="outline">892 addresses</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getReasonIcon("manual")}
                    <div>
                      <p className="font-medium">Manual Additions</p>
                      <p className="text-sm text-muted-foreground">Manually suppressed addresses</p>
                    </div>
                  </div>
                  <Badge variant="outline">85 addresses</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unsubscribe" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Unsubscribe Management</CardTitle>
              <CardDescription>
                Monitor unsubscribe rates and manage opt-out processes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Unsubscribe Rate</span>
                    <span className="text-sm font-semibold">0.8%</span>
                  </div>
                  <Progress value={0.8} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Industry average: 0.5-1.0%
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">One-Click Unsubscribe</span>
                    <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Preference Center</span>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Auto-Suppression</span>
                    <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailComplianceDashboard;
