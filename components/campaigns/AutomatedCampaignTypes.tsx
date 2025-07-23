"use client";

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Mail,
  Clock,
  Users,
  Heart,
  ShoppingCart,
  Gift,
  Star,
  TrendingUp,
  Calendar,
  Target,
  Zap,
  ArrowRight,
  Play,
  Settings,
  Copy,
} from 'lucide-react';
import { DripCampaignFlow } from './DripCampaignBuilder';

// Pre-built campaign templates
export interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  category: 'welcome' | 'nurture' | 'ecommerce' | 'retention' | 'lifecycle';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  estimatedDuration: string;
  emailCount: number;
  conversionRate: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  flow: Partial<DripCampaignFlow>;
  preview: {
    steps: string[];
    timing: string[];
  };
  tags: string[];
}

const campaignTemplates: CampaignTemplate[] = [
  {
    id: 'welcome_series',
    name: 'Welcome Email Series',
    description: 'Onboard new subscribers with a warm welcome sequence',
    category: 'welcome',
    icon: Heart,
    color: 'bg-pink-500',
    estimatedDuration: '7 days',
    emailCount: 4,
    conversionRate: '15-25%',
    difficulty: 'beginner',
    tags: ['onboarding', 'welcome', 'engagement'],
    preview: {
      steps: [
        'Welcome & Thank You',
        'Introduce Your Brand',
        'Share Value/Resources',
        'Call to Action'
      ],
      timing: ['Immediate', '1 day', '3 days', '7 days']
    },
    flow: {
      name: 'Welcome Email Series',
      description: 'Engage new subscribers with a structured welcome sequence',
      nodes: [
        {
          id: 'trigger_1',
          type: 'trigger',
          position: { x: 200, y: 100 },
          data: {
            title: 'New Subscriber',
            description: 'When someone joins your list',
            config: {
              triggerType: 'contact_created',
              conditions: { tags: { include: ['subscriber'] } },
              delay: 0
            }
          },
          connections: ['email_1']
        },
        {
          id: 'email_1',
          type: 'email',
          position: { x: 200, y: 200 },
          data: {
            title: 'Welcome Email',
            description: 'Warm welcome message',
            config: {
              subject: 'Welcome to {{company_name}}! 🎉',
              content: `Hi {{first_name}},

Welcome to our community! We're thrilled to have you on board.

Here's what you can expect:
• Weekly tips and insights
• Exclusive content just for subscribers
• Special offers and early access

Looking forward to this journey together!

Best regards,
The {{company_name}} Team`,
              trackOpens: true,
              trackClicks: true
            }
          },
          connections: ['delay_1']
        },
        {
          id: 'delay_1',
          type: 'delay',
          position: { x: 200, y: 300 },
          data: {
            title: 'Wait 1 Day',
            description: 'Let the welcome settle in',
            config: { duration: 1, unit: 'days' }
          },
          connections: ['email_2']
        },
        {
          id: 'email_2',
          type: 'email',
          position: { x: 200, y: 400 },
          data: {
            title: 'Brand Introduction',
            description: 'Share your story',
            config: {
              subject: 'Our story and mission',
              content: `Hi {{first_name}},

Yesterday we welcomed you to our community, and today I wanted to share a bit about who we are and why we do what we do.

[Share your brand story, mission, and values]

This is the foundation of everything we create for you.

Talk soon,
[Your name]`,
              trackOpens: true,
              trackClicks: true
            }
          },
          connections: ['delay_2']
        },
        {
          id: 'delay_2',
          type: 'delay',
          position: { x: 200, y: 500 },
          data: {
            title: 'Wait 2 Days',
            config: { duration: 2, unit: 'days' }
          },
          connections: ['email_3']
        },
        {
          id: 'email_3',
          type: 'email',
          position: { x: 200, y: 600 },
          data: {
            title: 'Value & Resources',
            description: 'Provide helpful content',
            config: {
              subject: 'Your free resources are here!',
              content: `Hi {{first_name}},

As promised, here are some valuable resources to help you get started:

📚 [Resource 1 - Link]
🎯 [Resource 2 - Link]
📝 [Resource 3 - Link]

These have helped thousands of people just like you!

Enjoy,
[Your name]`,
              trackOpens: true,
              trackClicks: true
            }
          },
          connections: ['delay_3']
        },
        {
          id: 'delay_3',
          type: 'delay',
          position: { x: 200, y: 700 },
          data: {
            title: 'Wait 4 Days',
            config: { duration: 4, unit: 'days' }
          },
          connections: ['email_4']
        },
        {
          id: 'email_4',
          type: 'email',
          position: { x: 200, y: 800 },
          data: {
            title: 'Call to Action',
            description: 'Invite to take next step',
            config: {
              subject: 'Ready for the next step?',
              content: `Hi {{first_name}},

Over the past week, you've gotten to know us and accessed some great resources.

Now I'd love to invite you to take the next step: [Your main CTA]

This is perfect if you're ready to [benefit/outcome].

[CTA Button]

Have questions? Just reply to this email!

Best,
[Your name]`,
              trackOpens: true,
              trackClicks: true
            }
          },
          connections: []
        }
      ]
    }
  },
  {
    id: 'abandoned_cart',
    name: 'Abandoned Cart Recovery',
    description: 'Win back customers who left items in their cart',
    category: 'ecommerce',
    icon: ShoppingCart,
    color: 'bg-orange-500',
    estimatedDuration: '10 days',
    emailCount: 3,
    conversionRate: '10-18%',
    difficulty: 'intermediate',
    tags: ['ecommerce', 'conversion', 'recovery'],
    preview: {
      steps: [
        'Gentle Reminder',
        'Add Urgency/Incentive',
        'Last Chance + Social Proof'
      ],
      timing: ['1 hour', '24 hours', '72 hours']
    },
    flow: {
      name: 'Abandoned Cart Recovery',
      description: 'Recover abandoned shopping carts with strategic follow-ups',
      nodes: [
        {
          id: 'trigger_cart',
          type: 'trigger',
          position: { x: 200, y: 100 },
          data: {
            title: 'Cart Abandoned',
            description: 'When cart is abandoned for 1+ hours',
            config: {
              triggerType: 'behavior',
              conditions: { event: 'cart_abandoned', timeThreshold: 3600 },
              delay: 60
            }
          },
          connections: ['email_cart_1']
        },
        {
          id: 'email_cart_1',
          type: 'email',
          position: { x: 200, y: 200 },
          data: {
            title: 'Friendly Reminder',
            description: 'Gentle nudge about forgotten items',
            config: {
              subject: 'You left something behind...',
              content: `Hi {{first_name}},

I noticed you were interested in some great items but didn't complete your purchase. 

Your cart contains:
{{cart_items}}

These items are still available and waiting for you!

[Complete Purchase Button]

Need help? Reply to this email or contact our support team.

Happy shopping!
{{company_name}}`,
              trackOpens: true,
              trackClicks: true
            }
          },
          connections: ['delay_cart_1']
        },
        {
          id: 'delay_cart_1',
          type: 'delay',
          position: { x: 200, y: 300 },
          data: {
            title: 'Wait 23 Hours',
            config: { duration: 23, unit: 'hours' }
          },
          connections: ['condition_cart_1']
        },
        {
          id: 'condition_cart_1',
          type: 'condition',
          position: { x: 200, y: 400 },
          data: {
            title: 'Check Purchase Status',
            description: 'Only continue if not purchased',
            config: {
              field: 'purchase_completed',
              operator: 'equals',
              value: 'false',
              trueAction: 'continue',
              falseAction: 'exit'
            }
          },
          connections: ['email_cart_2']
        },
        {
          id: 'email_cart_2',
          type: 'email',
          position: { x: 200, y: 500 },
          data: {
            title: 'Sweet Deal',
            description: 'Offer incentive to complete purchase',
            config: {
              subject: 'Still thinking? Here\'s 10% off!',
              content: `Hi {{first_name}},

I don't want you to miss out on the items in your cart!

As a thank you for considering us, here's a special 10% discount:

Code: SAVE10NOW

Your cart:
{{cart_items}}

This offer expires in 48 hours, so grab it while you can!

[Complete Purchase with Discount]

Thanks for choosing us!
{{company_name}}`,
              trackOpens: true,
              trackClicks: true
            }
          },
          connections: ['delay_cart_2']
        },
        {
          id: 'delay_cart_2',
          type: 'delay',
          position: { x: 200, y: 600 },
          data: {
            title: 'Wait 48 Hours',
            config: { duration: 48, unit: 'hours' }
          },
          connections: ['condition_cart_2']
        },
        {
          id: 'condition_cart_2',
          type: 'condition',
          position: { x: 200, y: 700 },
          data: {
            title: 'Final Check',
            config: {
              field: 'purchase_completed',
              operator: 'equals',
              value: 'false'
            }
          },
          connections: ['email_cart_3']
        },
        {
          id: 'email_cart_3',
          type: 'email',
          position: { x: 200, y: 800 },
          data: {
            title: 'Last Chance',
            description: 'Final attempt with social proof',
            config: {
              subject: 'Last chance - your items are almost gone!',
              content: `Hi {{first_name}},

This is my final reminder about the items in your cart.

{{cart_items}}

⚠️ Only a few left in stock!
⭐ Over 500 customers bought these items this month
🚚 Free shipping on orders over $50

Your 10% discount (SAVE10NOW) expires tonight!

[Complete Purchase Now]

If you're not ready now, no worries - we'll be here when you are.

Best regards,
{{company_name}}`,
              trackOpens: true,
              trackClicks: true
            }
          },
          connections: []
        }
      ]
    }
  },
  {
    id: 'reengagement',
    name: 'Re-engagement Campaign',
    description: 'Win back inactive subscribers and customers',
    category: 'retention',
    icon: Star,
    color: 'bg-purple-500',
    estimatedDuration: '14 days',
    emailCount: 4,
    conversionRate: '8-15%',
    difficulty: 'intermediate',
    tags: ['retention', 'reactivation', 'winback'],
    preview: {
      steps: [
        'We Miss You',
        'What Changed?',
        'Special Comeback Offer',
        'Final Goodbye Option'
      ],
      timing: ['Immediate', '3 days', '7 days', '14 days']
    },
    flow: {
      name: 'Re-engagement Campaign',
      description: 'Win back inactive subscribers with a strategic approach',
      nodes: [
        {
          id: 'trigger_inactive',
          type: 'trigger',
          position: { x: 200, y: 100 },
          data: {
            title: 'Inactive Subscriber',
            description: 'No engagement for 30+ days',
            config: {
              triggerType: 'behavior',
              conditions: { 
                lastActivity: 30,
                activityType: 'any_engagement'
              },
              delay: 0
            }
          },
          connections: ['email_miss_1']
        },
        {
          id: 'email_miss_1',
          type: 'email',
          position: { x: 200, y: 200 },
          data: {
            title: 'We Miss You',
            config: {
              subject: 'We miss you, {{first_name}}!',
              content: `Hi {{first_name}},

I noticed it's been a while since we've heard from you, and I wanted to reach out personally.

We've been working hard to bring you valuable content and I'd hate for you to miss out on what's new:

• [Recent update/feature]
• [Popular content/resource]
• [Community highlight]

Is everything okay? Hit reply and let me know if there's anything I can help with.

Looking forward to hearing from you,
[Your name]`,
              trackOpens: true,
              trackClicks: true
            }
          },
          connections: ['delay_miss_1']
        }
      ]
    }
  },
  {
    id: 'birthday_anniversary',
    name: 'Birthday & Anniversary Emails',
    description: 'Celebrate special occasions with personalized messages',
    category: 'lifecycle',
    icon: Gift,
    color: 'bg-green-500',
    estimatedDuration: 'Event-based',
    emailCount: 2,
    conversionRate: '20-35%',
    difficulty: 'beginner',
    tags: ['personalization', 'celebration', 'loyalty'],
    preview: {
      steps: [
        'Birthday Celebration',
        'Anniversary Milestone'
      ],
      timing: ['On birthday', 'On anniversary']
    },
    flow: {
      name: 'Birthday & Anniversary Campaign',
      description: 'Celebrate customer milestones with special offers',
      nodes: [
        {
          id: 'trigger_birthday',
          type: 'trigger',
          position: { x: 150, y: 100 },
          data: {
            title: 'Birthday Trigger',
            description: 'Contact\'s birthday',
            config: {
              triggerType: 'date_based',
              conditions: { dateField: 'birthday' },
              delay: 0
            }
          },
          connections: ['email_birthday']
        },
        {
          id: 'email_birthday',
          type: 'email',
          position: { x: 150, y: 200 },
          data: {
            title: 'Birthday Celebration',
            config: {
              subject: '🎉 Happy Birthday, {{first_name}}!',
              content: `Happy Birthday, {{first_name}}! 🎂

On your special day, we wanted to celebrate YOU and say thank you for being part of our community.

Here's a special birthday gift just for you:

🎁 25% OFF your next purchase
Code: BIRTHDAY25

This offer is valid for the next 7 days, so treat yourself to something special!

[Shop Now with Birthday Discount]

Wishing you a wonderful year ahead!

Cheers,
{{company_name}} Team`,
              trackOpens: true,
              trackClicks: true
            }
          ],
          connections: []
        },
        {
          id: 'trigger_anniversary',
          type: 'trigger',
          position: { x: 350, y: 100 },
          data: {
            title: 'Anniversary Trigger',
            description: 'Customer anniversary',
            config: {
              triggerType: 'date_based',
              conditions: { dateField: 'customer_since' },
              delay: 0
            }
          },
          connections: ['email_anniversary']
        },
        {
          id: 'email_anniversary',
          type: 'email',
          position: { x: 350, y: 200 },
          data: {
            title: 'Anniversary Celebration',
            config: {
              subject: '🎊 Celebrating {{years}} year(s) together!',
              content: `Dear {{first_name}},

Today marks a special milestone - it's been {{years}} year(s) since you joined our family!

Thank you for your continued trust and loyalty. Here are some highlights from our journey together:

• Total orders: {{total_orders}}
• Favorite products: {{top_products}}
• Money saved with our offers: ${{total_savings}}

To celebrate this milestone, enjoy 20% off your next order:

Code: ANNIVERSARY20

Here's to many more years together!

With gratitude,
{{company_name}}`,
              trackOpens: true,
              trackClicks: true
            }
          },
          connections: []
        }
      ]
    }
  },
  {
    id: 'product_education',
    name: 'Product Education Series',
    description: 'Help customers get maximum value from their purchase',
    category: 'nurture',
    icon: TrendingUp,
    color: 'bg-blue-500',
    estimatedDuration: '21 days',
    emailCount: 6,
    conversionRate: '25-40%',
    difficulty: 'advanced',
    tags: ['education', 'onboarding', 'value'],
    preview: {
      steps: [
        'Getting Started Guide',
        'Basic Features Tour',
        'Advanced Tips',
        'Pro Strategies',
        'Community & Support',
        'Upgrade Opportunity'
      ],
      timing: ['Day 1', 'Day 3', 'Day 7', 'Day 14', 'Day 21', 'Day 28']
    },
    flow: {
      name: 'Product Education Series',
      description: 'Comprehensive product onboarding and education sequence'
    }
  },
  {
    id: 'seasonal_promotion',
    name: 'Seasonal Promotion Campaign',
    description: 'Leverage holidays and seasons for targeted promotions',
    category: 'ecommerce',
    icon: Calendar,
    color: 'bg-red-500',
    estimatedDuration: '7 days',
    emailCount: 4,
    conversionRate: '12-22%',
    difficulty: 'intermediate',
    tags: ['seasonal', 'promotion', 'urgency'],
    preview: {
      steps: [
        'Season Announcement',
        'Early Bird Offer',
        'Limited Time Deal',
        'Last Chance'
      ],
      timing: ['7 days before', '3 days before', '1 day before', 'Last day']
    },
    flow: {
      name: 'Seasonal Promotion Campaign',
      description: 'Time-sensitive promotional campaign for seasonal events'
    }
  }
];

interface AutomatedCampaignTypesProps {
  onSelectTemplate: (template: CampaignTemplate) => void;
  onCreateFromScratch: () => void;
}

export function AutomatedCampaignTypes({ 
  onSelectTemplate, 
  onCreateFromScratch 
}: AutomatedCampaignTypesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null);

  const categories = [
    { id: 'all', name: 'All Campaigns', count: campaignTemplates.length },
    { id: 'welcome', name: 'Welcome Series', count: campaignTemplates.filter(t => t.category === 'welcome').length },
    { id: 'nurture', name: 'Nurture', count: campaignTemplates.filter(t => t.category === 'nurture').length },
    { id: 'ecommerce', name: 'E-commerce', count: campaignTemplates.filter(t => t.category === 'ecommerce').length },
    { id: 'retention', name: 'Retention', count: campaignTemplates.filter(t => t.category === 'retention').length },
    { id: 'lifecycle', name: 'Lifecycle', count: campaignTemplates.filter(t => t.category === 'lifecycle').length },
  ];

  const filteredTemplates = selectedCategory === 'all' 
    ? campaignTemplates 
    : campaignTemplates.filter(t => t.category === selectedCategory);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Automated Campaign Types</h2>
          <p className="text-gray-600">
            Choose from pre-built campaign templates or create your own from scratch
          </p>
        </div>
        <Button onClick={onCreateFromScratch} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Create from Scratch
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            onClick={() => setSelectedCategory(category.id)}
            className="flex items-center gap-2"
          >
            {category.name}
            <Badge variant="secondary" className="ml-1">
              {category.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Campaign Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const Icon = template.icon;
          return (
            <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg ${template.color} text-white`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <Badge className={getDifficultyColor(template.difficulty)}>
                    {template.difficulty}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription className="text-sm">
                  {template.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Template Stats */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">{template.emailCount}</div>
                    <div className="text-gray-600">Emails</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">{template.estimatedDuration}</div>
                    <div className="text-gray-600">Duration</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-green-600">{template.conversionRate}</div>
                    <div className="text-gray-600">Conv. Rate</div>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {template.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs px-2 py-0">
                      {tag}
                    </Badge>
                  ))}
                  {template.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs px-2 py-0">
                      +{template.tags.length - 3} more
                    </Badge>
                  )}
                </div>

                {/* Preview Steps */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="font-medium text-sm mb-2">Campaign Flow:</h4>
                  <div className="space-y-1">
                    {template.preview.steps.slice(0, 3).map((step, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        <span>{step}</span>
                        <span className="text-gray-400">• {template.preview.timing[index]}</span>
                      </div>
                    ))}
                    {template.preview.steps.length > 3 && (
                      <div className="text-xs text-gray-500 pl-3.5">
                        +{template.preview.steps.length - 3} more steps
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${template.color} text-white`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          {template.name}
                        </DialogTitle>
                        <DialogDescription>
                          {template.description}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <TemplatePreview template={template} />
                      
                      <DialogFooter>
                        <Button
                          onClick={() => onSelectTemplate(template)}
                          className="flex items-center gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          Use This Template
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => onSelectTemplate(template)}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Use Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No templates found
          </h3>
          <p className="text-gray-500">
            Try selecting a different category or create a campaign from scratch
          </p>
        </div>
      )}
    </div>
  );
}

// Template Preview Component
function TemplatePreview({ template }: { template: CampaignTemplate }) {
  return (
    <div className="space-y-6">
      {/* Template Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="font-semibold text-lg text-gray-900">{template.emailCount}</div>
          <div className="text-sm text-gray-600">Total Emails</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-lg text-gray-900">{template.estimatedDuration}</div>
          <div className="text-sm text-gray-600">Campaign Length</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-lg text-green-600">{template.conversionRate}</div>
          <div className="text-sm text-gray-600">Expected Conv.</div>
        </div>
        <div className="text-center">
          <Badge className={getDifficultyColor(template.difficulty)}>
            {template.difficulty}
          </Badge>
          <div className="text-sm text-gray-600 mt-1">Difficulty</div>
        </div>
      </div>

      {/* Campaign Flow Visualization */}
      <div>
        <h4 className="font-semibold mb-4">Campaign Flow</h4>
        <div className="space-y-3">
          {template.preview.steps.map((step, index) => (
            <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="font-medium">{step}</div>
                <div className="text-sm text-gray-600">Sent {template.preview.timing[index]}</div>
              </div>
              <div className="text-right">
                <Mail className="h-4 w-4 text-gray-400" />
              </div>
              {index < template.preview.steps.length - 1 && (
                <div className="absolute left-10 mt-8">
                  <ArrowDown className="h-4 w-4 text-gray-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <h4 className="font-semibold mb-2">Tags</h4>
        <div className="flex flex-wrap gap-2">
          {template.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Sample Email Preview (if available) */}
      {template.flow.nodes && template.flow.nodes.length > 1 && (
        <div>
          <h4 className="font-semibold mb-4">Sample Email Content</h4>
          <div className="border rounded-lg p-4 bg-white">
            {(() => {
              const firstEmail = template.flow.nodes?.find(n => n.type === 'email');
              if (!firstEmail?.data.config) return null;
              
              return (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Subject:</label>
                    <div className="text-gray-900">{firstEmail.data.config.subject}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Content Preview:</label>
                    <div className="text-gray-700 text-sm whitespace-pre-line bg-gray-50 p-3 rounded border max-h-40 overflow-y-auto">
                      {firstEmail.data.config.content?.substring(0, 500)}
                      {firstEmail.data.config.content?.length > 500 && '...'}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function moved outside component
function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'beginner': return 'bg-green-100 text-green-800';
    case 'intermediate': return 'bg-yellow-100 text-yellow-800';
    case 'advanced': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export default AutomatedCampaignTypes;
