# Intelligent Email Scheduling System

This document provides a comprehensive overview of the intelligent email scheduling system implemented in the SmartBatch Email platform.

## Overview

The intelligent email scheduling system provides advanced campaign scheduling capabilities including:

- **Immediate sending** - Send campaigns right away
- **Scheduled sending** - Schedule campaigns for specific dates and times
- **Recurring campaigns** - Set up campaigns that repeat on daily, weekly, or monthly patterns
- **Optimal timing** - AI-powered analysis to determine the best send times based on recipient engagement
- **Timezone optimization** - Automatically adjust send times for different timezones
- **ISP throttling** - Respect rate limits for different email providers
- **Priority queue management** - Prioritize high-importance emails

## Architecture

### Database Schema

#### Enhanced `campaigns` Table
- Added `scheduleSettings` object with comprehensive scheduling configuration
- Supports all scheduling types with timezone and rate limiting settings

#### New Tables
- **`campaignSchedules`** - Manages recurring campaign instances
- **`sendRateConfigs`** - ISP-specific rate limiting configurations
- **`timezoneProfiles`** - Timezone analysis and recipient engagement patterns

#### Enhanced `contacts` Table
- Added timezone detection and engagement profile tracking
- Stores optimal send time preferences for each contact

### Backend Services

#### `emailScheduler.ts`
Core scheduling logic with the following key functions:

- `updateCampaignScheduleSettings` - Configure campaign scheduling
- `calculateOptimalSendTimes` - AI-powered timing analysis
- `generateRecurringSchedules` - Create recurring campaign instances
- `getISPSendRates` - Analyze email provider distribution
- `analyzeRecipientEngagement` - Track engagement patterns
- `updateTimezoneProfiles` - Automated timezone detection
- `updateISPSendRates` - Dynamic rate limit adjustments

#### Enhanced `crons.ts`
Automated scheduled functions:

- **Every minute**: Process scheduled emails
- **Every 30 seconds**: Process priority queue
- **Daily at 1 AM UTC**: Update timezone profiles
- **Daily at 2 AM UTC**: Clean up old email data
- **Daily at 3 AM UTC**: Update ISP send rates

#### Enhanced `emailService.ts`
- Added priority queue processing
- Enhanced email queue management with priority levels
- Integrated with scheduling system for automated processing

### Frontend Components

#### `SchedulingInterface.tsx`
Main scheduling configuration interface with tabs for:
- **Immediate** - Send right away with rate limiting
- **Scheduled** - Date/time picker with timezone selection
- **Recurring** - Pattern configuration (daily/weekly/monthly)
- **Optimal** - AI-powered timing analysis and recommendations

#### `ScheduleManagement.tsx`
Comprehensive dashboard for managing scheduled campaigns:
- View all scheduled campaigns with filtering and sorting
- Bulk actions (pause, resume, cancel, reschedule)
- Real-time statistics and performance metrics
- Timeline view of upcoming scheduled sends

#### `TimezoneCalendar.tsx`
Advanced calendar picker with:
- Timezone-aware date/time selection
- Visual indicators for optimal send times
- Integration with recipient timezone analysis
- Conflict detection and recommendations

#### `OptimalTimingAnalyzer.tsx`
AI-powered timing analysis tool:
- Engagement heatmaps showing best send times
- ISP-specific recommendations
- Historical performance analysis
- Real-time optimization suggestions

## Usage

### Creating a Scheduled Campaign

1. **Basic Campaign Setup**
   - Navigate to Campaigns → Create New Campaign
   - Fill in campaign details (name, subject, content, recipients)

2. **Schedule Configuration**
   - Go to the "Schedule" tab
   - For new campaigns: Basic scheduling options available
   - For saved campaigns: Full advanced scheduling interface

3. **Advanced Scheduling Options**
   - **Immediate**: Send with rate limiting and ISP throttling
   - **Scheduled**: Pick specific date/time with timezone optimization
   - **Recurring**: Set up daily/weekly/monthly patterns
   - **Optimal**: Let AI determine the best send times

### Managing Scheduled Campaigns

1. **Schedule Management Dashboard**
   - Navigate to Campaigns → Schedule Management
   - View all scheduled campaigns in one place
   - Filter by status, type, or date range

2. **Bulk Actions**
   - Select multiple campaigns
   - Pause, resume, cancel, or reschedule in bulk
   - Monitor performance metrics

3. **Individual Campaign Management**
   - Edit scheduling settings
   - View detailed analytics
   - Adjust recurring patterns

### Testing the System

Navigate to Campaigns → Test Scheduling to:
- View system status and component health
- See campaign distribution by scheduling type
- Verify all features are working correctly
- Monitor current user information

## Configuration

### Rate Limiting

The system automatically configures rate limits for major ISPs:
- **Gmail**: 100 emails/hour, 2000/day
- **Outlook**: 80 emails/hour, 1500/day  
- **Yahoo**: 60 emails/hour, 1000/day
- **Other**: 40 emails/hour, 800/day

### Timezone Detection

The system automatically detects recipient timezones based on:
- Email engagement patterns
- Peak activity hours
- IP address analysis (when available)

### Optimal Timing Algorithm

The AI timing analyzer considers:
- Historical open/click rates by time
- Recipient timezone and local business hours
- Day of week preferences
- ISP-specific delivery patterns
- Campaign subject line and content type

## Monitoring and Analytics

### Real-time Metrics
- Campaign send progress
- Delivery success rates
- Engagement tracking (opens, clicks)
- ISP-specific performance

### Schedule Performance
- On-time delivery rates
- Optimal timing accuracy
- Recurring campaign success
- Queue processing efficiency

### System Health
- Cron job execution status
- Database performance
- API response times
- Error rates and debugging

## Troubleshooting

### Common Issues

1. **Campaigns not sending at scheduled time**
   - Check cron job execution in Convex dashboard
   - Verify campaign status is 'active'
   - Ensure scheduled time is in the future

2. **Timezone issues**
   - Verify timezone detection is working
   - Check recipient timezone profiles
   - Validate local time calculations

3. **Rate limiting problems**
   - Monitor ISP send rate configurations
   - Check for temporary blocks or delays
   - Adjust rate limits if needed

### Debug Mode

Enable detailed logging by:
1. Adding console.log statements to key functions
2. Monitoring Convex function logs
3. Using the test scheduling page for system validation

## Future Enhancements

### Planned Features
- Machine learning-based engagement prediction
- A/B testing for optimal send times
- Advanced segmentation based on engagement patterns
- Integration with external calendar systems
- Mobile app notifications for schedule management

### Performance Optimizations
- Caching of timezone and ISP configurations
- Batch processing improvements
- Real-time queue monitoring
- Enhanced error handling and retry logic

## API Reference

### Key Functions

#### Mutations
- `updateCampaignScheduleSettings(campaignId, settings)` - Configure campaign scheduling
- `generateRecurringSchedules(campaignId, settings)` - Create recurring instances
- `analyzeRecipientEngagement(userId)` - Update engagement profiles

#### Queries
- `getScheduledCampaigns(userId, filters)` - Retrieve scheduled campaigns
- `calculateOptimalSendTimes(campaignId, options)` - Get timing recommendations
- `getISPSendRates(userId)` - Get current rate configurations

#### Internal Functions (Cron Jobs)
- `scheduleQueuedEmails()` - Process ready emails
- `processPriorityQueue()` - Handle high-priority emails
- `updateTimezoneProfiles()` - Refresh timezone data
- `updateISPSendRates()` - Update rate configurations

## Support

For issues or questions about the email scheduling system:
1. Check the test scheduling page for system status
2. Review Convex function logs for errors
3. Consult this documentation for configuration details
4. Monitor the schedule management dashboard for campaign issues

---

*Last updated: July 2025*
*Version: 1.0.0*
