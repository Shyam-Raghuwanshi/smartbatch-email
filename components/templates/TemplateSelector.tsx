"use client";

import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { TemplatePreview } from './TemplatePreview';
import { 
  Search, 
  Eye, 
  Plus, 
  FileText, 
  Clock, 
  TrendingUp,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

interface TemplateSelectorProps {
  selectedTemplateId?: Id<"templates">;
  onTemplateSelect: (templateId: Id<"templates"> | undefined) => void;
  showCreateButton?: boolean;
  allowCustomContent?: boolean;
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

export function TemplateSelector({ 
  selectedTemplateId, 
  onTemplateSelect, 
  showCreateButton = true,
  allowCustomContent = true
}: TemplateSelectorProps) {
  const templates = useQuery(api.templates.getTemplatesByUser);
  const duplicateTemplate = useMutation(api.templates.cloneTemplate);
  
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<typeof templates extends Array<infer T> ? T : null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter templates
  const filteredTemplates = (templates || []).filter(template => {
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleDuplicateTemplate = async (templateId: Id<"templates">, currentName: string) => {
    try {
      const newTemplateId = await duplicateTemplate({ 
        templateId, 
        newName: `${currentName} (Copy)` 
      });
      toast.success('Template duplicated successfully');
      onTemplateSelect(newTemplateId);
    } catch (error) {
      console.error('Failed to duplicate template:', error);
      toast.error('Failed to duplicate template');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="search">Search Templates</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Search templates..."
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

      {/* Template Options */}
      <div className="space-y-3">
        {/* Custom Content Option */}
        {allowCustomContent && (
          <Card 
            className={`cursor-pointer border-2 transition-colors ${
              !selectedTemplateId 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onTemplateSelect(undefined)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <div className="flex-1">
                  <div className="font-medium">Custom Content</div>
                  <div className="text-sm text-gray-600">Write your own email content</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Template List */}
        {filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {templates?.length === 0 ? 'No templates yet' : 'No templates match your search'}
              </h3>
              <p className="text-gray-600 mb-4">
                {templates?.length === 0 
                  ? 'Create your first template to get started.'
                  : 'Try adjusting your search criteria.'
                }
              </p>
              {showCreateButton && templates?.length === 0 && (
                <Button onClick={() => window.open('/templates/editor', '_blank')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredTemplates.map((template) => (
              <Card 
                key={template._id}
                className={`cursor-pointer border-2 transition-colors group ${
                  selectedTemplateId === template._id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onTemplateSelect(template._id)}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-gray-600 line-clamp-1">
                          {template.subject}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewTemplate(template);
                          setIsPreviewOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Badge variant="outline" className="text-xs">{template.category}</Badge>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(template.updatedAt)}
                      </span>
                      {template.usageCount !== undefined && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {template.usageCount}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 3).map(tag => (
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Template Button */}
      {showCreateButton && filteredTemplates.length > 0 && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="p-6 text-center">
            <Button 
              variant="outline" 
              onClick={() => window.open('/templates/editor', '_blank')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Template
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Template Preview Modal */}
      {previewTemplate && (
        <TemplatePreview
          template={previewTemplate}
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setPreviewTemplate(null);
          }}
          onEdit={() => {
            window.open(`/templates/editor?id=${previewTemplate._id}`, '_blank');
            setIsPreviewOpen(false);
          }}
          onDuplicate={() => {
            handleDuplicateTemplate(previewTemplate._id, previewTemplate.name);
            setIsPreviewOpen(false);
          }}
          onUse={() => {
            onTemplateSelect(previewTemplate._id);
            setIsPreviewOpen(false);
          }}
        />
      )}
    </div>
  );
}
