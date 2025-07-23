"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart
} from 'recharts';
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Target,
  Users,
  Calendar,
  Award,
  Zap,
  ArrowUpRight,
  Package
} from 'lucide-react';

interface RevenueAttributionProps {
  dateRange: {
    from: Date;
    to: Date;
  };
}

export function RevenueAttribution({ dateRange }: RevenueAttributionProps) {
  const [attributionModel, setAttributionModel] = useState('lastClick');
  const [timeframe, setTimeframe] = useState('30d');

  // Mock data - replace with actual data from props
  const revenueData = [
    { date: '2024-01-01', revenue: 1250, orders: 15, avgOrderValue: 83.33 },
    { date: '2024-01-02', revenue: 1680, orders: 18, avgOrderValue: 93.33 },
    { date: '2024-01-03', revenue: 2010, orders: 22, avgOrderValue: 91.36 },
    { date: '2024-01-04', revenue: 1890, orders: 19, avgOrderValue: 99.47 },
    { date: '2024-01-05', revenue: 2340, orders: 28, avgOrderValue: 83.57 },
    { date: '2024-01-06', revenue: 2130, orders: 25, avgOrderValue: 85.20 },
    { date: '2024-01-07', revenue: 2580, orders: 31, avgOrderValue: 83.23 },
  ];

  const campaignRevenue = [
    { 
      campaign: 'Black Friday Sale', 
      revenue: 15420, 
      orders: 186, 
      conversionRate: 8.4,
      roas: 4.8,
      avgOrderValue: 82.90 
    },
    { 
      campaign: 'Newsletter #245', 
      revenue: 8760, 
      orders: 94, 
      conversionRate: 3.2,
      roas: 2.1,
      avgOrderValue: 93.19 
    },
    { 
      campaign: 'Welcome Series', 
      revenue: 12350, 
      orders: 142, 
      conversionRate: 12.1,
      roas: 5.2,
      avgOrderValue: 86.97 
    },
    { 
      campaign: 'Cart Abandonment', 
      revenue: 9840, 
      orders: 108, 
      conversionRate: 15.6,
      roas: 6.1,
      avgOrderValue: 91.11 
    },
    { 
      campaign: 'Product Launch', 
      revenue: 6590, 
      orders: 67, 
      conversionRate: 4.8,
      roas: 3.2,
      avgOrderValue: 98.36 
    },
  ];

  const productCategories = [
    { category: 'Electronics', revenue: 18500, orders: 145, percentage: 35.2 },
    { category: 'Clothing', revenue: 12400, orders: 198, percentage: 23.6 },
    { category: 'Home & Garden', revenue: 9800, orders: 132, percentage: 18.7 },
    { category: 'Books', revenue: 6200, orders: 156, percentage: 11.8 },
    { category: 'Sports', revenue: 5600, orders: 89, percentage: 10.7 },
  ];

  const customerSegments = [
    { 
      segment: 'VIP Customers', 
      revenue: 24500, 
      customers: 89, 
      avgRevenue: 275.28,
      lifetimeValue: 1250,
      percentage: 46.7 
    },
    { 
      segment: 'Regular Customers', 
      revenue: 18200, 
      customers: 234, 
      avgRevenue: 77.78,
      lifetimeValue: 450,
      percentage: 34.7 
    },
    { 
      segment: 'New Customers', 
      revenue: 9800, 
      customers: 187, 
      avgRevenue: 52.41,
      lifetimeValue: 180,
      percentage: 18.6 
    },
  ];

  const attributionData = [
    { touchpoint: 'Email Open', revenue: 8400, percentage: 16.0 },
    { touchpoint: 'Email Click', revenue: 15600, percentage: 29.7 },
    { touchpoint: 'Website Visit', revenue: 12800, percentage: 24.4 },
    { touchpoint: 'Product View', revenue: 9200, percentage: 17.5 },
    { touchpoint: 'Cart Addition', revenue: 6500, percentage: 12.4 },
  ];

  const monthlyGrowth = [
    { month: 'Jul', revenue: 42500, growth: 8.2 },
    { month: 'Aug', revenue: 45200, growth: 6.4 },
    { month: 'Sep', revenue: 48900, growth: 8.2 },
    { month: 'Oct', revenue: 52100, growth: 6.5 },
    { month: 'Nov', revenue: 61800, growth: 18.6 },
    { month: 'Dec', revenue: 68400, growth: 10.7 },
  ];

  const topPerformingCampaign = campaignRevenue.reduce((best, current) => 
    current.roas > best.roas ? current : best
  );

  const totalRevenue = campaignRevenue.reduce((sum, campaign) => sum + campaign.revenue, 0);
  const totalOrders = campaignRevenue.reduce((sum, campaign) => sum + campaign.orders, 0);
  const avgOrderValue = totalRevenue / totalOrders;

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  return (
    <div className="space-y-6">
      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              ${totalRevenue.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Revenue</div>
            <div className="text-xs text-green-600 flex items-center justify-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              +12.8% vs last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {totalOrders.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Orders</div>
            <div className="text-xs text-green-600 flex items-center justify-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              +8.5% vs last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              ${avgOrderValue.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Avg Order Value</div>
            <div className="text-xs text-green-600 flex items-center justify-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              +3.2% vs last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {topPerformingCampaign.roas.toFixed(1)}x
            </div>
            <div className="text-sm text-gray-600">Best ROAS</div>
            <div className="text-xs text-gray-500">
              {topPerformingCampaign.campaign}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Revenue Trend
                </CardTitle>
                <CardDescription>
                  Daily revenue from email campaigns
                </CardDescription>
              </div>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7D</SelectItem>
                  <SelectItem value="30d">30D</SelectItem>
                  <SelectItem value="90d">90D</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" fill="#22c55e" name="Revenue ($)" />
                  <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} name="Orders" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Attribution Model */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Attribution Analysis
                </CardTitle>
                <CardDescription>
                  Revenue attribution by touchpoint
                </CardDescription>
              </div>
              <Select value={attributionModel} onValueChange={setAttributionModel}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lastClick">Last Click</SelectItem>
                  <SelectItem value="firstClick">First Click</SelectItem>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="timeDecay">Time Decay</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ touchpoint, percentage }) => `${touchpoint}: ${percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {attributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Revenue Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Campaign Revenue Performance
          </CardTitle>
          <CardDescription>
            Revenue and ROAS by campaign
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaignRevenue
              .sort((a, b) => b.revenue - a.revenue)
              .map((campaign, index) => (
                <div key={campaign.campaign} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge variant={index === 0 ? "default" : "outline"}>
                        #{index + 1}
                      </Badge>
                      <div>
                        <h3 className="font-medium">{campaign.campaign}</h3>
                        <p className="text-sm text-gray-600">
                          {campaign.orders} orders • {campaign.conversionRate}% conversion rate
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        ${campaign.revenue.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        {campaign.roas.toFixed(1)}x ROAS
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="font-medium text-blue-600">${campaign.avgOrderValue.toFixed(2)}</div>
                      <div className="text-gray-600">Avg Order Value</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="font-medium text-purple-600">{campaign.conversionRate}%</div>
                      <div className="text-gray-600">Conversion Rate</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="font-medium text-orange-600">{campaign.roas.toFixed(1)}x</div>
                      <div className="text-gray-600">ROAS</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="font-medium text-green-600">{campaign.orders}</div>
                      <div className="text-gray-600">Total Orders</div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Revenue by Category
            </CardTitle>
            <CardDescription>
              Top performing product categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productCategories.map((category) => (
                <div key={category.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{category.category}</span>
                    <span className="text-sm text-gray-600">
                      ${category.revenue.toLocaleString()} ({category.percentage}%)
                    </span>
                  </div>
                  <Progress value={category.percentage} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{category.orders} orders</span>
                    <span>${(category.revenue / category.orders).toFixed(2)} avg</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer Segments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Customer Segments
            </CardTitle>
            <CardDescription>
              Revenue by customer tier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customerSegments.map((segment) => (
                <div key={segment.segment} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{segment.segment}</h3>
                    <Badge variant="outline">
                      {segment.percentage}% of revenue
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Revenue</div>
                      <div className="font-medium text-green-600">
                        ${segment.revenue.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Customers</div>
                      <div className="font-medium">{segment.customers}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Avg Revenue</div>
                      <div className="font-medium text-blue-600">
                        ${segment.avgRevenue.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Lifetime Value</div>
                      <div className="font-medium text-purple-600">
                        ${segment.lifetimeValue}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Growth Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Monthly Revenue Growth
          </CardTitle>
          <CardDescription>
            Revenue growth trend over the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" fill="#22c55e" name="Revenue ($)" />
                <Line yAxisId="right" type="monotone" dataKey="growth" stroke="#f59e0b" strokeWidth={3} name="Growth (%)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Revenue Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-green-800">Key Successes</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <ArrowUpRight className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Cart Abandonment Campaign Excellence
                    </p>
                    <p className="text-xs text-green-600">
                      Achieving 6.1x ROAS and 15.6% conversion rate - your best performer
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      Strong VIP Customer Revenue
                    </p>
                    <p className="text-xs text-blue-600">
                      VIP customers generating 46.7% of total revenue with $275 average spend
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-orange-800">Growth Opportunities</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                  <Target className="h-4 w-4 text-orange-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">
                      Optimize Product Launch Campaigns
                    </p>
                    <p className="text-xs text-orange-600">
                      3.2x ROAS is below average - consider better targeting and messaging
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                  <Users className="h-4 w-4 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-purple-800">
                      Increase New Customer Value
                    </p>
                    <p className="text-xs text-purple-600">
                      New customers average only $52 - create upselling campaigns to increase AOV
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
