"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";

interface ContactFiltersProps {
  selectedTags: string[];
  selectedCompanies: string[];
  availableTags: string[];
  availableCompanies: string[];
  onTagsChange: (tags: string[]) => void;
  onCompaniesChange: (companies: string[]) => void;
}

export function ContactFilters({
  selectedTags,
  selectedCompanies,
  availableTags,
  availableCompanies,
  onTagsChange,
  onCompaniesChange,
}: ContactFiltersProps) {
  const [showAllTags, setShowAllTags] = useState(false);
  const [showAllCompanies, setShowAllCompanies] = useState(false);

  const handleTagToggle = (tag: string, checked: boolean) => {
    if (checked) {
      onTagsChange([...selectedTags, tag]);
    } else {
      onTagsChange(selectedTags.filter(t => t !== tag));
    }
  };

  const handleCompanyToggle = (company: string, checked: boolean) => {
    if (checked) {
      onCompaniesChange([...selectedCompanies, company]);
    } else {
      onCompaniesChange(selectedCompanies.filter(c => c !== company));
    }
  };

  const clearAllFilters = () => {
    onTagsChange([]);
    onCompaniesChange([]);
  };

  const displayedTags = showAllTags ? availableTags : availableTags.slice(0, 10);
  const displayedCompanies = showAllCompanies ? availableCompanies : availableCompanies.slice(0, 10);

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Active Filters */}
          {(selectedTags.length > 0 || selectedCompanies.length > 0) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Active Filters</h4>
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  Clear All
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <Badge key={`tag-${tag}`} variant="default" className="pr-1">
                    Tag: {tag}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                      onClick={() => handleTagToggle(tag, false)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
                
                {selectedCompanies.map((company) => (
                  <Badge key={`company-${company}`} variant="secondary" className="pr-1">
                    Company: {company}
                    <Button
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
              
              <Separator />
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {/* Tags Filter */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Filter by Tags</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {displayedTags.map((tag) => (
                  <div key={tag} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${tag}`}
                      checked={selectedTags.includes(tag)}
                      onCheckedChange={(checked) => handleTagToggle(tag, !!checked)}
                    />
                    <Label 
                      htmlFor={`tag-${tag}`} 
                      className="text-sm cursor-pointer flex-1 truncate"
                    >
                      {tag}
                    </Label>
                  </div>
                ))}
                
                {availableTags.length === 0 && (
                  <p className="text-sm text-muted-foreground">No tags available</p>
                )}
                
                {availableTags.length > 10 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllTags(!showAllTags)}
                    className="w-full"
                  >
                    {showAllTags ? "Show Less" : `Show All (${availableTags.length})`}
                  </Button>
                )}
              </div>
            </div>

            {/* Companies Filter */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Filter by Company</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {displayedCompanies.map((company) => (
                  <div key={company} className="flex items-center space-x-2">
                    <Checkbox
                      id={`company-${company}`}
                      checked={selectedCompanies.includes(company)}
                      onCheckedChange={(checked) => handleCompanyToggle(company, !!checked)}
                    />
                    <Label 
                      htmlFor={`company-${company}`} 
                      className="text-sm cursor-pointer flex-1 truncate"
                    >
                      {company}
                    </Label>
                  </div>
                ))}
                
                {availableCompanies.length === 0 && (
                  <p className="text-sm text-muted-foreground">No companies available</p>
                )}
                
                {availableCompanies.length > 10 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllCompanies(!showAllCompanies)}
                    className="w-full"
                  >
                    {showAllCompanies ? "Show Less" : `Show All (${availableCompanies.length})`}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
