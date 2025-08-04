"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Building, Mail, Tag, Download, Plus } from "lucide-react";

interface Segment {
  _id: string;
  name: string;
  description?: string;
  contactCount?: number;
  filters: {
    tags?: string[];
    companies?: string[];
    engagementRange?: {
      min?: number;
      max?: number;
    };
    customFieldFilters?: Array<{
      field: string;
      operator: string;
      value: string;
    }>;
  };
}

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
  lastEngagement?: number;
}

interface ContactSegmentModalProps {
  segment: Segment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactSegmentModal({ segment, open, onOpenChange }: ContactSegmentModalProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const segmentContacts = useQuery(
    api.contact_segments.getContactsBySegment,
    open ? { segmentId: segment._id as Id<"contactSegments"> } : "skip"
  );

  useEffect(() => {
    if (segmentContacts) {
      setContacts(segmentContacts);
      setLoading(false);
    } else if (open) {
      setLoading(true);
    }
  }, [segmentContacts, open]);

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

  const handleExportContacts = () => {
    const csvData = [
      ["Email", "First Name", "Last Name", "Phone", "Company", "Position", "Tags", "Status", "Created At"],
      ...contacts.map(contact => [
        contact.email,
        contact.firstName || "",
        contact.lastName || "",
        contact.phone || "",
        contact.company || "",
        contact.position || "",
        contact.tags.join(", "),
        contact.isActive ? "Active" : "Inactive",
        new Date(contact.createdAt).toLocaleDateString(),
      ])
    ];

    const csvContent = csvData.map(row => row.map(field => `"${field}"`).join(",")).join("\\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${segment.name.replace(/[^a-z0-9]/gi, '_')}-contacts.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateCampaign = () => {
    // Extract tags from the segment filters to pre-populate the campaign
    const tags = segment.filters.tags || [];
    const queryParams = new URLSearchParams();
    
    if (tags.length > 0) {
      queryParams.set('tags', tags.join(','));
    }
    
    // Navigate to campaigns page with pre-selected segment tags
    router.push(`/campaigns?${queryParams.toString()}`);
  };

  const getFilterSummary = () => {
    const parts = [];
    
    if (segment.filters.tags && segment.filters.tags.length > 0) {
      parts.push(`Tags: ${segment.filters.tags.join(", ")}`);
    }
    
    if (segment.filters.companies && segment.filters.companies.length > 0) {
      parts.push(`Companies: ${segment.filters.companies.join(", ")}`);
    }
    
    if (segment.filters.engagementRange) {
      const { min, max } = segment.filters.engagementRange;
      if (min !== undefined || max !== undefined) {
        const minText = min !== undefined ? `min ${min} days` : "";
        const maxText = max !== undefined ? `max ${max} days` : "";
        parts.push(`Engagement: ${[minText, maxText].filter(Boolean).join(", ")} since last engagement`);
      }
    }
    
    if (segment.filters.customFieldFilters && segment.filters.customFieldFilters.length > 0) {
      segment.filters.customFieldFilters.forEach(filter => {
        parts.push(`${filter.field} ${filter.operator} "${filter.value}"`);
      });
    }
    
    return parts;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{segment.name}</DialogTitle>
              {segment.description && (
                <DialogDescription className="mt-1">{segment.description}</DialogDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                <Users className="mr-1 h-4 w-4" />
                {contacts.length} contacts
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Segment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Segment Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getFilterSummary().map((filter, index) => (
                  <div key={index} className="text-sm text-muted-foreground">
                    • {filter}
                  </div>
                ))}
                {getFilterSummary().length === 0 && (
                  <div className="text-sm text-muted-foreground">No filters applied</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handleExportContacts} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Contacts
            </Button>
            <Button onClick={handleCreateCampaign} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </div>

          {/* Contacts Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contacts in Segment</CardTitle>
              <CardDescription>
                {loading ? "Loading contacts..." : `${contacts.length} contacts match the segment criteria`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-muted rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contact</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Tags</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.map((contact) => (
                        <TableRow key={contact._id}>
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
                            <Badge variant={contact.isActive ? "default" : "secondary"}>
                              {contact.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <div className="text-sm">
                              {formatDate(contact.createdAt)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {contacts.length === 0 && (
                    <div className="p-8 text-center">
                      <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <div className="text-muted-foreground">
                        No contacts match the segment criteria
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
