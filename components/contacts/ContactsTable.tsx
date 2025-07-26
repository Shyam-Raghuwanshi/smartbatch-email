"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Mail, Phone, Building, MoreHorizontal, Eye, Edit, Trash2, Grid, List, TableIcon, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Performance components
import { usePerformanceMonitor, TableSkeleton, OptimisticWrapper, useDebouncedValue } from "@/components/ui/performance";
import { VirtualContactList } from "@/components/ui/virtual-scroll";
import { useCache } from "@/components/ui/cache";

interface Contact {
  _id: Id<"contacts">;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  position?: string;
  tags: string[];
  isActive: boolean;
  createdAt: number;
  updatedAt?: number;
  source?: string;
  lastEngagement?: number;
  emailStats?: {
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    lastOpenedAt?: number;
    lastClickedAt?: number;
  };
  customFields?: Record<string, string>;
}

// Type for virtual scroll component
interface VirtualContact {
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

interface ContactsTableProps {
  contacts: Contact[];
  selectedContacts: Id<"contacts">[];
  onSelectContact: (contactId: Id<"contacts">, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onContactClick: (contact: Contact) => void;
  loading?: boolean;
}

type ViewMode = "table" | "list" | "virtual";
type SortField = "name" | "email" | "company" | "createdAt" | "lastEngagement" | "engagementRate";
type SortDirection = "asc" | "desc";

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export function ContactsTable({
  contacts,
  selectedContacts,
  onSelectContact,
  onSelectAll,
  onContactClick,
  loading = false,
}: ContactsTableProps) {
  // Performance monitoring
  const renderTime = usePerformanceMonitor("ContactsTable");
  
  // View and interaction state
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: "createdAt",
    direction: "desc"
  });
  
  // Cache frequently accessed data
  const { data: cachedContacts } = useCache(
    `contacts-${JSON.stringify(contacts.map(c => c._id))}`,
    async () => contacts,
    { ttl: 5 * 60 * 1000 } // 5 minutes
  );

  // Utility functions
  const getInitials = useCallback((contact: Contact) => {
    const first = contact.firstName?.[0] || "";
    const last = contact.lastName?.[0] || "";
    return first + last || contact.email[0].toUpperCase();
  }, []);

  const getFullName = useCallback((contact: Contact) => {
    const parts = [contact.firstName, contact.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : "Unknown";
  }, []);

  const formatDate = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  const getEngagementRate = useCallback((contact: Contact) => {
    if (!contact.emailStats || contact.emailStats.totalSent === 0) return 0;
    return Math.round((contact.emailStats.totalOpened / contact.emailStats.totalSent) * 100);
  }, []);

  const getEngagementStatus = useCallback((contact: Contact) => {
    const rate = getEngagementRate(contact);
    if (rate >= 50) return { status: "high", color: "bg-green-500" };
    if (rate >= 25) return { status: "medium", color: "bg-yellow-500" };
    return { status: "low", color: "bg-red-500" };
  }, [getEngagementRate]);

  // Sorting logic
  const sortedContacts = useMemo(() => {
    const contactsToSort = cachedContacts || contacts;
    
    if (!contactsToSort || contactsToSort.length === 0) return [];
    
    return [...contactsToSort].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortConfig.field) {
        case "name":
          aValue = getFullName(a).toLowerCase();
          bValue = getFullName(b).toLowerCase();
          break;
        case "email":
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case "company":
          aValue = (a.company || "").toLowerCase();
          bValue = (b.company || "").toLowerCase();
          break;
        case "createdAt":
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
        case "lastEngagement":
          aValue = a.lastEngagement || 0;
          bValue = b.lastEngagement || 0;
          break;
        case "engagementRate":
          aValue = getEngagementRate(a);
          bValue = getEngagementRate(b);
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [cachedContacts, contacts, sortConfig, getFullName, getEngagementRate]);

  // Convert Contact to VirtualContact for virtual scroll
  const convertToVirtualContact = useCallback((contact: Contact): VirtualContact => ({
    _id: contact._id,
    email: contact.email,
    firstName: contact.firstName,
    lastName: contact.lastName,
    company: contact.company,
    tags: contact.tags,
    isActive: contact.isActive,
    lastEngagement: contact.lastEngagement,
    emailStats: contact.emailStats ? {
      totalSent: contact.emailStats.totalSent,
      totalOpened: contact.emailStats.totalOpened,
      totalClicked: contact.emailStats.totalClicked,
    } : undefined,
  }), []);

  // Convert VirtualContact back to Contact for callbacks
  const findContactById = useCallback((id: string): Contact | undefined => {
    return sortedContacts.find(c => c._id === id);
  }, [sortedContacts]);

  // Virtual scroll data conversion
  const virtualContacts = useMemo(() => 
    sortedContacts.map(convertToVirtualContact), 
    [sortedContacts, convertToVirtualContact]
  );

  // Handle sorting
  const handleSort = useCallback((field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc"
    }));
  }, []);

  // Handle row selection with optimistic updates
  const handleRowSelect = useCallback((contact: Contact, checked: boolean) => {
    onSelectContact(contact._id, checked);
  }, [onSelectContact]);

  const handleSelectAllClick = useCallback((checked: boolean) => {
    onSelectAll(checked);
  }, [onSelectAll]);

  // Check if all visible contacts are selected
  const isAllSelected = useMemo(() => {
    return sortedContacts.length > 0 && sortedContacts.every(contact => 
      selectedContacts.includes(contact._id)
    );
  }, [sortedContacts, selectedContacts]);

  const isSomeSelected = useMemo(() => {
    return selectedContacts.length > 0 && !isAllSelected;
  }, [selectedContacts.length, isAllSelected]);

  // Render sort icon
  const renderSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    return sortConfig.direction === "asc" 
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  // Contact row component for reusability
  const ContactRow = useCallback(({ contact, index }: { contact: Contact; index: number }) => {
    const isSelected = selectedContacts.includes(contact._id);
    const engagement = getEngagementStatus(contact);
    
    return (
      <TableRow 
        key={contact._id}
        className={cn(
          "cursor-pointer hover:bg-muted/50 transition-colors",
          isSelected && "bg-muted/50"
        )}
        onClick={() => onContactClick(contact)}
      >
          <TableCell onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => handleRowSelect(contact, checked as boolean)}
              aria-label={`Select ${getFullName(contact)}`}
            />
          </TableCell>
          
          <TableCell>
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {getInitials(contact)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{getFullName(contact)}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                  <Mail className="h-3 w-3 flex-shrink-0" />
                  {contact.email}
                </div>
              </div>
            </div>
          </TableCell>
          
          <TableCell>
            {contact.company ? (
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium truncate">{contact.company}</div>
                  {contact.position && (
                    <div className="text-sm text-muted-foreground truncate">
                      {contact.position}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </TableCell>
          
          <TableCell>
            {contact.phone ? (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm">{contact.phone}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </TableCell>
          
          <TableCell>
            <div className="flex flex-wrap gap-1 max-w-32">
              {contact.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {contact.tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{contact.tags.length - 2}
                </Badge>
              )}
            </div>
          </TableCell>
          
          <TableCell>
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", engagement.color)} />
              <span className="text-sm font-mono">
                {getEngagementRate(contact)}%
              </span>
            </div>
          </TableCell>
          
          <TableCell>
            <Badge variant={contact.isActive ? "default" : "secondary"}>
              {contact.isActive ? "Active" : "Inactive"}
            </Badge>
          </TableCell>
          
          <TableCell>
            <div className="text-sm">
              <div>{formatDate(contact.createdAt)}</div>
              {contact.source && (
                <div className="text-xs text-muted-foreground">
                  via {contact.source}
                </div>
              )}
            </div>
          </TableCell>
          
          <TableCell onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onContactClick(contact)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Contact
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
    );
  }, [
    selectedContacts,
    getEngagementStatus,
    getInitials,
    getFullName,
    getEngagementRate,
    formatDate,
    onContactClick,
    handleRowSelect
  ]);

  // List view component
  const ContactListItem = useCallback(({ contact }: { contact: Contact }) => {
    const isSelected = selectedContacts.includes(contact._id);
    const engagement = getEngagementStatus(contact);
    
    return (
      <Card 
        key={contact._id}
        className={cn(
          "cursor-pointer hover:bg-muted/50 transition-colors",
          isSelected && "ring-2 ring-primary"
        )}
        onClick={() => onContactClick(contact)}
      >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => handleRowSelect(contact, checked as boolean)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Select ${getFullName(contact)}`}
                />
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {getInitials(contact)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold truncate">{getFullName(contact)}</h3>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", engagement.color)} />
                      <span className="text-sm font-mono">{getEngagementRate(contact)}%</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{contact.email}</p>
                  {contact.company && (
                    <p className="text-sm text-muted-foreground truncate">
                      {contact.company}
                      {contact.position && ` • ${contact.position}`}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    {contact.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {contact.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{contact.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onContactClick(contact);
                }}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
    );
  }, [
    selectedContacts,
    getEngagementStatus,
    getInitials,
    getFullName,
    getEngagementRate,
    onContactClick,
    handleRowSelect
  ]);

  // Loading state
  if (loading) {
    return <TableSkeleton rows={10} />;
  }

  // Empty state
  if (!sortedContacts.length) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="mx-auto w-24 h-24 mb-4 rounded-full bg-muted flex items-center justify-center">
            <Mail className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No contacts found</h3>
          <p className="text-muted-foreground mb-4">
            Get started by adding your first contact or importing from a CSV file.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Mode Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {sortedContacts.length} contact{sortedContacts.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={viewMode === "table" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
            className="h-8 px-3"
          >
            <TableIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="h-8 px-3"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "virtual" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("virtual")}
            className="h-8 px-3"
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Render based on view mode */}
      {viewMode === "virtual" ? (
        <div className="border rounded-lg">
          <VirtualContactList
            contacts={virtualContacts}
            selectedContacts={selectedContacts.map(id => id)}
            onContactSelect={(virtualContact) => {
              const fullContact = findContactById(virtualContact._id);
              if (fullContact) {
                onContactClick(fullContact);
              }
            }}
            onSelectionChange={(selectedIds) => {
              // Clear current selection
              selectedContacts.forEach(id => onSelectContact(id, false));
              // Apply new selection
              selectedIds.forEach(id => {
                const fullContact = findContactById(id);
                if (fullContact) {
                  onSelectContact(fullContact._id, true);
                }
              });
            }}
            height={600}
          />
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-2">
          {sortedContacts.map((contact) => (
            <ContactListItem key={contact._id} contact={contact} />
          ))}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAllClick}
                    aria-label="Select all contacts"
                    className={isSomeSelected ? "data-[state=checked]:bg-blue-600" : ""}
                  />
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("name")}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Contact
                    {renderSortIcon("name")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("company")}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Company
                    {renderSortIcon("company")}
                  </Button>
                </TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("engagementRate")}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Engagement
                    {renderSortIcon("engagementRate")}
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("createdAt")}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Created
                    {renderSortIcon("createdAt")}
                  </Button>
                </TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedContacts.map((contact, index) => (
                <ContactRow key={contact._id} contact={contact} index={index} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}