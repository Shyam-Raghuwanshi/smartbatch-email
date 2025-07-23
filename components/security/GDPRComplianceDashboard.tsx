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
  Shield, 
  FileText, 
  Download, 
  Trash2, 
  Eye, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Users,
  Database,
  Settings
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface GDPRRequest {
  id: string;
  contactEmail: string;
  requestType: "access" | "deletion" | "portability" | "rectification";
  status: "pending" | "processing" | "completed" | "rejected";
  submittedAt: number;
  processingDeadline: number;
  completedAt?: number;
  notes?: string;
}

interface ConsentRecord {
  id: string;
  contactEmail: string;
  consentType: "marketing" | "analytics" | "functional" | "necessary";
  consentStatus: boolean;
  consentDate: number;
  withdrawalDate?: number;
  source: string;
}

export const GDPRComplianceDashboard: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [newRequestDialogOpen, setNewRequestDialogOpen] = useState(false);
  const [newRequestData, setNewRequestData] = useState({
    contactEmail: "",
    requestType: "",
    requestDetails: "",
  });

  // Mock data - in real implementation, these would come from Convex queries
  const gdprDashboard = {
    consentStats: {
      total: 1250,
      active: 980,
      withdrawn: 270,
      byType: {
        marketing: { given: 650, withdrawn: 120 },
        analytics: { given: 890, withdrawn: 80 },
        functional: { given: 980, withdrawn: 50 },
        necessary: { given: 1250, withdrawn: 0 },
      },
    },
    requestStats: {
      total: 23,
      pending: 2,
      completed: 19,
      rejected: 2,
      byType: {
        access: 8,
        deletion: 6,
        portability: 5,
        rectification: 4,
      },
    },
    complianceScore: 92,
    recommendations: [
      "Review consent collection forms for clarity",
      "Update privacy policy with recent changes",
      "Schedule data retention policy review",
    ],
  };

  const recentRequests: GDPRRequest[] = [
    {
      id: "1",
      contactEmail: "user@example.com",
      requestType: "access",
      status: "pending",
      submittedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      processingDeadline: Date.now() + 28 * 24 * 60 * 60 * 1000,
    },
    {
      id: "2",
      contactEmail: "privacy@company.com",
      requestType: "deletion",
      status: "processing",
      submittedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
      processingDeadline: Date.now() + 25 * 24 * 60 * 60 * 1000,
    },
    {
      id: "3",
      contactEmail: "test@email.com",
      requestType: "portability",
      status: "completed",
      submittedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
      processingDeadline: Date.now() + 20 * 24 * 60 * 60 * 1000,
      completedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "processing": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case "access": return <Eye className="h-4 w-4" />;
      case "deletion": return <Trash2 className="h-4 w-4" />;
      case "portability": return <Download className="h-4 w-4" />;
      case "rectification": return <Settings className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getDaysRemaining = (deadline: number) => {
    const days = Math.ceil((deadline - Date.now()) / (24 * 60 * 60 * 1000));
    return Math.max(0, days);
  };

  const handleNewRequest = () => {
    // In real implementation, this would call a Convex mutation
    console.log("Creating new GDPR request:", newRequestData);
    setNewRequestDialogOpen(false);
    setNewRequestData({ contactEmail: "", requestType: "", requestDetails: "" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">GDPR Compliance</h1>
          <p className="text-muted-foreground">
            Manage data protection, privacy rights, and consent
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Dialog open={newRequestDialogOpen} onOpenChange={setNewRequestDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <FileText className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create GDPR Request</DialogTitle>
                <DialogDescription>
                  Process a new data subject request
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    value={newRequestData.contactEmail}
                    onChange={(e) => setNewRequestData({
                      ...newRequestData,
                      contactEmail: e.target.value
                    })}
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="requestType">Request Type</Label>
                  <Select
                    value={newRequestData.requestType}
                    onValueChange={(value) => setNewRequestData({
                      ...newRequestData,
                      requestType: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select request type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="access">Data Access Request</SelectItem>
                      <SelectItem value="deletion">Data Deletion Request</SelectItem>
                      <SelectItem value="portability">Data Portability Request</SelectItem>
                      <SelectItem value="rectification">Data Rectification Request</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="requestDetails">Additional Details</Label>
                  <Textarea
                    id="requestDetails"
                    value={newRequestData.requestDetails}
                    onChange={(e) => setNewRequestData({
                      ...newRequestData,
                      requestDetails: e.target.value
                    })}
                    placeholder="Additional information about the request..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setNewRequestDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleNewRequest}>
                    Create Request
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Compliance Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gdprDashboard.complianceScore}%</div>
            <Progress value={gdprDashboard.complianceScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              +3% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Consents</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gdprDashboard.consentStats.active}</div>
            <p className="text-xs text-muted-foreground">
              of {gdprDashboard.consentStats.total} total contacts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gdprDashboard.requestStats.pending}</div>
            <p className="text-xs text-muted-foreground">
              {gdprDashboard.requestStats.total} total requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Subjects</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {gdprDashboard.consentStats.total.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Contacts with consent records
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations Alert */}
      {gdprDashboard.recommendations.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Compliance Recommendations</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {gdprDashboard.recommendations.map((recommendation, index) => (
                <li key={index} className="text-sm">{recommendation}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* GDPR Details Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requests">Data Requests</TabsTrigger>
          <TabsTrigger value="consents">Consent Management</TabsTrigger>
          <TabsTrigger value="retention">Data Retention</TabsTrigger>
          <TabsTrigger value="privacy">Privacy Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Consent Overview</CardTitle>
                <CardDescription>
                  Breakdown of consent types and status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(gdprDashboard.consentStats.byType).map(([type, data]) => (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">{type}</span>
                        <span className="text-sm text-muted-foreground">
                          {data.given} given, {data.withdrawn} withdrawn
                        </span>
                      </div>
                      <Progress 
                        value={(data.given / (data.given + data.withdrawn)) * 100} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Request Types</CardTitle>
                <CardDescription>
                  Distribution of GDPR request types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(gdprDashboard.requestStats.byType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getRequestTypeIcon(type)}
                        <span className="text-sm font-medium capitalize">{type}</span>
                      </div>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Subject Requests</CardTitle>
              <CardDescription>
                Manage and track GDPR data subject requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        {request.contactEmail}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {getRequestTypeIcon(request.requestType)}
                          <span className="capitalize">{request.requestType}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(request.submittedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {getDaysRemaining(request.processingDeadline)} days
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-3 w-3" />
                          </Button>
                          {request.status === "pending" && (
                            <Button variant="ghost" size="sm">
                              Process
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Consent Management</CardTitle>
              <CardDescription>
                Track and manage user consent preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Consent Records</h3>
                <p className="text-muted-foreground mb-4">
                  {gdprDashboard.consentStats.active} active consents out of {gdprDashboard.consentStats.total} total
                </p>
                <Button variant="outline">
                  <Database className="h-4 w-4 mr-2" />
                  View All Consents
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Retention Policies</CardTitle>
              <CardDescription>
                Automated data retention and cleanup policies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Email Tracking Data</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically delete after 2 years
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Inactive Contacts</h4>
                    <p className="text-sm text-muted-foreground">
                      Archive after 3 years of inactivity
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Withdrawn Consents</h4>
                    <p className="text-sm text-muted-foreground">
                      Delete 1 year after withdrawal
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Configure privacy and data protection settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Automatic Consent Collection</h4>
                    <p className="text-sm text-muted-foreground">
                      Require consent for all new contacts
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Data Encryption</h4>
                    <p className="text-sm text-muted-foreground">
                      Encrypt sensitive personal data
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">AES-256</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Audit Logging</h4>
                    <p className="text-sm text-muted-foreground">
                      Log all data access and modifications
                    </p>
                  </div>
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

export default GDPRComplianceDashboard;
