"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Mail,
  TrendingDown,
  TrendingUp,
  Settings
} from 'lucide-react';
import { toast } from "sonner";

interface AlertRule {
  id: string;
  name: string;
  type: 'bounce_rate' | 'complaint_rate' | 'failure_rate' | 'open_rate' | 'delivery_rate';
  threshold: number;
  operator: 'greater_than' | 'less_than';
  enabled: boolean;
  severity: 'warning' | 'critical';
}

const defaultRules: AlertRule[] = [
  {
    id: 'bounce_rate_warning',
    name: 'High Bounce Rate Warning',
    type: 'bounce_rate',
    threshold: 5,
    operator: 'greater_than',
    enabled: true,
    severity: 'warning'
  },
  {
    id: 'bounce_rate_critical',
    name: 'Critical Bounce Rate',
    type: 'bounce_rate',
    threshold: 10,
    operator: 'greater_than',
    enabled: true,
    severity: 'critical'
  },
  {
    id: 'complaint_rate_warning',
    name: 'High Complaint Rate',
    type: 'complaint_rate',
    threshold: 0.1,
    operator: 'greater_than',
    enabled: true,
    severity: 'warning'
  },
  {
    id: 'complaint_rate_critical',
    name: 'Critical Complaint Rate',
    type: 'complaint_rate',
    threshold: 0.5,
    operator: 'greater_than',
    enabled: true,
    severity: 'critical'
  },
  {
    id: 'delivery_rate_warning',
    name: 'Low Delivery Rate',
    type: 'delivery_rate',
    threshold: 90,
    operator: 'less_than',
    enabled: true,
    severity: 'warning'
  },
  {
    id: 'open_rate_warning',
    name: 'Low Open Rate',
    type: 'open_rate',
    threshold: 10,
    operator: 'less_than',
    enabled: false,
    severity: 'warning'
  }
];

export function AlertingSystem() {
  const [alertRules, setAlertRules] = useState<AlertRule[]>(defaultRules);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [lastAlertCount, setLastAlertCount] = useState(0);
  
  // Get current alerts and user info
  const alerts = useQuery(api.campaignMonitoring.getAlertTriggers, {});
  const userId = useQuery(api.lib.getUserId);
  const sendAlertEmail = useMutation(api.notifications.sendAlertEmail);
  
  // Load settings from localStorage on mount
  useEffect(() => {
    const savedRules = localStorage.getItem('alertRules');
    const savedEmailNotifications = localStorage.getItem('emailNotifications');
    
    if (savedRules) {
      setAlertRules(JSON.parse(savedRules));
    }
    if (savedEmailNotifications !== null) {
      setEmailNotifications(JSON.parse(savedEmailNotifications));
    }
  }, []);
  
  // Save settings to localStorage
  const saveSettings = () => {
    localStorage.setItem('alertRules', JSON.stringify(alertRules));
    localStorage.setItem('emailNotifications', JSON.stringify(emailNotifications));
    toast.success('Alert settings saved');
  };
  
  // Send email notifications for new alerts
  useEffect(() => {
    if (alerts && alerts.length > 0 && emailNotifications && userId) {
      // Only send email if there are new alerts (more than before)
      if (alerts.length > lastAlertCount) {
        const newAlerts = alerts.slice(0, alerts.length - lastAlertCount);
        const hasNewCritical = newAlerts.some(alert => alert.type === 'critical');
        const hasNewWarning = newAlerts.some(alert => alert.type === 'warning');
        
        if (hasNewCritical || hasNewWarning) {
          const alertType = hasNewCritical ? 'critical' : 'warning';
          
          sendAlertEmail({
            userId,
            alerts: newAlerts,
            alertType
          }).then(() => {
            console.log('📧 Alert email sent successfully');
            toast.success(`${alertType.charAt(0).toUpperCase() + alertType.slice(1)} alert email sent`);
          }).catch((error) => {
            console.error('Failed to send alert email:', error);
            toast.error('Failed to send alert email');
          });
        }
      }
      
      setLastAlertCount(alerts.length);
    }
  }, [alerts, emailNotifications, userId, sendAlertEmail, lastAlertCount]);
  
  const updateAlertRule = (ruleId: string, updates: Partial<AlertRule>) => {
    setAlertRules(prev => 
      prev.map(rule => 
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
    );
  };
  
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };
  
  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };
  
  const getRuleIcon = (type: AlertRule['type']) => {
    switch (type) {
      case 'bounce_rate':
      case 'complaint_rate':
      case 'failure_rate':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'open_rate':
      case 'delivery_rate':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const criticalAlerts = alerts?.filter(a => a.type === 'critical') || [];
  const warningAlerts = alerts?.filter(a => a.type === 'warning') || [];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Alert System</h2>
          <p className="mt-1 text-sm text-gray-600">
            Monitor campaign performance and get notified of issues
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button onClick={saveSettings}>
            <Settings className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
      
      {/* Current Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={criticalAlerts.length > 0 ? 'border-red-200 bg-red-50' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Critical Alerts ({criticalAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {criticalAlerts.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No critical alerts</p>
              </div>
            ) : (
              <div className="space-y-2">
                {criticalAlerts.map((alert, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-white border border-red-200 rounded">
                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-red-800 truncate">{alert.message}</p>
                      <p className="text-xs text-red-600">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className={warningAlerts.length > 0 ? 'border-yellow-200 bg-yellow-50' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
              Warning Alerts ({warningAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {warningAlerts.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No warning alerts</p>
              </div>
            ) : (
              <div className="space-y-2">
                {warningAlerts.map((alert, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-white border border-yellow-200 rounded">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-yellow-800 truncate">{alert.message}</p>
                      <p className="text-xs text-yellow-600">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Alert Rules Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Alert Rules
          </CardTitle>
          <CardDescription>
            Configure when to receive alerts based on campaign performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Notification Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Notification Settings</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-blue-500" />
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-xs text-gray-500">Send email alerts for critical issues</p>
                    </div>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Alert Rules */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Performance Thresholds</h3>
              <div className="space-y-4">
                {alertRules.map((rule) => (
                  <div key={rule.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getRuleIcon(rule.type)}
                        <div>
                          <h4 className="font-medium">{rule.name}</h4>
                          <p className="text-sm text-gray-600">
                            Alert when {rule.type.replace('_', ' ')} is {rule.operator.replace('_', ' ')} {rule.threshold}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={rule.severity === 'critical' ? 'destructive' : 'secondary'}>
                          {rule.severity}
                        </Badge>
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={(enabled) => updateAlertRule(rule.id, { enabled })}
                        />
                      </div>
                    </div>
                    
                    {rule.enabled && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor={`${rule.id}-threshold`}>Threshold</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id={`${rule.id}-threshold`}
                              type="number"
                              value={rule.threshold}
                              onChange={(e) => updateAlertRule(rule.id, { threshold: parseFloat(e.target.value) || 0 })}
                              className="w-20"
                              step={rule.type === 'complaint_rate' ? 0.1 : 1}
                              min={0}
                              max={100}
                            />
                            <span className="text-sm text-gray-500">%</span>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor={`${rule.id}-operator`}>Condition</Label>
                          <select
                            id={`${rule.id}-operator`}
                            value={rule.operator}
                            onChange={(e) => updateAlertRule(rule.id, { operator: e.target.value as AlertRule['operator'] })}
                            className="w-full p-2 border rounded-md text-sm"
                          >
                            <option value="greater_than">Greater than</option>
                            <option value="less_than">Less than</option>
                          </select>
                        </div>
                        
                        <div>
                          <Label htmlFor={`${rule.id}-severity`}>Severity</Label>
                          <select
                            id={`${rule.id}-severity`}
                            value={rule.severity}
                            onChange={(e) => updateAlertRule(rule.id, { severity: e.target.value as AlertRule['severity'] })}
                            className="w-full p-2 border rounded-md text-sm"
                          >
                            <option value="warning">Warning</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Alert History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Alert History
          </CardTitle>
          <CardDescription>
            Last 10 alerts from all campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alerts && alerts.length > 0 ? (
            <div className="space-y-2">
              {alerts.slice(0, 10).map((alert, index) => (
                <div key={index} className={`flex items-center gap-3 p-3 rounded-lg border ${getAlertColor(alert.type)}`}>
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={alert.type === 'critical' ? 'destructive' : 'secondary'}>
                    {alert.type}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <CheckCircle2 className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Recent Alerts</h3>
              <p className="text-gray-600">Your campaigns are performing well!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
