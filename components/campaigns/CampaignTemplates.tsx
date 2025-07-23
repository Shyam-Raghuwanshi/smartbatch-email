"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mail, 
  ShoppingCart, 
  Heart, 
  Gift, 
  Users, 
  TrendingUp,
  Calendar,
  Star,
  Zap,
  Clock,
  Target,
  Eye,
  Copy,
  Edit,
  Play
} from 'lucide-react';

interface CampaignTemplate {
  id: string;
  name: string;
  category: 'welcome' | 'ecommerce' | 'engagement' | 'event' | 'retention' | 'nurture';
  type: 'single' | 'drip' | 'behavioral';
  description: string;
  emailCount: number;
  duration: string;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  isPopular: boolean;
  tags: string[];
  previewEmails: Array<{
    subject: string;
    timing: string;
    content: string;
  }>;
}

const templateCategories = [
  {
    id: 'welcome',
    name: 'Welcome Series',
    icon: Heart,
    description: 'Onboard new subscribers and customers',
    color: 'bg-pink-100 text-pink-800'
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    icon: ShoppingCart,
    description: 'Drive sales and recover abandoned carts',
    color: 'bg-green-100 text-green-800'
  },
  {
    id: 'engagement',
    name: 'Re-engagement',
    icon: Zap,
    description: 'Win back inactive subscribers',
    color: 'bg-yellow-100 text-yellow-800'
  },
  {
    id: 'event',
    name: 'Event-Based',
    icon: Calendar,
    description: 'Birthday, anniversary, and special occasions',
    color: 'bg-purple-100 text-purple-800'
  },
  {
    id: 'retention',
    name: 'Customer Retention',
    icon: Users,
    description: 'Keep customers engaged and loyal',
    color: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'nurture',
    name: 'Lead Nurturing',
    icon: TrendingUp,
    description: 'Convert leads into customers',
    color: 'bg-indigo-100 text-indigo-800'
  }
];

const campaignTemplates: CampaignTemplate[] = [
  {
    id: '1',
    name: 'New Subscriber Welcome Series',
    category: 'welcome',
    type: 'drip',
    description: 'A 5-email welcome series to introduce new subscribers to your brand and products',
    emailCount: 5,
    duration: '14 days',
    openRate: 68.5,
    clickRate: 24.3,
    conversionRate: 8.7,
    isPopular: true,
    tags: ['beginner-friendly', 'high-converting', 'automated'],
    previewEmails: [
      {
        subject: 'Welcome to [Brand Name]! Here\'s what to expect',
        timing: 'Immediately',
        content: 'Thank you for joining our community! We\'re excited to have you...'
      },
      {
        subject: 'Your exclusive welcome gift is waiting',
        timing: 'Day 2',
        content: 'As a new member, we\'d like to offer you 15% off your first purchase...'
      },
      {
        subject: 'Meet the team behind [Brand Name]',
        timing: 'Day 5',
        content: 'We thought you\'d like to know the story behind our brand...'
      }
    ]
  },
  {
    id: '2',
    name: 'Abandoned Cart Recovery',
    category: 'ecommerce',
    type: 'behavioral',
    description: 'Recover lost sales with a strategic 3-email sequence',
    emailCount: 3,
    duration: '7 days',
    openRate: 45.2,
    clickRate: 18.9,
    conversionRate: 15.3,
    isPopular: true,
    tags: ['high-roi', 'automated', 'e-commerce'],
    previewEmails: [
      {
        subject: 'You left something in your cart',
        timing: '1 hour after abandonment',
        content: 'Don\'t forget about the items in your cart! Complete your purchase...'
      },
      {
        subject: 'Still thinking it over? Here\'s 10% off',
        timing: '24 hours',
        content: 'We noticed you\'re still considering your purchase. Here\'s a discount...'
      },
      {
        subject: 'Last chance - your cart expires soon',
        timing: '72 hours',
        content: 'Your reserved items will be released soon. Don\'t miss out...'
      }
    ]
  },
  {
    id: '3',
    name: 'Birthday Celebration Campaign',
    category: 'event',
    type: 'behavioral',
    description: 'Celebrate customer birthdays with special offers and personalized messages',
    emailCount: 2,
    duration: '2 days',
    openRate: 72.1,
    clickRate: 31.5,
    conversionRate: 12.8,
    isPopular: false,
    tags: ['personalized', 'high-engagement', 'event-driven'],
    previewEmails: [
      {
        subject: 'Happy Birthday [First Name]! 🎉',
        timing: 'On birthday',
        content: 'It\'s your special day! Celebrate with a birthday treat from us...'
      },
      {
        subject: 'Your birthday gift is still waiting',
        timing: '3 days after',
        content: 'Don\'t let your birthday surprise expire! Use your special discount...'
      }
    ]
  },
  {
    id: '4',
    name: 'Win-Back Inactive Subscribers',
    category: 'engagement',
    type: 'drip',
    description: 'Re-engage subscribers who haven\'t opened emails in 60+ days',
    emailCount: 4,
    duration: '21 days',
    openRate: 28.7,
    clickRate: 12.4,
    conversionRate: 6.2,
    isPopular: false,
    tags: ['re-engagement', 'list-cleaning', 'automated'],
    previewEmails: [
      {
        subject: 'We miss you! Here\'s what you\'ve been missing',
        timing: 'Day 1',
        content: 'It\'s been a while since we\'ve seen you. Here are our latest updates...'
      },
      {
        subject: 'One last try - 20% off everything',
        timing: 'Day 14',
        content: 'We really don\'t want to lose you. Here\'s an exclusive offer...'
      }
    ]
  },
  {
    id: '5',
    name: 'Post-Purchase Follow-up',
    category: 'retention',
    type: 'drip',
    description: 'Nurture customers after purchase with tips, support, and upsells',
    emailCount: 6,
    duration: '30 days',
    openRate: 51.3,
    clickRate: 19.8,
    conversionRate: 9.4,
    isPopular: true,
    tags: ['customer-success', 'upsell', 'retention'],
    previewEmails: [
      {
        subject: 'Your order is confirmed! What happens next',
        timing: 'Immediately after purchase',
        content: 'Thank you for your purchase! Here\'s what you can expect...'
      },
      {
        subject: 'How to get the most out of your purchase',
        timing: 'Day 3',
        content: 'Here are some tips to maximize the value of your recent purchase...'
      }
    ]
  },
  {
    id: '6',
    name: 'Lead Nurturing Sequence',
    category: 'nurture',
    type: 'drip',
    description: 'Convert leads with educational content and gentle sales messaging',
    emailCount: 8,
    duration: '45 days',
    openRate: 38.9,
    clickRate: 15.6,
    conversionRate: 11.2,
    isPopular: false,
    tags: ['b2b', 'educational', 'long-term'],
    previewEmails: [
      {
        subject: 'Thanks for your interest in [Product]',
        timing: 'Immediately',
        content: 'We\'re excited you\'re considering our solution. Here\'s what you need to know...'
      },
      {
        subject: 'Case study: How [Customer] achieved 200% growth',
        timing: 'Day 7',
        content: 'See how companies like yours are succeeding with our solution...'
      }
    ]
  }
];

export default function CampaignTemplates() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = campaignTemplates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleUseTemplate = (template: CampaignTemplate) => {
    // This would navigate to the campaign builder with the template pre-loaded
    console.log('Using template:', template.name);
  };

  const handlePreviewTemplate = (template: CampaignTemplate) => {
    setSelectedTemplate(template);
  };

  if (selectedTemplate) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setSelectedTemplate(null)}
            >
              ← Back to Templates
            </Button>
            <div>
              <h2 className="text-2xl font-bold">{selectedTemplate.name}</h2>
              <p className="text-muted-foreground">{selectedTemplate.description}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
            <Button onClick={() => handleUseTemplate(selectedTemplate)}>
              <Play className="h-4 w-4 mr-2" />
              Use Template
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Sequence Preview</CardTitle>
                <CardDescription>
                  {selectedTemplate.emailCount} emails over {selectedTemplate.duration}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedTemplate.previewEmails.map((email, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">Email {index + 1}</Badge>
                        <span className="text-sm text-muted-foreground">{email.timing}</span>
                      </div>
                      <h4 className="font-medium mb-2">{email.subject}</h4>
                      <p className="text-sm text-muted-foreground">{email.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Template Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Email Count:</span>
                  <span className="font-medium">{selectedTemplate.emailCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Duration:</span>
                  <span className="font-medium">{selectedTemplate.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Avg Open Rate:</span>
                  <span className="font-medium text-green-600">{selectedTemplate.openRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Avg Click Rate:</span>
                  <span className="font-medium text-blue-600">{selectedTemplate.clickRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Conversion Rate:</span>
                  <span className="font-medium text-purple-600">{selectedTemplate.conversionRate}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Template Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customization Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Timing intervals</span>
                  <Edit className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email content</span>
                  <Edit className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Trigger conditions</span>
                  <Edit className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Target audience</span>
                  <Edit className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Campaign Templates</h2>
          <p className="text-muted-foreground">
            Pre-built campaign templates for common use cases
          </p>
        </div>
        <div className="flex space-x-2">
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      {/* Category Navigation */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          onClick={() => setSelectedCategory('all')}
          size="sm"
        >
          All Templates
        </Button>
        {templateCategories.map((category) => {
          const Icon = category.icon;
          const count = campaignTemplates.filter(t => t.category === category.id).length;
          
          return (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category.id)}
              size="sm"
              className="flex items-center space-x-2 whitespace-nowrap"
            >
              <Icon className="h-4 w-4" />
              <span>{category.name}</span>
              <Badge variant="secondary" className="ml-1">
                {count}
              </Badge>
            </Button>
          );
        })}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const category = templateCategories.find(c => c.id === template.category);
          const Icon = category?.icon || Mail;
          
          return (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-5 w-5 text-gray-600" />
                    <Badge className={category?.color}>
                      {category?.name}
                    </Badge>
                  </div>
                  {template.isPopular && (
                    <Badge variant="secondary" className="flex items-center">
                      <Star className="h-3 w-3 mr-1" />
                      Popular
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription className="text-sm">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{template.emailCount} emails</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{template.duration}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-medium text-green-600">{template.openRate}%</div>
                      <div className="text-muted-foreground">Open Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-blue-600">{template.clickRate}%</div>
                      <div className="text-muted-foreground">Click Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-purple-600">{template.conversionRate}%</div>
                      <div className="text-muted-foreground">Convert</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {template.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handlePreviewTemplate(template)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Use Template
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-500">
            Try adjusting your search or category filter to find what you're looking for.
          </p>
        </div>
      )}
    </div>
  );
}
