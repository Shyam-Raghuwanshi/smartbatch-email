"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { FixedSizeList as List, VariableSizeList, ListChildComponentProps } from 'react-window';
import { FixedSizeGrid as Grid } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, ChevronDown, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { useDebouncedValue } from './performance';

// Contact item for virtual list
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

interface VirtualContactListProps {
  contacts: Contact[];
  height: number;
  onContactSelect?: (contact: Contact) => void;
  selectedContacts?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  loading?: boolean;
  hasNextPage?: boolean;
  loadNextPage?: () => Promise<void>;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  itemHeight?: number;
}

// Virtual contact row component
const ContactRow = React.memo(({ index, style, data }: ListChildComponentProps & { data: any }) => {
  const { contacts, onContactSelect, selectedContacts, onSelectionChange } = data;
  const contact = contacts[index];

  if (!contact) {
    return (
      <div style={style} className="p-4 border-b">
        <ContactRowSkeleton />
      </div>
    );
  }

  const isSelected = selectedContacts?.includes(contact._id) || false;
  const engagementRate = contact.emailStats ? 
    ((contact.emailStats.totalOpened + contact.emailStats.totalClicked) / Math.max(contact.emailStats.totalSent, 1) * 100) : 0;

  const handleSelectionChange = (checked: boolean) => {
    if (onSelectionChange) {
      const newSelection = checked 
        ? [...(selectedContacts || []), contact._id]
        : (selectedContacts || []).filter((id: string) => id !== contact._id);
      onSelectionChange(newSelection);
    }
  };

  return (
    <div 
      style={style} 
      className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
      onClick={() => onContactSelect?.(contact)}
    >
      <div className="flex items-center space-x-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={handleSelectionChange}
          onClick={(e) => e.stopPropagation()}
        />
        
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            {(contact.firstName?.[0] || contact.email[0]).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-gray-900 truncate">
              {contact.firstName && contact.lastName 
                ? `${contact.firstName} ${contact.lastName}`
                : contact.email
              }
            </p>
            {!contact.isActive && (
              <Badge variant="secondary" className="text-xs">Inactive</Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-4 mt-1">
            <p className="text-sm text-gray-500 truncate">{contact.email}</p>
            {contact.company && (
              <p className="text-sm text-gray-500 truncate">{contact.company}</p>
            )}
            {engagementRate > 0 && (
              <Badge variant="outline" className="text-xs">
                {engagementRate.toFixed(1)}% engaged
              </Badge>
            )}
          </div>
          
          {contact.tags.length > 0 && (
            <div className="flex items-center space-x-1 mt-1">
              {contact.tags.slice(0, 3).map((tag: string) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {contact.tags.length > 3 && (
                <span className="text-xs text-gray-500">+{contact.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
        
        <div className="text-right">
          <div className="text-xs text-gray-500">
            {contact.lastEngagement 
              ? new Date(contact.lastEngagement).toLocaleDateString()
              : 'No activity'
            }
          </div>
          {contact.emailStats && (
            <div className="text-xs text-gray-400 mt-1">
              {contact.emailStats.totalSent} sent • {contact.emailStats.totalOpened} opened
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ContactRow.displayName = 'ContactRow';

// Skeleton for loading states
const ContactRowSkeleton = React.memo(() => (
  <div className="flex items-center space-x-3 animate-pulse">
    <div className="h-4 w-4 bg-gray-200 rounded"></div>
    <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      <div className="flex space-x-1">
        <div className="h-4 w-12 bg-gray-200 rounded"></div>
        <div className="h-4 w-16 bg-gray-200 rounded"></div>
      </div>
    </div>
    <div className="space-y-1">
      <div className="h-3 bg-gray-200 rounded w-16"></div>
      <div className="h-3 bg-gray-200 rounded w-20"></div>
    </div>
  </div>
));

ContactRowSkeleton.displayName = 'ContactRowSkeleton';

// Main virtual contact list component
export function VirtualContactList({
  contacts,
  height = 600,
  onContactSelect,
  selectedContacts = [],
  onSelectionChange,
  loading = false,
  hasNextPage = false,
  loadNextPage,
  searchQuery = '',
  onSearchChange,
  itemHeight = 120
}: VirtualContactListProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const debouncedSearchQuery = useDebouncedValue(localSearchQuery, 300);
  const listRef = useRef<List>(null);

  // Filter contacts based on search
  const filteredContacts = useMemo(() => {
    if (!debouncedSearchQuery) return contacts;
    
    const query = debouncedSearchQuery.toLowerCase();
    return contacts.filter(contact => 
      contact.email.toLowerCase().includes(query) ||
      contact.firstName?.toLowerCase().includes(query) ||
      contact.lastName?.toLowerCase().includes(query) ||
      contact.company?.toLowerCase().includes(query) ||
      contact.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [contacts, debouncedSearchQuery]);

  // Update search when query changes
  useEffect(() => {
    if (onSearchChange && debouncedSearchQuery !== searchQuery) {
      onSearchChange(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, onSearchChange, searchQuery]);

  // Select all functionality
  const handleSelectAll = useCallback(() => {
    if (onSelectionChange) {
      const allIds = filteredContacts.map(c => c._id);
      const allSelected = allIds.every(id => selectedContacts.includes(id));
      
      if (allSelected) {
        onSelectionChange(selectedContacts.filter(id => !allIds.includes(id)));
      } else {
        onSelectionChange([...new Set([...selectedContacts, ...allIds])]);
      }
    }
  }, [filteredContacts, selectedContacts, onSelectionChange]);

  // Item data for virtual list
  const itemData = useMemo(() => ({
    contacts: filteredContacts,
    onContactSelect,
    selectedContacts,
    onSelectionChange
  }), [filteredContacts, onContactSelect, selectedContacts, onSelectionChange]);

  // Item count for infinite loader
  const itemCount = hasNextPage ? filteredContacts.length + 1 : filteredContacts.length;

  // Check if item is loaded
  const isItemLoaded = (index: number) => index < filteredContacts.length;

  // Load more items
  const loadMoreItems = loadNextPage ? async (startIndex: number, stopIndex: number) => {
    await loadNextPage();
  } : undefined;

  return (
    <Card className="overflow-hidden">
      {/* Search and filters header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search contacts..."
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          
          {selectedContacts.length > 0 && (
            <Badge variant="secondary">
              {selectedContacts.length} selected
            </Badge>
          )}
        </div>
        
        {/* Select all checkbox */}
        {filteredContacts.length > 0 && (
          <div className="flex items-center space-x-2 mt-3">
            <Checkbox
              checked={filteredContacts.every(c => selectedContacts.includes(c._id))}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-gray-600">
              Select all {filteredContacts.length} contacts
            </span>
          </div>
        )}
      </div>

      {/* Virtual list */}
      <div style={{ height }}>
        {loading && filteredContacts.length === 0 ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <ContactRowSkeleton key={i} />
            ))}
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Search className="h-12 w-12 mb-4 text-gray-300" />
            <p>No contacts found</p>
            {debouncedSearchQuery && (
              <p className="text-sm">Try adjusting your search terms</p>
            )}
          </div>
        ) : loadMoreItems ? (
          <InfiniteLoader
            isItemLoaded={isItemLoaded}
            itemCount={itemCount}
            loadMoreItems={loadMoreItems}
          >
            {({ onItemsRendered, ref }: any) => (
              <List
                ref={(list) => {
                  ref(list);
                  (listRef as any).current = list;
                }}
                height={height}
                width="100%"
                itemCount={itemCount}
                itemSize={itemHeight}
                itemData={itemData}
                onItemsRendered={onItemsRendered}
              >
                {ContactRow}
              </List>
            )}
          </InfiniteLoader>
        ) : (
          <List
            ref={listRef}
            height={height}
            width="100%"
            itemCount={filteredContacts.length}
            itemSize={itemHeight}
            itemData={itemData}
          >
            {ContactRow}
          </List>
        )}
      </div>
      
      {/* Loading indicator for infinite scroll */}
      {loading && filteredContacts.length > 0 && (
        <div className="p-4 border-t bg-gray-50 flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm text-gray-600">Loading more contacts...</span>
        </div>
      )}
    </Card>
  );
}

// Grid view for campaigns or templates
interface VirtualGridProps<T> {
  items: T[];
  height: number;
  width: number;
  columnCount: number;
  rowHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  loading?: boolean;
}

export function VirtualGrid<T>({
  items,
  height,
  width,
  columnCount,
  rowHeight,
  renderItem,
  loading = false
}: VirtualGridProps<T>) {
  const rowCount = Math.ceil(items.length / columnCount);
  
  const Cell = ({ columnIndex, rowIndex, style }: any) => {
    const index = rowIndex * columnCount + columnIndex;
    const item = items[index];
    
    if (!item) {
      return <div style={style} />;
    }
    
    return (
      <div style={style} className="p-2">
        {renderItem(item, index)}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-4 p-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-48 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <Grid
      columnCount={columnCount}
      columnWidth={width / columnCount - 16}
      height={height}
      rowCount={rowCount}
      rowHeight={rowHeight}
      width={width}
    >
      {Cell}
    </Grid>
  );
}

export default VirtualContactList;
