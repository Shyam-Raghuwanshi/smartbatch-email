"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar,
  Clock,
  Users,
  Mail,
  Settings,
  AlertCircle,
  CheckCircle2,
  Plus,
  X,
  Send,
  Timer,
  Eye
} from 'lucide-react';

interface CampaignFormProps {
  campaignId?: Id<"campaigns">;
  onSuccess: () => void;
}

type ScheduleType = 'immediate' | 'scheduled' | 'recurring';

interface FormData {
  name: string;
  subject: string;
  templateId?: Id<"templates">;
  customContent?: string;
  targetTags: string[];
  scheduleType: ScheduleType;
  scheduledAt?: Date;
  recurringPattern?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
  };
  sendDelay?: number;
  trackOpens: boolean;
  trackClicks: boolean;
}

export function CampaignForm({ campaignId, onSuccess }: CampaignFormProps) {
  const existingCampaign = useQuery(api.campaigns.getCampaignById, 
    campaignId ? { id: campaignId } : 'skip'
  );
  const templates = useQuery(api.templates.getTemplatesByUser);
  const contacts = useQuery(api.contacts.getContactsByUser);
  const createCampaign = useMutation(api.campaigns.createCampaign);
  const updateCampaign = useMutation(api.campaigns.updateCampaign);
  const getCurrentUser = useQuery(api.users.getCurrentUser);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    subject: '',
    targetTags: [],
    scheduleType: 'immediate',
    sendDelay: 5,
    trackOpens: true,
    trackClicks: true,
  });

  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');

  // Get unique tags from contacts
  const availableTags = contacts?.reduce((tags: string[], contact) => {
    contact.tags.forEach(tag => {
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    });
    return tags;
  }, []) || [];

  // Load existing campaign data
  useEffect(() => {
    if (existingCampaign) {
      setFormData({
        name: existingCampaign.name,
        subject: existingCampaign.settings.subject,
        templateId: existingCampaign.settings.templateId,
        customContent: existingCampaign.settings.customContent,
        targetTags: existingCampaign.settings.targetTags,
        scheduleType: existingCampaign.scheduledAt ? 'scheduled' : 'immediate',
        scheduledAt: existingCampaign.scheduledAt ? new Date(existingCampaign.scheduledAt) : undefined,
        sendDelay: existingCampaign.settings.sendDelay || 5,
        trackOpens: existingCampaign.settings.trackOpens,
        trackClicks: existingCampaign.settings.trackClicks,
      });
    }
  }, [existingCampaign]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!getCurrentUser) {
        throw new Error('User not found');
      }

      const campaignData = {
        name: formData.name,
        status: 'draft' as const,
        scheduledAt: formData.scheduleType === 'scheduled' && formData.scheduledAt 
          ? formData.scheduledAt.getTime() 
          : undefined,
        settings: {
          subject: formData.subject,
          templateId: formData.templateId,
          customContent: formData.customContent,
          targetTags: formData.targetTags,
          sendDelay: formData.sendDelay,
          trackOpens: formData.trackOpens,
          trackClicks: formData.trackClicks,
        },
      };

      if (campaignId) {
        await updateCampaign({
          id: campaignId,
          ...campaignData,
        });
      } else {
        await createCampaign({
          userId: getCurrentUser._id,
          ...campaignData,
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Failed to save campaign:', error);
      setError(error instanceof Error ? error.message : 'Failed to save campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.targetTags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        targetTags: [...prev.targetTags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      targetTags: prev.targetTags.filter(tag => tag !== tagToRemove)
    }));
  };

  const getContactsWithTags = () => {
    if (!contacts) return [];
    return contacts.filter(contact => 
      formData.targetTags.some(tag => contact.tags.includes(tag))
    );
  };

  const recipientCount = getContactsWithTags().length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="recipients">Recipients</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Campaign Details
              </CardTitle>
              <CardDescription>
                Set up the basic information for your email campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Campaign Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter campaign name..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="subject">Email Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Enter email subject line..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="track-opens"
                    checked={formData.trackOpens}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, trackOpens: checked }))}
                  />
                  <Label htmlFor="track-opens">Track Opens</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="track-clicks"
                    checked={formData.trackClicks}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, trackClicks: checked }))}
                  />
                  <Label htmlFor="track-clicks">Track Clicks</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Content
              </CardTitle>
              <CardDescription>
                Choose a template or create custom content for your email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="template">Email Template</Label>
                <div className="flex gap-2">
                  <Select 
                    value={formData.templateId || 'custom'} 
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      templateId: value === 'custom' ? undefined : value as Id<"templates">
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template or use custom content" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom Content</SelectItem>
                      {templates?.map((template) => (
                        <SelectItem key={template._id} value={template._id}>
                          {template.name} - {template.category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.open('/templates/editor', '_blank')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Template
                  </Button>
                </div>
                {templates?.length === 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No templates found. Create your first template to get started with pre-designed email layouts.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {formData.templateId && (
                <div className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Selected Template</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const template = templates?.find(t => t._id === formData.templateId);
                        if (template) {
                          window.open(`/templates/editor?id=${template._id}`, '_blank');
                        }
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                  {(() => {
                    const selectedTemplate = templates?.find(t => t._id === formData.templateId);
                    return selectedTemplate ? (
                      <div className="space-y-2">
                        <div className="text-sm">
                          <strong>Name:</strong> {selectedTemplate.name}
                        </div>
                        <div className="text-sm">
                          <strong>Subject:</strong> {selectedTemplate.subject}
                        </div>
                        {selectedTemplate.description && (
                          <div className="text-sm">
                            <strong>Description:</strong> {selectedTemplate.description}
                          </div>
                        )}
                        <div className="flex gap-1 mt-2">
                          <Badge variant="outline">{selectedTemplate.category}</Badge>
                          {selectedTemplate.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              {!formData.templateId && (
                <div>
                  <Label htmlFor="custom-content">Custom Email Content</Label>
                  <Textarea
                    id="custom-content"
                    value={formData.customContent || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, customContent: e.target.value }))}
                    placeholder="Enter your email content here..."
                    rows={8}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    You can use variables like {'{'}name{'}'}, {'{'}email{'}'} that will be replaced with contact data.
                  </p>
                </div>
              )}

              {formData.templateId && templates && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium mb-2">Template Preview</h4>
                  {(() => {
                    const template = templates.find(t => t._id === formData.templateId);
                    return template ? (
                      <div className="text-sm text-gray-600">
                        <p><strong>Subject:</strong> {template.subject}</p>
                        <p className="mt-2"><strong>Content:</strong></p>
                        <div className="mt-1 p-2 bg-white rounded border text-xs">
                          {template.content.substring(0, 200)}...
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Target Recipients
              </CardTitle>
              <CardDescription>
                Select contact tags to target specific groups of recipients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Add Target Tags</Label>
                <div className="flex gap-2">
                  <Select value={newTag} onValueChange={setNewTag}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a tag..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTags
                        .filter(tag => !formData.targetTags.includes(tag))
                        .map((tag) => (
                          <SelectItem key={tag} value={tag}>
                            {tag}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={addTag} disabled={!newTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>Selected Tags ({formData.targetTags.length})</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.targetTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                {formData.targetTags.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    No tags selected. Add tags to target specific contact groups.
                  </p>
                )}
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between">
                  <Label>Estimated Recipients</Label>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {recipientCount} contacts
                  </Badge>
                </div>
                {recipientCount > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    Your campaign will be sent to {recipientCount} contact{recipientCount !== 1 ? 's' : ''} 
                    {formData.targetTags.length > 0 && (
                      <> with tag{formData.targetTags.length !== 1 ? 's' : ''}: {formData.targetTags.join(', ')}</>
                    )}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Scheduling & Rate Limiting
              </CardTitle>
              <CardDescription>
                Configure when and how your campaign should be sent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Send Option</Label>
                <Select value={formData.scheduleType} onValueChange={(value: ScheduleType) => setFormData(prev => ({ ...prev, scheduleType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Send Immediately</SelectItem>
                    <SelectItem value="scheduled">Schedule for Later</SelectItem>
                    <SelectItem value="recurring">Recurring Campaign</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.scheduleType === 'scheduled' && (
                <div>
                  <Label htmlFor="scheduled-time">Scheduled Date & Time</Label>
                  <Input
                    id="scheduled-time"
                    type="datetime-local"
                    value={formData.scheduledAt ? formData.scheduledAt.toISOString().slice(0, 16) : ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      scheduledAt: e.target.value ? new Date(e.target.value) : undefined 
                    }))}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              )}

              {formData.scheduleType === 'recurring' && (
                <div className="space-y-3">
                  <div>
                    <Label>Recurrence Pattern</Label>
                    <Select value={formData.recurringPattern?.type || 'weekly'} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setFormData(prev => ({ 
                      ...prev, 
                      recurringPattern: { type: value, interval: prev.recurringPattern?.interval || 1 }
                    }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="interval">Repeat Every</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        id="interval"
                        type="number"
                        min={1}
                        max={30}
                        value={formData.recurringPattern?.interval || 1}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          recurringPattern: { 
                            type: prev.recurringPattern?.type || 'weekly', 
                            interval: parseInt(e.target.value) || 1 
                          }
                        }))}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-600">
                        {formData.recurringPattern?.type || 'week'}(s)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              <div>
                <Label htmlFor="send-delay">Rate Limiting (seconds between emails)</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="send-delay"
                    type="number"
                    min={1}
                    max={300}
                    value={formData.sendDelay || 5}
                    onChange={(e) => setFormData(prev => ({ ...prev, sendDelay: parseInt(e.target.value) || 5 }))}
                    className="w-24"
                  />
                  <span className="text-sm text-gray-600">seconds</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Delay between sending emails to avoid being marked as spam. Recommended: 5-10 seconds.
                </p>
              </div>

              {recipientCount > 0 && formData.sendDelay && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Timer className="h-4 w-4" />
                    <span className="font-medium">Estimated Send Time</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    Approximately {Math.ceil((recipientCount * formData.sendDelay) / 60)} minutes to send to all {recipientCount} recipients
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Email Preview
              </CardTitle>
              <CardDescription>
                Preview how your email will appear to recipients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email Header */}
              <div className="border rounded-lg bg-white p-4">
                <div className="border-b pb-3 mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>From: Your Name &lt;noreply@yourcompany.com&gt;</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    To: Sample Recipient &lt;sample@example.com&gt;
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    Subject: {formData.subject || 'Your email subject will appear here'}
                  </div>
                </div>

                {/* Email Content */}
                <div className="prose prose-sm max-w-none">
                  {(() => {
                    if (formData.templateId && templates) {
                      const template = templates.find(t => t._id === formData.templateId);
                      if (template) {
                        // Replace template variables with sample data for preview
                        let content = template.content;
                        const sampleData: Record<string, string> = {
                          name: 'John Doe',
                          email: 'sample@example.com',
                          firstName: 'John',
                          lastName: 'Doe',
                          company: 'Sample Company',
                          date: new Date().toLocaleDateString()
                        };
                        
                        template.variables?.forEach(variable => {
                          const replacement = sampleData[variable] || `{${variable}}`;
                          content = content.replace(new RegExp(`{${variable}}`, 'g'), replacement);
                        });
                        
                        return (
                          <div className="whitespace-pre-wrap text-gray-900">
                            {content}
                          </div>
                        );
                      }
                    }
                    
                    if (formData.customContent) {
                      // Replace variables in custom content with sample data
                      let content = formData.customContent;
                      const sampleData: Record<string, string> = {
                        name: 'John Doe',
                        email: 'sample@example.com',
                        firstName: 'John',
                        lastName: 'Doe',
                        company: 'Sample Company'
                      };
                      
                      Object.entries(sampleData).forEach(([key, value]) => {
                        content = content.replace(new RegExp(`{${key}}`, 'g'), value);
                      });
                      
                      return (
                        <div className="whitespace-pre-wrap text-gray-900">
                          {content}
                        </div>
                      );
                    }
                    
                    return (
                      <div className="text-gray-500 italic text-center py-8">
                        No content available. Please select a template or add custom content.
                      </div>
                    );
                  })()}
                </div>

                {/* Email Footer */}
                <div className="border-t pt-4 mt-6 text-xs text-gray-500">
                  <p>This is a preview of your email campaign.</p>
                  <p className="mt-1">
                    Recipients: {recipientCount} contact{recipientCount !== 1 ? 's' : ''} 
                    {formData.targetTags.length > 0 && (
                      <> with tag{formData.targetTags.length !== 1 ? 's' : ''}: {formData.targetTags.join(', ')}</>
                    )}
                  </p>
                </div>
              </div>

              {/* Preview Settings */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Campaign Settings Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Campaign Name:</span>
                    <p className="font-medium">{formData.name || 'Untitled Campaign'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Send Schedule:</span>
                    <p className="font-medium">
                      {formData.scheduleType === 'immediate' ? 'Send Immediately' : 
                       formData.scheduleType === 'scheduled' && formData.scheduledAt ? 
                       `Scheduled for ${formData.scheduledAt.toLocaleString()}` : 
                       formData.scheduleType === 'recurring' ? 
                       `Recurring ${formData.recurringPattern?.type || 'weekly'}` : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Rate Limiting:</span>
                    <p className="font-medium">{formData.sendDelay || 5} seconds between emails</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Tracking:</span>
                    <p className="font-medium">
                      Opens: {formData.trackOpens ? 'Enabled' : 'Disabled'}, 
                      Clicks: {formData.trackClicks ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={isSubmitting || !formData.name || !formData.subject || formData.targetTags.length === 0}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {campaignId ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {campaignId ? 'Update Campaign' : 'Create Campaign'}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
