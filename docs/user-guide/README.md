# User Guide

## Getting Started with GDPR Compliance

This guide will help you understand and use the GDPR compliance features in SmartBatch Email Marketing.

## Table of Contents

1. [Overview](#overview)
2. [Consent Management](#consent-management)
3. [Data Subject Rights](#data-subject-rights)
4. [Compliance Dashboard](#compliance-dashboard)
5. [Reports and Auditing](#reports-and-auditing)
6. [Best Practices](#best-practices)

## Overview

The GDPR compliance system helps you:
- Manage consent for all contacts
- Handle data subject rights requests
- Monitor compliance status
- Generate audit reports
- Maintain data protection standards

## Consent Management

### Recording Consent

When a contact provides consent, you need to record it properly:

1. **Navigate to Contacts** → Select a contact
2. **Click "Manage Consent"**
3. **Fill out the consent form:**
   - **Consent Type**: Marketing, Analytics, Functional, or Necessary
   - **Source**: Where consent was obtained (e.g., "Website form", "Email", "Phone")
   - **Legal Basis**: Usually "Consent" for marketing emails
   - **Details**: Any additional information

4. **Click "Record Consent"**

### Consent Types

- **Marketing**: Email campaigns, newsletters, promotional content
- **Analytics**: Tracking and analyzing user behavior
- **Functional**: Features that enhance user experience
- **Necessary**: Essential for basic platform functionality

### Withdrawing Consent

Contacts can withdraw consent at any time:

1. **Find the contact** with active consent
2. **Click "Manage Consent"**
3. **Find the consent** you want to withdraw
4. **Click "Withdraw"**
5. **Provide a reason** (optional but recommended)
6. **Confirm withdrawal**

⚠️ **Important**: Once consent is withdrawn, you cannot send marketing emails to that contact until they provide consent again.

## Data Subject Rights

### Handling Data Requests

Under GDPR, individuals have several rights regarding their personal data:

#### Right of Access
Individuals can request to know what personal data you hold about them.

**To process an access request:**
1. Go to **GDPR** → **Data Requests**
2. Click **"New Request"**
3. Enter the **contact's email**
4. Select **"Data Access"** as request type
5. Add any **relevant details**
6. Click **"Submit Request"**

#### Right to Data Portability
Individuals can request their data in a portable format.

**To process a portability request:**
1. Submit the request as above, selecting **"Data Portability"**
2. The system will generate a **secure download link**
3. Send the link to the individual
4. Mark the request as **"Completed"**

#### Right to Rectification
Individuals can request correction of inaccurate data.

**To process a rectification request:**
1. Submit the request selecting **"Data Rectification"**
2. **Update the contact's information** as requested
3. **Document the changes** in the request notes
4. Mark as **"Completed"**

#### Right to Erasure (Right to be Forgotten)
Individuals can request deletion of their personal data.

**To process a deletion request:**
1. Submit the request selecting **"Data Deletion"**
2. **Review legal obligations** - some data may need to be retained
3. If deletion is appropriate, the system will:
   - Remove personal data
   - Anonymize historical records
   - Update audit logs
4. Mark as **"Completed"**

### Request Timeline

- **Initial Response**: Within 72 hours
- **Full Response**: Within 30 days
- **Complex Requests**: May be extended to 60 days with notification

## Compliance Dashboard

The compliance dashboard provides an overview of your GDPR status:

### Key Metrics

- **Consent Rate**: Percentage of contacts with active consent
- **Request Volume**: Number of data subject requests
- **Response Time**: Average time to process requests
- **Compliance Score**: Overall compliance rating (0-100)

### Consent Statistics

- **Total Consents**: All consent records
- **Active Consents**: Currently valid consents
- **Withdrawn Consents**: Consents that have been withdrawn
- **By Type**: Breakdown by consent type (marketing, analytics, etc.)

### Request Statistics

- **Pending**: Requests awaiting processing
- **Processing**: Requests currently being handled
- **Completed**: Successfully processed requests
- **Rejected**: Requests that couldn't be fulfilled

## Reports and Auditing

### Generating Reports

1. Go to **GDPR** → **Reports**
2. Select **report type:**
   - Compliance Summary
   - Consent Report
   - Request Log
   - Audit Trail
3. Choose **date range**
4. Click **"Generate Report"**
5. Download or view the report

### Audit Logs

All GDPR-related activities are automatically logged:
- Consent changes
- Data requests
- Data access/modifications
- System changes

**To view audit logs:**
1. Go to **GDPR** → **Audit Logs**
2. Filter by date, user, or event type
3. Export logs if needed for compliance audits

## Best Practices

### Consent Collection

✅ **Do:**
- Use clear, plain language
- Specify what you'll use the data for
- Make consent optional (not pre-checked)
- Keep records of when and how consent was obtained
- Provide easy withdrawal options

❌ **Don't:**
- Use confusing or legal jargon
- Bundle consent with other terms
- Make consent mandatory for basic services
- Pre-check consent boxes
- Hide withdrawal options

### Data Minimization

✅ **Collect only necessary data:**
- Ask only for information you actually need
- Regular review and deletion of unused data
- Implement data retention policies
- Anonymize data when possible

### Response Management

✅ **Timely responses:**
- Acknowledge requests within 72 hours
- Set up automated confirmations
- Track response deadlines
- Communicate delays if necessary

### Documentation

✅ **Keep detailed records:**
- Document all consent interactions
- Maintain request processing logs
- Record data processing activities
- Update privacy policies regularly

## Troubleshooting

### Common Issues

**Q: Contact says they didn't give consent, but our records show they did**
A: Check the consent source and timestamp. Provide evidence of when and how consent was obtained. If there's any doubt, consider the consent invalid.

**Q: How long do we keep withdrawn consent records?**
A: Withdrawn consent records are kept for 1 year for legal protection, then automatically deleted.

**Q: Can we send transactional emails to contacts without marketing consent?**
A: Yes, transactional emails (order confirmations, password resets, etc.) don't require marketing consent as they're necessary for the service.

**Q: What if we can't fulfill a data deletion request?**
A: Document why deletion isn't possible (legal requirements, etc.) and communicate this to the individual. You may need to anonymize instead of delete.

## Getting Help

- **In-app Help**: Click the help icon (?) next to any feature
- **Documentation**: Complete guides at docs.smartbatch.com
- **Support**: Contact support@smartbatch.com for assistance
- **Training**: Schedule a training session with our team

## Compliance Checklist

Use this checklist to ensure ongoing compliance:

### Daily
- [ ] Monitor compliance dashboard
- [ ] Review new data requests
- [ ] Check for consent changes

### Weekly
- [ ] Process pending requests
- [ ] Review compliance score
- [ ] Update request statuses

### Monthly
- [ ] Generate compliance report
- [ ] Review audit logs
- [ ] Update documentation
- [ ] Review data retention policies

### Quarterly
- [ ] Comprehensive compliance audit
- [ ] Staff training update
- [ ] Policy review and updates
- [ ] Third-party vendor assessment
