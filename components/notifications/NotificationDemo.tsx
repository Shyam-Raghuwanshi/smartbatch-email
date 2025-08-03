"use client";

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Bell, Mail, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function NotificationDemo() {
  const createSampleNotifications = useMutation(api.users.initializeUserNotifications);

  const handleCreateSampleNotifications = async () => {
    try {
      await createSampleNotifications();
    } catch (error) {
      console.error('Failed to create sample notifications:', error);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Bell className="h-5 w-5" />
        Notification System Demo
      </h3>
      <p className="text-gray-600 mb-4">
        The notification system is now fully functional! Here's what you can do:
      </p>
      
      <div className="space-y-3 mb-6">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
          <div>
            <strong>Real-time notifications:</strong> Automatically generated when campaigns complete, contacts are imported, or alerts are triggered.
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Bell className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <strong>Interactive dropdown:</strong> Click notifications to mark as read, hover to see delete buttons.
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <strong>Scrollable list:</strong> The notification dropdown can handle many notifications with a scrollbar.
          </div>
        </div>
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
          <div>
            <strong>Bulk actions:</strong> "Mark all read" and "Clear all" buttons for managing multiple notifications.
          </div>
        </div>
      </div>

      <Button 
        onClick={handleCreateSampleNotifications}
        className="w-full"
      >
        Initialize Sample Notifications
      </Button>
      
      <div className="mt-4 text-sm text-gray-500">
        <p><strong>Note:</strong> Sample notifications are automatically created for new users. This button can be used to reset them if needed.</p>
      </div>
    </div>
  );
}
