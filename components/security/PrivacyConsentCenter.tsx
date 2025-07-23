"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Shield, 
  Eye, 
  Database, 
  Lock, 
  Clock, 
  Download, 
  Trash2, 
  Settings,
  Info,
  ExternalLink
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ConsentOption {
  id: string;
  name: string;
  description: string;
  required: boolean;
  category: "necessary" | "functional" | "analytics" | "marketing";
  details: string;
}

interface PrivacyRight {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
}

const CONSENT_OPTIONS: ConsentOption[] = [
  {
    id: "necessary",
    name: "Necessary Cookies & Data",
    description: "Essential for the website to function properly",
    required: true,
    category: "necessary",
    details: "These are required for basic website functionality including authentication, security, and core features."
  },
  {
    id: "functional",
    name: "Functional Cookies & Data", 
    description: "Enhance your experience with personalized features",
    required: false,
    category: "functional",
    details: "These help us remember your preferences and provide enhanced functionality like saved settings."
  },
  {
    id: "analytics",
    name: "Analytics & Performance",
    description: "Help us improve our services through usage analytics",
    required: false,
    category: "analytics", 
    details: "We use this data to understand how you use our platform and improve performance and features."
  },
  {
    id: "marketing",
    name: "Marketing Communications",
    description: "Receive updates, newsletters, and promotional content",
    required: false,
    category: "marketing",
    details: "We'll send you relevant updates about new features, tips, and promotional offers. You can unsubscribe anytime."
  },
];

const PRIVACY_RIGHTS: PrivacyRight[] = [
  {
    id: "access",
    title: "Right to Access",
    description: "Request a copy of your personal data",
    icon: <Eye className="h-5 w-5" />,
    action: "Request Data Export"
  },
  {
    id: "rectification", 
    title: "Right to Rectification",
    description: "Correct inaccurate personal data",
    icon: <Settings className="h-5 w-5" />,
    action: "Update My Data"
  },
  {
    id: "erasure",
    title: "Right to Erasure",
    description: "Request deletion of your personal data",
    icon: <Trash2 className="h-5 w-5" />,
    action: "Delete My Data"
  },
  {
    id: "portability",
    title: "Right to Data Portability", 
    description: "Export your data in a machine-readable format",
    icon: <Download className="h-5 w-5" />,
    action: "Export Data"
  },
  {
    id: "restriction",
    title: "Right to Restriction",
    description: "Limit how we process your data",
    icon: <Lock className="h-5 w-5" />,
    action: "Restrict Processing"
  }
];

export const PrivacyConsentCenter: React.FC = () => {
  const [consents, setConsents] = useState<Record<string, boolean>>({
    necessary: true, // Always true and disabled
    functional: false,
    analytics: false,
    marketing: false,
  });
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleConsentChange = (consentId: string, checked: boolean) => {
    if (consentId === "necessary") return; // Cannot be changed
    
    setConsents(prev => ({
      ...prev,
      [consentId]: checked
    }));
  };

  const handleSavePreferences = () => {
    // In real implementation, this would save to backend
    console.log("Saving consent preferences:", consents);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAcceptAll = () => {
    setConsents({
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    });
  };

  const handleRejectAll = () => {
    setConsents({
      necessary: true, // Cannot be disabled
      functional: false,
      analytics: false,
      marketing: false,
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "necessary": return "bg-blue-100 text-blue-800";
      case "functional": return "bg-green-100 text-green-800";
      case "analytics": return "bg-yellow-100 text-yellow-800";
      case "marketing": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Privacy & Consent Center</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Control how your data is used and exercise your privacy rights. 
          We're committed to transparency and giving you control over your personal information.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button onClick={handleAcceptAll} className="bg-green-600 hover:bg-green-700">
          Accept All
        </Button>
        <Button onClick={handleRejectAll} variant="outline">
          Reject Optional
        </Button>
        <Dialog open={showPrivacyPolicy} onOpenChange={setShowPrivacyPolicy}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Privacy Policy
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Privacy Policy</DialogTitle>
              <DialogDescription>
                Last updated: {new Date().toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <section>
                <h3 className="font-semibold mb-2">1. Information We Collect</h3>
                <p className="text-muted-foreground">
                  We collect information you provide directly to us, such as when you create an account, 
                  use our services, or contact us for support...
                </p>
              </section>
              <section>
                <h3 className="font-semibold mb-2">2. How We Use Your Information</h3>
                <p className="text-muted-foreground">
                  We use the information we collect to provide, maintain, and improve our services, 
                  process transactions, and communicate with you...
                </p>
              </section>
              <section>
                <h3 className="font-semibold mb-2">3. Information Sharing and Disclosure</h3>
                <p className="text-muted-foreground">
                  We do not sell, trade, or otherwise transfer your personal information to third parties 
                  without your consent, except as described in this policy...
                </p>
              </section>
              <section>
                <h3 className="font-semibold mb-2">4. Data Security</h3>
                <p className="text-muted-foreground">
                  We implement appropriate technical and organizational measures to protect your personal 
                  information against unauthorized access, alteration, disclosure, or destruction...
                </p>
              </section>
              <section>
                <h3 className="font-semibold mb-2">5. Your Rights</h3>
                <p className="text-muted-foreground">
                  You have the right to access, update, or delete your personal information. 
                  You may also object to or restrict certain processing of your data...
                </p>
              </section>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Success Message */}
      {saved && (
        <Alert className="bg-green-50 border-green-200">
          <Shield className="h-4 w-4" />
          <AlertTitle>Preferences Saved</AlertTitle>
          <AlertDescription>
            Your privacy preferences have been updated successfully.
          </AlertDescription>
        </Alert>
      )}

      {/* Consent Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Data Usage Preferences</span>
          </CardTitle>
          <CardDescription>
            Choose how we can use your data to improve your experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {CONSENT_OPTIONS.map((option, index) => (
            <div key={option.id}>
              <div className="flex items-start space-x-4">
                <div className="flex items-center space-x-2 mt-1">
                  <Checkbox
                    id={option.id}
                    checked={consents[option.id]}
                    onCheckedChange={(checked) => handleConsentChange(option.id, checked as boolean)}
                    disabled={option.required}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    <label 
                      htmlFor={option.id} 
                      className="text-sm font-medium cursor-pointer"
                    >
                      {option.name}
                    </label>
                    <Badge className={getCategoryColor(option.category)}>
                      {option.category}
                    </Badge>
                    {option.required && (
                      <Badge variant="outline" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDetails(showDetails === option.id ? null : option.id)}
                      className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800"
                    >
                      <Info className="h-3 w-3 mr-1" />
                      {showDetails === option.id ? "Hide" : "Show"} Details
                    </Button>
                  </div>
                  {showDetails === option.id && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs text-muted-foreground">
                      {option.details}
                    </div>
                  )}
                </div>
              </div>
              {index < CONSENT_OPTIONS.length - 1 && <Separator className="mt-6" />}
            </div>
          ))}
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={handleRejectAll}>
              Reject Optional
            </Button>
            <Button onClick={handleSavePreferences}>
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Rights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Your Privacy Rights</span>
          </CardTitle>
          <CardDescription>
            Exercise your rights under GDPR and other privacy regulations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {PRIVACY_RIGHTS.map((right) => (
              <div key={right.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="flex-shrink-0">
                  {right.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm">{right.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {right.description}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="text-xs">
                  {right.action}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Retention Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Data Retention</span>
          </CardTitle>
          <CardDescription>
            How long we keep your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Account Data</h4>
                <p className="text-xs text-muted-foreground">
                  Retained while your account is active and for 1 year after deletion
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Email Campaign Data</h4>
                <p className="text-xs text-muted-foreground">
                  Retained for 2 years for analytics and compliance purposes
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Usage Analytics</h4>
                <p className="text-xs text-muted-foreground">
                  Anonymized after 18 months, aggregated data retained indefinitely
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Audit Logs</h4>
                <p className="text-xs text-muted-foreground">
                  Retained for 7 years for security and compliance requirements
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Questions About Your Privacy?</CardTitle>
          <CardDescription>
            Contact our Data Protection Officer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Email:</strong> privacy@smartbatch.com
            </p>
            <p>
              <strong>Address:</strong> SmartBatch Inc., 123 Privacy Street, Data City, DC 12345
            </p>
            <p className="text-muted-foreground">
              We'll respond to your privacy inquiries within 30 days as required by law.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyConsentCenter;
