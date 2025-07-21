"use client";

import React from 'react';
import { ScheduleManagement } from '@/components/campaigns/ScheduleManagement';

export default function SchedulePage() {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Campaign Schedule Management</h1>
          <p className="text-gray-600">
            Manage all your scheduled, recurring, and optimally-timed campaigns in one place.
          </p>
        </div>
        
        <ScheduleManagement />
      </div>
    </div>
  );
}
