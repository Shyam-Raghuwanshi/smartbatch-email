"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Download, 
  FileText, 
  Database, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Package,
  Shield,
  Filter,
  Calendar
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DataCategory {
  id: string;
  name: string;
  description: string;
  size: string;
  recordCount: number;
  icon: React.ReactNode;
  included: boolean;
}

interface ExportRequest {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  requestedAt: number;
  completedAt?: number;
  downloadUrl?: string;
  expiresAt?: number;
  format: "json" | "csv" | "xml";
  categories: string[];
  fileSize?: string;
}

const DATA_CATEGORIES: DataCategory[] = [
  {
    id: "profile",
    name: "Profile Information",
    description: "Your account details, preferences, and settings",
    size: "2.3 KB",
    recordCount: 1,
    icon: <Database className="h-4 w-4" />,
    included: true,
  },
  {
    id: "contacts",
    name: "Contact Lists",
    description: "All your contact lists and subscriber information",
    size: "45.7 MB",
    recordCount: 12450,
    icon: <Package className="h-4 w-4" />,
    included: true,
  },
  {
    id: "campaigns",
    name: "Email Campaigns",
    description: "Campaign data, templates, and send history",
    size: "23.1 MB",
    recordCount: 156,
    icon: <FileText className="h-4 w-4" />,
    included: true,
  },
  {
    id: "analytics",
    name: "Analytics Data",
    description: "Email performance metrics and engagement data",
    size: "12.8 MB",
    recordCount: 8734,
    icon: <Database className="h-4 w-4" />,
    included: false,
  },
  {
    id: "templates",
    name: "Email Templates",
    description: "Your custom email templates and designs",
    size: "5.2 MB",
    recordCount: 34,
    icon: <FileText className="h-4 w-4" />,
    included: false,
  },
  {
    id: "integrations",
    name: "Integration Data",
    description: "Connected services and sync data",
    size: "1.1 MB",
    recordCount: 67,
    icon: <Package className="h-4 w-4" />,
    included: false,
  },
  {
    id: "audit_logs",
    name: "Activity Logs",
    description: "Your account activity and access logs",
    size: "8.9 MB",
    recordCount: 2341,
    icon: <Shield className="h-4 w-4" />,
    included: false,
  },
];

const RECENT_EXPORTS: ExportRequest[] = [
  {
    id: "1",
    status: "completed",
    requestedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    completedAt: Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000,
    downloadUrl: "#",
    expiresAt: Date.now() + 4 * 24 * 60 * 60 * 1000,
    format: "json",
    categories: ["profile", "contacts", "campaigns"],
    fileSize: "68.4 MB",
  },
  {
    id: "2",
    status: "processing",
    requestedAt: Date.now() - 30 * 60 * 1000,
    format: "csv",
    categories: ["contacts", "analytics"],
  },
];

export const DataExportCenter: React.FC = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    DATA_CATEGORIES.filter(cat => cat.included).map(cat => cat.id)
  );
  const [exportFormat, setExportFormat] = useState<string>("json");
  const [dateRange, setDateRange] = useState<string>("all_time");
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories(prev => [...prev, categoryId]);
    } else {
      setSelectedCategories(prev => prev.filter(id => id !== categoryId));
    }
  };

  const handleSelectAll = () => {
    setSelectedCategories(DATA_CATEGORIES.map(cat => cat.id));
  };

  const handleSelectNone = () => {
    setSelectedCategories([]);
  };

  const handleStartExport = () => {
    setIsExporting(true);
    setExportProgress(0);
    
    // Simulate export progress
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExporting(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "processing": return "bg-blue-100 text-blue-800";
      case "failed": return "bg-red-100 text-red-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "processing": return <Clock className="h-4 w-4 text-blue-500" />;
      case "failed": return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "pending": return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTotalSize = () => {
    return DATA_CATEGORIES
      .filter(cat => selectedCategories.includes(cat.id))
      .reduce((total, cat) => {
        const size = parseFloat(cat.size);
        const unit = cat.size.includes("MB") ? "MB" : "KB";
        return total + (unit === "MB" ? size : size / 1024);
      }, 0);
  };

  const getTotalRecords = () => {
    return DATA_CATEGORIES
      .filter(cat => selectedCategories.includes(cat.id))
      .reduce((total, cat) => total + cat.recordCount, 0);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Download className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Data Export Center</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Export your personal data in machine-readable formats. 
          You have the right to receive a copy of your data under GDPR Article 20.
        </p>
      </div>

      <Tabs defaultValue="new-export" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new-export">New Export</TabsTrigger>
          <TabsTrigger value="export-history">Export History</TabsTrigger>
        </TabsList>

        <TabsContent value="new-export" className="space-y-6">
          {/* Export Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Configure Data Export</span>
              </CardTitle>
              <CardDescription>
                Select the data categories and format for your export
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Category Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Data Categories</h3>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={handleSelectAll}>
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleSelectNone}>
                      Select None
                    </Button>
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  {DATA_CATEGORIES.map((category) => (
                    <div key={category.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                      <Checkbox
                        id={category.id}
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={(checked) => handleCategoryToggle(category.id, checked as boolean)}
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          {category.icon}
                          <label htmlFor={category.id} className="font-medium cursor-pointer">
                            {category.name}
                          </label>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {category.description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>{category.recordCount.toLocaleString()} records</span>
                          <span>{category.size}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Export Options */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Export Format</label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON (Recommended)</SelectItem>
                      <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
                      <SelectItem value="xml">XML (Structured)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_time">All Time</SelectItem>
                      <SelectItem value="last_year">Last Year</SelectItem>
                      <SelectItem value="last_6_months">Last 6 Months</SelectItem>
                      <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Export Summary */}
              {selectedCategories.length > 0 && (
                <Alert>
                  <Package className="h-4 w-4" />
                  <AlertTitle>Export Summary</AlertTitle>
                  <AlertDescription>
                    <div className="mt-2 space-y-1 text-sm">
                      <div>
                        <strong>{selectedCategories.length}</strong> data categories selected
                      </div>
                      <div>
                        <strong>{getTotalRecords().toLocaleString()}</strong> total records
                      </div>
                      <div>
                        Estimated size: <strong>{getTotalSize().toFixed(1)} MB</strong>
                      </div>
                      <div>
                        Format: <strong>{exportFormat.toUpperCase()}</strong>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Export Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={handleStartExport}
                  disabled={selectedCategories.length === 0 || isExporting}
                  className="min-w-[200px]"
                >
                  {isExporting ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Exporting... {exportProgress}%
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Start Export
                    </>
                  )}
                </Button>
              </div>

              {/* Export Progress */}
              {isExporting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Export Progress</span>
                    <span>{exportProgress}%</span>
                  </div>
                  <Progress value={exportProgress} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Important Information */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Important Information</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                <li>Exports are processed securely and encrypted during transit</li>
                <li>Download links expire after 7 days for security</li>
                <li>Large exports may take several minutes to complete</li>
                <li>You'll receive an email notification when your export is ready</li>
                <li>Personal data of other users is excluded for privacy protection</li>
              </ul>
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="export-history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Export History</span>
              </CardTitle>
              <CardDescription>
                View and download your previous data exports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {RECENT_EXPORTS.length > 0 ? (
                <div className="space-y-4">
                  {RECENT_EXPORTS.map((exportRequest) => (
                    <div key={exportRequest.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(exportRequest.status)}
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">
                              {exportRequest.format.toUpperCase()} Export
                            </span>
                            <Badge className={getStatusColor(exportRequest.status)}>
                              {exportRequest.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Requested: {new Date(exportRequest.requestedAt).toLocaleDateString()}
                            {exportRequest.completedAt && (
                              <span> • Completed: {new Date(exportRequest.completedAt).toLocaleDateString()}</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Categories: {exportRequest.categories.join(", ")}
                            {exportRequest.fileSize && (
                              <span> • Size: {exportRequest.fileSize}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {exportRequest.status === "completed" && exportRequest.downloadUrl && (
                          <>
                            <Button variant="outline" size="sm" asChild>
                              <a href={exportRequest.downloadUrl} download>
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </a>
                            </Button>
                            {exportRequest.expiresAt && (
                              <div className="text-xs text-muted-foreground">
                                Expires: {new Date(exportRequest.expiresAt).toLocaleDateString()}
                              </div>
                            )}
                          </>
                        )}
                        {exportRequest.status === "processing" && (
                          <Badge variant="outline" className="text-blue-600">
                            <Clock className="h-3 w-3 mr-1" />
                            Processing
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Export History</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't created any data exports yet.
                  </p>
                  <Button>
                    Create Your First Export
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataExportCenter;
