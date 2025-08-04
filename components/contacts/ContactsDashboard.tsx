"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useConvexAuth, AuthLoading, Authenticated, Unauthenticated } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Upload, Download, Plus, UserPlus, Tags, Building, Trash2, MoreHorizontal } from "lucide-react";
import { ContactFormModal } from "./ContactFormModal";
import { ContactProfileModal } from "./ContactProfileModal";
import { BulkActionsBar } from "./BulkActionsBar";
import { ContactsTable } from "./ContactsTable";
import { ContactFilters } from "./ContactFilters";
import { ContactStats } from "./ContactStats";
import { LoadingCard, TableLoadingSkeleton } from "@/components/ui/loading";
import Link from "next/link";

export function ContactsDashboard() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [selectedContacts, setSelectedContacts] = useState<Id<"contacts">[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showEditContactModal, setShowEditContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(25);

  // Queries
  const contactsData = useQuery(api.contacts_enhanced.getContacts, {
    search: searchTerm || undefined,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    companies: selectedCompanies.length > 0 ? selectedCompanies : undefined,
    isActive: activeFilter,
    limit: pageSize,
    offset: currentPage * pageSize,
  });

  const tags = useQuery(api.contacts_enhanced.getTags);
  const companies = useQuery(api.contacts_enhanced.getCompanies);
  const stats = useQuery(api.contacts_enhanced.getContactStats);

  // Mutations
  const deleteContacts = useMutation(api.contacts_enhanced.deleteContacts);
  const bulkUpdateTags = useMutation(api.contacts_enhanced.bulkUpdateTags);

  const contacts = contactsData?.contacts || [];
  const totalContacts = contactsData?.total || 0;
  const hasMore = contactsData?.hasMore || false;

  const handleSelectContact = useCallback((contactId: Id<"contacts">, selected: boolean) => {
    setSelectedContacts(prev =>
      selected
        ? [...prev, contactId]
        : prev.filter(id => id !== contactId)
    );
  }, []);

  const handleSelectAll = useCallback((selected: boolean) => {
    setSelectedContacts(selected ? contacts.map((c: any) => c._id) : []);
  }, [contacts]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedContacts.length > 0) {
      await deleteContacts({ contactIds: selectedContacts });
      setSelectedContacts([]);
    }
  }, [selectedContacts, deleteContacts]);

  const handleBulkTagUpdate = useCallback(async (tagsToAdd: string[], tagsToRemove: string[]) => {
    if (selectedContacts.length > 0) {
      await bulkUpdateTags({
        contactIds: selectedContacts,
        tagsToAdd: tagsToAdd.length > 0 ? tagsToAdd : undefined,
        tagsToRemove: tagsToRemove.length > 0 ? tagsToRemove : undefined,
      });
      setSelectedContacts([]);
    }
  }, [selectedContacts, bulkUpdateTags]);

  const handleExportContacts = useCallback(() => {
    const contactsToExport = selectedContacts.length > 0
      ? contacts.filter((c: any) => selectedContacts.includes(c._id))
      : contacts;

    const csvData = [
      ["Email", "First Name", "Last Name", "Phone", "Company", "Position", "Tags", "Status", "Created At"],
      ...contactsToExport.map((contact: any) => [
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

    const csvContent = csvData.map(row => row.map((field: any) => `"${field}"`).join(",")).join("\\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [contacts, selectedContacts]);

  const handleEditContact = useCallback((contact: any) => {
    setEditingContact(contact);
    setShowEditContactModal(true);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedTags([]);
    setSelectedCompanies([]);
    setActiveFilter(undefined);
  }, []);

  // Show loading while auth is being determined
  if (isLoading) {
    return (
      <AuthLoading>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
              <p className="mt-1 text-sm text-gray-600">Loading...</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <LoadingCard key={i} />
            ))}
          </div>
          <div className="mt-6">
            <TableLoadingSkeleton />
          </div>
        </div>
      </AuthLoading>
    );
  }

  return (
    <>
      <Unauthenticated>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
              <p className="mt-1 text-sm text-gray-600">Please sign in to continue</p>
            </div>
          </div>
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-600">
                You need to be signed in to view your contacts.
              </p>
            </CardContent>
          </Card>
        </div>
      </Unauthenticated>

      <Authenticated>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
              <p className="text-muted-foreground">
                Manage your contact database and segments
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/integrations">
                <Button variant="outline">
                  <Download className="h-4 w-4" />
                  Import
                </Button>
              </Link>
              <Button onClick={handleExportContacts} variant="outline">
                <Upload className="h-4 w-4" />
                Export
              </Button>
              <Button onClick={() => setShowAddContactModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && <ContactStats stats={stats} />}

          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search contacts by name, email, or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Quick Filters */}
                <div className="flex gap-2">
                  <Select value={activeFilter?.toString() || "all"} onValueChange={(value) =>
                    setActiveFilter(value === "all" ? undefined : value === "true")
                  }>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant={showFilters ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </Button>

                  {(searchTerm || selectedTags.length > 0 || selectedCompanies.length > 0 || activeFilter !== undefined) && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <ContactFilters
                  selectedTags={selectedTags}
                  selectedCompanies={selectedCompanies}
                  availableTags={tags || []}
                  availableCompanies={companies || []}
                  onTagsChange={setSelectedTags}
                  onCompaniesChange={setSelectedCompanies}
                />
              )}
            </CardContent>
          </Card>

          {/* Bulk Actions Bar */}
          {selectedContacts.length > 0 && (
            <BulkActionsBar
              selectedCount={selectedContacts.length}
              onDelete={handleBulkDelete}
              onTagUpdate={handleBulkTagUpdate}
              onExport={handleExportContacts}
              availableTags={tags || []}
            />
          )}

          {/* Contacts Table */}
          <ContactsTable
            contacts={contacts}
            selectedContacts={selectedContacts}
            onSelectContact={handleSelectContact}
            onSelectAll={handleSelectAll}
            onContactClick={setSelectedContact}
            onEditContact={handleEditContact}
            loading={contactsData === undefined}
          />

          {/* Pagination */}
          {totalContacts > pageSize && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalContacts)} of {totalContacts} contacts
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={!hasMore}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          <ContactFormModal
            open={showAddContactModal}
            onOpenChange={setShowAddContactModal}
          />

          <ContactFormModal
            open={showEditContactModal}
            onOpenChange={(open) => {
              setShowEditContactModal(open);
              if (!open) {
                setEditingContact(null);
              }
            }}
            contact={editingContact}
          />

          {selectedContact && (
            <ContactProfileModal
              contact={selectedContact}
              open={!!selectedContact}
              onOpenChange={(open: boolean) => !open && setSelectedContact(null)}
            />
          )}
        </div>
      </Authenticated>
    </>
  );
}
