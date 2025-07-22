"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  BookOpen,
  Code2,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Globe,
  Key,
  Play,
  Smartphone,
  Terminal
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

interface ApiEndpoint {
  method: string;
  path: string;
  summary: string;
  description: string;
  parameters?: any[];
  requestBody?: any;
  responses: any;
  examples?: any;
}

export function ApiDocumentationGenerator() {
  const [selectedFormat, setSelectedFormat] = useState<string>("openapi");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("javascript");
  const [testEndpoint, setTestEndpoint] = useState<string>("");
  const [testApiKey, setTestApiKey] = useState<string>("");

  const apiKeys = useQuery(api.apiKeys.list);
  const generateDocs = useMutation(api.integrations.generateApiDocs);

  const apiEndpoints: ApiEndpoint[] = [
    {
      method: "GET",
      path: "/api/v1/contacts",
      summary: "List contacts",
      description: "Retrieve a list of all contacts with optional filtering and pagination",
      parameters: [
        { name: "page", in: "query", type: "integer", description: "Page number for pagination" },
        { name: "limit", in: "query", type: "integer", description: "Number of items per page" },
        { name: "search", in: "query", type: "string", description: "Search contacts by email or name" },
        { name: "tags", in: "query", type: "string", description: "Filter by tags (comma-separated)" },
      ],
      responses: {
        200: {
          description: "Successful response",
          schema: {
            type: "object",
            properties: {
              contacts: { type: "array", items: { $ref: "#/definitions/Contact" } },
              pagination: { $ref: "#/definitions/Pagination" },
            },
          },
        },
      },
      examples: {
        javascript: `const response = await fetch('/api/v1/contacts?page=1&limit=20', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});
const data = await response.json();`,
        python: `import requests

response = requests.get(
    'https://api.smartbatch.com/v1/contacts',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
    },
    params={'page': 1, 'limit': 20}
)
data = response.json()`,
        curl: `curl -X GET "https://api.smartbatch.com/v1/contacts?page=1&limit=20" \\
     -H "Authorization: Bearer YOUR_API_KEY" \\
     -H "Content-Type: application/json"`
      },
    },
    {
      method: "POST",
      path: "/api/v1/contacts",
      summary: "Create contact",
      description: "Create a new contact in your account",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/definitions/ContactCreate" },
          },
        },
      },
      responses: {
        201: {
          description: "Contact created successfully",
          schema: { $ref: "#/definitions/Contact" },
        },
        400: {
          description: "Bad request - validation errors",
        },
      },
      examples: {
        javascript: `const response = await fetch('/api/v1/contacts', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    company: 'Acme Corp',
    tags: ['lead', 'marketing']
  })
});
const contact = await response.json();`,
        python: `import requests

response = requests.post(
    'https://api.smartbatch.com/v1/contacts',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
    },
    json={
        'email': 'john@example.com',
        'firstName': 'John',
        'lastName': 'Doe',
        'company': 'Acme Corp',
        'tags': ['lead', 'marketing']
    }
)
contact = response.json()`,
        curl: `curl -X POST "https://api.smartbatch.com/v1/contacts" \\
     -H "Authorization: Bearer YOUR_API_KEY" \\
     -H "Content-Type: application/json" \\
     -d '{
       "email": "john@example.com",
       "firstName": "John",
       "lastName": "Doe",
       "company": "Acme Corp",
       "tags": ["lead", "marketing"]
     }'`
      },
    },
    {
      method: "GET",
      path: "/api/v1/campaigns",
      summary: "List campaigns",
      description: "Retrieve a list of all email campaigns",
      parameters: [
        { name: "status", in: "query", type: "string", description: "Filter by campaign status" },
        { name: "page", in: "query", type: "integer", description: "Page number for pagination" },
      ],
      responses: {
        200: {
          description: "Successful response",
          schema: {
            type: "object",
            properties: {
              campaigns: { type: "array", items: { $ref: "#/definitions/Campaign" } },
              pagination: { $ref: "#/definitions/Pagination" },
            },
          },
        },
      },
    },
    {
      method: "POST",
      path: "/api/v1/campaigns",
      summary: "Create campaign",
      description: "Create a new email campaign",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/definitions/CampaignCreate" },
          },
        },
      },
      responses: {
        201: {
          description: "Campaign created successfully",
          schema: { $ref: "#/definitions/Campaign" },
        },
      },
    },
    {
      method: "POST",
      path: "/api/v1/campaigns/{id}/send",
      summary: "Send campaign",
      description: "Send an email campaign to its target audience",
      parameters: [
        { name: "id", in: "path", type: "string", required: true, description: "Campaign ID" },
      ],
      responses: {
        200: {
          description: "Campaign sent successfully",
        },
      },
    },
  ];

  const handleGenerateDocs = async () => {
    try {
      const docs = await generateDocs({ format: selectedFormat });
      
      // Create and download the documentation file
      const blob = new Blob([JSON.stringify(docs, null, 2)], { 
        type: selectedFormat === "openapi" ? "application/json" : "text/plain" 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `smartbatch-api-docs.${selectedFormat === "openapi" ? "json" : "md"}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("API documentation generated and downloaded");
    } catch (error) {
      toast.error("Failed to generate documentation");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Code copied to clipboard");
  };

  const testApiCall = async () => {
    if (!testEndpoint || !testApiKey) {
      toast.error("Please provide both endpoint and API key");
      return;
    }

    try {
      const response = await fetch(`https://api.smartbatch.com${testEndpoint}`, {
        headers: {
          "Authorization": `Bearer ${testApiKey}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      toast.success(`API call successful: ${response.status}`);
      console.log("API Response:", data);
    } catch (error) {
      toast.error("API call failed");
      console.error("API Error:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Documentation</h2>
          <p className="text-muted-foreground">
            Comprehensive API documentation and code examples
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedFormat} onValueChange={setSelectedFormat}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openapi">OpenAPI</SelectItem>
              <SelectItem value="markdown">Markdown</SelectItem>
              <SelectItem value="postman">Postman</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleGenerateDocs}>
            <Download className="h-4 w-4 mr-2" />
            Export Docs
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="examples">Code Examples</TabsTrigger>
          <TabsTrigger value="testing">API Testing</TabsTrigger>
          <TabsTrigger value="sdks">SDKs & Libraries</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ApiOverview />
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-4">
          <ApiEndpointsList endpoints={apiEndpoints} />
        </TabsContent>

        <TabsContent value="examples" className="space-y-4">
          <div className="flex items-center space-x-4 mb-4">
            <Label>Language:</Label>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="curl">cURL</SelectItem>
                <SelectItem value="php">PHP</SelectItem>
                <SelectItem value="ruby">Ruby</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <CodeExamples endpoints={apiEndpoints} language={selectedLanguage} />
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <ApiTesting 
            onTest={testApiCall}
            testEndpoint={testEndpoint}
            setTestEndpoint={setTestEndpoint}
            testApiKey={testApiKey}
            setTestApiKey={setTestApiKey}
            apiKeys={apiKeys || []}
          />
        </TabsContent>

        <TabsContent value="sdks" className="space-y-4">
          <SdkDocumentation />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ApiOverview() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>SmartBatch Email API</span>
          </CardTitle>
          <CardDescription>
            RESTful API for managing contacts, campaigns, and email automation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <h3 className="font-semibold">Base URL</h3>
              <code className="text-sm bg-muted px-2 py-1 rounded">
                https://api.smartbatch.com/v1
              </code>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h3 className="font-semibold">Authentication</h3>
              <p className="text-sm text-muted-foreground">Bearer Token (API Key)</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h3 className="font-semibold">Format</h3>
              <p className="text-sm text-muted-foreground">JSON</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Quick Start</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Generate an API key from the API Keys section</li>
              <li>Include the API key in the Authorization header</li>
              <li>Make requests to the API endpoints</li>
              <li>Handle responses and errors appropriately</li>
            </ol>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Rate Limits</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Free Plan:</strong> 1,000 requests/hour
              </div>
              <div>
                <strong>Pro Plan:</strong> 10,000 requests/hour
              </div>
              <div>
                <strong>Enterprise:</strong> Custom limits
              </div>
              <div>
                <strong>Burst:</strong> 100 requests/minute
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Common Response Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Badge variant="default">200</Badge>
                <span>Success</span>
              </div>
              <div className="flex justify-between">
                <Badge variant="default">201</Badge>
                <span>Created</span>
              </div>
              <div className="flex justify-between">
                <Badge variant="secondary">400</Badge>
                <span>Bad Request</span>
              </div>
              <div className="flex justify-between">
                <Badge variant="secondary">401</Badge>
                <span>Unauthorized</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Badge variant="secondary">403</Badge>
                <span>Forbidden</span>
              </div>
              <div className="flex justify-between">
                <Badge variant="secondary">404</Badge>
                <span>Not Found</span>
              </div>
              <div className="flex justify-between">
                <Badge variant="destructive">429</Badge>
                <span>Rate Limited</span>
              </div>
              <div className="flex justify-between">
                <Badge variant="destructive">500</Badge>
                <span>Server Error</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ApiEndpointsList({ endpoints }: { endpoints: ApiEndpoint[] }) {
  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case "GET": return "bg-blue-100 text-blue-800";
      case "POST": return "bg-green-100 text-green-800";
      case "PUT": return "bg-yellow-100 text-yellow-800";
      case "DELETE": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      {endpoints.map((endpoint, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Badge className={getMethodColor(endpoint.method)}>
                {endpoint.method}
              </Badge>
              <code className="font-mono text-sm">{endpoint.path}</code>
            </div>
            <CardTitle className="text-lg">{endpoint.summary}</CardTitle>
            <CardDescription>{endpoint.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {endpoint.parameters && (
              <div>
                <h4 className="font-semibold mb-2">Parameters</h4>
                <div className="space-y-2">
                  {endpoint.parameters.map((param, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center space-x-2">
                        <code className="text-sm">{param.name}</code>
                        <Badge variant="outline">{param.type}</Badge>
                        {param.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                      </div>
                      <span className="text-sm text-muted-foreground">{param.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="font-semibold mb-2">Responses</h4>
              <div className="space-y-2">
                {Object.entries(endpoint.responses).map(([code, response]: [string, any]) => (
                  <div key={code} className="flex items-center justify-between p-2 bg-muted rounded">
                    <Badge className={parseInt(code) < 300 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {code}
                    </Badge>
                    <span className="text-sm">{response.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CodeExamples({ endpoints, language }: { endpoints: ApiEndpoint[]; language: string }) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Code copied to clipboard");
  };

  return (
    <div className="space-y-6">
      {endpoints
        .filter(endpoint => endpoint.examples && endpoint.examples[language])
        .map((endpoint, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Badge className="bg-blue-100 text-blue-800">
                    {endpoint.method}
                  </Badge>
                  <code className="font-mono text-sm">{endpoint.path}</code>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(endpoint.examples[language])}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
                <code>{endpoint.examples[language]}</code>
              </pre>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}

function ApiTesting({ 
  onTest, 
  testEndpoint, 
  setTestEndpoint, 
  testApiKey, 
  setTestApiKey, 
  apiKeys 
}: {
  onTest: () => void;
  testEndpoint: string;
  setTestEndpoint: (value: string) => void;
  testApiKey: string;
  setTestApiKey: (value: string) => void;
  apiKeys: any[];
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Play className="h-5 w-5" />
            <span>API Testing Console</span>
          </CardTitle>
          <CardDescription>
            Test API endpoints directly from the documentation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="test-endpoint">Endpoint</Label>
              <Select value={testEndpoint} onValueChange={setTestEndpoint}>
                <SelectTrigger>
                  <SelectValue placeholder="Select endpoint to test" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="/v1/contacts">GET /v1/contacts</SelectItem>
                  <SelectItem value="/v1/campaigns">GET /v1/campaigns</SelectItem>
                  <SelectItem value="/v1/templates">GET /v1/templates</SelectItem>
                  <SelectItem value="/v1/analytics/overview">GET /v1/analytics/overview</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="test-api-key">API Key</Label>
              <Select value={testApiKey} onValueChange={setTestApiKey}>
                <SelectTrigger>
                  <SelectValue placeholder="Select API key" />
                </SelectTrigger>
                <SelectContent>
                  {apiKeys.map((key) => (
                    <SelectItem key={key._id} value={key.key}>
                      {key.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={onTest} disabled={!testEndpoint || !testApiKey}>
            <Terminal className="h-4 w-4 mr-2" />
            Test API Call
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sample Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">List Contacts</h4>
            <pre className="bg-muted p-3 rounded text-sm overflow-auto">
{`curl -X GET "https://api.smartbatch.com/v1/contacts" \\
     -H "Authorization: Bearer YOUR_API_KEY" \\
     -H "Content-Type: application/json"`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Create Contact</h4>
            <pre className="bg-muted p-3 rounded text-sm overflow-auto">
{`curl -X POST "https://api.smartbatch.com/v1/contacts" \\
     -H "Authorization: Bearer YOUR_API_KEY" \\
     -H "Content-Type: application/json" \\
     -d '{
       "email": "john@example.com",
       "firstName": "John",
       "lastName": "Doe"
     }'`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SdkDocumentation() {
  const sdks = [
    {
      language: "JavaScript/Node.js",
      icon: <Code2 className="h-6 w-6" />,
      status: "Available",
      installation: "npm install @smartbatch/email-sdk",
      githubUrl: "https://github.com/smartbatch/email-sdk-js",
      examples: {
        init: `import { SmartBatchClient } from '@smartbatch/email-sdk';

const client = new SmartBatchClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.smartbatch.com/v1'
});`,
        usage: `// Create a contact
const contact = await client.contacts.create({
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe'
});

// Send a campaign
const campaign = await client.campaigns.send({
  templateId: 'template_123',
  segmentId: 'segment_456'
});`
      }
    },
    {
      language: "Python",
      icon: <Terminal className="h-6 w-6" />,
      status: "Available",
      installation: "pip install smartbatch-email",
      githubUrl: "https://github.com/smartbatch/email-sdk-python",
      examples: {
        init: `from smartbatch import SmartBatchClient

client = SmartBatchClient(
    api_key="your-api-key",
    base_url="https://api.smartbatch.com/v1"
)`,
        usage: `# Create a contact
contact = client.contacts.create(
    email="john@example.com",
    first_name="John",
    last_name="Doe"
)

# Send a campaign
campaign = client.campaigns.send(
    template_id="template_123",
    segment_id="segment_456"
)`
      }
    },
    {
      language: "PHP",
      icon: <Globe className="h-6 w-6" />,
      status: "Coming Soon",
      installation: "composer require smartbatch/email-sdk",
      githubUrl: "https://github.com/smartbatch/email-sdk-php",
    },
    {
      language: "Ruby",
      icon: <Smartphone className="h-6 w-6" />,
      status: "Coming Soon",
      installation: "gem install smartbatch-email",
      githubUrl: "https://github.com/smartbatch/email-sdk-ruby",
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Official SDKs & Libraries</CardTitle>
          <CardDescription>
            Use our official SDKs to integrate SmartBatch into your applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sdks.map((sdk, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {sdk.icon}
                      <h3 className="font-semibold">{sdk.language}</h3>
                    </div>
                    <Badge variant={sdk.status === "Available" ? "default" : "secondary"}>
                      {sdk.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Installation</Label>
                    <pre className="bg-muted p-2 rounded text-xs mt-1">
                      {sdk.installation}
                    </pre>
                  </div>

                  {sdk.examples && (
                    <>
                      <div>
                        <Label className="text-sm font-medium">Initialization</Label>
                        <pre className="bg-muted p-2 rounded text-xs mt-1">
                          {sdk.examples.init}
                        </pre>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Usage Example</Label>
                        <pre className="bg-muted p-2 rounded text-xs mt-1">
                          {sdk.examples.usage}
                        </pre>
                      </div>
                    </>
                  )}

                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={sdk.githubUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        GitHub
                      </a>
                    </Button>
                    {sdk.status === "Available" && (
                      <Button variant="outline" size="sm">
                        <FileText className="h-3 w-3 mr-1" />
                        Docs
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Community SDKs</CardTitle>
          <CardDescription>
            Community-maintained libraries and integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              Community SDKs coming soon. Want to contribute? 
              <a href="mailto:developers@smartbatch.com" className="text-blue-600 hover:underline ml-1">
                Get in touch
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
