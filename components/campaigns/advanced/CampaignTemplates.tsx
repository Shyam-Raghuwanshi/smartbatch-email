"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Star, Settings, Plus, Copy, Eye } from 'lucide-react';

// Performance imports
import { usePerformanceMonitor } from '@/components/ui/performance';

const mockTemplates = [
  {
    id: '1',
    name: 'Welcome Series',
    category: 'Onboarding',
    usage: 87,
    performance: 4.8,
    lastUsed: '2 days ago'
  },
  {
    id: '2',
    name: 'Product Announcement',
    category: 'Marketing',
    usage: 56,
    performance: 4.2,
    lastUsed: '1 week ago'
  },
  {
    id: '3',
    name: 'Re-engagement Campaign',
    category: 'Retention',
    usage: 34,
    performance: 3.9,
    lastUsed: '3 days ago'
  }
];

export function CampaignTemplates() {
  const renderTime = usePerformanceMonitor("CampaignTemplates");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Campaign Templates</h2>
          <p className="text-muted-foreground">
            Pre-built campaign templates optimized for different use cases and industries
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockTemplates.map((template) => (
          <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {template.category}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">{template.performance}</span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-900">{template.usage}</div>
                  <div className="text-gray-500">Times Used</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{template.lastUsed}</div>
                  <div className="text-gray-500">Last Used</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="default">
                    <Copy className="h-3 w-3 mr-1" />
                    Use Template
                  </Button>
                </div>

                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost">
                    <Eye className="h-3 w-3" />
                  </Button>
                  
                  <Button size="sm" variant="ghost">
                    <Settings className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <div className="font-semibold">24</div>
                <div className="text-sm text-muted-foreground">Total Templates</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="font-semibold">4.3</div>
                <div className="text-sm text-muted-foreground">Avg. Rating</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Copy className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-semibold">1,247</div>
                <div className="text-sm text-muted-foreground">Total Uses</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <div className="mx-auto w-24 h-24 mb-4 rounded-full bg-muted flex items-center justify-center">
            <FileText className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Advanced Campaign Templates</h3>
          <p className="text-muted-foreground mb-4">
            This component is under development. Advanced template management with AI-powered optimization and industry-specific templates will be available soon.
          </p>
          <Button variant="outline">
            Learn More
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
