"use client";

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Search, 
  Star, 
  Download, 
  ExternalLink, 
  CheckCircle,
  Clock,
  Filter,
  Grid,
  List,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
  Shield,
  Database,
  Globe,
  BarChart3,
  Mail,
  MessageSquare,
  Calendar,
  FileText,
  DollarSign,
  Package
} from 'lucide-react';

interface IntegrationMarketplaceProps {
  userId: string;
}

const integrationCategories = [
  { id: 'all', name: 'All Categories', icon: Package },
  { id: 'crm', name: 'CRM & Sales', icon: BarChart3 },
  { id: 'marketing', name: 'Marketing', icon: TrendingUp },
  { id: 'productivity', name: 'Productivity', icon: CheckCircle },
  { id: 'communication', name: 'Communication', icon: MessageSquare },
  { id: 'analytics', name: 'Analytics', icon: BarChart3 },
  { id: 'finance', name: 'Finance', icon: DollarSign },
  { id: 'data', name: 'Data & Storage', icon: Database },
  { id: 'security', name: 'Security', icon: Shield },
  { id: 'developer', name: 'Developer Tools', icon: Globe }
];

const marketplaceIntegrations = [
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'World\'s #1 CRM platform for sales, service, and marketing',
    category: 'crm',
    vendor: 'Salesforce.com',
    version: '2.1.0',
    rating: 4.8,
    installations: 45000,
    pricing: 'Free',
    icon: '🏢',
    featured: true,
    verified: true,
    tags: ['CRM', 'Sales', 'Marketing', 'Enterprise'],
    features: [
      'Bidirectional contact sync',
      'Lead management',
      'Opportunity tracking',
      'Campaign integration',
      'Custom field mapping',
      'Real-time webhooks'
    ],
    requirements: ['Salesforce Professional or higher', 'API access enabled'],
    documentation: 'https://docs.salesforce.com',
    supportLevel: 'Enterprise',
    screenshots: [],
    changelog: [
      { version: '2.1.0', date: '2024-01-15', changes: ['Added custom field mapping', 'Improved error handling'] },
      { version: '2.0.0', date: '2024-01-01', changes: ['Major rewrite', 'Added webhook support'] }
    ]
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Inbound marketing, sales, and service software',
    category: 'marketing',
    vendor: 'HubSpot',
    version: '1.8.3',
    rating: 4.7,
    installations: 38000,
    pricing: 'Free',
    icon: '🧲',
    featured: true,
    verified: true,
    tags: ['Marketing', 'CRM', 'Automation', 'Analytics'],
    features: [
      'Contact synchronization',
      'Email campaign integration',
      'Lead scoring',
      'Analytics dashboard',
      'Form submissions',
      'Marketing automation'
    ],
    requirements: ['HubSpot Marketing Hub', 'API key access'],
    documentation: 'https://developers.hubspot.com',
    supportLevel: 'Community',
    screenshots: [],
    changelog: []
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect SmartBatch with 5000+ apps and automate workflows',
    category: 'productivity',
    vendor: 'Zapier',
    version: '3.2.1',
    rating: 4.6,
    installations: 120000,
    pricing: 'Free',
    icon: '⚡',
    featured: true,
    verified: true,
    tags: ['Automation', 'Workflows', 'Integration', 'No-code'],
    features: [
      '5000+ app connections',
      'Multi-step workflows',
      'Conditional logic',
      'Custom triggers',
      'Error handling',
      'Premium support'
    ],
    requirements: ['Zapier account', 'Premium plan for advanced features'],
    documentation: 'https://zapier.com/apps/smartbatch',
    supportLevel: 'Premium',
    screenshots: [],
    changelog: []
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Get notifications and updates directly in your Slack workspace',
    category: 'communication',
    vendor: 'Slack Technologies',
    version: '1.5.2',
    rating: 4.5,
    installations: 85000,
    pricing: 'Free',
    icon: '💬',
    featured: false,
    verified: true,
    tags: ['Communication', 'Notifications', 'Team collaboration'],
    features: [
      'Campaign notifications',
      'Error alerts',
      'Performance reports',
      'Custom channels',
      'Slash commands',
      'Interactive messages'
    ],
    requirements: ['Slack workspace', 'Bot installation permissions'],
    documentation: 'https://api.slack.com',
    supportLevel: 'Community',
    screenshots: [],
    changelog: []
  },
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    description: 'Track email campaign performance and user behavior',
    category: 'analytics',
    vendor: 'Google',
    version: '2.0.4',
    rating: 4.4,
    installations: 65000,
    pricing: 'Free',
    icon: '📊',
    featured: false,
    verified: true,
    tags: ['Analytics', 'Tracking', 'Metrics', 'Google'],
    features: [
      'Campaign tracking',
      'Conversion analytics',
      'User behavior analysis',
      'Custom events',
      'Goal tracking',
      'Attribution modeling'
    ],
    requirements: ['Google Analytics account', 'Tracking ID'],
    documentation: 'https://developers.google.com/analytics',
    supportLevel: 'Community',
    screenshots: [],
    changelog: []
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Sync customer data and trigger campaigns based on purchase behavior',
    category: 'crm',
    vendor: 'Shopify',
    version: '1.3.7',
    rating: 4.3,
    installations: 32000,
    pricing: 'Free',
    icon: '🛒',
    featured: false,
    verified: true,
    tags: ['E-commerce', 'Customer data', 'Purchase tracking'],
    features: [
      'Customer sync',
      'Order tracking',
      'Abandoned cart recovery',
      'Product recommendations',
      'Purchase triggers',
      'Revenue tracking'
    ],
    requirements: ['Shopify store', 'Private app or partner account'],
    documentation: 'https://shopify.dev',
    supportLevel: 'Partner',
    screenshots: [],
    changelog: []
  }
];

export const IntegrationMarketplace: React.FC<IntegrationMarketplaceProps> = ({ userId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filter and sort integrations
  const filteredIntegrations = useMemo(() => {
    let filtered = marketplaceIntegrations.filter(integration => {
      const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           integration.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           integration.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });

    // Sort integrations
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'featured':
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return b.rating - a.rating;
        case 'popularity':
          return b.installations - a.installations;
        case 'rating':
          return b.rating - a.rating;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
          return new Date(b.changelog[0]?.date || '2024-01-01').getTime() - 
                 new Date(a.changelog[0]?.date || '2024-01-01').getTime();
        default:
          return 0;
      }
    });
  }, [searchQuery, selectedCategory, sortBy]);

  const handleInstallIntegration = (integration: any) => {
    // Implementation would trigger the integration setup flow
    console.log('Installing integration:', integration.id);
    setShowDetailModal(false);
  };

  const IntegrationCard = ({ integration, compact = false }: { integration: any; compact?: boolean }) => {
    const IconComponent = integration.icon;
    
    return (
      <Card 
        className={`cursor-pointer hover:shadow-lg transition-all duration-200 ${compact ? 'h-auto' : 'h-full'}`}
        onClick={() => {
          setSelectedIntegration(integration);
          setShowDetailModal(true);
        }}
      >
        <CardHeader className={compact ? 'pb-2' : 'pb-3'}>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{integration.icon}</div>
              <div>
                <div className="flex items-center space-x-2">
                  <CardTitle className={compact ? 'text-base' : 'text-lg'}>{integration.name}</CardTitle>
                  {integration.verified && (
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                  )}
                  {integration.featured && (
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
                <p className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>by {integration.vendor}</p>
              </div>
            </div>
            <Badge variant="outline">{integration.pricing}</Badge>
          </div>
          <CardDescription className={compact ? 'text-xs line-clamp-2' : 'line-clamp-3'}>
            {integration.description}
          </CardDescription>
        </CardHeader>
        <CardContent className={compact ? 'pt-0' : ''}>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="font-medium">{integration.rating}</span>
                <span className="text-gray-500">({integration.installations.toLocaleString()} installs)</span>
              </div>
              <span className="text-gray-500">v{integration.version}</span>
            </div>
            
            <div className="flex flex-wrap gap-1">
              {integration.tags.slice(0, compact ? 2 : 4).map((tag: string) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {integration.tags.length > (compact ? 2 : 4) && (
                <Badge variant="secondary" className="text-xs">
                  +{integration.tags.length - (compact ? 2 : 4)}
                </Badge>
              )}
            </div>

            {!compact && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Key Features:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {integration.features.slice(0, 3).map((feature: string, index: number) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Integration Marketplace</h2>
          <p className="text-gray-600">Discover and install integrations to extend SmartBatch</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {integrationCategories.map((category) => {
              const IconComponent = category.icon;
              return (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center space-x-2">
                    <IconComponent className="w-4 h-4" />
                    <span>{category.name}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="popularity">Most Popular</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="name">Name A-Z</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Featured Integrations */}
      {selectedCategory === 'all' && searchQuery === '' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Sparkles className="w-5 h-5 text-yellow-500 mr-2" />
            Featured Integrations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketplaceIntegrations
              .filter(integration => integration.featured)
              .map((integration) => (
                <IntegrationCard key={integration.id} integration={integration} />
              ))}
          </div>
        </div>
      )}

      {/* All Integrations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {selectedCategory === 'all' ? 'All Integrations' : 
             integrationCategories.find(c => c.id === selectedCategory)?.name}
            <span className="text-sm text-gray-500 ml-2">
              ({filteredIntegrations.length} found)
            </span>
          </h3>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIntegrations.map((integration) => (
              <IntegrationCard key={integration.id} integration={integration} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredIntegrations.map((integration) => (
              <IntegrationCard key={integration.id} integration={integration} compact />
            ))}
          </div>
        )}
      </div>

      {/* Integration Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedIntegration && (
            <>
              <DialogHeader>
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{selectedIntegration.icon}</div>
                  <div>
                    <DialogTitle className="flex items-center space-x-2">
                      {selectedIntegration.name}
                      {selectedIntegration.verified && (
                        <CheckCircle className="w-5 h-5 text-blue-500" />
                      )}
                    </DialogTitle>
                    <DialogDescription>
                      by {selectedIntegration.vendor} • v{selectedIntegration.version}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                  <TabsTrigger value="requirements">Requirements</TabsTrigger>
                  <TabsTrigger value="changelog">Changelog</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                      <p className="text-gray-700">{selectedIntegration.description}</p>
                      
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-medium">{selectedIntegration.rating}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Download className="w-4 h-4 text-gray-500" />
                          <span>{selectedIntegration.installations.toLocaleString()} installs</span>
                        </div>
                        <Badge variant="outline">{selectedIntegration.pricing}</Badge>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {selectedIntegration.tags.map((tag: string) => (
                          <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Button 
                        onClick={() => handleInstallIntegration(selectedIntegration)}
                        className="w-full"
                        size="lg"
                      >
                        Install Integration
                      </Button>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Category:</span>
                          <span className="capitalize">{selectedIntegration.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Support Level:</span>
                          <span>{selectedIntegration.supportLevel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Documentation:</span>
                          <Button variant="link" size="sm" className="p-0 h-auto">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View Docs
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="features" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedIntegration.features.map((feature: string, index: number) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="requirements" className="space-y-4">
                  <div className="space-y-3">
                    {selectedIntegration.requirements.map((requirement: string, index: number) => (
                      <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Clock className="w-5 h-5 text-orange-500 flex-shrink-0" />
                        <span>{requirement}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="changelog" className="space-y-4">
                  {selectedIntegration.changelog.length > 0 ? (
                    <div className="space-y-4">
                      {selectedIntegration.changelog.map((entry: any, index: number) => (
                        <div key={index} className="border-l-2 border-blue-500 pl-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-medium">v{entry.version}</span>
                            <span className="text-sm text-gray-500">{entry.date}</span>
                          </div>
                          <ul className="space-y-1">
                            {entry.changes.map((change: string, changeIndex: number) => (
                              <li key={changeIndex} className="text-sm text-gray-700">
                                • {change}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No changelog available</p>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
