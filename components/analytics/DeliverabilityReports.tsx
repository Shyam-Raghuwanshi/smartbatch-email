'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  Globe,
  Mail,
  TrendingUp,
  TrendingDown,
  Info,
  Calendar,
  Filter,
  Download
} from 'lucide-react';

interface DeliverabilityReportsProps {
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export default function DeliverabilityReports({ dateRange }: DeliverabilityReportsProps) {
  const [selectedMetric, setSelectedMetric] = useState('delivery-rate');

  // Mock data - in real app, this would come from Convex
  const deliverabilityOverview = {
    deliveryRate: 94.8,
    inboxPlacement: 87.2,
    spamRate: 2.3,
    bounceRate: 2.9,
    blockRate: 0.8,
    reputation: 'Excellent'
  };

  const dailyDeliverability = [
    { date: '2024-01-15', delivered: 94.5, inbox: 86.8, spam: 2.1, bounced: 3.2, blocked: 0.9 },
    { date: '2024-01-16', delivered: 95.2, inbox: 87.5, spam: 2.0, bounced: 2.6, blocked: 0.7 },
    { date: '2024-01-17', delivered: 93.8, inbox: 85.2, spam: 2.8, bounced: 3.4, blocked: 1.0 },
    { date: '2024-01-18', delivered: 96.1, inbox: 89.3, spam: 1.8, bounced: 2.1, blocked: 0.5 },
    { date: '2024-01-19', delivered: 94.7, inbox: 87.1, spam: 2.2, bounced: 3.1, blocked: 0.8 },
    { date: '2024-01-20', delivered: 95.8, inbox: 88.6, spam: 1.9, bounced: 2.3, blocked: 0.6 },
    { date: '2024-01-21', delivered: 94.2, inbox: 86.4, spam: 2.5, bounced: 3.3, blocked: 0.9 }
  ];

  const ispPerformance = [
    { isp: 'Gmail', delivered: 96.2, inbox: 91.5, spam: 1.8, reputation: 'Excellent' },
    { isp: 'Outlook', delivered: 94.8, inbox: 86.3, spam: 2.2, reputation: 'Good' },
    { isp: 'Yahoo', delivered: 93.1, inbox: 83.7, spam: 2.9, reputation: 'Good' },
    { isp: 'Apple Mail', delivered: 95.7, inbox: 89.1, spam: 1.9, reputation: 'Excellent' },
    { isp: 'AOL', delivered: 92.4, inbox: 81.2, spam: 3.1, reputation: 'Fair' },
    { isp: 'Others', delivered: 94.0, inbox: 85.8, spam: 2.4, reputation: 'Good' }
  ];

  const domainReputation = [
    { domain: 'yourcompany.com', reputation: 98, status: 'Excellent', blacklists: 0 },
    { domain: 'subdomain.yourcompany.com', reputation: 95, status: 'Good', blacklists: 1 },
    { domain: 'mail.yourcompany.com', reputation: 97, status: 'Excellent', blacklists: 0 }
  ];

  const bounceAnalysis = [
    { type: 'Hard Bounce', count: 156, percentage: 45.2, reason: 'Invalid email address' },
    { type: 'Soft Bounce', count: 89, percentage: 25.8, reason: 'Mailbox full' },
    { type: 'Blocked', count: 67, percentage: 19.4, reason: 'IP reputation' },
    { type: 'Spam Complaint', count: 33, percentage: 9.6, reason: 'Recipient marked as spam' }
  ];

  const geographicDeliverability = [
    { country: 'United States', delivered: 95.8, inbox: 89.2 },
    { country: 'United Kingdom', delivered: 94.3, inbox: 87.1 },
    { country: 'Germany', delivered: 93.7, inbox: 85.9 },
    { country: 'France', delivered: 94.9, inbox: 88.3 },
    { country: 'Canada', delivered: 96.1, inbox: 90.1 },
    { country: 'Australia', delivered: 95.2, inbox: 88.7 }
  ];

  const authenticationStatus = {
    spf: { status: 'Pass', percentage: 99.8 },
    dkim: { status: 'Pass', percentage: 99.9 },
    dmarc: { status: 'Pass', percentage: 98.7 },
    bimi: { status: 'Not Set', percentage: 0 }
  };

  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6366F1', '#8B5CF6'];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'excellent': return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
      case 'good': return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
      case 'fair': return <Badge className="bg-yellow-100 text-yellow-800">Fair</Badge>;
      case 'poor': return <Badge className="bg-red-100 text-red-800">Poor</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Deliverability Reports</h2>
          <p className="text-gray-600">Monitor email delivery and inbox placement performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Delivery Rate</p>
                <p className="text-2xl font-bold text-green-600">{deliverabilityOverview.deliveryRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2">
              <Progress value={deliverabilityOverview.deliveryRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inbox Placement</p>
                <p className="text-2xl font-bold text-blue-600">{deliverabilityOverview.inboxPlacement}%</p>
              </div>
              <Mail className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-2">
              <Progress value={deliverabilityOverview.inboxPlacement} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Spam Rate</p>
                <p className="text-2xl font-bold text-yellow-600">{deliverabilityOverview.spamRate}%</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="mt-2">
              <Progress value={deliverabilityOverview.spamRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bounce Rate</p>
                <p className="text-2xl font-bold text-orange-600">{deliverabilityOverview.bounceRate}%</p>
              </div>
              <XCircle className="h-8 w-8 text-orange-500" />
            </div>
            <div className="mt-2">
              <Progress value={deliverabilityOverview.bounceRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Block Rate</p>
                <p className="text-2xl font-bold text-red-600">{deliverabilityOverview.blockRate}%</p>
              </div>
              <Shield className="h-8 w-8 text-red-500" />
            </div>
            <div className="mt-2">
              <Progress value={deliverabilityOverview.blockRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Reputation</p>
                <p className={`text-2xl font-bold ${getStatusColor(deliverabilityOverview.reputation)}`}>
                  {deliverabilityOverview.reputation}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2">
              {getStatusBadge(deliverabilityOverview.reputation)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Delivery Trends</TabsTrigger>
          <TabsTrigger value="isp">ISP Performance</TabsTrigger>
          <TabsTrigger value="reputation">Domain Reputation</TabsTrigger>
          <TabsTrigger value="bounces">Bounce Analysis</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
          <TabsTrigger value="authentication">Authentication</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Performance Trends</CardTitle>
              <CardDescription>Track delivery metrics over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyDeliverability}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="delivered" stroke="#10B981" strokeWidth={2} name="Delivered" />
                    <Line type="monotone" dataKey="inbox" stroke="#3B82F6" strokeWidth={2} name="Inbox" />
                    <Line type="monotone" dataKey="spam" stroke="#F59E0B" strokeWidth={2} name="Spam" />
                    <Line type="monotone" dataKey="bounced" stroke="#EF4444" strokeWidth={2} name="Bounced" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="isp">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>ISP Performance Comparison</CardTitle>
                <CardDescription>Delivery rates across major email providers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ispPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="isp" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="delivered" fill="#10B981" name="Delivered %" />
                      <Bar dataKey="inbox" fill="#3B82F6" name="Inbox %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ISP Reputation Status</CardTitle>
                <CardDescription>Current standing with each provider</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ispPerformance.map((isp, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium">{isp.isp}</p>
                          <p className="text-sm text-gray-600">
                            {isp.delivered}% delivered, {isp.inbox}% inbox
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(isp.reputation)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reputation">
          <Card>
            <CardHeader>
              <CardTitle>Domain Reputation Monitor</CardTitle>
              <CardDescription>Track the reputation of your sending domains</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {domainReputation.map((domain, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Shield className="h-6 w-6 text-blue-500" />
                      <div>
                        <p className="font-medium">{domain.domain}</p>
                        <p className="text-sm text-gray-600">
                          Blacklisted on {domain.blacklists} lists
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">{domain.reputation}</p>
                        <p className="text-sm text-gray-600">Reputation Score</p>
                      </div>
                      {getStatusBadge(domain.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bounces">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Bounce Distribution</CardTitle>
                <CardDescription>Breakdown of delivery failures</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={bounceAnalysis}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                      >
                        {bounceAnalysis.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bounce Details</CardTitle>
                <CardDescription>Common reasons for delivery failures</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bounceAnalysis.map((bounce, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div>
                          <p className="font-medium">{bounce.type}</p>
                          <p className="text-sm text-gray-600">{bounce.reason}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{bounce.count}</p>
                        <p className="text-sm text-gray-600">{bounce.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geographic">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Deliverability</CardTitle>
              <CardDescription>Performance across different regions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={geographicDeliverability} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="country" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="delivered" fill="#10B981" name="Delivered %" />
                    <Bar dataKey="inbox" fill="#3B82F6" name="Inbox %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="authentication">
          <Card>
            <CardHeader>
              <CardTitle>Email Authentication Status</CardTitle>
              <CardDescription>SPF, DKIM, DMARC, and BIMI configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(authenticationStatus).map(([protocol, data]) => (
                  <div key={protocol} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium uppercase">{protocol}</h3>
                      {data.status === 'Pass' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <p className={`text-lg font-bold ${data.status === 'Pass' ? 'text-green-600' : 'text-red-600'}`}>
                      {data.status}
                    </p>
                    <p className="text-sm text-gray-600">{data.percentage}% coverage</p>
                    <div className="mt-2">
                      <Progress value={data.percentage} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Authentication Recommendations</h4>
                    <ul className="text-sm text-blue-800 mt-1 space-y-1">
                      <li>• Consider implementing BIMI for enhanced brand visibility</li>
                      <li>• Monitor DMARC reports for unauthorized use of your domain</li>
                      <li>• Ensure all sending IPs have proper SPF records</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
