# Google Sheets Auto-Sync Implementation

## Overview

This implementation adds automatic data fetching for connected Google Sheets integrations with configurable sync intervals. The system automatically polls Google Sheets for new data and syncs it to the local database.

## Features

### 1. **Automatic Polling System**
- **Cron Job**: Runs every 5 minutes to check for due syncs
- **Configurable Intervals**: Users can set sync frequency (15min, 30min, hourly, daily, weekly)
- **Smart Scheduling**: Uses exponential backoff for failed attempts
- **Retry Logic**: Automatic retries with configurable limits (max 3 attempts)

### 2. **Polling Configuration**
- **Auto-Setup**: Polling settings are automatically created when Google Sheets integration is connected
- **Default Settings**: 1-hour interval by default for new connections
- **User Control**: Full control over sync frequency through settings UI

### 3. **User Interface**
- **Settings Page**: Dedicated tab for managing auto-sync settings (`/settings?tab=integrations`)
- **Integration Overview**: New integrations page at `/integrations-overview`
- **Status Indicators**: Real-time status badges showing sync state
- **Sync History**: Track of recent sync activities and results

## Technical Implementation

### Database Schema
- **`integrationPollingSettings`**: Stores polling configuration per integration
- **`integrationSyncs`**: Tracks sync history and results

### Key Files

#### Backend (Convex)
- **`convex/integrationPolling.ts`**: Core polling logic and settings management
- **`convex/crons.ts`**: Cron job for processing polling queue
- **`convex/integrations.ts`**: Auto-creates polling settings when integration connects
- **`convex/googleSheetsIntegration.ts`**: Existing Google Sheets sync functionality

#### Frontend (React/Next.js)
- **`components/settings/IntegrationPollingSettings.tsx`**: Settings UI for individual integrations
- **`components/integrations/AutoSyncStatus.tsx`**: Status badges and indicators
- **`components/integrations/GoogleSheetsStatus.tsx`**: Google Sheets specific status display
- **`app/(dashboard)/settings/page.tsx`**: Main settings page with polling settings tab
- **`app/(dashboard)/integrations-overview/page.tsx`**: New integrations overview page

## Configuration Options

### Sync Frequencies
- **15 Minutes**: For high-frequency updates
- **30 Minutes**: Regular updates
- **1 Hour**: Default setting, balanced approach
- **Daily**: For less frequently changing data
- **Weekly**: For static or rarely changing data

### Polling Settings
```typescript
interface PollingSettings {
  enabled: boolean;          // Enable/disable auto-sync
  frequency: FrequencyType;  // Sync interval
  intervalMinutes: number;   // Actual interval in minutes
  nextPollAt?: number;       // Next scheduled sync time
  lastPolledAt?: number;     // Last sync time
  retryCount: number;        // Current retry count
  maxRetries: number;        // Maximum retry attempts (default: 3)
}
```

## How It Works

### 1. **Connection Setup**
1. User connects Google Sheets integration
2. Integration status is set to "connected"
3. Default polling settings are automatically created (1-hour interval)
4. First sync is scheduled for 1 hour from connection time

### 2. **Automatic Polling**
1. Cron job runs every 5 minutes
2. Queries for integrations with `nextPollAt <= now` and `enabled = true`
3. Processes each due integration:
   - Calls existing `syncContactsFromSheets` function
   - Updates polling status based on success/failure
   - Schedules next poll or handles retries

### 3. **Error Handling**
1. **Success**: Reset retry count, schedule next sync
2. **Failure**: Increment retry count, schedule retry with exponential backoff
3. **Max Retries**: Disable polling, log error, notify user

### 4. **User Management**
1. Users can view all polling settings in `/settings?tab=integrations`
2. Enable/disable auto-sync per integration
3. Change sync frequency
4. View sync history and status
5. Manual sync still available

## Usage

### For Users
1. **Connect Google Sheets**: Use existing integration flow
2. **Auto-sync is enabled**: By default with 1-hour interval
3. **Customize settings**: Go to Settings > Integration Settings
4. **Monitor status**: Check integration overview or settings page

### For Developers
1. **Add new integration types**: Extend polling logic in `integrationPolling.ts`
2. **Customize intervals**: Add new frequency options
3. **Monitor performance**: Check cron job logs and sync history
4. **Handle errors**: Polling system includes comprehensive error handling

## Monitoring

### Sync History
- Track all sync attempts with timestamps
- Record success/failure status
- Store contact counts and error details
- Available in both API and UI

### Status Indicators
- **Active**: Auto-sync enabled and working
- **Manual**: Auto-sync disabled
- **Error**: Failed syncs, retry in progress
- **Next sync**: Time until next scheduled sync

### Error Handling
- Failed syncs trigger exponential backoff
- After 3 failures, polling is disabled
- Users are notified through UI status indicators
- Detailed error logs available

## Benefits

1. **Always Up-to-Date**: Data is automatically synced without user intervention
2. **Configurable**: Users control sync frequency based on their needs
3. **Reliable**: Built-in retry logic and error handling
4. **Transparent**: Clear status indicators and sync history
5. **Efficient**: Smart scheduling prevents unnecessary API calls
6. **Scalable**: Designed to handle multiple integrations per user

## Future Enhancements

1. **Webhook Support**: Real-time updates instead of polling
2. **Selective Sync**: Choose specific sheets or data ranges
3. **Conflict Resolution**: Handle concurrent edits
4. **Custom Schedules**: Time-based scheduling (e.g., business hours only)
5. **Integration Analytics**: Detailed sync performance metrics
