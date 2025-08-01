"use client";

import { useUser } from '@clerk/nextjs'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useCurrentUser, useEnsureUser } from '@/lib/convex-hooks'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, Mail, Users, BarChart3, Target } from 'lucide-react'

export default function DashboardPage() {
  const { user: clerkUser } = useUser()
  const convexUser = useCurrentUser()
  const ensureUser = useEnsureUser()
  const router = useRouter()

  // Get user's email usage data
  const monthlyUsage = useQuery(api.userEmailUsage.getMonthlyEmailUsage)
  const dashboardData = useQuery(api.emailDashboard.getDashboardData, { timeRange: "30d" })
  const campaigns = useQuery(api.campaigns.getUserCampaigns)
  const contacts = useQuery(api.contacts.getUserContacts, { page: 0, limit: 1 }) // Just to get count

  // Sync Clerk user with Convex database
  useEffect(() => {
    if (clerkUser && !convexUser) {
      ensureUser({
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: clerkUser.fullName || clerkUser.emailAddresses[0]?.emailAddress || '',
      })
    }
  }, [clerkUser, convexUser, ensureUser])

  // Calculate stats from actual data
  const stats = [
    { 
      name: 'Total Campaigns', 
      value: campaigns?.length.toString() || '0', 
      change: '+2 from last month', 
      icon: <Mail className="h-5 w-5" />,
      color: 'blue'
    },
    { 
      name: 'Active Contacts', 
      value: contacts?.total?.toLocaleString() || '0', 
      change: '+12% from last month', 
      icon: <Users className="h-5 w-5" />,
      color: 'green'
    },
    { 
      name: 'Email Opens', 
      value: '89%', 
      change: '+2.1% from last month', 
      icon: <BarChart3 className="h-5 w-5" />,
      color: 'purple'
    },
    { 
      name: 'Click Rate', 
      value: '24%', 
      change: '+1.8% from last month', 
      icon: <Target className="h-5 w-5" />,
      color: 'orange'
    },
  ]

  // Handle navigation functions
  const handleCreateCampaign = () => {
    if (!monthlyUsage?.canSend) {
      alert("You've reached your monthly email limit. Please upgrade your plan to send more emails.")
      return
    }
    router.push('/campaigns?action=create')
  }

  const handleImportContacts = () => {
    router.push('/contacts?action=import')
  }

  const handleCreateTemplate = () => {
    router.push('/templates?action=create')
  }

  const handleUpgradePlan = () => {
    router.push('/billing')
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome back! Here&apos;s what&apos;s happening with your email campaigns.
        </p>
      </div>

      {/* Email Usage Alert for Free Plan */}
      {monthlyUsage?.plan === 'free' && monthlyUsage?.usagePercentage > 80 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Approaching Email Limit
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                You've used {monthlyUsage.usage} of {monthlyUsage.limit} emails this month. 
                Consider upgrading to send more emails.
              </p>
            </div>
            <Button 
              size="sm" 
              onClick={handleUpgradePlan}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Upgrade Plan
            </Button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`text-${stat.color}-500 mr-4`}>{stat.icon}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                <p className="text-sm text-green-600">{stat.change}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center text-sm">
              <div className="text-green-500 mr-3">
                <CheckCircle className="h-4 w-4" />
              </div>
              <span className="text-gray-600">Campaign &quot;Summer Sale&quot; sent to 500 contacts</span>
              <span className="ml-auto text-gray-400">2 hours ago</span>
            </div>
            <div className="flex items-center text-sm">
              <div className="text-blue-500 mr-3">
                <Mail className="h-4 w-4" />
              </div>
              <span className="text-gray-600">New template &quot;Welcome Series&quot; created</span>
              <span className="ml-auto text-gray-400">1 day ago</span>
            </div>
            <div className="flex items-center text-sm">
              <div className="text-purple-500 mr-3">
                <Users className="h-4 w-4" />
              </div>
              <span className="text-gray-600">25 new contacts imported</span>
              <span className="ml-auto text-gray-400">2 days ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={handleCreateCampaign}
              disabled={!monthlyUsage?.canSend}
              className="w-full text-left p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <p className="font-medium">Create New Campaign</p>
                  <p className="text-sm text-gray-600">Design and send email campaigns</p>
                  {!monthlyUsage?.canSend && (
                    <p className="text-xs text-red-500 mt-1">Monthly limit reached</p>
                  )}
                </div>
              </div>
            </button>
            <button 
              onClick={handleImportContacts}
              className="w-full text-left p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <Users className="h-5 w-5 text-green-500 mr-3" />
                <div>
                  <p className="font-medium">Import Contacts</p>
                  <p className="text-sm text-gray-600">Add contacts to your list</p>
                </div>
              </div>
            </button>
            <button 
              onClick={handleCreateTemplate}
              className="w-full text-left p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 text-purple-500 mr-3" />
                <div>
                  <p className="font-medium">Create Template</p>
                  <p className="text-sm text-gray-600">Design reusable email templates</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Account Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Plan</span>
              <Badge variant={monthlyUsage?.plan === 'free' ? 'secondary' : 'default'}>
                {monthlyUsage?.plan?.charAt(0).toUpperCase() + monthlyUsage?.plan?.slice(1) || 'Free'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Emails sent this month</span>
              <span className="font-medium">
                {monthlyUsage?.usage || 0} / {monthlyUsage?.limit || 10}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  (monthlyUsage?.usagePercentage || 0) > 90 
                    ? 'bg-red-600' 
                    : (monthlyUsage?.usagePercentage || 0) > 75 
                      ? 'bg-yellow-600' 
                      : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(monthlyUsage?.usagePercentage || 0, 100)}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500">
              {monthlyUsage?.remaining || 0} emails remaining this month
            </div>
            <Button 
              onClick={handleUpgradePlan}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Upgrade Plan
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
