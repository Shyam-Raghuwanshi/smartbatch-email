"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import RichTextEditor from '@/components/ui/rich-text-editor';
import {
  Save,
  Eye,
  Smartphone,
  Monitor,
  Palette,
  Type,
  Settings,
  AlertCircle,
  CheckCircle2,
  X,
  Plus,
  Zap,
  FileText,
  Hash,
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

const COMMON_VARIABLES = [
  'firstName',
  'lastName',
  'email',
  'company',
  'name',
  'date',
  'unsubscribeUrl',
  'websiteUrl',
  'supportEmail'
];

export default function TemplateEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('id') as Id<"templates"> | null;
  
  const template = useQuery(
    api.templates.getTemplateById,
    templateId ? { id: templateId } : "skip"
  );
  
  const createTemplate = useMutation(api.templates.createTemplate);
  const updateTemplate = useMutation(api.templates.updateTemplate);
  const validateEmailContent = useMutation(api.templates.validateEmailContent);
  
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    htmlContent: '',
    previewText: '',
    category: 'Newsletter',
    tags: [] as string[],
    description: '',
    variables: [] as string[],
    settings: {
      textColor: '#000000',
      backgroundColor: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      linkColor: '#007bff',
      buttonColor: '#007bff',
    }
  });
  
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState('editor');
  const [newTag, setNewTag] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    spamScore: number;
    suggestions: string[];
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load template data when editing
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        subject: template.subject || '',
        content: template.content || '',
        htmlContent: template.htmlContent || '',
        previewText: template.previewText || '',
        category: template.category || 'Newsletter',
        tags: template.tags || [],
        description: template.description || '',
        variables: template.variables || [],
        settings: {
          textColor: template.settings?.textColor || '#000000',
          backgroundColor: template.settings?.backgroundColor || '#ffffff',
          fontFamily: template.settings?.fontFamily || 'Arial, sans-serif',
          fontSize: template.settings?.fontSize || '16px',
          linkColor: template.settings?.linkColor || '#007bff',
          buttonColor: template.settings?.buttonColor || '#007bff',
        }
      });
    }
  }, [template]);

  const handleSave = async () => {
    if (!formData.name || !formData.subject || !formData.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      if (templateId) {
        await updateTemplate({
          id: templateId,
          ...formData,
        });
        toast.success('Template updated successfully');
      } else {
        const newTemplateId = await createTemplate(formData);
        toast.success('Template created successfully');
        router.push(`/templates/editor?id=${newTemplateId}`);
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleValidate = async () => {
    if (!formData.subject || !formData.content) {
      toast.error('Please add subject and content to validate');
      return;
    }

    setIsValidating(true);
    try {
      const results = await validateEmailContent({
        subject: formData.subject,
        content: formData.content,
      });
      setValidationResults(results);
      setActiveTab('validation');
    } catch (error) {
      console.error('Validation failed:', error);
      toast.error('Validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addVariable = (variable: string) => {
    if (!formData.variables.includes(variable)) {
      setFormData(prev => ({
        ...prev,
        variables: [...prev.variables, variable]
      }));
    }
  };

  const removeVariable = (variableToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.filter(variable => variable !== variableToRemove)
    }));
  };

  const generateEmailHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${formData.subject}</title>
          <style>
            body {
              font-family: ${formData.settings.fontFamily};
              font-size: ${formData.settings.fontSize};
              color: ${formData.settings.textColor};
              background-color: ${formData.settings.backgroundColor};
              margin: 0;
              padding: 20px;
              line-height: 1.6;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            a {
              color: ${formData.settings.linkColor};
              text-decoration: none;
            }
            a:hover {
              text-decoration: underline;
            }
            .button {
              display: inline-block;
              background-color: ${formData.settings.buttonColor};
              color: white;
              padding: 12px 24px;
              border-radius: 4px;
              text-decoration: none;
              font-weight: bold;
            }
            @media (max-width: 600px) {
              .container {
                padding: 15px;
                margin: 10px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            ${formData.content}
          </div>
        </body>
      </html>
    `;
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            ← Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold">
              {templateId ? 'Edit Template' : 'Create Template'}
            </h1>
            <p className="text-sm text-gray-600">
              {templateId ? 'Update your email template' : 'Design a new email template'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleValidate}
            disabled={isValidating}
          >
            <Zap className="h-4 w-4 mr-2" />
            {isValidating ? 'Validating...' : 'Validate'}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel - Form */}
          <ResizablePanel defaultSize={40} minSize={30}>
            <div className="h-full border-r bg-gray-50">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-6">
                  {/* Basic Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Template Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="name">Template Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Welcome Newsletter"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Brief description of this template"
                          rows={2}
                        />
                      </div>

                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TEMPLATE_CATEGORIES.map(category => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Tags</Label>
                        <div className="flex gap-2 mb-2">
                          <Input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Add tag"
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          />
                          <Button onClick={addTag} size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {formData.tags.map(tag => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                              <button
                                onClick={() => removeTag(tag)}
                                className="ml-1 hover:text-red-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Email Content */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Email Content</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="subject">Subject Line *</Label>
                        <Input
                          id="subject"
                          value={formData.subject}
                          onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                          placeholder="Your email subject"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.subject.length}/60 characters
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="previewText">Preview Text</Label>
                        <Input
                          id="previewText"
                          value={formData.previewText}
                          onChange={(e) => setFormData(prev => ({ ...prev, previewText: e.target.value }))}
                          placeholder="Text shown in email preview"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Appears after subject in inbox preview
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Variables */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Hash className="h-5 w-5" />
                        Variables
                      </CardTitle>
                      <CardDescription>
                        Add variables that can be personalized in campaigns
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label>Common Variables</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {COMMON_VARIABLES.map(variable => (
                            <Button
                              key={variable}
                              variant="outline"
                              size="sm"
                              onClick={() => addVariable(variable)}
                              disabled={formData.variables.includes(variable)}
                            >
                              {variable}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {formData.variables.length > 0 && (
                        <div className="mt-4">
                          <Label>Selected Variables</Label>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {formData.variables.map(variable => (
                              <Badge key={variable} variant="default">
                                {`{{${variable}}}`}
                                <button
                                  onClick={() => removeVariable(variable)}
                                  className="ml-1 hover:text-red-300"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Style Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        Style Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Text Color</Label>
                          <Input
                            type="color"
                            value={formData.settings.textColor}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              settings: { ...prev.settings, textColor: e.target.value }
                            }))}
                            className="h-10"
                          />
                        </div>
                        <div>
                          <Label>Background Color</Label>
                          <Input
                            type="color"
                            value={formData.settings.backgroundColor}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              settings: { ...prev.settings, backgroundColor: e.target.value }
                            }))}
                            className="h-10"
                          />
                        </div>
                        <div>
                          <Label>Link Color</Label>
                          <Input
                            type="color"
                            value={formData.settings.linkColor}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              settings: { ...prev.settings, linkColor: e.target.value }
                            }))}
                            className="h-10"
                          />
                        </div>
                        <div>
                          <Label>Button Color</Label>
                          <Input
                            type="color"
                            value={formData.settings.buttonColor}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              settings: { ...prev.settings, buttonColor: e.target.value }
                            }))}
                            className="h-10"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Font Family</Label>
                        <Select
                          value={formData.settings.fontFamily}
                          onValueChange={(value) => setFormData(prev => ({
                            ...prev,
                            settings: { ...prev.settings, fontFamily: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                            <SelectItem value="Georgia, serif">Georgia</SelectItem>
                            <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                            <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                            <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Right Panel - Editor and Preview */}
          <ResizablePanel defaultSize={60} minSize={40}>
            <div className="h-full flex flex-col">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="border-b px-4 py-2 flex items-center justify-between">
                  <TabsList>
                    <TabsTrigger value="editor">Editor</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="validation">
                      Validation
                      {validationResults && (
                        <Badge
                          variant={validationResults.spamScore < 50 ? "default" : "destructive"}
                          className="ml-2"
                        >
                          {validationResults.spamScore}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>
                  
                  {activeTab === 'preview' && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant={previewMode === 'desktop' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPreviewMode('desktop')}
                      >
                        <Monitor className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={previewMode === 'mobile' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPreviewMode('mobile')}
                      >
                        <Smartphone className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <TabsContent value="editor" className="flex-1 p-4">
                  <div className="h-full">
                    <Label className="text-sm font-medium mb-2 block">Email Content *</Label>
                    <RichTextEditor
                      content={formData.content}
                      onChange={(content: string) => setFormData(prev => ({ ...prev, content }))}
                      variables={formData.variables}
                      className="h-[calc(100%-2rem)]"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="flex-1 p-4">
                  <div className={`mx-auto bg-white border rounded-lg overflow-hidden ${
                    previewMode === 'mobile' ? 'max-w-sm' : 'max-w-2xl'
                  }`}>
                    {/* Email Header */}
                    <div className="bg-gray-100 p-4 border-b">
                      <div className="text-sm text-gray-600">From: your-email@example.com</div>
                      <div className="text-sm text-gray-600">To: recipient@example.com</div>
                      <div className="font-medium">{formData.subject || 'Subject Line'}</div>
                      {formData.previewText && (
                        <div className="text-sm text-gray-500 mt-1">{formData.previewText}</div>
                      )}
                    </div>
                    
                    {/* Email Content */}
                    <div className="p-4">
                      <div
                        dangerouslySetInnerHTML={{ __html: formData.content || '<p>Start writing your email content...</p>' }}
                        style={{
                          fontFamily: formData.settings.fontFamily,
                          color: formData.settings.textColor,
                        }}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="validation" className="flex-1 p-4">
                  {validationResults ? (
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            {validationResults.spamScore < 50 ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-600" />
                            )}
                            Spam Score: {validationResults.spamScore}/100
                          </CardTitle>
                          <CardDescription>
                            {validationResults.spamScore < 30 && "Excellent! Low spam risk."}
                            {validationResults.spamScore >= 30 && validationResults.spamScore < 50 && "Good. Moderate spam risk."}
                            {validationResults.spamScore >= 50 && validationResults.spamScore < 70 && "Warning. High spam risk."}
                            {validationResults.spamScore >= 70 && "Critical. Very high spam risk."}
                          </CardDescription>
                        </CardHeader>
                        {validationResults.suggestions.length > 0 && (
                          <CardContent>
                            <h4 className="font-medium mb-2">Suggestions for improvement:</h4>
                            <ul className="space-y-1">
                              {validationResults.suggestions.map((suggestion, index) => (
                                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                  <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                                  {suggestion}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        )}
                      </Card>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No validation results</h3>
                        <p className="text-gray-600 mb-4">Click the Validate button to check your email content</p>
                        <Button onClick={handleValidate} disabled={isValidating}>
                          {isValidating ? 'Validating...' : 'Validate Email'}
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
