"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Shield } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function BillingPage() {
  const monthlyUsage = useQuery(api.userEmailUsage.getMonthlyEmailUsage);

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        '10 emails per month',
        '5 emails per day',
        '2 emails per hour',
        'Basic templates',
        'Contact management',
        'Basic analytics',
      ],
      limitations: [
        'Limited email volume',
        'Basic support',
        'SmartBatch branding',
      ],
      current: monthlyUsage?.plan === 'free',
      buttonText: 'Current Plan',
      buttonDisabled: true,
      icon: <Star className="h-5 w-5" />,
      popular: false,
    },
    {
      name: 'Pro',
      price: '$29',
      period: 'per month',
      description: 'For growing businesses',
      features: [
        '10,000 emails per month',
        '500 emails per day',
        '100 emails per hour',
        'Advanced templates',
        'A/B testing',
        'Advanced analytics',
        'Custom branding',
        'Priority support',
        'Automation workflows',
        'Integration APIs',
      ],
      current: monthlyUsage?.plan === 'pro',
      buttonText: monthlyUsage?.plan === 'pro' ? 'Current Plan' : 'Upgrade to Pro',
      buttonDisabled: monthlyUsage?.plan === 'pro',
      icon: <Zap className="h-5 w-5" />,
      popular: true,
    },
    {
      name: 'Enterprise',
      price: '$99',
      period: 'per month',
      description: 'For large organizations',
      features: [
        '100,000 emails per month',
        '5,000 emails per day',
        '1,000 emails per hour',
        'Everything in Pro',
        'Custom integrations',
        'Dedicated support',
        'SSO authentication',
        'Advanced security',
        'Custom reporting',
        'SLA guarantee',
      ],
      current: monthlyUsage?.plan === 'enterprise',
      buttonText: monthlyUsage?.plan === 'enterprise' ? 'Current Plan' : 'Contact Sales',
      buttonDisabled: monthlyUsage?.plan === 'enterprise',
      icon: <Shield className="h-5 w-5" />,
      popular: false,
    },
  ];

  const handleUpgrade = (planName: string) => {
    // In a real app, this would integrate with Stripe or another payment processor
    alert(`Upgrading to ${planName} plan would be implemented here with a payment processor like Stripe.`);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Plans</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your subscription and billing information
        </p>
      </div>

      {/* Current Usage Summary */}
      {monthlyUsage && (
        <Card>
          <CardHeader>
            <CardTitle>Current Usage</CardTitle>
            <CardDescription>Your email usage for this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-2xl font-bold">
                  {monthlyUsage.usage} / {monthlyUsage.limit}
                </p>
                <p className="text-sm text-gray-600">emails sent this month</p>
              </div>
              <Badge variant={monthlyUsage.plan === 'free' ? 'secondary' : 'default'}>
                {monthlyUsage.plan.charAt(0).toUpperCase() + monthlyUsage.plan.slice(1)} Plan
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  monthlyUsage.usagePercentage > 90 
                    ? 'bg-red-600' 
                    : monthlyUsage.usagePercentage > 75 
                      ? 'bg-yellow-600' 
                      : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(monthlyUsage.usagePercentage, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {monthlyUsage.remaining} emails remaining
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.name} className={`relative ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white">Most Popular</Badge>
              </div>
            )}
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {plan.icon}
                  {plan.name}
                </CardTitle>
                {plan.current && (
                  <Badge variant="outline">Current</Badge>
                )}
              </div>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-gray-600">/{plan.period}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {plan.limitations && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-2">Limitations:</p>
                  <ul className="space-y-1">
                    {plan.limitations.map((limitation, index) => (
                      <li key={index} className="text-xs text-gray-500">
                        • {limitation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button 
                className="w-full mt-6"
                variant={plan.current ? "secondary" : "default"}
                disabled={plan.buttonDisabled}
                onClick={() => !plan.buttonDisabled && handleUpgrade(plan.name)}
              >
                {plan.buttonText}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium">What happens if I exceed my email limit?</h4>
            <p className="text-sm text-gray-600 mt-1">
              Your campaigns will be paused until the next billing cycle or you upgrade your plan. 
              You'll receive notifications before reaching your limit.
            </p>
          </div>
          <div>
            <h4 className="font-medium">Can I change plans anytime?</h4>
            <p className="text-sm text-gray-600 mt-1">
              Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </p>
          </div>
          <div>
            <h4 className="font-medium">Do you offer custom enterprise solutions?</h4>
            <p className="text-sm text-gray-600 mt-1">
              Yes, we offer custom solutions for large organizations with specific needs. 
              Contact our sales team for more information.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
