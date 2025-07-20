"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Eye,
  FileText,
  Palette,
  Star,
  Clock,
  Users,
  TrendingUp,
  Mail,
  Layout,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

const TEMPLATE_CATEGORIES = [
  'Newsletter',
  'Marketing',
  'Transactional',
  'Welcome',
  'Promotional',
  'Event',
  'Product Update',
  'Customer Support',
  'Educational',
  'Other'
];

const PRE_BUILT_TEMPLATES = [
  {
    id: 'welcome-email',
    name: 'Welcome Email',
    description: 'A warm welcome message for new subscribers',
    category: 'Welcome',
    tags: ['onboarding', 'welcome'],
    thumbnail: '/templates/welcome.png',
    content: `
      <h1>Welcome to our community!</h1>
      <p>Hi {{firstName}},</p>
      <p>We're thrilled to have you join our community! Here's what you can expect:</p>
      <ul>
        <li>Weekly newsletters with valuable insights</li>
        <li>Exclusive access to our resources</li>
        <li>Special member-only discounts</li>
      </ul>
      <p>To get started, here are some helpful links:</p>
      <a href="{{websiteUrl}}" class="button">Visit Our Website</a>
      <p>If you have any questions, feel free to reach out to us at {{supportEmail}}.</p>
      <p>Best regards,<br>The Team</p>
    `,
    subject: 'Welcome to {{company}}, {{firstName}}!',
    variables: ['firstName', 'company', 'websiteUrl', 'supportEmail']
  },
  {
    id: 'newsletter',
    name: 'Newsletter Template',
    description: 'Professional newsletter layout with multiple sections',
    category: 'Newsletter',
    tags: ['newsletter', 'updates'],
    thumbnail: '/templates/newsletter.png',
    content: `
      <h1>{{company}} Newsletter</h1>
      <p>Hi {{firstName}},</p>
      <p>Here's what's new this week:</p>
      
      <h2>📈 This Week's Highlights</h2>
      <p>Share your top news, updates, or achievements here.</p>
      
      <h2>🎯 Featured Content</h2>
      <p>Spotlight your best content, products, or services.</p>
      
      <h2>📅 Upcoming Events</h2>
      <p>Let your audience know about upcoming events or deadlines.</p>
      
      <p>That's all for this week! See you next time.</p>
      <p>Best regards,<br>{{company}} Team</p>
    `,
    subject: 'Your Weekly {{company}} Update',
    variables: ['firstName', 'company']
  },
  {
    id: 'promotional',
    name: 'Promotional Email',
    description: 'Eye-catching promotional template with CTA',
    category: 'Promotional',
    tags: ['promotion', 'sale', 'cta'],
    thumbnail: '/templates/promotional.png',
    content: `
      <h1>🎉 Special Offer Just for You!</h1>
      <p>Hi {{firstName}},</p>
      <p>We have an exclusive offer that we think you'll love:</p>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <h2 style="color: #007bff; margin: 0;">50% OFF</h2>
        <p style="margin: 10px 0;">On all premium features</p>
        <a href="#" class="button">Claim Your Discount</a>
      </div>
      
      <p>This offer is valid until {{date}}. Don't miss out!</p>
      
      <h3>Why choose us?</h3>
      <ul>
        <li>✓ Premium quality</li>
        <li>✓ 24/7 support</li>
        <li>✓ Money-back guarantee</li>
      </ul>
      
      <p>Questions? Reply to this email or contact us at {{supportEmail}}.</p>
    `,
    subject: '🎉 Exclusive 50% OFF - Limited Time!',
    variables: ['firstName', 'date', 'supportEmail']
  },
  {
    id: 'event-invitation',
    name: 'Event Invitation',
    description: 'Professional event invitation template',
    category: 'Event',
    tags: ['event', 'invitation', 'rsvp'],
    thumbnail: '/templates/event.png',
    content: `
      <h1>You're Invited!</h1>
      <p>Hi {{firstName}},</p>
      <p>We're excited to invite you to our upcoming event:</p>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2>Event Name</h2>
        <p><strong>📅 Date:</strong> [Event Date]</p>
        <p><strong>🕒 Time:</strong> [Event Time]</p>
        <p><strong>📍 Location:</strong> [Event Location]</p>
      </div>
      
      <p>Join us for an amazing experience where you'll:</p>
      <ul>
        <li>Network with industry professionals</li>
        <li>Learn from expert speakers</li>
        <li>Discover new opportunities</li>
      </ul>
      
      <a href="#" class="button">RSVP Now</a>
      
      <p>Can't make it? No worries - we'll send you a recording after the event.</p>
      <p>Looking forward to seeing you there!</p>
    `,
    subject: 'You\'re Invited: [Event Name] - {{date}}',
    variables: ['firstName', 'date']
  },
  {
    id: 'product-update',
    name: 'Product Update',
    description: 'Announce new features and improvements',
    category: 'Product Update',
    tags: ['product', 'features', 'update'],
    thumbnail: '/templates/product-update.png',
    content: `
      <h1>🚀 New Features Available!</h1>
      <p>Hi {{firstName}},</p>
      <p>We've been working hard to improve your experience, and we're excited to share what's new:</p>
      
      <h2>✨ What's New</h2>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <h3>Feature 1</h3>
        <p>Brief description of the new feature and its benefits.</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <h3>Feature 2</h3>
        <p>Brief description of the new feature and its benefits.</p>
      </div>
      
      <h2>🛠️ Improvements</h2>
      <ul>
        <li>Enhanced performance</li>
        <li>Better user interface</li>
        <li>Bug fixes and stability improvements</li>
      </ul>
      
      <a href="{{websiteUrl}}" class="button">Try New Features</a>
      
      <p>As always, we love hearing your feedback. Reply to this email with your thoughts!</p>
    `,
    subject: '🚀 New Features in {{company}} - Check Them Out!',
    variables: ['firstName', 'company', 'websiteUrl']
  }
];

export default function TemplatesPage() {
  const router = useRouter();
  const templates = useQuery(api.templates.getTemplatesByUser);
  const publicTemplates = useQuery(api.templates.getPublicTemplates);
  const categories = useQuery(api.templates.getCategories);
  const allTags = useQuery(api.templates.getAllTags);
  const deleteTemplate = useMutation(api.templates.deleteTemplate);
  const duplicateTemplate = useMutation(api.templates.cloneTemplate);
  const createTemplate = useMutation(api.templates.createTemplate);
  const seedDefaultTemplates = useMutation(api.templates.seedDefaultTemplates);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('my-templates');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<typeof templates extends Array<infer T> ? T : null>(null);

  // Filter templates based on search and filters
  const filteredTemplates = (templates || []).filter(template => {
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => template.tags.includes(tag));
    
    return matchesSearch && matchesCategory && matchesTags;
  });

  const handleDeleteTemplate = async (templateId: Id<"templates">) => {
    if (confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      try {
        await deleteTemplate({ id: templateId });
        toast.success('Template deleted successfully');
      } catch (error) {
        console.error('Failed to delete template:', error);
        toast.error('Failed to delete template');
      }
    }
  };

  const handleDuplicateTemplate = async (templateId: Id<"templates">, currentName: string) => {
    try {
      await duplicateTemplate({ 
        templateId, 
        newName: `${currentName} (Copy)` 
      });
      toast.success('Template duplicated successfully');
    } catch (error) {
      console.error('Failed to duplicate template:', error);
      toast.error('Failed to duplicate template');
    }
  };

  const handleUsePrebuiltTemplate = async (template: typeof PRE_BUILT_TEMPLATES[0]) => {
    try {
      const templateId = await createTemplate({
        name: template.name,
        subject: template.subject,
        content: template.content,
        category: template.category,
        tags: template.tags,
        description: template.description,
        variables: template.variables,
        settings: {
          textColor: '#000000',
          backgroundColor: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize: '16px',
          linkColor: '#007bff',
          buttonColor: '#007bff',
        }
      });
      
      toast.success('Template added to your library');
      router.push(`/templates/editor?id=${templateId}`);
    } catch (error) {
      console.error('Failed to create template:', error);
      toast.error('Failed to create template');
    }
  };

  const handleSeedDefaultTemplates = async () => {
    try {
      await seedDefaultTemplates();
      toast.success('Default templates added to your library!');
    } catch (error) {
      console.error('Failed to seed templates:', error);
      toast.error('Failed to add default templates');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const TemplateCard = ({ template, isPrebuilt = false }: { template: any, isPrebuilt?: boolean }) => (
    <Card className="group hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1">{template.name}</CardTitle>
            <CardDescription className="text-sm line-clamp-2">
              {template.description}
            </CardDescription>
          </div>
          {!isPrebuilt && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => router.push(`/templates/editor?id=${template._id}`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleDuplicateTemplate(template._id, template.name)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    setPreviewTemplate(template);
                    setIsPreviewOpen(true);
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleDeleteTemplate(template._id)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Badge variant="outline">{template.category}</Badge>
            {template.usageCount !== undefined && (
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {template.usageCount} uses
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{template.tags.length - 3}
              </Badge>
            )}
          </div>

          {!isPrebuilt && template.updatedAt && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              Updated {formatDate(template.updatedAt)}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {isPrebuilt ? (
              <Button
                size="sm"
                onClick={() => handleUsePrebuiltTemplate(template)}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                Use Template
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPreviewTemplate(template);
                    setIsPreviewOpen(true);
                  }}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  onClick={() => router.push(`/templates/editor?id=${template._id}`)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
          <p className="mt-1 text-sm text-gray-600">
            Create, manage, and customize your email templates
          </p>
        </div>
        <Button onClick={() => router.push('/templates/editor')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Templates</p>
                <p className="text-2xl font-bold text-gray-900">{templates?.length || 0}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">{categories?.length || 0}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Layout className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Public Templates</p>
                <p className="text-2xl font-bold text-gray-900">{publicTemplates?.length || 0}</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pre-built</p>
                <p className="text-2xl font-bold text-gray-900">{PRE_BUILT_TEMPLATES.length}</p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Star className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Templates</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name, subject, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Label htmlFor="category">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {TEMPLATE_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="my-templates">My Templates</TabsTrigger>
          <TabsTrigger value="pre-built">Pre-built Templates</TabsTrigger>
          <TabsTrigger value="public">Public Gallery</TabsTrigger>
        </TabsList>

        <TabsContent value="my-templates" className="mt-6">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📧</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {templates?.length === 0 ? 'No templates yet' : 'No templates match your filters'}
              </h3>
              <p className="text-gray-600 mb-6">
                {templates?.length === 0 
                  ? 'Create your first email template to get started.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              {templates?.length === 0 && (
                <div className="flex gap-2">
                  <Button onClick={() => router.push('/templates/editor')}>
                    Create Your First Template
                  </Button>
                  <Button variant="outline" onClick={handleSeedDefaultTemplates}>
                    Add Default Templates
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <TemplateCard key={template._id} template={template} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pre-built" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRE_BUILT_TEMPLATES.map((template) => (
              <TemplateCard key={template.id} template={template} isPrebuilt />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="public" className="mt-6">
          {publicTemplates?.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No public templates</h3>
              <p className="text-gray-600">Check back later for community-shared templates.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicTemplates?.map((template) => (
                <TemplateCard key={template._id} template={template} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
            <DialogDescription>
              {previewTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          
          {previewTemplate && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="text-sm text-gray-600 mb-2">Subject:</div>
                <div className="font-medium">{previewTemplate.subject}</div>
              </div>
              
              <div className="border rounded-lg p-4 bg-white">
                <div 
                  dangerouslySetInnerHTML={{ __html: previewTemplate.content }}
                  className="prose prose-sm max-w-none"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{previewTemplate.category}</Badge>
                {previewTemplate.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
            {previewTemplate && !previewTemplate._id && (
              <Button onClick={() => {
                handleUsePrebuiltTemplate(previewTemplate);
                setIsPreviewOpen(false);
              }}>
                Use Template
              </Button>
            )}
            {previewTemplate?._id && (
              <Button onClick={() => {
                router.push(`/templates/editor?id=${previewTemplate._id}`);
                setIsPreviewOpen(false);
              }}>
                Edit Template
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
