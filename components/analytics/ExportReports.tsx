"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Download,
  FileText,
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  Loader2
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ExportReportsProps {
  dateRange: {
    from: Date;
    to: Date;
  };
}

export function ExportReports({ dateRange }: ExportReportsProps) {
  // Mock data - replace with actual data filtering based on dateRange
  const data = {
    totalEmails: 45230,
    openRate: 24.8,
    clickRate: 3.2,
    bounceRate: 1.8,
    deliveryRate: 98.2,
    revenue: 28750
  };

  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [reportType, setReportType] = useState('summary');
  const [selectedMetrics, setSelectedMetrics] = useState([
    'openRate',
    'clickRate',
    'deliveryRate',
    'bounceRate'
  ]);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [scheduledReports, setScheduledReports] = useState([
    {
      id: 1,
      name: 'Weekly Performance Report',
      frequency: 'weekly',
      format: 'pdf',
      lastSent: '2024-01-15',
      recipients: ['manager@company.com']
    },
    {
      id: 2,
      name: 'Monthly Analytics Summary',
      frequency: 'monthly',
      format: 'csv',
      lastSent: '2024-01-01',
      recipients: ['team@company.com', 'analytics@company.com']
    }
  ]);

  const reportTypes = [
    { value: 'summary', label: 'Executive Summary' },
    { value: 'detailed', label: 'Detailed Analytics' },
    { value: 'campaign', label: 'Campaign Performance' },
    { value: 'audience', label: 'Audience Insights' },
    { value: 'deliverability', label: 'Deliverability Report' },
    { value: 'custom', label: 'Custom Report' }
  ];

  const availableMetrics = [
    { id: 'emailsSent', label: 'Emails Sent' },
    { id: 'deliveryRate', label: 'Delivery Rate' },
    { id: 'openRate', label: 'Open Rate' },
    { id: 'clickRate', label: 'Click Rate' },
    { id: 'bounceRate', label: 'Bounce Rate' },
    { id: 'unsubscribeRate', label: 'Unsubscribe Rate' },
    { id: 'revenue', label: 'Revenue Attribution' },
    { id: 'engagement', label: 'Engagement Score' },
    { id: 'listGrowth', label: 'List Growth' },
    { id: 'deviceBreakdown', label: 'Device Breakdown' }
  ];

  const handleMetricToggle = (metricId: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricId)
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    );
  };

  const generateCSVReport = () => {
    const csvData = [
      ['Metric', 'Value', 'Period'],
      ['Total Emails Sent', data?.totalEmails || 0, `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`],
      ['Open Rate', `${data?.openRate || 0}%`, `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`],
      ['Click Rate', `${data?.clickRate || 0}%`, `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`],
      ['Delivery Rate', `${data?.deliveryRate || 0}%`, `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`],
      ['Bounce Rate', `${data?.bounceRate || 0}%`, `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`],
      ['Revenue Generated', `$${data?.revenue || 0}`, `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`],
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generatePDFReport = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    
    // Header
    pdf.setFontSize(20);
    pdf.text('Email Campaign Analytics Report', 20, 30);
    
    pdf.setFontSize(12);
    pdf.text(`Report Period: ${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`, 20, 45);
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 55);
    
    // Executive Summary
    pdf.setFontSize(16);
    pdf.text('Executive Summary', 20, 75);
    
    const summaryData = [
      ['Metric', 'Value', 'Status'],
      ['Total Emails Sent', (data?.totalEmails || 0).toLocaleString(), '✓'],
      ['Average Open Rate', `${data?.openRate || 0}%`, data?.openRate > 20 ? '✓' : '⚠️'],
      ['Average Click Rate', `${data?.clickRate || 0}%`, data?.clickRate > 3 ? '✓' : '⚠️'],
      ['Delivery Rate', `${data?.deliveryRate || 0}%`, data?.deliveryRate > 95 ? '✓' : '⚠️'],
      ['Bounce Rate', `${data?.bounceRate || 0}%`, data?.bounceRate < 5 ? '✓' : '⚠️'],
      ['Total Revenue', `$${(data?.revenue || 0).toLocaleString()}`, '✓'],
    ];

    (pdf as any).autoTable({
      head: [summaryData[0]],
      body: summaryData.slice(1),
      startY: 85,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Performance Analysis
    let yPosition = (pdf as any).lastAutoTable.finalY + 20;
    pdf.setFontSize(16);
    pdf.text('Performance Analysis', 20, yPosition);
    
    yPosition += 15;
    pdf.setFontSize(12);
    
    const analysis = [
      `• Open rate of ${data?.openRate || 0}% ${(data?.openRate || 0) > 20 ? 'exceeds' : 'is below'} industry average (22.86%)`,
      `• Click rate of ${data?.clickRate || 0}% ${(data?.clickRate || 0) > 2.91 ? 'exceeds' : 'is below'} industry average (2.91%)`,
      `• Delivery rate of ${data?.deliveryRate || 0}% ${(data?.deliveryRate || 0) > 95 ? 'meets' : 'needs improvement for'} best practices`,
      `• Total revenue generated: $${(data?.revenue || 0).toLocaleString()}`,
    ];

    analysis.forEach((line, index) => {
      pdf.text(line, 20, yPosition + (index * 10));
    });

    // Recommendations
    yPosition += analysis.length * 10 + 20;
    pdf.setFontSize(16);
    pdf.text('Recommendations', 20, yPosition);
    
    yPosition += 15;
    pdf.setFontSize(12);
    
    const recommendations = [
      '• Focus on improving subject lines to increase open rates',
      '• Optimize call-to-action buttons for better click-through rates',
      '• Segment audiences for more targeted messaging',
      '• A/B test send times for optimal engagement',
    ];

    recommendations.forEach((rec, index) => {
      pdf.text(rec, 20, yPosition + (index * 10));
    });

    pdf.save(`email-analytics-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing
      
      if (exportFormat === 'csv') {
        generateCSVReport();
      } else if (exportFormat === 'pdf') {
        generatePDFReport();
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Reports
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Analytics Reports</DialogTitle>
          <DialogDescription>
            Generate and download comprehensive analytics reports
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Export Configuration */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Report Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Report Type</label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Export Format</label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Report</SelectItem>
                      <SelectItem value="csv">CSV Data</SelectItem>
                      <SelectItem value="xlsx">Excel Spreadsheet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-3 block">Include Metrics</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableMetrics.map(metric => (
                      <div key={metric.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={metric.id}
                          checked={selectedMetrics.includes(metric.id)}
                          onCheckedChange={() => handleMetricToggle(metric.id)}
                        />
                        <label htmlFor={metric.id} className="text-sm">
                          {metric.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {exportFormat === 'pdf' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeCharts"
                      checked={includeCharts}
                      onCheckedChange={(checked) => setIncludeCharts(checked === true)}
                    />
                    <label htmlFor="includeCharts" className="text-sm">
                      Include charts and visualizations
                    </label>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button 
                onClick={handleExport} 
                disabled={isExporting}
                className="flex-1"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export Now
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Scheduled Reports */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Scheduled Reports</CardTitle>
                <CardDescription>
                  Automatic report delivery to your team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {scheduledReports.map(report => (
                  <div key={report.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{report.name}</h4>
                      <Badge variant="outline">
                        {report.frequency}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        <span>Format: {report.format.toUpperCase()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>Last sent: {report.lastSent}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        <span>{report.recipients.length} recipient(s)</span>
                      </div>
                    </div>
                  </div>
                ))}

                <Button variant="outline" className="w-full">
                  <Clock className="h-4 w-4 mr-2" />
                  Schedule New Report
                </Button>
              </CardContent>
            </Card>

            {/* Quick Export Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Export</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    setReportType('summary');
                    setExportFormat('pdf');
                    handleExport();
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Executive Summary (PDF)
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    setReportType('detailed');
                    setExportFormat('csv');
                    handleExport();
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Raw Data Export (CSV)
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    setReportType('campaign');
                    setExportFormat('pdf');
                    handleExport();
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Campaign Performance (PDF)
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <DialogTrigger asChild>
            <Button variant="outline">Close</Button>
          </DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
