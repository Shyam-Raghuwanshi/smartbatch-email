"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Papa from "papaparse";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileText, Download, AlertCircle, CheckCircle, XCircle, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface ParsedContact {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  position?: string;
  tags?: string[];
}

interface ImportResult {
  successful: number;
  failed: number;
  duplicatesSkipped: number;
  errors: string[];
}

interface ContactImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper function to automatically map columns based on common header names
function autoMapColumns(columns: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  const fieldMappings = {
    email: ["email", "e-mail", "email address", "mail", "emailaddress"],
    firstName: ["first name", "firstname", "first_name", "fname", "given name"],
    lastName: ["last name", "lastname", "last_name", "lname", "surname", "family name"],
    phone: ["phone", "phone number", "phonenumber", "phone_number", "tel", "telephone", "mobile"],
    company: ["company", "organization", "org", "business", "employer"],
    position: ["position", "title", "job title", "jobtitle", "job_title", "role"],
    tags: ["tags", "categories", "labels", "groups"]
  };
  
  columns.forEach(column => {
    const normalizedColumn = column.toLowerCase().trim();
    
    Object.entries(fieldMappings).forEach(([field, variants]) => {
      if (variants.includes(normalizedColumn)) {
        mapping[field] = column;
      }
    });
  });
  
  return mapping;
}

export function ContactImportModal({ open, onOpenChange }: ContactImportModalProps) {
  const [activeTab, setActiveTab] = useState("csv");
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [step, setStep] = useState<"upload" | "mapping" | "preview" | "importing" | "result">("upload");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const importContacts = useMutation(api.contacts_enhanced.importContacts);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    onDrop: handleFileUpload,
    multiple: false,
  });

  function handleFileUpload(files: File[]) {
    const file = files[0];
    if (!file) return;

    // Reset any previous errors
    setUploadError(null);

    // Validate file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setUploadError("File size too large. Please upload a file smaller than 10MB.");
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(), // Clean up headers
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          console.error("CSV parsing errors:", results.errors);
          const criticalErrors = results.errors.filter(error => error.type === "Delimiter");
          if (criticalErrors.length > 0) {
            setUploadError("Invalid CSV format. Please ensure your file is properly formatted with comma separators.");
            return;
          }
        }
        
        // Filter out empty rows and ensure we have valid data
        const validData = results.data.filter((row: any) => {
          // Check if row has at least one non-empty value
          return Object.values(row).some(value => value && String(value).trim() !== '');
        }) as Record<string, string>[];
        
        if (validData.length === 0) {
          setUploadError("No valid data found in the CSV file. Please ensure your file contains data rows with headers.");
          return;
        }

        setCsvData(validData);
        
        // Auto-map columns based on common header names
        if (validData.length > 0) {
          const autoMapping = autoMapColumns(Object.keys(validData[0]));
          setColumnMapping(autoMapping);
        }
        
        setStep("mapping");
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        setUploadError(`Failed to parse CSV file: ${error.message}`);
      },
    });
  }

  const availableColumns = csvData.length > 0 ? Object.keys(csvData[0]).filter(column => column && column.trim() !== '') : [];
  const contactFields = [
    { key: "email", label: "Email", required: true },
    { key: "firstName", label: "First Name", required: false },
    { key: "lastName", label: "Last Name", required: false },
    { key: "phone", label: "Phone", required: false },
    { key: "company", label: "Company", required: false },
    { key: "position", label: "Position", required: false },
    { key: "tags", label: "Tags", required: false },
  ];

  const handleColumnMapping = (field: string, column: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: column,
    }));
  };

  const generatePreview = () => {
    if (!columnMapping.email) {
      return;
    }

    const contacts: ParsedContact[] = csvData.map(row => {
      const contact: ParsedContact = {
        email: row[columnMapping.email],
      };

      if (columnMapping.firstName) contact.firstName = row[columnMapping.firstName];
      if (columnMapping.lastName) contact.lastName = row[columnMapping.lastName];
      if (columnMapping.phone) contact.phone = row[columnMapping.phone];
      if (columnMapping.company) contact.company = row[columnMapping.company];
      if (columnMapping.position) contact.position = row[columnMapping.position];
      if (columnMapping.tags) {
        const tagsString = row[columnMapping.tags];
        contact.tags = tagsString ? tagsString.split(",").map((tag: string) => tag.trim()) : [];
      }

      return contact;
    }).filter(contact => contact.email && contact.email.includes("@"));

    setParsedContacts(contacts);
    setStep("preview");
  };

  const handleImport = async () => {
    if (parsedContacts.length === 0) return;

    setImporting(true);
    setStep("importing");

    try {
      const result = await importContacts({
        contacts: parsedContacts,
        fileName: "CSV Import",
        skipDuplicates,
      });

      setImportResult(result);
      setStep("result");
    } catch (error) {
      console.error("Import failed:", error);
    } finally {
      setImporting(false);
    }
  };

  const resetImport = () => {
    setCsvData([]);
    setParsedContacts([]);
    setColumnMapping({});
    setImportResult(null);
    setUploadError(null);
    setStep("upload");
  };

  const handleClose = () => {
    resetImport();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Contacts</DialogTitle>
          <DialogDescription>
            Import contacts from CSV files or integrate with external sources
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="csv">CSV Upload</TabsTrigger>
            <TabsTrigger value="google">Google Sheets</TabsTrigger>
            <TabsTrigger value="api">API Integration</TabsTrigger>
          </TabsList>

          <TabsContent value="csv" className="space-y-4">
            {step === "upload" && (
              <Card>
                <CardHeader>
                  <CardTitle>Upload CSV File</CardTitle>
                  <CardDescription>
                    Select a CSV file containing your contacts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    {...getRootProps()}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                      isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                    )}
                  >
                    <input {...getInputProps()} />
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">
                      {isDragActive ? "Drop the file here" : "Drag & drop a CSV file here"}
                    </p>
                    <p className="text-muted-foreground mb-4">
                      or click to select a file
                    </p>
                    <Button variant="outline">
                      <FileText className="mr-2 h-4 w-4" />
                      Browse Files
                    </Button>
                  </div>

                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Supported formats:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• CSV files (.csv)</li>
                      <li>• Excel files (.xls, .xlsx)</li>
                      <li>• Headers in the first row</li>
                    </ul>
                  </div>

                  {uploadError && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-red-800">Upload Error</h4>
                          <p className="text-sm text-red-700 mt-1">{uploadError}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {step === "mapping" && (
              <Card>
                <CardHeader>
                  <CardTitle>Map Columns</CardTitle>
                  <CardDescription>
                    Match your CSV columns to contact fields
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {availableColumns.length === 0 ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        No columns detected in your CSV file. Please ensure your CSV file has:
                      </p>
                      <ul className="text-sm text-yellow-800 mt-2 list-disc list-inside">
                        <li>Headers in the first row</li>
                        <li>At least one data row</li>
                        <li>Proper CSV formatting</li>
                      </ul>
                      <Button 
                        variant="outline" 
                        onClick={() => setStep("upload")} 
                        className="mt-3"
                      >
                        Upload Different File
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          Found {availableColumns.length} columns: {availableColumns.join(", ")}
                        </p>
                        <p className="text-sm text-blue-800 mt-1">
                          {csvData.length} rows of data detected
                        </p>
                        {Object.keys(columnMapping).length > 0 && (
                          <p className="text-sm text-blue-800 mt-1">
                            ✓ Auto-mapped {Object.keys(columnMapping).length} field{Object.keys(columnMapping).length !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2 mb-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const autoMapping = autoMapColumns(availableColumns);
                            setColumnMapping(autoMapping);
                          }}
                        >
                          Auto-Map Columns
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setColumnMapping({})}
                        >
                          Clear All Mappings
                        </Button>
                      </div>
                      
                      {contactFields.map((field) => (
                        <div key={field.key} className="flex items-center gap-4">
                          <Label className="w-24 font-medium">
                            {field.label}
                            {field.required && <span className="text-destructive">*</span>}
                          </Label>
                          <div className="flex-1 relative">
                            <select
                              className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
                              value={columnMapping[field.key] || ""}
                              onChange={(e) => handleColumnMapping(field.key, e.target.value)}
                            >
                              <option value="">Select column...</option>
                              {availableColumns.map((column) => (
                                <option key={column} value={column}>
                                  {column}
                                </option>
                              ))}
                            </select>
                            {columnMapping[field.key] && (
                              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {csvData.length > 0 && (
                        <div className="mt-6">
                          <h4 className="font-medium mb-3">Sample Data Preview</h4>
                          <div className="border rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  {contactFields.filter(field => columnMapping[field.key]).map((field) => (
                                    <TableHead key={field.key} className="text-xs">
                                      {field.label}
                                      <div className="text-xs text-muted-foreground">
                                        ({columnMapping[field.key]})
                                      </div>
                                    </TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {csvData.slice(0, 3).map((row, index) => (
                                  <TableRow key={index}>
                                    {contactFields.filter(field => columnMapping[field.key]).map((field) => (
                                      <TableCell key={field.key} className="text-xs max-w-32 truncate">
                                        {row[columnMapping[field.key]] || "—"}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Showing first 3 rows with mapped columns
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex items-center space-x-2 pt-4">
                    <Checkbox
                      id="skipDuplicates"
                      checked={skipDuplicates}
                      onCheckedChange={(checked) => setSkipDuplicates(checked === true)}
                    />
                    <Label htmlFor="skipDuplicates">
                      Skip duplicate email addresses
                    </Label>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => setStep("upload")}>
                      Back
                    </Button>
                    <Button 
                      onClick={generatePreview}
                      disabled={!columnMapping.email || availableColumns.length === 0}
                    >
                      Preview Import
                    </Button>
                    {!columnMapping.email && availableColumns.length > 0 && (
                      <p className="text-sm text-muted-foreground self-center ml-2">
                        Please map the Email field to continue
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {step === "preview" && (
              <Card>
                <CardHeader>
                  <CardTitle>Preview Contacts</CardTitle>
                  <CardDescription>
                    Review {parsedContacts.length} contacts before importing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Tags</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedContacts.slice(0, 10).map((contact, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{contact.email}</TableCell>
                            <TableCell>
                              {[contact.firstName, contact.lastName].filter(Boolean).join(" ") || "—"}
                            </TableCell>
                            <TableCell>{contact.company || "—"}</TableCell>
                            <TableCell>
                              {contact.tags && contact.tags.length > 0 ? (
                                <div className="flex gap-1">
                                  {contact.tags.slice(0, 2).map((tag, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {contact.tags.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{contact.tags.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              ) : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {parsedContacts.length > 10 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Showing first 10 of {parsedContacts.length} contacts
                    </p>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => setStep("mapping")}>
                      Back
                    </Button>
                    <Button onClick={handleImport}>
                      Import {parsedContacts.length} Contacts
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === "importing" && (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Importing Contacts</h3>
                  <p className="text-muted-foreground">
                    Please wait while we process your contacts...
                  </p>
                </CardContent>
              </Card>
            )}

            {step === "result" && importResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {importResult.failed === 0 ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    )}
                    Import Complete
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {importResult.successful}
                      </div>
                      <div className="text-sm text-green-600">Imported</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {importResult.duplicatesSkipped}
                      </div>
                      <div className="text-sm text-yellow-600">Skipped</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {importResult.failed}
                      </div>
                      <div className="text-sm text-red-600">Failed</div>
                    </div>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Errors:</h4>
                      <div className="max-h-32 overflow-y-auto text-sm text-muted-foreground">
                        {importResult.errors.map((error, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={handleClose}>
                      Done
                    </Button>
                    <Button variant="outline" onClick={resetImport}>
                      Import More
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="google" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Google Sheets Integration
                </CardTitle>
                <CardDescription>
                  Connect your Google Sheets to import contacts directly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Google Sheets integration coming soon
                  </p>
                  <Button disabled>
                    Connect Google Sheets
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API Integration</CardTitle>
                <CardDescription>
                  Use our API to import contacts programmatically
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>API Endpoint</Label>
                    <Input
                      value="https://api.smartbatch.com/v1/contacts/import"
                      readOnly
                      className="font-mono text-sm"
                    />
                  </div>
                  <div>
                    <Label>API Key</Label>
                    <Input
                      value="sk_test_123456789"
                      readOnly
                      type="password"
                      className="font-mono text-sm"
                    />
                  </div>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download API Documentation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
