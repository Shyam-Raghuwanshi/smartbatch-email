"use client";

import { useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

export function useEmailSettings() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  const hasEmailSettings = useQuery(
    api.emailSettings.hasEmailSettings,
    isLoaded && isSignedIn ? {} : "skip"
  );

  const requireEmailSettings = (action: string = "perform this action") => {
    if (hasEmailSettings === false) {
      toast.error("Email Configuration Required", {
        description: `Please set up your Resend API key to ${action}.`,
        action: {
          label: "Setup Email",
          onClick: () => router.push("/settings?tab=email"),
        },
      });
      return false;
    }
    return true;
  };

  const redirectToEmailSettings = () => {
    router.push("/settings?tab=email");
  };

  return {
    hasEmailSettings: hasEmailSettings ?? false,
    isLoading: hasEmailSettings === undefined,
    requireEmailSettings,
    redirectToEmailSettings,
  };
}
