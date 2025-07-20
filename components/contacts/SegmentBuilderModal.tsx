"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, X, Users, Eye } from "lucide-react";

const segmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

type SegmentFormData = z.infer<typeof segmentSchema>;

interface SegmentFilter {
  tags: string[];
  companies: string[];
  engagementRange: {
    min?: number;
    max?: number;
  };
  customFieldFilters: Array<{
    field: string;
    operator: string;
    value: string;
  }>;
}

interface Segment {
  _id: string;
  name: string;
  description?: string;
  filters: SegmentFilter;
}

interface SegmentBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segment?: Segment | null;
}

export function SegmentBuilderModal({ open, onOpenChange, segment }: SegmentBuilderModalProps) {
  const [filters, setFilters] = useState<SegmentFilter>({
    tags: [],
    companies: [],
    engagementRange: {},
    customFieldFilters: [],
  });
  const [previewData, setPreviewData] = useState<{ contacts: Contact[]; total: number } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const availableTags = useQuery(api.contacts_enhanced.getTags) || [];
  const availableCompanies = useQuery(api.contacts_enhanced.getCompanies) || [];
  
  const createSegment = useMutation(api.contact_segments.createSegment);
  const updateSegment = useMutation(api.contact_segments.updateSegment);
  const previewSegmentContacts = useQuery(api.contact_segments.previewSegmentContacts, 
    showPreview ? { filters } : "skip"
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<SegmentFormData>({
    resolver: zodResolver(segmentSchema),
    defaultValues: {
      name: segment?.name || "",
      description: segment?.description || "",
    },
  });

  useEffect(() => {
    if (segment) {
      setFilters(segment.filters);
      setValue("name", segment.name);
      setValue("description", segment.description || "");
    } else {
      setFilters({
        tags: [],
        companies: [],
        engagementRange: {},
        customFieldFilters: [],
      });
      reset();
    }
  }, [segment, setValue, reset]);

  const onSubmit = async (data: SegmentFormData) => {
    try {
      const segmentData = {
        name: data.name,
        description: data.description,
        filters,
      };

      if (segment) {
        await updateSegment({
          segmentId: segment._id as Id<"contactSegments">,
          ...segmentData,
        });
      } else {
        await createSegment(segmentData);
      }

      handleClose();
    } catch (error) {
      console.error("Error saving segment:", error);
    }
  };

  const handleClose = () => {
    reset();
    setFilters({
      tags: [],
      companies: [],
      engagementRange: {},
      customFieldFilters: [],
    });
    setPreviewData(null);
    setShowPreview(false);
    onOpenChange(false);
  };

  const handleTagToggle = (tag: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      tags: checked
        ? [...prev.tags, tag]
        : prev.tags.filter(t => t !== tag)
    }));
  };

  const handleCompanyToggle = (company: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      companies: checked
        ? [...prev.companies, company]
        : prev.companies.filter(c => c !== company)
    }));
  };

  const handleEngagementRangeChange = (type: "min" | "max", value: string) => {
    const numValue = value ? parseInt(value) : undefined;
    setFilters(prev => ({
      ...prev,
      engagementRange: {
        ...prev.engagementRange,
        [type]: numValue,
      },
    }));
  };

  const addCustomFieldFilter = () => {
    setFilters(prev => ({
      ...prev,
      customFieldFilters: [
        ...prev.customFieldFilters,
        { field: "", operator: "equals", value: "" },
      ],
    }));
  };

  const updateCustomFieldFilter = (index: number, field: keyof typeof filters.customFieldFilters[0], value: string) => {
    setFilters(prev => ({
      ...prev,
      customFieldFilters: prev.customFieldFilters.map((filter, i) =>
        i === index ? { ...filter, [field]: value } : filter
      ),
    }));
  };

  const removeCustomFieldFilter = (index: number) => {
    setFilters(prev => ({
      ...prev,
      customFieldFilters: prev.customFieldFilters.filter((_, i) => i !== index),
    }));
  };

  const handlePreview = async () => {
    try {
      const result = await previewSegmentContacts({ filters });
      setPreviewData(result);
      setShowPreview(true);
    } catch (error) {
      console.error("Error previewing contacts:", error);
    }
  };

  const hasFilters = filters.tags.length > 0 || 
                   filters.companies.length > 0 || 
                   Object.keys(filters.engagementRange).length > 0 ||
                   filters.customFieldFilters.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {segment ? "Edit Segment" : "Create New Segment"}
          </DialogTitle>
          <DialogDescription>
            Define filters to create a targeted contact segment
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Segment Name *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="e.g., High-Value Customers"
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Describe what this segment represents..."
                rows={3}
              />
            </div>
          </div>

          <Separator />

          {/* Filters */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Segment Filters</h3>

            {/* Tags Filter */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Filter by Tags</CardTitle>
                <CardDescription>
                  Include contacts that have any of the selected tags
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {availableTags.map((tag: string) => (
                      <div key={tag} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tag-${tag}`}
                          checked={filters.tags.includes(tag)}
                          onCheckedChange={(checked) => handleTagToggle(tag, !!checked)}
                        />
                        <Label htmlFor={`tag-${tag}`} className="text-sm truncate">
                          {tag}
                        </Label>
                      </div>
                    ))}
                  </div>

                  {filters.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      {filters.tags.map((tag) => (
                        <Badge key={tag} variant="default" className="pr-1">
                          {tag}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                            onClick={() => handleTagToggle(tag, false)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Companies Filter */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Filter by Company</CardTitle>
                <CardDescription>
                  Include contacts from specific companies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {availableCompanies.slice(0, 12).map((company: string) => (
                      <div key={company} className="flex items-center space-x-2">
                        <Checkbox
                          id={`company-${company}`}
                          checked={filters.companies.includes(company)}
                          onCheckedChange={(checked) => handleCompanyToggle(company, !!checked)}
                        />
                        <Label htmlFor={`company-${company}`} className="text-sm truncate">
                          {company}
                        </Label>
                      </div>
                    ))}
                  </div>

                  {filters.companies.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      {filters.companies.map((company) => (
                        <Badge key={company} variant="secondary" className="pr-1">
                          {company}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                            onClick={() => handleCompanyToggle(company, false)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Engagement Filter */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Filter by Engagement</CardTitle>
                <CardDescription>
                  Filter by days since last engagement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="engagementMin">Minimum days since engagement</Label>
                    <Input
                      id="engagementMin"
                      type="number"
                      placeholder="0"
                      value={filters.engagementRange.min || ""}
                      onChange={(e) => handleEngagementRangeChange("min", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="engagementMax">Maximum days since engagement</Label>
                    <Input
                      id="engagementMax"
                      type="number"
                      placeholder="30"
                      value={filters.engagementRange.max || ""}
                      onChange={(e) => handleEngagementRangeChange("max", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Custom Fields Filter */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Custom Field Filters</CardTitle>
                <CardDescription>
                  Filter by custom field values
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filters.customFieldFilters.map((filter, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 items-end">
                      <div>
                        <Label>Field Name</Label>
                        <Input
                          placeholder="field name"
                          value={filter.field}
                          onChange={(e) => updateCustomFieldFilter(index, "field", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Operator</Label>
                        <Select
                          value={filter.operator}
                          onValueChange={(value) => updateCustomFieldFilter(index, "operator", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Equals</SelectItem>
                            <SelectItem value="contains">Contains</SelectItem>
                            <SelectItem value="starts_with">Starts with</SelectItem>
                            <SelectItem value="ends_with">Ends with</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Value</Label>
                        <Input
                          placeholder="value"
                          value={filter.value}
                          onChange={(e) => updateCustomFieldFilter(index, "value", e.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeCustomFieldFilter(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addCustomFieldFilter}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Custom Field Filter
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          {hasFilters && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePreview}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Preview Contacts
                  </Button>

                  {showPreview && previewData && (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-medium">
                        This segment will include {previewData.total} contacts
                      </p>
                      {previewData.contacts.length > 0 && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <p>Sample contacts:</p>
                          <ul className="list-disc list-inside">
                            {previewData.contacts.slice(0, 5).map((contact, index) => (
                              <li key={index}>
                                {contact.firstName || ""} {contact.lastName || ""} ({contact.email})
                              </li>
                            ))}
                          </ul>
                          {previewData.total > 5 && (
                            <p>...and {previewData.total - 5} more</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !hasFilters}>
              {isSubmitting ? "Saving..." : segment ? "Update Segment" : "Create Segment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
