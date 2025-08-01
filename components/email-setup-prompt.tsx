"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Settings, AlertTriangle, ArrowRight } from "lucide-react";

export function EmailSetupPrompt() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  // Only check if user is authenticated and Clerk is loaded
  const hasEmailSettings = useQuery(
    api.emailSettings.hasEmailSettings,
    isLoaded && isSignedIn ? {} : "skip"
  );

  useEffect(() => {
    // Only show prompt once per session and if user is authenticated
    if (isLoaded && isSignedIn && hasEmailSettings !== undefined && !hasChecked) {
      setHasChecked(true);
      
      // If user doesn't have email settings, show the setup prompt
      if (!hasEmailSettings) {
        // Small delay to ensure the app has loaded
        setTimeout(() => setIsOpen(true), 1000);
      }
    }
  }, [isLoaded, isSignedIn, hasEmailSettings, hasChecked]);

  const handleSetupEmail = () => {
    setIsOpen(false);
    router.push("/settings?tab=email");
  };

  const handleSkip = () => {
    setIsOpen(false);
  };

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
            <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <DialogTitle className="text-center">Email Configuration Required</DialogTitle>
          <DialogDescription className="text-center">
            To send campaigns and use SmartBatch features, you need to configure your email settings with your own Resend API key.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-blue-500" />
                Why do I need this?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• <strong>Control:</strong> Use your own Resend account and API key</p>
              <p>• <strong>Security:</strong> Your emails are sent directly from your account</p>
              <p>• <strong>Deliverability:</strong> Better reputation with your own domain</p>
              <p>• <strong>Limits:</strong> Manage your own sending quotas and costs</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Settings className="h-4 w-4 text-green-500" />
                Quick Setup (2 minutes)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>1. Sign up for a free Resend account</p>
              <p>2. Get your API key from Resend dashboard</p>
              <p>3. Add your domain and verify DNS records</p>
              <p>4. Start sending professional emails!</p>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleSetupEmail} className="flex-1">
              <ArrowRight className="h-4 w-4 mr-2" />
              Set Up Email Now
            </Button>
            <Button variant="outline" onClick={handleSkip} className="flex-1">
              Skip for now
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            You can always set this up later in Settings → Email Configuration
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
