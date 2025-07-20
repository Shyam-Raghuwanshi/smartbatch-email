"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Mail, Phone, Building, Calendar, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Contact {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  position?: string;
  tags: string[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  source?: string;
  lastEngagement?: number;
  emailStats?: {
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
  };
}

interface ContactsTableProps {
  contacts: Contact[];
  selectedContacts: string[];
  onSelectContact: (contactId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onContactClick: (contact: Contact) => void;
  loading: boolean;
}

export function ContactsTable({
  contacts,
  selectedContacts,
  onSelectContact,
  onSelectAll,
  onContactClick,
  loading,
}: ContactsTableProps) {
  const [sortField, setSortField] = useState<keyof Contact>("updatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const allSelected = contacts.length > 0 && selectedContacts.length === contacts.length;
  const someSelected = selectedContacts.length > 0 && selectedContacts.length < contacts.length;

  const handleSort = (field: keyof Contact) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getInitials = (contact: Contact) => {
    const first = contact.firstName?.[0] || "";
    const last = contact.lastName?.[0] || "";
    return first + last || contact.email[0].toUpperCase();
  };

  const getFullName = (contact: Contact) => {
    const parts = [contact.firstName, contact.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : "—";
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getEngagementRate = (contact: Contact) => {
    const stats = contact.emailStats;
    if (!stats || stats.totalSent === 0) return 0;
    return Math.round((stats.totalOpened / stats.totalSent) * 100);
  };

  const getEngagementBadgeColor = (rate: number) => {
    if (rate >= 70) return "bg-green-100 text-green-800";
    if (rate >= 40) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-muted rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}              ref={(el) => {
                if (el && 'indeterminate' in el) {
                  (el as HTMLInputElement).indeterminate = someSelected;
                }
              }}
                onCheckedChange={(checked) => onSelectAll(!!checked)}
              />
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort("email")}
            >
              Contact
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort("company")}
            >
              Company
            </TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Engagement</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort("updatedAt")}
            >
              Last Updated
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow 
              key={contact._id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onContactClick(contact)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedContacts.includes(contact._id)}
                  onCheckedChange={(checked) => onSelectContact(contact._id, !!checked)}
                />
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(contact)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{getFullName(contact)}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {contact.email}
                    </div>
                    {contact.phone && (
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {contact.phone}
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>

              <TableCell>
                {contact.company ? (
                  <div>
                    <div className="font-medium flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      {contact.company}
                    </div>
                    {contact.position && (
                      <div className="text-sm text-muted-foreground">
                        {contact.position}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>

              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {contact.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {contact.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{contact.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </TableCell>

              <TableCell>
                {contact.emailStats && contact.emailStats.totalSent > 0 ? (
                  <div className="space-y-1">
                    <Badge 
                      className={cn("text-xs", getEngagementBadgeColor(getEngagementRate(contact)))}
                    >
                      {getEngagementRate(contact)}% open rate
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {contact.emailStats.totalSent} sent, {contact.emailStats.totalClicked} clicked
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">No data</span>
                )}
              </TableCell>

              <TableCell>
                <div className="text-sm">
                  {formatDate(contact.updatedAt)}
                </div>
                {contact.source && (
                  <div className="text-xs text-muted-foreground">
                    via {contact.source}
                  </div>
                )}
              </TableCell>

              <TableCell>
                <Badge variant={contact.isActive ? "default" : "secondary"}>
                  {contact.isActive ? "Active" : "Inactive"}
                </Badge>
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
                      View Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Edit Contact
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Add to Campaign
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      Delete Contact
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {contacts.length === 0 && (
        <div className="p-8 text-center">
          <div className="text-muted-foreground">
            No contacts found. Try adjusting your filters or import some contacts.
          </div>
        </div>
      )}
    </div>
  );
}
