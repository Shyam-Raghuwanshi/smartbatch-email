"use client";

import { useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useUserSync } from '@/hooks/useUserSync'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, Mail, Users, BarChart3, Target, Loader2 } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { isLoading, isError, error, user, isAuthenticated } = useUserSync()

  // Get user's email usage data - only fetch if user exists
  const monthlyUsage = useQuery(
    api.userEmailUsage.getMonthlyEmailUsage,
    isAuthenticated ? {} : "skip"
  )
  const dashboardData = useQuery(
    api.emailDashboard.getDashboardData,
    isAuthenticated ? { timeRange: "30d" } : "skip"
  )
  const campaigns = useQuery(
    api.campaigns.getUserCampaigns,
    isAuthenticated ? {} : "skip"
  )
  const contacts = useQuery(
    api.contacts.getUserContacts,
    isAuthenticated ? { page: 0, limit: 1 } : "skip"
  ) // Just to get count

  // Show loading state while authentication is settling
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Setting up your dashboard...</h2>
          <p className="text-gray-600">This will only take a moment.</p>
        </div>
      </div>
    )
  }

  // Show error state if sync failed
  if (isError && error) {
    throw error; // Let the error boundary handle it
  }

  // Calculate stats from actual data
  const stats = [
    { 
      name: 'Total Campaigns', 
      value: campaigns?.length.toString() || '0', 
      change: campaigns && campaigns.length > 0 ? `${campaigns.length} active` : 'No campaigns yet', 
      icon: <Mail className="h-5 w-5" />,
      color: 'blue'
    },
    { 
      name: 'Active Contacts', 
      value: contacts?.total?.toLocaleString() || '0', 
      change: contacts?.total ? `${contacts.total} total contacts` : 'Import your first contacts', 
      icon: <Users className="h-5 w-5" />,
      color: 'green'
    },
    { 
      name: 'Email Opens', 
      value: dashboardData?.openRate ? `${Math.round(dashboardData.openRate)}%` : '0%', 
      change: dashboardData?.totalEmailsSent ? `${dashboardData.totalEmailsSent} emails sent` : 'No emails sent yet', 
      icon: <BarChart3 className="h-5 w-5" />,
      color: 'purple'
    },
    { 
      name: 'Click Rate', 
      value: dashboardData?.clickRate ? `${Math.round(dashboardData.clickRate)}%` : '0%', 
      change: dashboardData?.totalClicks ? `${dashboardData.totalClicks} total clicks` : 'No clicks yet', 
      icon: <Target className="h-5 w-5" />,
      color: 'orange'
    },
  ]

  // Handle navigation functions
  const handleCreateCampaign = () => {
    router.push('/campaigns?action=create')
  }

  const handleImportContacts = () => {
    router.push('/contacts?action=import')
  }

  const handleCreateTemplate = () => {
    router.push('/templates?action=create')
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
            {campaigns && campaigns.length > 0 ? (
              campaigns.slice(0, 3).map((campaign, index) => (
                <div key={campaign._id} className="flex items-center text-sm">
                  <div className="text-green-500 mr-3">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <span className="text-gray-600">
                    Campaign &quot;{campaign.name}&quot; - {campaign.status}
                  </span>
                  <span className="ml-auto text-gray-400">
                    {new Date(campaign._creationTime).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex items-center text-sm">
                <div className="text-gray-400 mr-3">
                  <Mail className="h-4 w-4" />
                </div>
                <span className="text-gray-600">No recent activity - create your first campaign to get started!</span>
              </div>
            )}
            {contacts?.total && contacts.total > 0 && (
              <div className="flex items-center text-sm">
                <div className="text-purple-500 mr-3">
                  <Users className="h-4 w-4" />
                </div>
                <span className="text-gray-600">{contacts.total} contacts in your database</span>
                <span className="ml-auto text-gray-400">Updated recently</span>
              </div>
            )}
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
              className="w-full text-left p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <p className="font-medium">Create New Campaign</p>
                  <p className="text-sm text-gray-600">Design and send email campaigns</p>
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
      </div>
    </div>
  )
}
