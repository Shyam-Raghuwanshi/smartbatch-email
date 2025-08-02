"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  Mail, 
  Clock, 
  GitBranch, 
  Settings,
  Plus
} from 'lucide-react';

interface WorkflowElement {
  type: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
}

const workflowElements: WorkflowElement[] = [
  {
    type: 'trigger',
    label: 'Trigger',
    icon: Zap,
    color: 'bg-green-500',
    description: 'When to start this campaign'
  },
  {
    type: 'email',
    label: 'Email',
    icon: Mail,
    color: 'bg-blue-500',
    description: 'Send an email'
  },
  {
    type: 'wait',
    label: 'Wait',
    icon: Clock,
    color: 'bg-yellow-500',
    description: 'Add a time delay'
  },
  {
    type: 'condition',
    label: 'Condition',
    icon: GitBranch,
    color: 'bg-purple-500',
    description: 'Branch based on conditions'
  },
  {
    type: 'action',
    label: 'Action',
    icon: Settings,
    color: 'bg-orange-500',
    description: 'Perform an action'
  }
];

interface WorkflowElementsPanelProps {
  onAddElement: (type: string) => void;
}

export function WorkflowElementsPanel({ onAddElement }: WorkflowElementsPanelProps) {
  return (
    <div className="w-80 bg-white border-l border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Add Nodes</h3>
        <span className="text-sm text-gray-500">Properties</span>
      </div>
      
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-4">Workflow Elements</h4>
        <div className="space-y-3">
          {workflowElements.map((element) => {
            const Icon = element.icon;
            return (
              <div
                key={element.type}
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onAddElement(element.type)}
              >
                <div className={`p-2 rounded-md ${element.color} text-white mr-3`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{element.label}</div>
                  <div className="text-xs text-gray-500">{element.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Properties</h4>
        <div className="text-sm text-gray-500">
          Select a node to edit its properties
        </div>
      </div>
    </div>
  );
}
