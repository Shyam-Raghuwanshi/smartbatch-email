"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, AlertCircle, TrendingUp, Eye, MousePointer } from 'lucide-react';
import { ComponentSkeleton, TableSkeleton, ErrorBoundary } from './performance';
import { usePaginatedCache, useBackgroundSync } from './cache';

// Intersection Observer hook for infinite scroll
function useIntersectionObserver(
  callback: () => void,
  options: IntersectionObserverInit = {}
) {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        callback();
      }
    }, {
      threshold: 0.1,
      rootMargin: '100px',
      ...options
    });

    observer.observe(target);
    return () => observer.disconnect();
  }, [callback, options]);

  return targetRef;
}

// Generic infinite scroll container
interface InfiniteScrollProps<T> {
  items: T[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  renderError?: (error: Error, retry: () => void) => React.ReactNode;
  error?: Error;
  className?: string;
  threshold?: number;
  skeleton?: React.ReactNode;
  loadingText?: string;
  emptyText?: string;
}

export function InfiniteScroll<T>({
  items,
  loading,
  hasMore,
  loadMore,
  renderItem,
  renderEmpty,
  renderError,
  error,
  className = '',
  threshold = 0.1,
  skeleton = <ComponentSkeleton />,
  loadingText = 'Loading more...',
  emptyText = 'No items found'
}: InfiniteScrollProps<T>) {
  const loadMoreRef = useIntersectionObserver(loadMore, { threshold });

  if (error && renderError) {
    return <>{renderError(error, loadMore)}</>;
  }

  if (items.length === 0 && !loading) {
    return renderEmpty ? <>{renderEmpty()}</> : (
      <div className="text-center py-12 text-gray-500">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>{emptyText}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {renderItem(item, index)}
        </React.Fragment>
      ))}
      
      {loading && items.length === 0 && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>{skeleton}</div>
          ))}
        </div>
      )}
      
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-6">
          {loading ? (
            <div className="flex items-center space-x-2 text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{loadingText}</span>
            </div>
          ) : (
            <Button variant="outline" onClick={loadMore}>
              Load More
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Campaign card for infinite scroll
interface Campaign {
  _id: string;
  name: string;
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed';
  type: string;
  createdAt: number;
  scheduledAt?: number;
  analytics?: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    openRate: number;
    clickRate: number;
  };
  settings: {
    targetAudience?: string;
    sendTime?: string;
  };
}

const CampaignCard = React.memo(({ campaign, onClick }: { campaign: Campaign; onClick?: (campaign: Campaign) => void }) => {
  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
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
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onClick?.(campaign)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 mb-1">
              {campaign.name}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>{campaign.type}</span>
              <span>•</span>
              <span>Created {formatDate(campaign.createdAt)}</span>
            </div>
          </div>
          <Badge className={getStatusColor(campaign.status)}>
            {campaign.status}
          </Badge>
        </div>

        {campaign.analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {campaign.analytics.sent.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">Sent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {campaign.analytics.openRate.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600 flex items-center justify-center">
                <Eye className="h-3 w-3 mr-1" />
                Opens
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {campaign.analytics.clickRate.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600 flex items-center justify-center">
                <MousePointer className="h-3 w-3 mr-1" />
                Clicks
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {((campaign.analytics.clicked / campaign.analytics.sent) * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600 flex items-center justify-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                CTR
              </div>
            </div>
          </div>
        )}

        {campaign.settings.targetAudience && (
          <div className="text-sm text-gray-600">
            Target: {campaign.settings.targetAudience}
          </div>
        )}

        {campaign.scheduledAt && campaign.status === 'scheduled' && (
          <div className="text-sm text-gray-600">
            Scheduled for {formatDate(campaign.scheduledAt)}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

CampaignCard.displayName = 'CampaignCard';

// Infinite scrolling campaigns list
interface InfiniteCampaignsProps {
  onCampaignClick?: (campaign: Campaign) => void;
  filters?: {
    status?: Campaign['status'][];
    type?: string[];
    search?: string;
  };
}

export function InfiniteCampaigns({ onCampaignClick, filters }: InfiniteCampaignsProps) {
  const {
    items: campaigns,
    hasMore,
    isLoading,
    loadNextPage,
    reset
  } = usePaginatedCache<Campaign>(
    `campaigns${filters ? `:${JSON.stringify(filters)}` : ''}`,
    async (page, limit) => {
      // This would be replaced with actual Convex query
      const mockCampaigns: Campaign[] = Array.from({ length: limit }, (_, i) => ({
        _id: `campaign_${page}_${i}`,
        name: `Campaign ${page * limit + i + 1}`,
        status: ['draft', 'running', 'completed', 'paused'][Math.floor(Math.random() * 4)] as Campaign['status'],
        type: ['Newsletter', 'Promotional', 'Welcome', 'Follow-up'][Math.floor(Math.random() * 4)],
        createdAt: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        analytics: {
          sent: Math.floor(Math.random() * 10000),
          delivered: Math.floor(Math.random() * 9500),
          opened: Math.floor(Math.random() * 5000),
          clicked: Math.floor(Math.random() * 1000),
          openRate: Math.random() * 100,
          clickRate: Math.random() * 30
        },
        settings: {
          targetAudience: 'All contacts',
          sendTime: '09:00'
        }
      }));

      return {
        items: mockCampaigns,
        total: 1000,
        hasMore: page < 50
      };
    },
    { pageSize: 12, prefetchNext: true }
  );

  // Reset when filters change
  useEffect(() => {
    reset();
  }, [filters, reset]);

  // Background sync for real-time updates
  useBackgroundSync(
    'campaigns:live',
    async () => {
      // Fetch latest campaign updates
      return { lastUpdate: Date.now() };
    },
    {
      interval: 30000, // 30 seconds
      onUpdate: () => {
        // Could update specific campaigns that changed
      }
    }
  );

  const renderError = (error: Error, retry: () => void) => (
    <Card className="p-6 text-center">
      <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Failed to load campaigns
      </h3>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <Button onClick={retry} variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        Try Again
      </Button>
    </Card>
  );

  const renderEmpty = () => (
    <Card className="p-12 text-center">
      <div className="text-gray-400 mb-4">
        <AlertCircle className="h-16 w-16 mx-auto" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        No campaigns found
      </h3>
      <p className="text-gray-600 mb-6">
        Get started by creating your first email campaign
      </p>
      <Button>
        Create Campaign
      </Button>
    </Card>
  );

  return (
    <ErrorBoundary>
      <InfiniteScroll
        items={campaigns}
        loading={isLoading}
        hasMore={hasMore}
        loadMore={loadNextPage}
        renderItem={(campaign) => (
          <CampaignCard 
            key={campaign._id} 
            campaign={campaign} 
            onClick={onCampaignClick}
          />
        )}
        renderEmpty={renderEmpty}
        renderError={renderError}
        className="space-y-6"
        skeleton={<ComponentSkeleton />}
        loadingText="Loading more campaigns..."
        emptyText="No campaigns match your filters"
      />
    </ErrorBoundary>
  );
}

// Infinite contacts list (similar structure)
interface Contact {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  tags: string[];
  isActive: boolean;
  lastEngagement?: number;
  emailStats?: {
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
  };
}

const ContactCard = React.memo(({ contact, onClick }: { contact: Contact; onClick?: (contact: Contact) => void }) => {
  const engagementRate = contact.emailStats ? 
    ((contact.emailStats.totalOpened + contact.emailStats.totalClicked) / Math.max(contact.emailStats.totalSent, 1) * 100) : 0;

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onClick?.(contact)}
    >
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600">
              {(contact.firstName?.[0] || contact.email[0]).toUpperCase()}
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium text-gray-900 truncate">
                {contact.firstName && contact.lastName 
                  ? `${contact.firstName} ${contact.lastName}`
                  : contact.email
                }
              </p>
              {!contact.isActive && (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </div>
            
            <p className="text-sm text-gray-500 truncate">{contact.email}</p>
            
            {contact.company && (
              <p className="text-xs text-gray-400 truncate">{contact.company}</p>
            )}
            
            {contact.tags.length > 0 && (
              <div className="flex items-center space-x-1 mt-2">
                {contact.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {contact.tags.length > 2 && (
                  <span className="text-xs text-gray-500">+{contact.tags.length - 2}</span>
                )}
              </div>
            )}
          </div>
          
          <div className="text-right">
            {engagementRate > 0 && (
              <Badge variant="secondary" className="text-xs">
                {engagementRate.toFixed(1)}% engaged
              </Badge>
            )}
            <div className="text-xs text-gray-500 mt-1">
              {contact.lastEngagement 
                ? new Date(contact.lastEngagement).toLocaleDateString()
                : 'No activity'
              }
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ContactCard.displayName = 'ContactCard';

export function InfiniteContacts({ onContactClick, filters }: {
  onContactClick?: (contact: Contact) => void;
  filters?: any;
}) {
  const {
    items: contacts,
    hasMore,
    isLoading,
    loadNextPage,
    reset
  } = usePaginatedCache<Contact>(
    `contacts${filters ? `:${JSON.stringify(filters)}` : ''}`,
    async (page, limit) => {
      // Mock data - replace with actual query
      const mockContacts: Contact[] = Array.from({ length: limit }, (_, i) => ({
        _id: `contact_${page}_${i}`,
        email: `user${page * limit + i + 1}@example.com`,
        firstName: `First${i + 1}`,
        lastName: `Last${i + 1}`,
        company: `Company ${i + 1}`,
        tags: [`tag${i % 3 + 1}`, `category${i % 2 + 1}`],
        isActive: Math.random() > 0.1,
        lastEngagement: Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000,
        emailStats: {
          totalSent: Math.floor(Math.random() * 100),
          totalOpened: Math.floor(Math.random() * 50),
          totalClicked: Math.floor(Math.random() * 20)
        }
      }));

      return {
        items: mockContacts,
        total: 10000,
        hasMore: page < 500
      };
    },
    { pageSize: 20 }
  );

  useEffect(() => {
    reset();
  }, [filters, reset]);

  return (
    <ErrorBoundary>
      <InfiniteScroll
        items={contacts}
        loading={isLoading}
        hasMore={hasMore}
        loadMore={loadNextPage}
        renderItem={(contact) => (
          <ContactCard 
            key={contact._id} 
            contact={contact} 
            onClick={onContactClick}
          />
        )}
        className="space-y-3"
        skeleton={<ComponentSkeleton />}
      />
    </ErrorBoundary>
  );
}

export default InfiniteScroll;
