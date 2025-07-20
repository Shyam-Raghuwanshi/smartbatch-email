export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Settings
        </h2>
        <p className="mt-2 text-sm text-gray-700">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Account Settings
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Configure your account preferences and notification settings.</p>
          </div>
          <div className="mt-5">
            <p className="text-sm text-gray-500">Settings panel coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
