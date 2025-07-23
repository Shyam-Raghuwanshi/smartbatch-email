"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Library,
  Plus,
  Search,
  Filter,
  Star,
  Copy,
  Edit,
  Trash2,
  Image,
  Type,
  MousePointer,
  Share2,
  BarChart3,
  Sparkles,
  Code,
  Palette,
  Tag,
  Clock,
  TrendingUp,
  Eye,
  Download,
} from 'lucide-react';

interface ContentLibraryProps {
  onComponentSelect?: (component: any) => void;
  selectedCategory?: string;
}

export function ContentLibrary({
  onComponentSelect,
  selectedCategory,
}: ContentLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(selectedCategory || '');
  const [sortBy, setSortBy] = useState<'usage' | 'date' | 'rating'>('usage');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Form states for creating new components
  const [newComponent, setNewComponent] = useState({
    type: '',
    content: '',
    htmlContent: '',
    category: '',
    tags: '',
    styles: '',
  });

  const getComponents = useMutation(api.contentLibrary.getComponents);
  const createComponent = useMutation(api.contentLibrary.createComponent);
  const updateComponent = useMutation(api.contentLibrary.updateComponent);
  const deleteComponent = useMutation(api.contentLibrary.deleteComponent);
  const generateAIContent = useMutation(api.contentLibrary.generateAIContent);
  const analyzeComponentPerformance = useMutation(api.contentLibrary.analyzeComponentPerformance);

  const [components, setComponents] = useState<any[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);

  useEffect(() => {
    loadComponents();
  }, [categoryFilter, sortBy]);

  const loadComponents = async () => {
    try {
      const result = await getComponents({
        category: categoryFilter || undefined,
        sortBy,
      });
      setComponents(result.components || []);
    } catch (error) {
      console.error('Error loading components:', error);
    }
  };

  const handleCreateComponent = async () => {
    if (!newComponent.type || !newComponent.content) return;

    try {
      await createComponent({
        type: newComponent.type as any,
        content: newComponent.content,
        htmlContent: newComponent.htmlContent || undefined,
        category: newComponent.category || undefined,
        tags: newComponent.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        styles: newComponent.styles ? JSON.parse(newComponent.styles) : undefined,
      });

      setIsCreateDialogOpen(false);
      setNewComponent({
        type: '',
        content: '',
        htmlContent: '',
        category: '',
        tags: '',
        styles: '',
      });
      
      await loadComponents();
    } catch (error) {
      console.error('Error creating component:', error);
    }
  };

  const handleGenerateAIContent = async (type: string, category: string) => {
    setIsAnalyzing(true);
    try {
      const result = await generateAIContent({ type: type as any, category });
      if (result.success) {
        await loadComponents();
      }
    } catch (error) {
      console.error('Error generating AI content:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzePerformance = async (componentId: Id<'contentComponents'>) => {
    try {
      const result = await analyzeComponentPerformance({ componentId });
      setPerformanceData(result);
    } catch (error) {
      console.error('Error analyzing performance:', error);
    }
  };

  const handleDeleteComponent = async (componentId: Id<'contentComponents'>) => {
    try {
      await deleteComponent({ componentId });
      await loadComponents();
    } catch (error) {
      console.error('Error deleting component:', error);
    }
  };

  const filteredComponents = components.filter(component =>
    component.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    component.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    component.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    component.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const categories = [
    'headers', 'footers', 'cta', 'text', 'image', 'social', 'divider', 'spacer', 'product', 'testimonial'
  ];

  const componentTypes = [
    'header', 'footer', 'cta', 'textBlock', 'imageBlock', 'socialMedia'
  ];

  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'header': return <Type className="h-4 w-4" />;
      case 'footer': return <Type className="h-4 w-4 rotate-180" />;
      case 'cta': return <MousePointer className="h-4 w-4" />;
      case 'textBlock': return <Type className="h-4 w-4" />;
      case 'imageBlock': return <Image className="h-4 w-4" />;
      case 'socialMedia': return <Share2 className="h-4 w-4" />;
      default: return <Library className="h-4 w-4" />;
    }
  };

  const getUsageBadgeVariant = (usageCount: number) => {
    if (usageCount >= 50) return 'default';
    if (usageCount >= 20) return 'secondary';
    return 'outline';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Content Library</h2>
          <p className="text-muted-foreground">
            Reusable email components and AI-generated content blocks
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleGenerateAIContent('mixed', 'general')} variant="outline">
            <Sparkles className="h-4 w-4 mr-2" />
            AI Generate
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Component
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Component</DialogTitle>
                <DialogDescription>
                  Add a new reusable component to your content library
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="componentType">Type</Label>
                    <Select value={newComponent.type} onValueChange={(value) => 
                      setNewComponent(prev => ({ ...prev, type: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {componentTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="componentCategory">Category</Label>
                    <Select value={newComponent.category} onValueChange={(value) => 
                      setNewComponent(prev => ({ ...prev, category: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="componentContent">Content</Label>
                  <Textarea
                    id="componentContent"
                    placeholder="Enter component content..."
                    value={newComponent.content}
                    onChange={(e) => setNewComponent(prev => ({ ...prev, content: e.target.value }))}
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="componentHtml">HTML Content (Optional)</Label>
                  <Textarea
                    id="componentHtml"
                    placeholder="Enter HTML content..."
                    value={newComponent.htmlContent}
                    onChange={(e) => setNewComponent(prev => ({ ...prev, htmlContent: e.target.value }))}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="componentTags">Tags (comma-separated)</Label>
                  <Input
                    id="componentTags"
                    placeholder="e.g., promotional, newsletter, urgent"
                    value={newComponent.tags}
                    onChange={(e) => setNewComponent(prev => ({ ...prev, tags: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="componentStyles">Styles (JSON)</Label>
                  <Textarea
                    id="componentStyles"
                    placeholder='{"color": "#000", "fontSize": "16px"}'
                    value={newComponent.styles}
                    onChange={(e) => setNewComponent(prev => ({ ...prev, styles: e.target.value }))}
                    rows={2}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateComponent}>
                  Create Component
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="library" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="generator">AI Generator</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Library className="h-5 w-5" />
                Component Library
              </CardTitle>
              <CardDescription>
                Browse and manage your reusable email components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search components..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usage">Usage</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredComponents.map((component) => (
                  <Card 
                    key={component._id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setSelectedComponent(component);
                      onComponentSelect && onComponentSelect(component);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getComponentIcon(component.type)}
                            <Badge variant="outline" className="text-xs">
                              {component.type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(component.content);
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAnalyzePerformance(component._id);
                              }}
                            >
                              <BarChart3 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteComponent(component._id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm font-medium line-clamp-2">
                            {component.content}
                          </p>
                          
                          {component.category && (
                            <Badge variant="secondary" className="text-xs">
                              {component.category}
                            </Badge>
                          )}
                          
                          {component.tags && component.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {component.tags.slice(0, 3).map((tag: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {component.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{component.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>{component.usageCount || 0} uses</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            <span>{component.rating || 0}/5</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {filteredComponents.length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    No components found matching your criteria
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Component Analytics
              </CardTitle>
              <CardDescription>
                Performance insights for your content components
              </CardDescription>
            </CardHeader>
            <CardContent>
              {performanceData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {performanceData.totalUsage}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Usage</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {performanceData.averageRating}
                      </div>
                      <div className="text-sm text-muted-foreground">Avg Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {performanceData.conversionRate}%
                      </div>
                      <div className="text-sm text-muted-foreground">Conversion</div>
                    </div>
                  </div>
                  
                  {performanceData.topPerformers && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Top Performing Components</h4>
                      {performanceData.topPerformers.map((component: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">{component.type}</span>
                          <Badge variant="default">{component.score}/100</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    Select a component and click the analytics button to view performance data
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Content Generator
              </CardTitle>
              <CardDescription>
                Generate new components using artificial intelligence
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {componentTypes.map((type) => (
                  <Card 
                    key={type} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleGenerateAIContent(type, 'general')}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="space-y-2">
                        {getComponentIcon(type)}
                        <p className="text-sm font-medium capitalize">{type}</p>
                        <Button size="sm" disabled={isAnalyzing}>
                          {isAnalyzing ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  AI-generated components are optimized for engagement and conversion based on 
                  industry best practices and performance data.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
