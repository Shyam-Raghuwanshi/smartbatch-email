"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { useUser } from '@clerk/nextjs';
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
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Eye,
  FileText,
  Star,
  Users,
  TrendingUp,
  Layout,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

// Template interface
interface Template {
  _id: Id<"templates">;
  name: string;
  subject: string;
  content: string;
  category: string;
  tags: string[];
  description?: string;
  variables: string[];
  isDefault?: boolean;
  isPublic?: boolean;
  usageCount?: number;
  updatedAt?: number;
  settings?: {
    textColor?: string;
    backgroundColor?: string;
    fontFamily?: string;
    fontSize?: string;
    linkColor?: string;
    buttonColor?: string;
  };
}

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

export default function TemplatesPage() {
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const templates = useQuery(api.templates.getTemplatesByUser);
  const publicTemplates = useQuery(api.templates.getPublicTemplates);
  const defaultTemplates = useQuery(api.templates.getDefaultTemplates);
  const categories = useQuery(api.templates.getCategories);
  const allTags = useQuery(api.templates.getAllTags);
  const deleteTemplate = useMutation(api.templates.deleteTemplate);
  const duplicateTemplate = useMutation(api.templates.cloneTemplate);
  const createTemplate = useMutation(api.templates.createTemplate);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('my-templates');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [loadingTemplateId, setLoadingTemplateId] = useState<Id<"templates"> | null>(null);

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

  const handleUseDefaultTemplate = async (template: Template) => {
    // Check if user is authenticated
    if (!isSignedIn || !user) {
      toast.error('Please sign in to use templates');
      router.push('/sign-in');
      return;
    }

    setLoadingTemplateId(template._id);

    try {
      console.log('Cloning template with ID:', template._id);
      console.log('User authenticated:', isSignedIn, user?.id);
      
      const templateId = await duplicateTemplate({
        templateId: template._id,
        newName: `${template.name} (Copy)`
      });
      
      console.log('Template cloned with ID:', templateId);
      toast.success('Template added to your library');
      router.push(`/templates/editor?id=${templateId}`);
    } catch (error) {
      console.error('Failed to clone template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to clone template: ${errorMessage}`);
    } finally {
      setLoadingTemplateId(null);
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

  const TemplateCard = ({ template, isDefault = false }: { template: Template, isDefault?: boolean }) => (
    <Card className="group hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1">{template.name}</CardTitle>
            <CardDescription className="text-sm line-clamp-2">
              {template.description}
            </CardDescription>
          </div>
          {!isDefault && (
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

          {!isDefault && template.updatedAt && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              Updated {formatDate(template.updatedAt)}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {isDefault ? (
              <Button
                size="sm"
                onClick={() => handleUseDefaultTemplate(template)}
                className="flex-1"
                disabled={loadingTemplateId === template._id}
              >
                {loadingTemplateId === template._id ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Use Template
                  </>
                )}
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
                <p className="text-sm font-medium text-gray-600">Default Templates</p>
                <p className="text-2xl font-bold text-gray-900">{defaultTemplates?.length || 0}</p>
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
              <Label htmlFor="search" className="text-sm font-medium">Search Templates</Label>
              <div className="relative mt-2">
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
              <Label htmlFor="category" className="text-sm font-medium">Category</Label>
              <div className="mt-2">
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
          </div>
        </CardContent>
      </Card>

      {/* Templates Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="my-templates">My Templates</TabsTrigger>
          <TabsTrigger value="default-templates">Default Templates</TabsTrigger>
          <TabsTrigger value="public">Public Gallery</TabsTrigger>
        </TabsList>

        <TabsContent value="my-templates" className="mt-6">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                <div className="text-4xl">📧</div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {templates?.length === 0 ? 'No templates yet' : 'No templates match your filters'}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                {templates?.length === 0 
                  ? 'Get started by creating your first email template or choose from our professionally designed defaults.'
                  : 'Try adjusting your search or filter criteria to find the templates you\'re looking for.'
                }
              </p>
              {templates?.length === 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
                  <Button 
                    onClick={() => router.push('/templates/editor')}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Your First Template
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

        <TabsContent value="default-templates" className="mt-6">
          {!defaultTemplates || defaultTemplates.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center">
                <div className="text-4xl">⭐</div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No default templates available</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {defaultTemplates.map((template) => (
                <TemplateCard key={template._id} template={template} isDefault />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="public" className="mt-6">
          {publicTemplates?.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center">
                <div className="text-4xl">🌍</div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No public templates</h3>
              <p className="text-gray-600 max-w-md mx-auto leading-relaxed">Check back later for community-shared templates and designs from other users.</p>
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
            {previewTemplate && previewTemplate.isDefault && (
              <Button onClick={() => {
                handleUseDefaultTemplate(previewTemplate);
                setIsPreviewOpen(false);
              }}>
                Use Template
              </Button>
            )}
            {previewTemplate && !previewTemplate.isDefault && previewTemplate._id && (
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
