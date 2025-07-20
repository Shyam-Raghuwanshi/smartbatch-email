"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Tags, Download, Plus, X } from "lucide-react";

interface BulkActionsBarProps {
  selectedCount: number;
  onDelete: () => void;
  onTagUpdate: (tagsToAdd: string[], tagsToRemove: string[]) => void;
  onExport: () => void;
  availableTags: string[];
}

export function BulkActionsBar({
  selectedCount,
  onDelete,
  onTagUpdate,
  onExport,
  availableTags,
}: BulkActionsBarProps) {
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagsToAdd, setTagsToAdd] = useState<string[]>([]);
  const [tagsToRemove, setTagsToRemove] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");

  const handleTagUpdate = () => {
    onTagUpdate(tagsToAdd, tagsToRemove);
    setTagsToAdd([]);
    setTagsToRemove([]);
    setShowTagModal(false);
  };

  const addNewTag = () => {
    if (newTagInput && !tagsToAdd.includes(newTagInput)) {
      setTagsToAdd([...tagsToAdd, newTagInput]);
      setNewTagInput("");
    }
  };

  const addExistingTag = (tag: string) => {
    if (!tagsToAdd.includes(tag)) {
      setTagsToAdd([...tagsToAdd, tag]);
    }
  };

  const removeTagToAdd = (tag: string) => {
    setTagsToAdd(tagsToAdd.filter(t => t !== tag));
  };

  const addTagToRemove = (tag: string) => {
    if (!tagsToRemove.includes(tag)) {
      setTagsToRemove([...tagsToRemove, tag]);
    }
  };

  const removeTagToRemove = (tag: string) => {
    setTagsToRemove(tagsToRemove.filter(t => t !== tag));
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-sm">
                {selectedCount} selected
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Dialog open={showTagModal} onOpenChange={setShowTagModal}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Tags className="mr-2 h-4 w-4" />
                    Manage Tags
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Manage Tags</DialogTitle>
                    <DialogDescription>
                      Add or remove tags for {selectedCount} selected contacts
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    {/* Add Tags */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Tags to Add</Label>
                      
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter new tag..."
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addNewTag();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addNewTag}
                          disabled={!newTagInput}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {tagsToAdd.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {tagsToAdd.map((tag) => (
                            <Badge key={tag} variant="default" className="pr-1">
                              {tag}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                                onClick={() => removeTagToAdd(tag)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {availableTags.length > 0 && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Available Tags</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {availableTags
                              .filter(tag => !tagsToAdd.includes(tag))
                              .slice(0, 10)
                              .map((tag) => (
                                <Button
                                  key={tag}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-xs"
                                  onClick={() => addExistingTag(tag)}
                                >
                                  + {tag}
                                </Button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <Separator />
                    
                    {/* Remove Tags */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Tags to Remove</Label>
                      
                      {tagsToRemove.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {tagsToRemove.map((tag) => (
                            <Badge key={tag} variant="destructive" className="pr-1">
                              {tag}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                                onClick={() => removeTagToRemove(tag)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {availableTags.length > 0 && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Select Tags to Remove</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {availableTags
                              .filter(tag => !tagsToRemove.includes(tag))
                              .slice(0, 10)
                              .map((tag) => (
                                <Button
                                  key={tag}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-xs"
                                  onClick={() => addTagToRemove(tag)}
                                >
                                  - {tag}
                                </Button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowTagModal(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleTagUpdate}
                        disabled={tagsToAdd.length === 0 && tagsToRemove.length === 0}
                      >
                        Update Tags
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              
              <Button variant="destructive" size="sm" onClick={onDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
          
          <Button variant="ghost" size="sm">
            Clear Selection
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
