"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Mail, BarChart3, Users, Zap } from "lucide-react";
import { useUser } from "@clerk/nextjs";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Perfect for getting started",
    features: [
      "10 emails per month",
      "Basic templates",
      "Email tracking",
      "Basic analytics",
      "Community support"
    ],
    limits: {
      emails: "10/month",
      contacts: "100",
      templates: "3"
    },
    current: true
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For growing businesses",
    features: [
      "10,000 emails per month",
      "Advanced templates",
      "A/B testing",
      "Advanced analytics",
      "API access",
      "Priority support",
      "Custom integrations"
    ],
    limits: {
      emails: "10,000/month",
      contacts: "Unlimited",
      templates: "Unlimited"
    },
    popular: true
  },
  {
    name: "Enterprise",
    price: "$99",
    period: "/month",
    description: "For large organizations",
    features: [
      "100,000 emails per month",
      "White-label solution",
      "Advanced automation",
      "Custom analytics",
      "Dedicated support",
      "SLA guarantee",
      "Custom integrations",
      "Team management"
    ],
    limits: {
      emails: "100,000/month",
      contacts: "Unlimited",
      templates: "Unlimited"
    }
  }
];

export default function BillingPage() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async (planName: string) => {
    setIsLoading(true);
    try {
      // In a real app, this would integrate with Stripe or another payment processor
      alert(`Upgrade to ${planName} plan would be processed here. This is a demo.`);
    } catch (error) {
      console.error("Upgrade failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
          <p className="text-gray-600">
            Select the perfect plan for your email marketing needs
          </p>
        </div>

        {/* Current Usage */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Current Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Mail className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">7 / 10</div>
                <div className="text-sm text-gray-600">Emails sent this month</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">1,234</div>
                <div className="text-sm text-gray-600">Active contacts</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Zap className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">Free</div>
                <div className="text-sm text-gray-600">Current plan</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <Card 
              key={plan.name} 
              className={`relative ${plan.popular ? 'border-blue-500 scale-105' : ''} ${plan.current ? 'border-green-500' : ''}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500">
                  Most Popular
                </Badge>
              )}
              {plan.current && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-green-500">
                  Current Plan
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  {plan.name === "Enterprise" && <Crown className="h-5 w-5 text-yellow-500" />}
                  {plan.name}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Limits */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-semibold mb-2">Limits</h4>
                    <div className="space-y-1 text-sm">
                      <div>📧 {plan.limits.emails}</div>
                      <div>👥 {plan.limits.contacts} contacts</div>
                      <div>📄 {plan.limits.templates} templates</div>
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <h4 className="font-semibold mb-2">Features</h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button 
                    className="w-full mt-6" 
                    variant={plan.current ? "outline" : "default"}
                    disabled={plan.current || isLoading}
                    onClick={() => handleUpgrade(plan.name)}
                  >
                    {plan.current ? "Current Plan" : `Upgrade to ${plan.name}`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-center mb-6">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Can I change plans at any time?</h3>
                <p className="text-gray-600 text-sm">
                  Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">What happens if I exceed my email limit?</h3>
                <p className="text-gray-600 text-sm">
                  You'll be prompted to upgrade your plan. Free plan users are limited to 10 emails per month.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
                <p className="text-gray-600 text-sm">
                  Yes, we offer a 30-day money-back guarantee for all paid plans.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Is there a setup fee?</h3>
                <p className="text-gray-600 text-sm">
                  No, there are no setup fees. You only pay the monthly subscription cost.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
