"use client";

import { useUser } from '@clerk/nextjs'
import { useEffect } from 'react'
import { useCurrentUser, useEnsureUser } from '@/lib/convex-hooks'

const stats = [
  { name: 'Total Campaigns', value: '12', change: '+2 from last month', icon: '📧' },
  { name: 'Active Contacts', value: '1,234', change: '+12% from last month', icon: '👥' },
  { name: 'Email Opens', value: '89%', change: '+2.1% from last month', icon: '📊' },
  { name: 'Click Rate', value: '24%', change: '+1.8% from last month', icon: '🎯' },
]

export default function DashboardPage() {
  const { user: clerkUser } = useUser()
  const convexUser = useCurrentUser()
  const ensureUser = useEnsureUser()

  // Sync Clerk user with Convex database
  useEffect(() => {
    if (clerkUser && !convexUser) {
      ensureUser({
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: clerkUser.fullName || clerkUser.emailAddresses[0]?.emailAddress || '',
      })
    }
  }, [clerkUser, convexUser, ensureUser])

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
              <div className="text-2xl mr-4">{stat.icon}</div>
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
              <div className="text-green-500 mr-3">✓</div>
              <span className="text-gray-600">Campaign &quot;Summer Sale&quot; sent to 500 contacts</span>
              <span className="ml-auto text-gray-400">2 hours ago</span>
            </div>
            <div className="flex items-center text-sm">
              <div className="text-blue-500 mr-3">📧</div>
              <span className="text-gray-600">New template &quot;Welcome Series&quot; created</span>
              <span className="ml-auto text-gray-400">1 day ago</span>
            </div>
            <div className="flex items-center text-sm">
              <div className="text-purple-500 mr-3">👥</div>
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
            <button className="w-full text-left p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <span className="text-blue-500 mr-3">📧</span>
                <div>
                  <p className="font-medium">Create New Campaign</p>
                  <p className="text-sm text-gray-600">Design and send email campaigns</p>
                </div>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <span className="text-green-500 mr-3">👥</span>
                <div>
                  <p className="font-medium">Import Contacts</p>
                  <p className="text-sm text-gray-600">Add contacts to your list</p>
                </div>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <span className="text-purple-500 mr-3">📝</span>
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
              <span className="font-medium">Free</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Emails sent this month</span>
              <span className="font-medium">1,234 / 10,000</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '12.34%' }}></div>
            </div>
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
              Upgrade Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
