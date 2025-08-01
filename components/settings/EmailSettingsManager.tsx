"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
      Mail,
      Plus,
      Settings,
      Eye,
      EyeOff,
      CheckCircle,
      XCircle,
      AlertTriangle,
      Trash2,
      Edit,
      Copy,
      TestTube,
      Loader2,
      MailWarning,
      Info
} from "lucide-react";
import { toast } from "sonner";

export function EmailSettingsManager() {
      const { isLoaded, isSignedIn } = useAuth();
      const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
      const [editingSettings, setEditingSettings] = useState<Id<"emailSettings"> | null>(null);
      const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
      const [fullApiKeys, setFullApiKeys] = useState<Record<string, string>>({});
      const [loadingApiKeys, setLoadingApiKeys] = useState<Record<string, boolean>>({});

      // Only run queries if user is authenticated and Clerk is loaded
      const emailSettings = useQuery(
            api.emailSettings.getUserEmailSettings,
            isLoaded && isSignedIn ? {} : "skip"
      );
      const defaultSettings = useQuery(
            api.emailSettings.getDefaultEmailSettings,
            isLoaded && isSignedIn ? {} : "skip"
      );

      const getFullApiKey = useAction(api.emailSettings.getFullApiKey);

      const toggleApiKeyVisibility = async (settingsId: string) => {
            const currentlyShowing = showApiKeys[settingsId] || false;
            
            // If we're about to show the API key and don't have it yet, fetch it
            if (!currentlyShowing && !fullApiKeys[settingsId]) {
                  // Set loading state
                  setLoadingApiKeys(prev => ({
                        ...prev,
                        [settingsId]: true
                  }));

                  try {
                        const result = await getFullApiKey({ emailSettingsId: settingsId as Id<"emailSettings"> });
                        setFullApiKeys(prev => ({
                              ...prev,
                              [settingsId]: result.apiKey
                        }));
                  } catch (error) {
                        console.error('Failed to get full API key:', error);
                        toast.error("Failed to load API key");
                        return;
                  } finally {
                        // Clear loading state
                        setLoadingApiKeys(prev => ({
                              ...prev,
                              [settingsId]: false
                        }));
                  }
            }

            setShowApiKeys(prev => ({
                  ...prev,
                  [settingsId]: !prev[settingsId]
            }));
      };

      // Show loading state while Clerk is loading
      if (!isLoaded) {
            return (
                  <div className="space-y-6">
                        <div className="flex items-center justify-center py-12">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        </div>
                  </div>
            );
      }

      // Show message if not authenticated
      if (!isSignedIn) {
            return (
                  <div className="space-y-6">
                        <Card>
                              <CardContent className="flex flex-col items-center justify-center py-12">
                                    <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
                                    <p className="text-muted-foreground text-center">
                                          Please sign in to manage email settings
                                    </p>
                              </CardContent>
                        </Card>
                  </div>
            );
      }

      return (
            <div className="space-y-6">
                  <div className="flex items-center justify-between">
                        <div>
                              <h2 className="text-2xl font-bold">Email Settings</h2>
                              <p className="text-muted-foreground">
                                    Configure your custom domains and email service providers
                              </p>
                        </div>
                        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                              <DialogTrigger asChild>
                                    <Button>
                                          <Plus className="h-4 w-4 mr-2" />
                                          Add Email Configuration
                                    </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                          <DialogTitle>Add Email Configuration</DialogTitle>
                                          <DialogDescription>
                                                Configure a new email service provider and custom domain
                                          </DialogDescription>
                                    </DialogHeader>
                                    <EmailSettingsForm
                                          onClose={() => setIsCreateModalOpen(false)}
                                    />
                              </DialogContent>
                        </Dialog>
                  </div>

                  {/* Quick Setup Guide */}
                  {!emailSettings || emailSettings.length === 0 ? (
                        <QuickSetupGuide />
                  ) : null}

                  {/* Email Settings List */}
                  {emailSettings && emailSettings.length > 0 ? (
                        <div className="space-y-4">
                              {emailSettings.map((setting) => (
                                    <EmailSettingsCard
                                          key={setting._id}
                                          setting={setting}
                                          isDefault={setting.isDefault}
                                          showApiKey={showApiKeys[setting._id] || false}
                                          fullApiKey={fullApiKeys[setting._id]}
                                          loadingApiKey={loadingApiKeys[setting._id] || false}
                                          onToggleApiKey={() => toggleApiKeyVisibility(setting._id)}
                                          onEdit={() => setEditingSettings(setting._id)}
                                    />
                              ))}
                        </div>
                  ) : (
                        <Card>
                              <CardContent className="flex flex-col items-center justify-center py-12">
                                    <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No email configurations</h3>
                                    <p className="text-muted-foreground text-center mb-4">
                                          Add your first email configuration to start sending from your custom domain
                                    </p>
                              </CardContent>
                        </Card>
                  )}

                  {/* Edit Modal */}
                  <Dialog open={!!editingSettings} onOpenChange={() => setEditingSettings(null)}>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                    <DialogTitle>Edit Email Configuration</DialogTitle>
                                    <DialogDescription>
                                          Update your email service provider settings
                                    </DialogDescription>
                              </DialogHeader>
                              {editingSettings && (
                                    <EmailSettingsForm
                                          settingsId={editingSettings}
                                          onClose={() => setEditingSettings(null)}
                                    />
                              )}
                        </DialogContent>
                  </Dialog>
            </div>
      );
}

function EmailSettingsCard({
      setting,
      isDefault,
      showApiKey,
      fullApiKey,
      loadingApiKey,
      onToggleApiKey,
      onEdit
}: {
      setting: any;
      isDefault: boolean;
      showApiKey: boolean;
      fullApiKey?: string;
      loadingApiKey: boolean;
      onToggleApiKey: () => void;
      onEdit: () => void;
}) {
      const [isTesting, setIsTesting] = useState(false);
      const [isVerifying, setIsVerifying] = useState(false);
      const [lastVerificationResult, setLastVerificationResult] = useState<any>(null);

      const testConfiguration = useAction(api.emailSettings.testEmailConfiguration);
      const verifyDomain = useAction(api.emailSettings.verifyDomainSettings);
      const deleteSettings = useMutation(api.emailSettings.deleteEmailSettings);

      const handleTest = async () => {
            setIsTesting(true);
            try {
                  const result = await testConfiguration({
                        emailSettingsId: setting._id,
                  });

                  if (result.success) {
                        toast.success(`Test email sent successfully to ${result.sentTo}!`);
                  } else {
                        toast.error(result.error || "Failed to send test email");
                  }
            } catch (error: any) {
                  toast.error(error.message || "Failed to send test email");
            }
            setIsTesting(false);
      };

      const handleVerifyDomain = async () => {
            setIsVerifying(true);
            try {
                  const result = await verifyDomain({
                        emailSettingsId: setting._id,
                  });

                  // Store the verification result for the tooltip
                  setLastVerificationResult(result);

                  const coreVerified = result.domainVerified && result.dkimSetup && result.spfSetup;
                  const hasApiLimitations = result.issues?.some(issue => 
                        issue.includes('ℹ️') || issue.includes('sending-only') || issue.includes('API limitations')
                  );
                  const realIssues = result.issues?.filter(issue => 
                        !issue.includes('ℹ️') && !issue.includes('sending-only') && !issue.includes('API limitations')
                  ) || [];

                  if (coreVerified) {
                        if (hasApiLimitations) {
                              toast.success("Domain verified successfully! Using sending-only API key with DNS verification.");
                        } else {
                              toast.success("Domain verification completed successfully!");
                        }
                  } else {
                        const issueCount = realIssues.length;
                        if (issueCount > 0) {
                              toast.warning(`Domain verification found ${issueCount} issue${issueCount !== 1 ? 's' : ''}. Hover over the status badge for details.`);
                        } else if (hasApiLimitations) {
                              toast.info("Domain verification completed with sending-only API key. Check status badge for details.");
                        } else {
                              toast.warning("Domain verification completed. Check status badge for details.");
                        }
                  }
            } catch (error: any) {
                  toast.error(error.message || "Failed to verify domain");
                  setLastVerificationResult(null);
            }
            setIsVerifying(false);
      };

      const handleDelete = async () => {
            if (confirm("Are you sure you want to delete this email configuration?")) {
                  try {
                        await deleteSettings({ id: setting._id });
                        toast.success("Email configuration deleted");
                  } catch (error: any) {
                        toast.error(error.message || "Failed to delete configuration");
                  }
            }
      };

      const copyToClipboard = (text: string) => {
            navigator.clipboard.writeText(text);
            toast.success("Copied to clipboard");
      };

      return (
            <Card>
                  <CardHeader>
                        <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                    <div className={`w-3 h-3 rounded-full ${setting.isActive ? "bg-green-500" : "bg-gray-400"
                                          }`} />
                                    <div>
                                          <CardTitle className="flex items-center gap-2">
                                                {setting.name}
                                                {isDefault && <Badge variant="default">Default</Badge>}
                                                <Badge variant="outline" className="capitalize">
                                                      Resend
                                                </Badge>
                                          </CardTitle>
                                          <CardDescription>
                                                {setting.configuration.domain} • {setting.configuration.defaultFromEmail}
                                          </CardDescription>
                                    </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                    <Button variant="ghost" size="sm" onClick={onEdit}>
                                          <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={handleDelete}>
                                          <Trash2 className="h-4 w-4" />
                                    </Button>
                              </div>
                        </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-3">
                                    <div>
                                          <Label className="text-sm font-medium">API Key</Label>
                                          <div className="flex items-center space-x-2 mt-1">
                                                <code className="bg-muted px-3 py-2 rounded text-sm font-mono flex-1">
                                                      {showApiKey ? (fullApiKey || setting.configuration.apiKey) : "****" + setting.configuration.apiKey.slice(-4)}
                                                </code>
                                                <Button variant="ghost" size="sm" onClick={onToggleApiKey} disabled={loadingApiKey}>
                                                      {loadingApiKey ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                      ) : showApiKey ? (
                                                            <EyeOff className="h-4 w-4" />
                                                      ) : (
                                                            <Eye className="h-4 w-4" />
                                                      )}
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(fullApiKey || setting.configuration.apiKey)}>
                                                      <Copy className="h-4 w-4" />
                                                </Button>
                                          </div>
                                    </div>

                                    <div>
                                          <Label className="text-sm font-medium">Default From</Label>
                                          <p className="text-sm text-muted-foreground mt-1">
                                                {setting.configuration.defaultFromName} &lt;{setting.configuration.defaultFromEmail}&gt;
                                          </p>
                                    </div>
                              </div>

                              <div className="space-y-3">
                                    <div>
                                          <Label className="text-sm font-medium">Domain Verification</Label>
                                          <div className="flex items-center space-x-2 mt-1">
                                                <DomainStatusBadge 
                                                      status={setting.verificationStatus} 
                                                      lastVerificationResult={lastVerificationResult}
                                                />
                                                <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={handleVerifyDomain}
                                                      disabled={isVerifying}
                                                >
                                                      {isVerifying ? "Verifying..." : "Re-verify"}
                                                </Button>
                                          </div>
                                    </div>

                                    <div>
                                          <Label className="text-sm font-medium">Custom From Addresses</Label>
                                          <div className="space-y-1 mt-1">
                                                {setting.customFromAddresses.map((addr: any, idx: number) => (
                                                      <div key={idx} className="text-sm text-muted-foreground flex items-center justify-between">
                                                            <span>{addr.name}: {addr.email}</span>
                                                            {addr.isDefault && <Badge variant="outline" className="text-xs">Default</Badge>}
                                                      </div>
                                                ))}
                                          </div>
                                    </div>
                              </div>
                        </div>

                        {/* Test Email Section */}
                        <div className="border-t pt-4">
                              <Label className="text-sm font-medium">Test Configuration</Label>
                              <p className="text-sm text-muted-foreground mt-1 mb-3">
                                    Send a test email to your account to verify the configuration is working
                              </p>
                              <Button
                                    onClick={handleTest}
                                    disabled={isTesting}
                                    size="sm"
                                    className="w-full"
                              >
                                    <TestTube className="h-4 w-4 mr-2" />
                                    {isTesting ? "Sending Test Email..." : "Send Test Email to My Account"}
                              </Button>
                        </div>
                  </CardContent>
            </Card>
      );
}

function DomainStatusBadge({ status, lastVerificationResult }: { 
      status: any; 
      lastVerificationResult?: { issues?: string[] } 
}) {
      // Core verification requires Domain, DKIM, and SPF (DMARC is optional)
      const coreVerified = status.domainVerified && status.dkimSetup && status.spfSetup;
      const fullyVerified = coreVerified && status.dmarcSetup;
      const issues = lastVerificationResult?.issues || [];
      const [showAllIssues, setShowAllIssues] = useState(false);

      // Create detailed status breakdown
      const statusDetails = [
            {
                  label: "Domain Accessible",
                  checked: status.domainVerified,
                  icon: status.domainVerified ? "✅" : "❌",
                  required: true
            },
            {
                  label: "DKIM Authentication",
                  checked: status.dkimSetup,
                  icon: status.dkimSetup ? "✅" : "❌",
                  required: true
            },
            {
                  label: "SPF Authorization", 
                  checked: status.spfSetup,
                  icon: status.spfSetup ? "✅" : "❌",
                  required: true
            },
            {
                  label: "DMARC Policy",
                  checked: status.dmarcSetup,
                  icon: status.dmarcSetup ? "✅" : "⚪",
                  required: false,
                  description: "Optional but recommended for enhanced security and deliverability"
            }
      ];

      const coreRequiredCount = statusDetails.filter(s => s.required).length;
      const coreCompletedCount = statusDetails.filter(s => s.required && s.checked).length;
      const allCompletedCount = statusDetails.filter(s => s.checked).length;
      const totalCount = statusDetails.length;

      const displayedIssues = showAllIssues ? issues : issues.slice(0, 3);
      const hasMoreIssues = issues.length > 3;

      const tooltipContent = (
            <div className="max-w-lg space-y-3">
                  <div className="font-medium">
                        {fullyVerified 
                              ? `🎉 Fully Verified (${allCompletedCount}/${totalCount})`
                              : coreVerified 
                                    ? `✅ Core Verified (${coreCompletedCount}/${coreRequiredCount} required)`
                                    : `⚠️ Verification Status (${coreCompletedCount}/${coreRequiredCount} required)`
                        }
                  </div>
                  
                  <div className="space-y-1">
                        {statusDetails.map((detail, idx) => (
                              <div key={idx} className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs">
                                          <span>{detail.icon}</span>
                                          <span className={detail.checked ? "text-green-200" : detail.required ? "text-red-200" : "text-gray-300"}>
                                                {detail.label}
                                                {!detail.required && <span className="text-xs opacity-70"> (optional)</span>}
                                          </span>
                                    </div>
                                    {detail.description && (
                                          <div className="text-xs text-gray-300 ml-6 opacity-80">
                                                {detail.description}
                                          </div>
                                    )}
                              </div>
                        ))}
                  </div>

                  {!status.dmarcSetup && (
                        <div className="pt-2 border-t border-primary-foreground/20">
                              <div className="text-xs text-blue-200">
                                    <div className="font-medium mb-1">💡 About DMARC:</div>
                                    <div>DMARC helps prevent email spoofing and improves deliverability by telling email providers how to handle unauthenticated emails from your domain.</div>
                              </div>
                        </div>
                  )}

                  {issues.length > 0 && (
                        <div className="pt-2 border-t border-primary-foreground/20">
                              <div className="font-medium text-xs mb-2">
                                    {issues.some(issue => issue.includes('ℹ️') || issue.includes('Note:')) 
                                          ? "Configuration Info:" 
                                          : issues.some(issue => issue.includes('permission') || issue.includes('API key')) 
                                                ? "API Information:" 
                                                : "Issues to Fix:"
                                    }
                              </div>
                              <div className="space-y-2">
                                    {displayedIssues.map((issue, idx) => (
                                          <div key={idx} className={`text-xs leading-relaxed ${
                                                issue.includes('ℹ️') || issue.includes('Note:')
                                                      ? 'text-blue-200' 
                                                      : issue.includes('permission') || issue.includes('API key')
                                                            ? 'text-gray-300'
                                                            : issue.includes('Amazon SES') || issue.includes('SPF record is configured')
                                                                  ? 'text-orange-200'
                                                                  : 'text-yellow-200'
                                          }`}>
                                                • {issue}
                                          </div>
                                    ))}
                                    {hasMoreIssues && (
                                          <button
                                                onClick={(e) => {
                                                      e.stopPropagation();
                                                      setShowAllIssues(!showAllIssues);
                                                }}
                                                className="text-xs text-blue-300 hover:text-blue-100 underline transition-colors"
                                          >
                                                {showAllIssues 
                                                      ? "Show less" 
                                                      : `Show ${issues.length - 3} more items`
                                                }
                                          </button>
                                    )}
                              </div>
                        </div>
                  )}

                  <div className="pt-2 border-t border-primary-foreground/20 text-xs text-muted-foreground">
                        Click "Re-verify" to check current status
                  </div>
            </div>
      );      if (fullyVerified) {
            return (
                  <Tooltip>
                        <TooltipTrigger asChild>
                              <Badge variant="default" className="flex items-center gap-1 cursor-help">
                                    <CheckCircle className="h-3 w-3" />
                                    Fully Verified
                                    <Info className="h-3 w-3 opacity-70" />
                              </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                              {tooltipContent}
                        </TooltipContent>
                  </Tooltip>
            );
      } else if (coreVerified) {
            return (
                  <Tooltip>
                        <TooltipTrigger asChild>
                              <Badge variant="default" className="flex items-center gap-1 cursor-help">
                                    <CheckCircle className="h-3 w-3" />
                                    Verified
                                    <Info className="h-3 w-3 opacity-70" />
                              </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                              {tooltipContent}
                        </TooltipContent>
                  </Tooltip>
            );
      } else if (coreCompletedCount > 0) {
            return (
                  <Tooltip>
                        <TooltipTrigger asChild>
                              <Badge variant="secondary" className="flex items-center gap-1 cursor-help">
                                    <AlertTriangle className="h-3 w-3" />
                                    Partial ({coreCompletedCount}/{coreRequiredCount})
                                    <Info className="h-3 w-3 opacity-70" />
                              </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                              {tooltipContent}
                        </TooltipContent>
                  </Tooltip>
            );
      } else {
            return (
                  <Tooltip>
                        <TooltipTrigger asChild>
                              <Badge variant="destructive" className="flex items-center gap-1 cursor-help">
                                    <XCircle className="h-3 w-3" />
                                    Not Verified
                                    <Info className="h-3 w-3 opacity-70" />
                              </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                              {tooltipContent}
                        </TooltipContent>
                  </Tooltip>
            );
      }
}

function QuickSetupGuide() {
      return (
            <Card className="border-dashed">
                  <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                              <Mail className="h-12 w-12 text-muted-foreground mx-auto" />
                              <div>
                                    <h3 className="text-lg font-semibold">Setup Resend Email Sending</h3>
                                    <p className="text-muted-foreground">
                                          Configure your Resend account and custom domain for professional email marketing
                                    </p>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                    <div className="text-center">
                                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-2">1</div>
                                          <h4 className="font-medium">Get Resend API Key</h4>
                                          <p className="text-sm text-muted-foreground">Sign up at Resend and get your API key</p>
                                    </div>
                                    <div className="text-center">
                                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-2">2</div>
                                          <h4 className="font-medium">Verify Domain</h4>
                                          <p className="text-sm text-muted-foreground">Add and verify your custom domain in Resend</p>
                                    </div>
                                    <div className="text-center">
                                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-2">3</div>
                                          <h4 className="font-medium">Configure & Test</h4>
                                          <p className="text-sm text-muted-foreground">Set up your configuration and test sending</p>
                                    </div>
                              </div>
                        </div>
                  </CardContent>
            </Card>
      );
}

function EmailSettingsForm({
      settingsId,
      onClose
}: {
      settingsId?: Id<"emailSettings">;
      onClose: () => void;
}) {
      const { isLoaded, isSignedIn } = useAuth();
      const [formData, setFormData] = useState({
            name: "",
            apiKey: "",
            domain: "",
            defaultFromName: "",
            defaultFromEmail: "",
            replyToEmail: "",
            makeDefault: false,
      });

      const [customAddresses, setCustomAddresses] = useState([
            { name: "Support", email: "", description: "Customer support emails", isDefault: false },
            { name: "Marketing", email: "", description: "Marketing campaigns", isDefault: true },
      ]);

      // Fetch existing data when editing
      const existingSettings = useQuery(
            api.emailSettings.getEmailSettingsById,
            isLoaded && isSignedIn && settingsId ? { id: settingsId } : "skip"
      );

      // Populate form when data is loaded
      useEffect(() => {
            if (existingSettings) {
                  setFormData({
                        name: existingSettings.name,
                        apiKey: "", // Don't populate the API key for security
                        domain: existingSettings.configuration.domain,
                        defaultFromName: existingSettings.configuration.defaultFromName,
                        defaultFromEmail: existingSettings.configuration.defaultFromEmail,
                        replyToEmail: existingSettings.configuration.replyToEmail || "",
                        makeDefault: existingSettings.isDefault,
                  });
                  
                  if (existingSettings.customFromAddresses) {
                        setCustomAddresses(existingSettings.customFromAddresses);
                  }
            }
      }, [existingSettings]);

      const createSettings = useMutation(api.emailSettings.createEmailSettings);
      const updateSettings = useMutation(api.emailSettings.updateEmailSettings);

      const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();

            try {
                  const configuration = {
                        domain: formData.domain,
                        defaultFromName: formData.defaultFromName,
                        defaultFromEmail: formData.defaultFromEmail,
                        replyToEmail: formData.replyToEmail || undefined,
                        ...(formData.apiKey && { apiKey: formData.apiKey }), // Only include API key if provided
                  };

                  const validAddresses = customAddresses.filter(addr => addr.email.trim());

                  if (settingsId) {
                        // For updates, only send configuration if API key is provided
                        const updateData: any = {
                              id: settingsId,
                              name: formData.name,
                              customFromAddresses: validAddresses,
                              makeDefault: formData.makeDefault,
                        };
                        
                        // Only include configuration if API key is provided (user wants to update it)
                        if (formData.apiKey) {
                              updateData.configuration = configuration;
                        } else {
                              // Update only non-API key fields
                              updateData.configuration = {
                                    domain: formData.domain,
                                    defaultFromName: formData.defaultFromName,
                                    defaultFromEmail: formData.defaultFromEmail,
                                    replyToEmail: formData.replyToEmail || undefined,
                              };
                        }
                        
                        await updateSettings(updateData);
                        toast.success("Email settings updated successfully");
                  } else {
                        // For creation, API key is required
                        if (!formData.apiKey) {
                              toast.error("API key is required for new configurations");
                              return;
                        }
                        
                        await createSettings({
                              name: formData.name,
                              provider: "resend", // Always use Resend
                              configuration: { ...configuration, apiKey: formData.apiKey },
                              customFromAddresses: validAddresses,
                              makeDefault: formData.makeDefault,
                        });
                        toast.success("Email settings created successfully");
                  }

                  onClose();
            } catch (error: any) {
                  toast.error(error.message || "Failed to save email settings");
            }
      };

      return (
            <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                        <div>
                              <Label htmlFor="name">Configuration Name</Label>
                              <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g., Primary Email Configuration"
                                    required
                              />
                              <p className="text-sm text-muted-foreground mt-1">
                                    Using Resend email service
                              </p>
                        </div>
                  </div>

                  <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                              <TabsTrigger value="addresses">From Addresses</TabsTrigger>
                        </TabsList>

                        <TabsContent value="basic" className="space-y-4">
                              <div className="grid grid-cols-1 gap-4">
                                    <div>
                                          <Label htmlFor="apiKey">Resend API Key</Label>
                                          <Input
                                                id="apiKey"
                                                type="password"
                                                value={formData.apiKey}
                                                onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                                                placeholder={settingsId ? "Leave empty to keep current API key" : "re_xxxxxxxxxx"}
                                                required={!settingsId} // Only required for new settings
                                          />
                                          <p className="text-sm text-muted-foreground mt-1">
                                                {settingsId 
                                                      ? "Leave empty to keep your existing API key, or enter a new one to update it"
                                                      : "Get your API key from"
                                                } <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Resend Dashboard</a>
                                          </p>
                                    </div>
                                    <div>
                                          <Label htmlFor="domain">Sending Domain</Label>
                                          <Input
                                                id="domain"
                                                value={formData.domain}
                                                onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                                                placeholder="yourdomain.com"
                                                required
                                          />
                                          <p className="text-sm text-yellow-600 mt-1 flex items-center space-x-1">
                                                <MailWarning className="h-4 w-4"/>
                                                <span>Domain must be verified in your Resend account</span>
                                          </p>
                                    </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                    <div>
                                          <Label htmlFor="defaultFromName">Default From Name</Label>
                                          <Input
                                                id="defaultFromName"
                                                value={formData.defaultFromName}
                                                onChange={(e) => setFormData(prev => ({ ...prev, defaultFromName: e.target.value }))}
                                                placeholder="Your Company"
                                                required
                                          />
                                    </div>
                                    <div>
                                          <Label htmlFor="defaultFromEmail">Default From Email</Label>
                                          <Input
                                                id="defaultFromEmail"
                                                type="email"
                                                value={formData.defaultFromEmail}
                                                onChange={(e) => setFormData(prev => ({ ...prev, defaultFromEmail: e.target.value }))}
                                                placeholder="noreply@yourdomain.com"
                                                required
                                          />
                                    </div>
                              </div>

                              <div>
                                    <Label htmlFor="replyToEmail">Reply-To Email (Optional)</Label>
                                    <Input
                                          id="replyToEmail"
                                          type="email"
                                          value={formData.replyToEmail}
                                          onChange={(e) => setFormData(prev => ({ ...prev, replyToEmail: e.target.value }))}
                                          placeholder="support@yourdomain.com"
                                    />
                              </div>

                              <div className="flex items-center space-x-2">
                                    <Switch
                                          id="makeDefault"
                                          checked={formData.makeDefault}
                                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, makeDefault: checked }))}
                                    />
                                    <Label htmlFor="makeDefault">Make this the default email configuration</Label>
                              </div>
                        </TabsContent>

                        <TabsContent value="addresses" className="space-y-4">
                              <div>
                                    <Label>Custom From Addresses</Label>
                                    <p className="text-sm text-muted-foreground mb-4">
                                          Configure different sender addresses for different types of emails
                                    </p>
                              </div>

                              {customAddresses.map((address, index) => (
                                    <div key={index} className="border rounded-lg p-4 space-y-3">
                                          <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                      <Label>Name</Label>
                                                      <Input
                                                            value={address.name}
                                                            onChange={(e) => {
                                                                  const newAddresses = [...customAddresses];
                                                                  newAddresses[index].name = e.target.value;
                                                                  setCustomAddresses(newAddresses);
                                                            }}
                                                            placeholder="e.g., Support"
                                                      />
                                                </div>
                                                <div>
                                                      <Label>Email</Label>
                                                      <Input
                                                            type="email"
                                                            value={address.email}
                                                            onChange={(e) => {
                                                                  const newAddresses = [...customAddresses];
                                                                  newAddresses[index].email = e.target.value;
                                                                  setCustomAddresses(newAddresses);
                                                            }}
                                                            placeholder={`support@${formData.domain || 'yourdomain.com'}`}
                                                      />
                                                </div>
                                          </div>
                                          <div>
                                                <Label>Description</Label>
                                                <Input
                                                      value={address.description || ""}
                                                      onChange={(e) => {
                                                            const newAddresses = [...customAddresses];
                                                            newAddresses[index].description = e.target.value;
                                                            setCustomAddresses(newAddresses);
                                                      }}
                                                      placeholder="When to use this address"
                                                />
                                          </div>
                                    </div>
                              ))}

                              <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setCustomAddresses([...customAddresses, {
                                          name: "",
                                          email: "",
                                          description: "",
                                          isDefault: false
                                    }])}
                              >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Address
                              </Button>
                        </TabsContent>
                  </Tabs>

                  <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                              Cancel
                        </Button>
                        <Button type="submit">
                              {settingsId ? "Update" : "Create"} Configuration
                        </Button>
                  </div>
            </form>
      );
}
