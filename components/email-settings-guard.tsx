"use client";

import { ReactNode } from "react";
import { useEmailSettings } from "@/hooks/useEmailSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Settings, ArrowRight } from "lucide-react";

interface EmailSettingsGuardProps {
  children: ReactNode;
  action?: string;
  fallback?: ReactNode;
}

export function EmailSettingsGuard({ 
  children, 
  action = "use this feature",
  fallback 
}: EmailSettingsGuardProps) {
  const { hasEmailSettings, isLoading, redirectToEmailSettings } = useEmailSettings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasEmailSettings) {
    return fallback || (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20 mb-4">
            <Mail className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle>Email Configuration Required</CardTitle>
          <CardDescription>
            You need to set up your Resend API key and domain to {action}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>✓ Control your own email sending</p>
            <p>✓ Better deliverability with your domain</p>
            <p>✓ Manage your own costs and limits</p>
          </div>
          <Button onClick={redirectToEmailSettings} className="w-full">
            <Settings className="h-4 w-4 mr-2" />
            Set Up Email Configuration
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
