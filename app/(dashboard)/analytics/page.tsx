export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-600">
          Track the performance of your email campaigns
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📈</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data yet</h3>
          <p className="text-gray-600 mb-6">Send your first campaign to start tracking performance.</p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
            Create Campaign
          </button>
        </div>
      </div>
    </div>
  )
}
