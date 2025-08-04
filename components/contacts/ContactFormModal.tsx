"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const contactSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  tags: z.array(z.string()),
  customFields: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean(),
});

type ContactFormData = z.infer<typeof contactSchema>;

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
  customFields?: Record<string, string>;
}

interface ContactFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact;
}

export function ContactFormModal({ open, onOpenChange, contact }: ContactFormModalProps) {
  const [tagInput, setTagInput] = useState("");
  const [customFieldKey, setCustomFieldKey] = useState("");
  const [customFieldValue, setCustomFieldValue] = useState("");
  const [customFields, setCustomFields] = useState<Record<string, string>>(contact?.customFields || {});
  const [selectedTags, setSelectedTags] = useState<string[]>(contact?.tags || []);

  const availableTags = useQuery(api.contacts_enhanced.getTags) || [];

  const createContact = useMutation(api.contacts_enhanced.createContact);
  const updateContact = useMutation(api.contacts_enhanced.updateContact);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      email: contact?.email || "",
      firstName: contact?.firstName || "",
      lastName: contact?.lastName || "",
      phone: contact?.phone || "",
      company: contact?.company || "",
      position: contact?.position || "",
      tags: contact?.tags || [],
      isActive: contact?.isActive ?? true,
      customFields: contact?.customFields || {},
    },
  });

  // Update form values when contact prop changes
  useEffect(() => {
    if (contact) {
      setValue("email", contact.email);
      setValue("firstName", contact.firstName || "");
      setValue("lastName", contact.lastName || "");
      setValue("phone", contact.phone || "");
      setValue("company", contact.company || "");
      setValue("position", contact.position || "");
      setValue("isActive", contact.isActive ?? true);
      setSelectedTags(contact.tags || []);
      setCustomFields(contact.customFields || {});
    } else {
      // Reset form for new contact
      reset({
        email: "",
        firstName: "",
        lastName: "",
        phone: "",
        company: "",
        position: "",
        tags: [],
        isActive: true,
        customFields: {},
      });
      setSelectedTags([]);
      setCustomFields({});
    }
  }, [contact, setValue, reset]);

  const onSubmit = async (data: ContactFormData) => {
    try {
      const contactData = {
        ...data,
        tags: selectedTags,
        customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
      };

      if (contact) {
        await updateContact({
          contactId: contact._id,
          ...contactData,
        });
      } else {
        await createContact(contactData);
      }

      handleClose();
    } catch (error) {
      console.error("Error saving contact:", error);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedTags([]);
    setCustomFields({});
    setTagInput("");
    setCustomFieldKey("");
    setCustomFieldValue("");
    onOpenChange(false);
  };

  const addTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const addCustomField = () => {
    if (customFieldKey && customFieldValue) {
      setCustomFields({
        ...customFields,
        [customFieldKey]: customFieldValue,
      });
      setCustomFieldKey("");
      setCustomFieldValue("");
    }
  };

  const removeCustomField = (key: string) => {
    const updatedFields = { ...customFields };
    delete updatedFields[key];
    setCustomFields(updatedFields);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {contact ? "Edit Contact" : "Add New Contact"}
          </DialogTitle>
          <DialogDescription>
            {contact ? "Update contact information" : "Create a new contact in your database"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  {...register("firstName")}
                  placeholder="John"
                />
              </div>
              
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  {...register("lastName")}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Company Information</h3>
            
            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                {...register("company")}
                placeholder="Enter company name"
              />
            </div>

            <div>
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                {...register("position")}
                placeholder="Software Engineer"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Tags</h3>
            
            <div>
              <Label>Current Tags</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="pr-1">
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => removeTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(tagInput);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addTag(tagInput)}
                disabled={!tagInput}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {availableTags.length > 0 && (
              <div>
                <Label className="text-sm text-muted-foreground">Suggested Tags</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {availableTags
                    .filter(tag => !selectedTags.includes(tag) && tag.toLowerCase().includes(tagInput.toLowerCase()))
                    .slice(0, 10)
                    .map((tag) => (
                      <Button
                        key={tag}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => addTag(tag)}
                      >
                        {tag}
                      </Button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Custom Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Custom Fields</h3>
            
            <div className="space-y-2">
              {Object.entries(customFields).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 p-2 border rounded">
                  <div className="flex-1">
                    <span className="font-medium">{key}:</span> {value}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCustomField(key)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Field name"
                value={customFieldKey}
                onChange={(e) => setCustomFieldKey(e.target.value)}
              />
              <Input
                placeholder="Field value"
                value={customFieldValue}
                onChange={(e) => setCustomFieldValue(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addCustomField}
                disabled={!customFieldKey || !customFieldValue}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              {...register("isActive")}
              defaultChecked={contact?.isActive ?? true}
            />
            <Label htmlFor="isActive">Active Contact</Label>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : contact ? "Update Contact" : "Create Contact"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
