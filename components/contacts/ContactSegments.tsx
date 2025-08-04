"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Users, Filter, Edit, Trash2, MoreHorizontal, Search } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SegmentBuilderModal } from "./SegmentBuilderModal";
import { ContactSegmentModal } from "./ContactSegmentModal";

interface Segment {
  _id: Id<"contactSegments">;
  name: string;
  description?: string;
  contactCount?: number;
  createdAt: number;
  updatedAt: number;
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

export function ContactSegments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSegmentBuilder, setShowSegmentBuilder] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);

  const segments = useQuery(api.contact_segments.getSegments) || [];
  const deleteSegment = useMutation(api.contact_segments.deleteSegment);
  const updateSegmentCounts = useMutation(api.contact_segments.updateSegmentCounts);

  const filteredSegments = segments.filter(segment =>
    segment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    segment.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteSegment = async (segmentId: Id<"contactSegments">) => {
    if (confirm("Are you sure you want to delete this segment?")) {
      await deleteSegment({ segmentId });
    }
  };

  const handleEditSegment = (segment: Segment) => {
    setEditingSegment(segment);
    setShowSegmentBuilder(true);
  };

  const handleViewSegment = (segment: Segment) => {
    setSelectedSegment(segment);
  };

  const refreshCounts = async () => {
    await updateSegmentCounts({});
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getFilterSummary = (filters: Segment["filters"]) => {
    const parts = [];
    
    if (filters.tags && filters.tags.length > 0) {
      parts.push(`${filters.tags.length} tag${filters.tags.length > 1 ? 's' : ''}`);
    }
    
    if (filters.companies && filters.companies.length > 0) {
      parts.push(`${filters.companies.length} company${filters.companies.length > 1 ? 'ies' : 'y'}`);
    }
    
    if (filters.engagementRange) {
      parts.push("engagement filter");
    }
    
    if (filters.customFieldFilters && filters.customFieldFilters.length > 0) {
      parts.push(`${filters.customFieldFilters.length} custom field${filters.customFieldFilters.length > 1 ? 's' : ''}`);
    }
    
    return parts.length > 0 ? parts.join(", ") : "No filters";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contact Segments</h1>
          <p className="text-muted-foreground">
            Create and manage contact segments for targeted campaigns
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowSegmentBuilder(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Segment
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search segments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Segments Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredSegments.map((segment) => (
          <Card key={segment._id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{segment.name}</CardTitle>
                  {segment.description && (
                    <CardDescription>{segment.description}</CardDescription>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewSegment(segment)}>
                      <Users className="mr-2 h-4 w-4" />
                      View Contacts
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditSegment(segment)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Segment
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteSegment(segment._id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Segment
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Contact Count */}
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">
                  {segment.contactCount !== undefined ? segment.contactCount.toLocaleString() : "—"}
                </span>
                <span className="text-muted-foreground">contacts</span>
              </div>

              {/* Filter Summary */}
              <div>
                <p className="text-sm font-medium mb-1">Filters:</p>
                <p className="text-xs text-muted-foreground">
                  {getFilterSummary(segment.filters)}
                </p>
              </div>

              {/* Tags Preview */}
              {segment.filters.tags && segment.filters.tags.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">Tags:</p>
                  <div className="flex flex-wrap gap-1">
                    {segment.filters.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {segment.filters.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{segment.filters.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Companies Preview */}
              {segment.filters.companies && segment.filters.companies.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">Companies:</p>
                  <div className="flex flex-wrap gap-1">
                    {segment.filters.companies.slice(0, 2).map((company) => (
                      <Badge key={company} variant="outline" className="text-xs">
                        {company}
                      </Badge>
                    ))}
                    {segment.filters.companies.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{segment.filters.companies.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Created Date */}
              <p className="text-xs text-muted-foreground">
                Created {formatDate(segment.createdAt)}
              </p>

              {/* Action Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleViewSegment(segment)}
              >
                <Users className="mr-2 h-4 w-4" />
                View Contacts
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSegments.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No segments found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "Try adjusting your search criteria" : "Create your first segment to get started"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowSegmentBuilder(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Segment
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <SegmentBuilderModal
        open={showSegmentBuilder}
        onOpenChange={(open: boolean) => {
          setShowSegmentBuilder(open);
          if (!open) setEditingSegment(null);
        }}
        segment={editingSegment}
      />

      {selectedSegment && (
        <ContactSegmentModal
          segment={selectedSegment}
          open={!!selectedSegment}
          onOpenChange={(open: boolean) => !open && setSelectedSegment(null)}
        />
      )}
    </div>
  );
}
