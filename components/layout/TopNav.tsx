"use client";

import React from 'react';
import { UserButton, useUser } from '@clerk/nextjs';
import { Bell, Search, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useCurrentUser } from '@/lib/convex-hooks';

interface TopNavProps {
  title?: string;
}

export default function TopNav({ title = "Dashboard" }: TopNavProps) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const convexUser = useCurrentUser();
  
  // Only fetch data if user is properly authenticated and synced
  const isUserReady = clerkLoaded && clerkUser && convexUser;
  
  // Get real notifications from Convex - only if user is ready
  const notifications = useQuery(
    api.notifications.getUserNotifications, 
    isUserReady ? { limit: 20 } : "skip"
  );
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    isUserReady ? {} : "skip"
  );
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const deleteNotification = useMutation(api.notifications.deleteNotification);
  const deleteAllNotifications = useMutation(api.notifications.deleteAllNotifications);
  const initializeNotifications = useMutation(api.users.initializeUserNotifications);

  // Initialize sample notifications for new users - only when user is ready
  React.useEffect(() => {
    if (!isUserReady) return;
    
    const init = async () => {
      try {
        await initializeNotifications();
      } catch (error) {
        console.log('Failed to initialize notifications:', error);
      }
    };
    
    // Small delay to ensure user is fully synced
    const timeoutId = setTimeout(init, 1000);
    return () => clearTimeout(timeoutId);
  }, [initializeNotifications, isUserReady]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-400';
      case 'warning': return 'bg-yellow-400';
      case 'error': return 'bg-red-400';
      default: return 'bg-blue-400';
    }
  };

  const handleNotificationClick = async (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      try {
        await markAsRead({ notificationId: notificationId as any });
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await deleteNotification({ notificationId: notificationId as any });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await deleteAllNotifications();
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  };

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Page title */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold leading-6 text-gray-900">{title}</h1>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-x-4 lg:gap-x-6">

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {(unreadCount || 0) > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                >
                  {unreadCount}
                </Badge>
              )}
              <span className="sr-only">View notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notifications
              <div className="flex gap-1">
                {(unreadCount || 0) > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="text-xs h-auto p-1"
                  >
                    Mark all read
                  </Button>
                )}
                {notifications && notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className="text-xs h-auto p-1 text-red-600 hover:text-red-700"
                  >
                    Clear all
                  </Button>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-96 overflow-y-auto">
              {notifications && notifications.length > 0 ? (
                notifications.map((notification:any) => (
                  <DropdownMenuItem 
                    key={notification._id} 
                    className={`flex items-start space-x-3 p-3 cursor-pointer group relative ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification._id, notification.read)}
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getNotificationIcon(notification.type)}`} />
                    <div className="flex-1 min-w-0 pr-8">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {notification.time}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteNotification(notification._id, e)}
                      className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <UserButton 
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "h-8 w-8"
            }
          }}
        />
      </div>
    </div>
  );
}
