"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useAction } from 'convex/react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { TemplatePreview } from '@/components/templates/TemplatePreview';
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
  ExternalLink,
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

function TemplateEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('id') as Id<"templates"> | null;
  
  const template = useQuery(
    api.templates.getTemplateById,
    templateId ? { id: templateId } : "skip"
  );
  
  const createTemplate = useMutation(api.templates.createTemplate);
  const updateTemplate = useMutation(api.templates.updateTemplate);
  const validateEmailContent = useAction(api.templates.validateEmailContent);
  const optimizeTemplateWithAI = useAction(api.templates.optimizeTemplateWithAI);
  const generateSubjectLineAlternatives = useAction(api.templates.generateSubjectLineAlternatives);
  
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
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isGeneratingSubjects, setIsGeneratingSubjects] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    spamScore: number;
    suggestions: string[];
    aiAnalysis?: string;
    riskLevel?: string;
    deliverabilityScore?: number;
    specificIssues?: string[];
    isAIPowered?: boolean;
  } | null>(null);
  const [optimizationResults, setOptimizationResults] = useState<any | null>(null);
  const [subjectAlternatives, setSubjectAlternatives] = useState<any | null>(null);
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

    // Switch to validation tab and clear previous results
    setActiveTab('validation');
    setValidationResults(null);
    setIsValidating(true);
    
    try {
      const results = await validateEmailContent({
        subject: formData.subject,
        content: formData.content,
        campaignType: formData.category,
        targetAudience: 'General', // Could be made configurable
      });
      setValidationResults(results);
      
      if (results.isAIPowered) {
        toast.success('AI-powered validation completed!');
      } else {
        toast.success('Validation completed (basic mode)');
      }
    } catch (error) {
      console.error('Validation failed:', error);
      toast.error('Validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  const handleOptimize = async () => {
    if (!formData.subject || !formData.content) {
      toast.error('Please add subject and content to optimize');
      return;
    }

    // Switch to optimization tab and clear previous results
    setActiveTab('optimization');
    setOptimizationResults(null);
    setIsOptimizing(true);
    
    try {
      const results = await optimizeTemplateWithAI({
        subject: formData.subject,
        content: formData.content,
        campaignType: formData.category,
        targetAudience: 'General',
        optimizationType: 'comprehensive',
      });
      setOptimizationResults(results);
      
      if (results.success) {
        toast.success('AI optimization completed!');
      } else {
        toast.error('Optimization failed: ' + results.error);
      }
    } catch (error) {
      console.error('Optimization failed:', error);
      toast.error('Optimization failed');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleGenerateSubjects = async () => {
    if (!formData.subject || !formData.content) {
      toast.error('Please add current subject and content first');
      return;
    }

    // Switch to subjects tab and clear previous results
    setActiveTab('subjects');
    setSubjectAlternatives(null);
    setIsGeneratingSubjects(true);
    
    try {
      const results = await generateSubjectLineAlternatives({
        currentSubject: formData.subject,
        content: formData.content,
        campaignType: formData.category,
        targetAudience: 'General',
      });
      setSubjectAlternatives(results);
      
      if (results.success) {
        toast.success('Subject line alternatives generated!');
      } else {
        toast.error('Generation failed: ' + results.error);
      }
    } catch (error) {
      console.error('Subject generation failed:', error);
      toast.error('Subject generation failed');
    } finally {
      setIsGeneratingSubjects(false);
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
            size="sm"
            onClick={handleValidate}
            disabled={isValidating}
            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
          >
            <Zap className="h-4 w-4 mr-1" />
            {isValidating ? 'Validating...' : 'Validate'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
          >
            <Settings className="h-4 w-4 mr-1" />
            {isOptimizing ? 'Optimizing...' : 'Optimize'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateSubjects}
            disabled={isGeneratingSubjects}
            className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
          >
            <Type className="h-4 w-4 mr-1" />
            {isGeneratingSubjects ? 'Subjects...' : 'Subjects'}
          </Button>
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? 'Saving...' : 'Save'}
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
            <div className="h-screen overflow-y-auto pb-40 flex flex-col">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="border-b px-4 py-2 flex items-center justify-between overflow-x-auto">
                  <TabsList className="w-auto flex-shrink-0">
                    <TabsTrigger value="editor" className="px-4">Editor</TabsTrigger>
                    {/* <TabsTrigger value="preview" className="px-4">Preview</TabsTrigger> */}
                    <TabsTrigger value="validation" className="px-4">
                      Validation
                      {validationResults && (
                        <Badge
                          variant={validationResults.spamScore < 50 ? "default" : "destructive"}
                          className="ml-2 text-xs"
                        >
                          {validationResults.spamScore}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="optimization" className="px-4">
                      AI Optimize
                      {optimizationResults && optimizationResults.success && (
                        <Badge
                          variant="secondary"
                          className="ml-2 text-xs"
                        >
                          {optimizationResults.optimizationScore}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="subjects" className="px-4">
                      AI Subjects
                      {subjectAlternatives && subjectAlternatives.success && (
                        <Badge
                          variant="secondary"
                          className="ml-2 text-xs"
                        >
                          {subjectAlternatives.alternatives?.length || 0}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setIsPreviewDialogOpen(true)}
                            className="flex items-center gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Open Preview
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Open template preview in a clean dialog without any styling conflicts</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {activeTab === 'preview' && (
                      <>
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
                      </>
                    )}
                  </div>
                </div>

                <TabsContent value="editor" className="flex-1 overflow-visible">
                  <div className="h-full flex flex-col p-4">
                    <Label className="text-sm font-medium mb-2 block">Email Content *</Label>
                    <div className="flex-1 min-h-0">
                      <RichTextEditor
                        content={formData.content}
                        onChange={(content: string) => setFormData(prev => ({ ...prev, content }))}
                        variables={formData.variables}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full p-4">
                    <div className="flex flex-col items-center">
                      <div className="mb-4 text-center">
                        <p className="text-sm text-muted-foreground mb-2">
                          Quick preview - for the full experience, use "Open Preview" button above
                        </p>
                      </div>
                      <div className={`mx-auto bg-white shadow-lg border rounded-lg overflow-hidden ${
                        previewMode === 'mobile' ? 'max-w-sm' : 'max-w-2xl'
                      }`} style={{ isolation: 'isolate' }}>
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
                        <div className="p-4 bg-white">
                          <div
                            dangerouslySetInnerHTML={{ __html: formData.content || '<p>Start writing your email content...</p>' }}
                            style={{
                              fontFamily: formData.settings.fontFamily,
                              color: formData.settings.textColor,
                              backgroundColor: formData.settings.backgroundColor,
                              fontSize: formData.settings.fontSize,
                            }}
                            className="email-content-preview"
                          />
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="validation" className="flex-1 overflow-hidden">
                  <div className="h-full overflow-y-auto p-4">
                  {isValidating ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Validating Email Content</h3>
                        <p className="text-gray-600">AI is analyzing your email for deliverability and compliance...</p>
                      </div>
                    </div>
                  ) : validationResults ? (
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
                            {validationResults.isAIPowered && (
                              <Badge variant="secondary" className="ml-2">AI Powered</Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            {validationResults.riskLevel === 'low' && "Excellent! Low spam risk."}
                            {validationResults.riskLevel === 'medium' && "Good. Moderate spam risk."}
                            {validationResults.riskLevel === 'high' && "Warning. High spam risk."}
                            {!validationResults.riskLevel && (
                              <>
                                {validationResults.spamScore < 30 && "Excellent! Low spam risk."}
                                {validationResults.spamScore >= 30 && validationResults.spamScore < 50 && "Good. Moderate spam risk."}
                                {validationResults.spamScore >= 50 && validationResults.spamScore < 70 && "Warning. High spam risk."}
                                {validationResults.spamScore >= 70 && "Critical. Very high spam risk."}
                              </>
                            )}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {validationResults.deliverabilityScore && (
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-sm font-medium text-blue-900">Deliverability Score</span>
                              </div>
                              <div className="text-2xl font-bold text-blue-700">
                                {validationResults.deliverabilityScore}/100
                              </div>
                            </div>
                          )}
                          
                          {validationResults.specificIssues && validationResults.specificIssues.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2 text-red-700">Specific Issues Found:</h4>
                              <ul className="space-y-1">
                                {validationResults.specificIssues.map((issue, index) => (
                                  <li key={index} className="text-sm text-red-600 flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    {issue}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {validationResults.suggestions.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2">Suggestions for improvement:</h4>
                              <ul className="space-y-1">
                                {validationResults.suggestions.map((suggestion, index) => (
                                  <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                    <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                                    {suggestion}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {validationResults.aiAnalysis && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                              <h4 className="font-medium mb-2 text-gray-700">AI Analysis:</h4>
                              <div className="text-sm text-gray-600 whitespace-pre-wrap">
                                {validationResults.aiAnalysis}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No validation results</h3>
                        <p className="text-gray-600 mb-4">Click the AI Validate button to check your email content</p>
                        <Button onClick={handleValidate} disabled={isValidating}>
                          {isValidating ? 'Validating...' : 'AI Validate Email'}
                        </Button>
                      </div>
                    </div>
                  )}
                  </div>
                </TabsContent>

                <TabsContent value="optimization" className="flex-1 overflow-hidden">
                  <div className="h-full overflow-y-auto p-4">
                  {isOptimizing ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Optimizing Email Content</h3>
                        <p className="text-gray-600">AI is analyzing and optimizing your email for better performance...</p>
                      </div>
                    </div>
                  ) : optimizationResults && optimizationResults.success ? (
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5 text-purple-600" />
                            AI Optimization Results
                            <Badge variant="secondary" className="ml-2">AI Powered</Badge>
                          </CardTitle>
                          <CardDescription>
                            Comprehensive AI-powered analysis and recommendations
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-purple-50 rounded-lg">
                              <div className="text-sm font-medium text-purple-700 mb-1">Optimization Score</div>
                              <div className="text-2xl font-bold text-purple-900">
                                {optimizationResults.optimizationScore}/100
                              </div>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <div className="text-sm font-medium text-blue-700 mb-1">Subject Effectiveness</div>
                              <div className="text-2xl font-bold text-blue-900">
                                {optimizationResults.subjectLineEffectiveness}/100
                              </div>
                            </div>
                          </div>

                          {optimizationResults.recommendations && optimizationResults.recommendations.length > 0 && (
                            <div className='pb-20'>
                              <h4 className="font-medium mb-2">AI Recommendations:</h4>
                              <ul className="space-y-2">
                                {optimizationResults.recommendations.map((rec, index) => (
                                  <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    {rec}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {optimizationResults.ctaRecommendations && optimizationResults.ctaRecommendations.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2 text-orange-700">Call-to-Action Improvements:</h4>
                              <ul className="space-y-1">
                                {optimizationResults.ctaRecommendations.map((cta, index) => (
                                  <li key={index} className="text-sm text-orange-600 flex items-start gap-2">
                                    <div className="w-1 h-1 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                                    {cta}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {optimizationResults.mobileOptimization && optimizationResults.mobileOptimization.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2 text-green-700">Mobile Optimization:</h4>
                              <ul className="space-y-1">
                                {optimizationResults.mobileOptimization.map((mobile, index) => (
                                  <li key={index} className="text-sm text-green-600 flex items-start gap-2">
                                    <Smartphone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    {mobile}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {optimizationResults.aiAnalysis && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                              <h4 className="font-medium mb-2 text-gray-700">Full AI Analysis:</h4>
                              <div className="text-sm text-gray-600 whitespace-pre-wrap">
                                {optimizationResults.aiAnalysis}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ) : optimizationResults && !optimizationResults.success ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Optimization Failed</h3>
                        <p className="text-gray-600 mb-4">{optimizationResults.error}</p>
                        <Button onClick={handleOptimize} disabled={isOptimizing}>
                          {isOptimizing ? 'Optimizing...' : 'Try Again'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No optimization results</h3>
                        <p className="text-gray-600 mb-4">Click the AI Optimize button to get AI-powered recommendations</p>
                        <Button onClick={handleOptimize} disabled={isOptimizing}>
                          {isOptimizing ? 'Optimizing...' : 'AI Optimize Email'}
                        </Button>
                      </div>
                    </div>
                  )}
                  </div>
                </TabsContent>

                <TabsContent value="subjects" className="flex-1 overflow-hidden">
                  <div className="h-full overflow-y-auto p-4">
                    {isGeneratingSubjects ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Generating Subject Lines</h3>
                          <p className="text-gray-600">AI is creating optimized subject line alternatives...</p>
                        </div>
                      </div>
                    ) : subjectAlternatives && subjectAlternatives.success ? (
                      <div className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Type className="h-5 w-5 text-green-600" />
                              AI Subject Line Analysis
                              <Badge variant="secondary" className="ml-2">AI Powered</Badge>
                            </CardTitle>
                            <CardDescription>
                              AI-generated subject line alternatives and analysis
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="p-3 bg-green-50 rounded-lg">
                              <div className="text-sm font-medium text-green-700 mb-1">Current Subject Score</div>
                              <div className="text-2xl font-bold text-green-900">
                                {subjectAlternatives.currentScore}/100
                              </div>
                            </div>

                            {subjectAlternatives.alternatives && subjectAlternatives.alternatives.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2">AI-Generated Alternatives:</h4>
                                <div className="space-y-2">
                                  {subjectAlternatives.alternatives.map((alternative, index) => (
                                    <div 
                                      key={index} 
                                      className="p-3 bg-white border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group" 
                                      onClick={() => {
                                        setFormData(prev => ({ ...prev, subject: alternative }));
                                        toast.success(`Subject line updated: "${alternative}"`);
                                      }}
                                    >
                                      <div className="text-sm font-medium text-gray-900 group-hover:text-blue-700">
                                        {alternative}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1 group-hover:text-blue-500">
                                        Click to use this subject line
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {subjectAlternatives.analysis && subjectAlternatives.analysis.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2">Subject Line Analysis:</h4>
                                <ul className="space-y-1">
                                  {subjectAlternatives.analysis.map((point, index) => (
                                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                      <div className="w-1 h-1 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                                      {point}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {subjectAlternatives.abTestingRecommendations && subjectAlternatives.abTestingRecommendations.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2 text-blue-700">A/B Testing Recommendations:</h4>
                                <ul className="space-y-1">
                                  {subjectAlternatives.abTestingRecommendations.map((rec, index) => (
                                    <li key={index} className="text-sm text-blue-600 flex items-start gap-2">
                                      <Hash className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                      {rec}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {subjectAlternatives.aiAnalysis && (
                              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                <h4 className="font-medium mb-2 text-gray-700">Full AI Analysis:</h4>
                                <div className="text-sm text-gray-600 whitespace-pre-wrap max-h-48 overflow-y-auto">
                                  {subjectAlternatives.aiAnalysis}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    ) : subjectAlternatives && !subjectAlternatives.success ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Subject Generation Failed</h3>
                        <p className="text-gray-600 mb-4">{subjectAlternatives.error}</p>
                        <Button onClick={handleGenerateSubjects} disabled={isGeneratingSubjects}>
                          {isGeneratingSubjects ? 'Generating...' : 'Try Again'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Type className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No subject alternatives</h3>
                        <p className="text-gray-600 mb-4">Click the AI Subjects button to generate alternative subject lines</p>
                        <Button onClick={handleGenerateSubjects} disabled={isGeneratingSubjects}>
                          {isGeneratingSubjects ? 'Generating...' : 'Generate AI Subjects'}
                        </Button>
                      </div>
                    </div>
                  )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Template Preview Dialog */}
      <TemplatePreview
        template={{
          _id: templateId || 'preview',
          name: formData.name || 'Untitled Template',
          subject: formData.subject || 'Subject Line Preview',
          content: formData.content || '<p>Start writing your email content to see it here...</p>',
          description: formData.description || 'Template preview',
          category: formData.category,
          tags: formData.tags,
          variables: formData.variables,
          updatedAt: Date.now(),
          usageCount: 0,
          settings: formData.settings,
        }}
        isOpen={isPreviewDialogOpen}
        onClose={() => setIsPreviewDialogOpen(false)}
        showActions={false}
      />
    </div>
  );
}

function TemplateEditorWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TemplateEditor />
    </Suspense>
  );
}

export default TemplateEditorWrapper;
