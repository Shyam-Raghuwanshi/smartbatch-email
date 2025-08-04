"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface ApiDocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiDocumentationModal({ isOpen, onClose }: ApiDocumentationModalProps) {
  const [activeTab, setActiveTab] = useState("nextjs");

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Code copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy code");
    }
  };

  const downloadAsFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  const nextjsExample = `// pages/api/import-contacts.js (Pages Router)
// or app/api/import-contacts/route.js (App Router)

export async function POST() {
  try {
    const contacts = [
      {
        email: "user@example.com",
        firstName: "John",
        lastName: "Doe",
        phone: "+1234567890",
        company: "Acme Corp",
        position: "Developer",
        tags: ["lead", "premium"]
      },
      {
        email: "jane@example.com",
        firstName: "Jane",
        lastName: "Smith",
        phone: "+0987654321",
        company: "Tech Corp",
        position: "Designer",
        tags: ["client", "vip"]
      }
    ];

    const response = await fetch('YOUR_SMARTBATCH_API_ENDPOINT', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'your_api_key_here', // or use Authorization: Bearer your_api_key_here
      },
      body: JSON.stringify({ contacts }),
    });

    if (!response.ok) {
      throw new Error(\`API call failed: \${response.statusText}\`);
    }

    const result = await response.json();
    
    return Response.json({
      success: true,
      imported: result.contacts?.length || 0,
      message: 'Contacts imported successfully'
    });

  } catch (error) {
    console.error('Import error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Client-side usage (React component)
const ImportContacts = () => {
  const handleImport = async () => {
    try {
      const response = await fetch('/api/import-contacts', {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log(\`Successfully imported \${result.imported} contacts\`);
      } else {
        console.error('Import failed:', result.error);
      }
    } catch (error) {
      console.error('Network error:', error);
    }
  };

  return (
    <button onClick={handleImport}>
      Import Contacts
    </button>
  );
};`;

  const nodejsExample = `// Node.js with Express
const express = require('express');
const fetch = require('node-fetch'); // or use built-in fetch in Node.js 18+
const app = express();

app.use(express.json());

// Import contacts endpoint
app.post('/import-contacts', async (req, res) => {
  try {
    const contacts = [
      {
        email: "user@example.com",
        firstName: "John",
        lastName: "Doe",
        phone: "+1234567890",
        company: "Acme Corp",
        position: "Developer",
        tags: ["lead", "premium"]
      },
      {
        email: "jane@example.com",
        firstName: "Jane",
        lastName: "Smith",
        phone: "+0987654321",
        company: "Tech Corp",
        position: "Designer",
        tags: ["client", "vip"]
      }
    ];

    const response = await fetch('YOUR_SMARTBATCH_API_ENDPOINT', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'your_api_key_here', // or use Authorization: Bearer your_api_key_here
      },
      body: JSON.stringify({ contacts }),
    });

    if (!response.ok) {
      throw new Error(\`API call failed: \${response.statusText}\`);
    }

    const result = await response.json();
    
    res.json({
      success: true,
      imported: result.contacts?.length || 0,
      message: 'Contacts imported successfully'
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Alternative: Direct function for importing contacts
async function importContactsToSmartBatch(contacts, apiKey) {
  try {
    const response = await fetch('YOUR_SMARTBATCH_API_ENDPOINT', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ contacts }),
    });

    if (!response.ok) {
      throw new Error(\`API call failed: \${response.statusText}\`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to import contacts:', error);
    throw error;
  }
}

// Usage example
(async () => {
  try {
    const contacts = [
      {
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        company: "Test Company"
      }
    ];
    
    const result = await importContactsToSmartBatch(contacts, 'your_api_key_here');
    console.log('Import successful:', result);
  } catch (error) {
    console.error('Import failed:', error);
  }
})();

app.listen(3000, () => {
  console.log('Server running on port 3000');
});`;

  const apiReference = `# SmartBatch API Reference

## Base URL
\`\`\`
YOUR_SMARTBATCH_API_ENDPOINT
\`\`\`

## Authentication
Include your API key in one of the following ways:

### Option 1: x-api-key header
\`\`\`
x-api-key: your_api_key_here
\`\`\`

### Option 2: Authorization Bearer token
\`\`\`
Authorization: Bearer your_api_key_here
\`\`\`

## Endpoints

### Import Contacts
**POST** \`/contacts/import\`

Import multiple contacts into your SmartBatch account.

#### Request Headers
\`\`\`
Content-Type: application/json
x-api-key: your_api_key_here
\`\`\`

#### Request Body
\`\`\`json
{
  "contacts": [
    {
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "company": "Acme Corp",
      "position": "Developer",
      "tags": ["lead", "premium"]
    }
  ]
}
\`\`\`

#### Response Format
\`\`\`json
{
  "contacts": [
    {
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "company": "Acme Corp",
      "position": "Developer",
      "tags": ["lead", "premium"]
    }
  ]
}
\`\`\`

## Contact Object Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Contact's email address (unique identifier) |
| firstName | string | No | Contact's first name |
| lastName | string | No | Contact's last name |
| phone | string | No | Contact's phone number |
| company | string | No | Contact's company name |
| position | string | No | Contact's job position/title |
| tags | array | No | Array of string tags for categorization |

## Error Responses

### 401 Unauthorized
\`\`\`json
{
  "error": "API key is required. Provide it via x-api-key header or Authorization Bearer token."
}
\`\`\`

### 401 Invalid API Key
\`\`\`json
{
  "error": "Unauthorized"
}
\`\`\`

### 500 Internal Server Error
\`\`\`json
{
  "error": "Internal server error"
}
\`\`\`

## Rate Limits
- Maximum 100 contacts per request
- Rate limit: 60 requests per minute
- Contact us for higher limits if needed

## CORS Support
The API supports CORS with the following headers:
- Access-Control-Allow-Origin: *
- Access-Control-Allow-Methods: GET, POST, OPTIONS
- Access-Control-Allow-Headers: Content-Type, Authorization, x-api-key`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            SmartBatch API Documentation
          </DialogTitle>
          <DialogDescription>
            Complete guide and code examples for integrating with the SmartBatch API
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="nextjs">Next.js Integration</TabsTrigger>
            <TabsTrigger value="nodejs">Node.js Integration</TabsTrigger>
            <TabsTrigger value="reference">API Reference</TabsTrigger>
          </TabsList>

          <TabsContent value="nextjs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Next.js Integration Example
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(nextjsExample)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadAsFile(nextjsExample, "nextjs-smartbatch-integration.js")}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  Complete example for integrating SmartBatch API with Next.js (supports both App Router and Pages Router)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex gap-2">
                  <Badge variant="secondary">App Router</Badge>
                  <Badge variant="secondary">Pages Router</Badge>
                  <Badge variant="secondary">React</Badge>
                </div>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{nextjsExample}</code>
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nodejs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Node.js Integration Example
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(nodejsExample)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadAsFile(nodejsExample, "nodejs-smartbatch-integration.js")}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  Complete example for integrating SmartBatch API with Node.js and Express
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex gap-2">
                  <Badge variant="secondary">Express.js</Badge>
                  <Badge variant="secondary">Node.js</Badge>
                  <Badge variant="secondary">REST API</Badge>
                </div>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{nodejsExample}</code>
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reference" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  API Reference Documentation
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(apiReference)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadAsFile(apiReference, "smartbatch-api-reference.md")}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  Complete API reference with endpoints, authentication, and response formats
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex gap-2">
                  <Badge variant="secondary">REST API</Badge>
                  <Badge variant="secondary">Authentication</Badge>
                  <Badge variant="secondary">Documentation</Badge>
                </div>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
                  <code>{apiReference}</code>
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={() => downloadAsFile(
              `${nextjsExample}\n\n${nodejsExample}\n\n${apiReference}`,
              "smartbatch-complete-integration-guide.txt"
            )}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Complete Guide
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
