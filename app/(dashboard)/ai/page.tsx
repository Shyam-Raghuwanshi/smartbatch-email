"use client";

import { Metadata } from 'next';
import { AIFeaturesHub } from '@/components/ai';

// Note: This would be the metadata if this was a server component
// export const metadata: Metadata = {
//   title: 'AI Features - SmartBatch Email',
//   description: 'AI-powered email optimization and smart content features',
// };

export default function AIPage() {
  return (
    <div className="container mx-auto py-6">
      <AIFeaturesHub />
    </div>
  );
}
