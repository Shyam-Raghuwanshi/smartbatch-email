"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Eye, Edit, Copy, Clock, TrendingUp } from 'lucide-react';

interface Template {
  _id: string;
  name: string;
  subject: string;
  content: string;
  description?: string;
  category: string;
  tags: string[];
  variables: string[];
  updatedAt: number;
  usageCount?: number;
}

interface TemplatePreviewProps {
  template: Template;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onUse?: () => void;
  showActions?: boolean;
}

export function TemplatePreview({ 
  template, 
  isOpen, 
  onClose, 
  onEdit, 
  onDuplicate, 
  onUse,
  showActions = true 
}: TemplatePreviewProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{template.name}</span>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              Updated {formatDate(template.updatedAt)}
              {template.usageCount !== undefined && (
                <>
                  <TrendingUp className="h-4 w-4 ml-2" />
                  {template.usageCount} uses
                </>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            {template.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Template Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Subject Line</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{template.subject}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Category & Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{template.category}</Badge>
                  {template.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Variables */}
          {template.variables.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Variables</CardTitle>
                <CardDescription>
                  These variables will be replaced with actual values when sending emails
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {template.variables.map(variable => (
                    <Badge key={variable} variant="default" className="font-mono text-xs">
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Email Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Email Preview</CardTitle>
              <CardDescription>
                Preview of how the email will look to recipients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                {/* Email Header */}
                <div className="bg-gray-100 p-4 border-b">
                  <div className="text-sm text-gray-600">From: your-email@example.com</div>
                  <div className="text-sm text-gray-600">To: recipient@example.com</div>
                  <div className="font-medium mt-1">{template.subject}</div>
                </div>
                
                {/* Email Content */}
                <div className="p-6 bg-white">
                  <div 
                    dangerouslySetInnerHTML={{ __html: template.content }}
                    className="prose prose-sm max-w-none"
                    style={{
                      fontFamily: 'Arial, sans-serif',
                      lineHeight: '1.6',
                      color: '#333333'
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {showActions && (
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {onDuplicate && (
              <Button variant="outline" onClick={onDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </Button>
            )}
            {onEdit && (
              <Button variant="outline" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {onUse && (
              <Button onClick={onUse}>
                Use Template
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
