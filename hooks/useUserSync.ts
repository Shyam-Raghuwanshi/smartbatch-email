"use client";

import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { useEffect, useState } from 'react';
import { api } from '@/convex/_generated/api';

export interface UserSyncState {
  isLoading: boolean;
  isError: boolean;
  error?: Error;
  user: any;
  isAuthenticated: boolean;
}

export function useUserSync(): UserSyncState {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const convexUser = useQuery(api.users.getCurrentUser);
  const ensureUser = useMutation(api.lib.ensureUser);
  
  const [syncState, setSyncState] = useState({
    isLoading: true,
    isError: false,
    error: undefined as Error | undefined,
    syncAttempted: false,
  });

  useEffect(() => {
    async function syncUser() {
      // Wait for Clerk to load
      if (!clerkLoaded) {
        setSyncState(prev => ({ ...prev, isLoading: true }));
        return;
      }

      // If no Clerk user, we're not authenticated
      if (!clerkUser) {
        setSyncState({
          isLoading: false,
          isError: false,
          error: undefined,
          syncAttempted: false,
        });
        return;
      }

      // If we have both Clerk and Convex user, we're done
      if (convexUser) {
        setSyncState({
          isLoading: false,
          isError: false,
          error: undefined,
          syncAttempted: true,
        });
        return;
      }

      // If we have Clerk user but no Convex user, and haven't attempted sync yet
      if (!syncState.syncAttempted) {
        setSyncState(prev => ({ ...prev, syncAttempted: true, isLoading: true }));
        
        try {
          await ensureUser({
            email: clerkUser.emailAddresses[0]?.emailAddress || '',
            name: clerkUser.fullName || clerkUser.emailAddresses[0]?.emailAddress || '',
          });
          
          setSyncState({
            isLoading: false,
            isError: false,
            error: undefined,
            syncAttempted: true,
          });
        } catch (error) {
          console.error('User sync failed:', error);
          setSyncState({
            isLoading: false,
            isError: true,
            error: error instanceof Error ? error : new Error('Unknown sync error'),
            syncAttempted: false, // Allow retry
          });
        }
      }
    }

    syncUser();
  }, [clerkLoaded, clerkUser, convexUser, ensureUser, syncState.syncAttempted]);

  return {
    isLoading: syncState.isLoading,
    isError: syncState.isError,
    error: syncState.error,
    user: convexUser,
    isAuthenticated: !!clerkUser && !!convexUser,
  };
}
