import { v } from "convex/values";
import { mutation, query, action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";

/**
 * Email Settings Management
 * Handles custom domain configuration, email service providers, and sender settings
 */

// Get user's email settings
export const getUserEmailSettings = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user) {
      throw new Error("User not found");
    }

    const emailSettings = await ctx.db
      .query("emailSettings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    // Don't expose sensitive data in queries - mask API keys
    return emailSettings.map(setting => ({
      ...setting,
      configuration: {
        ...setting.configuration,
        apiKey: "****" + setting.configuration.apiKey.slice(-4),
        smtpPassword: setting.configuration.smtpPassword ? "****" : undefined,
      }
    }));
  },
});

// Get email settings by ID for editing
export const getEmailSettingsById = query({
  args: {
    id: v.id("emailSettings"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user) {
      throw new Error("User not found");
    }

    const emailSettings = await ctx.db.get(args.id);
    if (!emailSettings || emailSettings.userId !== user._id) {
      throw new Error("Email settings not found or access denied");
    }

    // Return settings with API key masked except for the last 4 characters
    return {
      ...emailSettings,
      configuration: {
        ...emailSettings.configuration,
        apiKey: "****" + emailSettings.configuration.apiKey.slice(-4),
      }
    };
  },
});

// Get default email settings for user
export const getDefaultEmailSettings = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user) {
      throw new Error("User not found");
    }

    const defaultSettings = await ctx.db
      .query("emailSettings")
      .withIndex("by_user_default", (q) => q.eq("userId", user._id).eq("isDefault", true))
      .first();

    if (!defaultSettings) {
      return null;
    }

    // Mask sensitive data
    return {
      ...defaultSettings,
      configuration: {
        ...defaultSettings.configuration,
        apiKey: "****" + defaultSettings.configuration.apiKey.slice(-4),
        smtpPassword: defaultSettings.configuration.smtpPassword ? "****" : undefined,
      }
    };
  },
});

// Create new email settings (Resend only)
export const createEmailSettings = mutation({
  args: {
    name: v.string(),
    provider: v.literal("resend"), // Only support Resend
    configuration: v.object({
      apiKey: v.string(),
      domain: v.string(),
      defaultFromName: v.string(),
      defaultFromEmail: v.string(),
      replyToEmail: v.optional(v.string()),
    }),
    customFromAddresses: v.optional(v.array(v.object({
      name: v.string(),
      email: v.string(),
      description: v.optional(v.string()),
      isDefault: v.boolean(),
    }))),
    makeDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user) {
      throw new Error("User not found");
    }

    // If making this default, unset other defaults first
    if (args.makeDefault) {
      const existingDefaults = await ctx.db
        .query("emailSettings")
        .withIndex("by_user_default", (q) => q.eq("userId", user._id).eq("isDefault", true))
        .collect();
      
      for (const setting of existingDefaults) {
        await ctx.db.patch(setting._id, { isDefault: false });
      }
    }

    // Encrypt sensitive data (in production, use proper encryption)
    const encryptedConfig = {
      ...args.configuration,
      apiKey: await encryptApiKey(args.configuration.apiKey),
      smtpPassword: args.configuration.smtpPassword 
        ? await encryptApiKey(args.configuration.smtpPassword)
        : undefined,
    };

    const emailSettingsId = await ctx.db.insert("emailSettings", {
      userId: user._id,
      name: args.name,
      provider: args.provider,
      configuration: encryptedConfig,
      isDefault: args.makeDefault || false,
      isActive: true,
      verificationStatus: {
        domainVerified: true,
        dkimSetup: true,
        spfSetup: true,
        dmarcSetup: true,
      },
      customFromAddresses: args.customFromAddresses || [
        {
          name: "Default",
          email: args.configuration.defaultFromEmail,
          description: "Default sender address",
          isDefault: true,
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return emailSettingsId;
  },
});

// Update email settings (Resend only)
export const updateEmailSettings = mutation({
  args: {
    id: v.id("emailSettings"),
    name: v.optional(v.string()),
    configuration: v.optional(v.object({
      apiKey: v.optional(v.string()),
      domain: v.optional(v.string()),
      defaultFromName: v.optional(v.string()),
      defaultFromEmail: v.optional(v.string()),
      replyToEmail: v.optional(v.string()),
    })),
    customFromAddresses: v.optional(v.array(v.object({
      name: v.string(),
      email: v.string(),
      description: v.optional(v.string()),
      isDefault: v.boolean(),
    }))),
    makeDefault: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user) {
      throw new Error("User not found");
    }

    const emailSettings = await ctx.db.get(args.id);
    if (!emailSettings || emailSettings.userId !== user._id) {
      throw new Error("Email settings not found or access denied");
    }

    // If making this default, unset other defaults first
    if (args.makeDefault) {
      const existingDefaults = await ctx.db
        .query("emailSettings")
        .withIndex("by_user_default", (q) => q.eq("userId", user._id).eq("isDefault", true))
        .collect();
      
      for (const setting of existingDefaults) {
        if (setting._id !== args.id) {
          await ctx.db.patch(setting._id, { isDefault: false });
        }
      }
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    if (args.makeDefault !== undefined) updates.isDefault = args.makeDefault;
    if (args.customFromAddresses !== undefined) updates.customFromAddresses = args.customFromAddresses;

    // Handle configuration updates with encryption
    if (args.configuration) {
      const currentConfig = emailSettings.configuration;
      const updatedConfig = { ...currentConfig };

      for (const [key, value] of Object.entries(args.configuration)) {
        if (value !== undefined) {
          if (key === 'apiKey' || key === 'smtpPassword') {
            (updatedConfig as any)[key] = await encryptApiKey(value as string);
          } else {
            (updatedConfig as any)[key] = value;
          }
        }
      }

      updates.configuration = updatedConfig;
    }

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

// Delete email settings
export const deleteEmailSettings = mutation({
  args: {
    id: v.id("emailSettings"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user) {
      throw new Error("User not found");
    }

    const emailSettings = await ctx.db.get(args.id);
    if (!emailSettings || emailSettings.userId !== user._id) {
      throw new Error("Email settings not found or access denied");
    }

    // Don't allow deleting the default settings if it's the only one
    if (emailSettings.isDefault) {
      const userSettings = await ctx.db
        .query("emailSettings")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
      
      if (userSettings.length === 1) {
        throw new Error("Cannot delete the only email configuration");
      }
    }

    await ctx.db.delete(args.id);
  },
});

// Test email configuration
export const testEmailConfiguration = action({
  args: {
    emailSettingsId: v.id("emailSettings"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the current user to send test email to their address
    const user = await ctx.runQuery(api.users.getCurrentUser);
    if (!user) {
      throw new Error("User not found");
    }

    // Get email settings (with full API key for testing)
    const emailSettings = await ctx.runQuery(internal.emailSettings.getEmailSettingsForSending, {
      emailSettingsId: args.emailSettingsId,
      clerkId: identity.subject,
    });

    if (!emailSettings) {
      throw new Error("Email settings not found");
    }

    try {
      // Send test email to the current user's email
      const result = await sendTestEmailResend(emailSettings, user.email);

      return {
        success: true,
        messageId: result.messageId,
        message: `Test email sent successfully to ${user.email}`,
        sentTo: user.email
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to send test email"
      };
    }
  },
});

// Get full API key for display purposes (when user clicks eye button)
export const getFullApiKey = action({
  args: {
    emailSettingsId: v.id("emailSettings"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get email settings with full API key
    const emailSettings = await ctx.runQuery(internal.emailSettings.getEmailSettingsForSending, {
      emailSettingsId: args.emailSettingsId,
      clerkId: identity.subject,
    });

    if (!emailSettings) {
      throw new Error("Email settings not found");
    }

    return {
      apiKey: emailSettings.configuration.apiKey
    };
  },
});

// Internal function to get email settings with decrypted keys for sending
export const getEmailSettingsForSending = query({
  args: {
    emailSettingsId: v.optional(v.id("emailSettings")),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    
    if (!user) {
      return null;
    }

    let emailSettings;
    if (args.emailSettingsId) {
      emailSettings = await ctx.db.get(args.emailSettingsId);
      if (!emailSettings || emailSettings.userId !== user._id) {
        return null;
      }
    } else {
      // Get default email settings
      emailSettings = await ctx.db
        .query("emailSettings")
        .withIndex("by_user_default", (q) => q.eq("userId", user._id).eq("isDefault", true))
        .first();
    }

    if (!emailSettings || !emailSettings.isActive) {
      return null;
    }

    // Decrypt sensitive data for sending
    const decryptedConfig = {
      ...emailSettings.configuration,
      apiKey: await decryptApiKey(emailSettings.configuration.apiKey),
      smtpPassword: emailSettings.configuration.smtpPassword 
        ? await decryptApiKey(emailSettings.configuration.smtpPassword)
        : undefined,
    };

    return {
      ...emailSettings,
      configuration: decryptedConfig,
    };
  },
});

// Verify domain settings
export const verifyDomainSettings = action({
  args: {
    emailSettingsId: v.id("emailSettings"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get email settings to check domain
    const emailSettings = await ctx.runQuery(internal.emailSettings.getEmailSettingsForSending, {
      emailSettingsId: args.emailSettingsId,
      clerkId: identity.subject,
    });

    if (!emailSettings) {
      throw new Error("Email settings not found");
    }

    const domain = emailSettings.configuration.domain;
    console.log(`Verifying domain: ${domain}`);

    try {
      // Check domain verification status with Resend API
      const domainResponse = await fetch(`https://api.resend.com/domains/${domain}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${emailSettings.configuration.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      let domainVerified = false;
      let dkimSetup = false;
      let spfSetup = false;
      let dmarcSetup = false;
      let issues: string[] = [];

      if (domainResponse.ok) {
        const domainData = await domainResponse.json();
        console.log('Resend domain data:', domainData);
        
        domainVerified = domainData.status === 'verified';
        
        // Check DNS records if available
        if (domainData.records) {
          const records = domainData.records;
          
          // Check DKIM
          const dkimRecord = records.find((r: any) => r.record_type === 'CNAME' && r.name.includes('_domainkey'));
          dkimSetup = dkimRecord ? dkimRecord.status === 'verified' : false;
          
          // Check SPF
          const spfRecord = records.find((r: any) => r.record_type === 'TXT' && r.value.includes('v=spf1'));
          spfSetup = spfRecord ? spfRecord.status === 'verified' : false;
          
          // Check DMARC
          const dmarcRecord = records.find((r: any) => r.record_type === 'TXT' && r.name.includes('_dmarc'));
          dmarcSetup = dmarcRecord ? dmarcRecord.status === 'verified' : false;
          
          // Collect issues
          records.forEach((record: any) => {
            if (record.status !== 'verified') {
              issues.push(`${record.record_type} record not verified: ${record.name}`);
            }
          });
        }
      } else {
        // Log the specific error from Resend API
        const errorText = await domainResponse.text();
        console.log(`Resend domain API failed with status ${domainResponse.status}:`, errorText);
        
        // For API permission issues, we'll proceed with manual DNS checks
        // and only show informational messages, not errors
        let apiLimitationMessage = '';
        
        if (domainResponse.status === 404) {
          apiLimitationMessage = `Domain "${domain}" not found in Resend account. This may be normal if using a sending-only API key.`;
        } else if (domainResponse.status === 401 || domainResponse.status === 403) {
          // These are expected with sending-only API keys
          apiLimitationMessage = 'Using sending-only API key. Domain verification will be performed via DNS checks.';
        } else if (domainResponse.status === 422) {
          apiLimitationMessage = `Domain format issue with Resend API. Performing manual verification for "${domain}".`;
        } else {
          apiLimitationMessage = `Resend API access limited (${domainResponse.status}). Using manual DNS verification.`;
        }
        
        // Always perform manual DNS checks when API access is limited
        console.log('Performing manual DNS checks due to API limitations');
        
        const dnsResults = await performManualDNSChecks(domain);
        domainVerified = dnsResults.domainExists;
        spfSetup = dnsResults.hasSpf;
        dmarcSetup = dnsResults.hasDmarc;
        dkimSetup = dnsResults.hasDkim;
        
        // Add the API limitation as an informational note, not an error
        if (dnsResults.domainExists && dnsResults.hasDkim) {
          issues.push(`ℹ️ ${apiLimitationMessage} DNS verification successful.`);
        } else {
          issues.push(`ℹ️ ${apiLimitationMessage}`);
        }
        
        // Add actual DNS issues if any
        issues = [...issues, ...dnsResults.issues];
      }

      // Ensure all verification fields are set with default values
      // Domain is considered fully verified if Domain, DKIM, and SPF are verified
      // DMARC is optional but recommended
      const coreVerified = domainVerified && dkimSetup && spfSetup;
      
      const verificationStatus = {
        domainVerified: domainVerified || false,
        dkimSetup: dkimSetup || false,
        spfSetup: spfSetup || false,
        dmarcSetup: dmarcSetup || false,
      };

      // Update verification status in database
      await ctx.runMutation(internal.emailSettings.updateVerificationStatus, {
        emailSettingsId: args.emailSettingsId,
        verificationStatus
      });

      return {
        ...verificationStatus,
        lastVerified: Date.now(),
        issues
      };
    } catch (error: any) {
      console.error('Domain verification error:', error);
      
      // Ensure all verification fields are set to false on error
      const verificationStatus = {
        domainVerified: false,
        dkimSetup: false,
        spfSetup: false,
        dmarcSetup: false,
      };

      // Try to update verification status even on error
      try {
        await ctx.runMutation(internal.emailSettings.updateVerificationStatus, {
          emailSettingsId: args.emailSettingsId,
          verificationStatus
        });
      } catch (updateError) {
        console.error('Failed to update verification status on error:', updateError);
      }

      return {
        ...verificationStatus,
        lastVerified: Date.now(),
        issues: [`Verification failed: ${error.message}`]
      };
    }
  },
});

// Helper function to perform manual DNS checks
async function performManualDNSChecks(domain: string) {
  const issues: string[] = [];
  let domainExists = false;
  let hasSpf = false;
  let hasDmarc = false;
  let hasDkim = false;

  console.log(`Starting manual DNS checks for domain: ${domain}`);

  try {
    // Use a public DNS-over-HTTPS service to check records
    const dnsApiBase = 'https://dns.google/resolve';
    
    // Check if domain exists (A record)
    try {
      console.log(`Checking A record for ${domain}`);
      const aRecordResponse = await fetch(`${dnsApiBase}?name=${domain}&type=A`);
      if (aRecordResponse.ok) {
        const aData = await aRecordResponse.json();
        domainExists = aData.Answer && aData.Answer.length > 0;
        if (domainExists) {
          console.log(`✓ Domain ${domain} has A record`);
        } else {
          console.log(`✗ Domain ${domain} has no A record`);
          issues.push('Domain does not have A record (domain not accessible)');
        }
      }
    } catch (error) {
      console.error('A record check failed:', error);
      issues.push('Failed to check A record');
    }

    // Check SPF record - check both root domain and send subdomain
    try {
      console.log(`Checking SPF record for ${domain}`);
      const spfResponse = await fetch(`${dnsApiBase}?name=${domain}&type=TXT`);
      if (spfResponse.ok) {
        const spfData = await spfResponse.json();
        if (spfData.Answer) {
          const spfRecords = spfData.Answer.filter((record: any) => 
            record.data && record.data.includes('v=spf1')
          );
          hasSpf = spfRecords.length > 0;
          
          if (hasSpf) {
            console.log(`✓ Found SPF record: ${spfRecords[0].data}`);
            // Check if it includes Resend
            const includesResend = spfRecords.some((record: any) => 
              record.data.includes('_spf.resend.com')
            );
            if (!includesResend) {
              const currentProvider = spfRecords[0].data.match(/include:([^\s]+)/)?.[1] || 'unknown service';
              if (currentProvider.includes('amazonses')) {
                issues.push(`SPF record is configured for Amazon SES (${currentProvider}). To use Resend, update the SPF record to: "v=spf1 include:_spf.resend.com ~all"`);
              } else {
                issues.push('SPF record found but does not include Resend (_spf.resend.com)');
              }
            }
          }
        }
      }
      
      // Also check send subdomain if root domain doesn't have SPF
      if (!hasSpf) {
        console.log(`Checking SPF record for send.${domain}`);
        const sendSpfResponse = await fetch(`${dnsApiBase}?name=send.${domain}&type=TXT`);
        if (sendSpfResponse.ok) {
          const sendSpfData = await sendSpfResponse.json();
          if (sendSpfData.Answer) {
            const sendSpfRecords = sendSpfData.Answer.filter((record: any) => 
              record.data && record.data.includes('v=spf1')
            );
            
            if (sendSpfRecords.length > 0) {
              hasSpf = true;
              console.log(`✓ Found SPF record on send subdomain: ${sendSpfRecords[0].data}`);
              
              const includesResend = sendSpfRecords.some((record: any) => 
                record.data.includes('_spf.resend.com')
              );
              if (!includesResend) {
                const currentProvider = sendSpfRecords[0].data.match(/include:([^\s]+)/)?.[1] || 'unknown service';
                if (currentProvider.includes('amazonses')) {
                  issues.push(`SPF record is configured for Amazon SES (${currentProvider}). To use Resend, update the SPF record to: "v=spf1 include:_spf.resend.com ~all"`);
                } else {
                  issues.push(`SPF record found on send subdomain but includes '${currentProvider}' instead of Resend (_spf.resend.com). Update to include Resend.`);
                }
              }
            }
          }
        }
      }
      
      if (!hasSpf) {
        console.log(`✗ No SPF record found for ${domain} or send.${domain}`);
        issues.push('SPF record not found - add TXT record: "v=spf1 include:_spf.resend.com ~all"');
      }
    } catch (error) {
      console.error('SPF record check failed:', error);
      issues.push('Failed to check SPF record');
    }

    // Check DMARC record (recommended but optional)
    try {
      console.log(`Checking DMARC record for _dmarc.${domain}`);
      const dmarcResponse = await fetch(`${dnsApiBase}?name=_dmarc.${domain}&type=TXT`);
      if (dmarcResponse.ok) {
        const dmarcData = await dmarcResponse.json();
        if (dmarcData.Answer) {
          const dmarcRecords = dmarcData.Answer.filter((record: any) => 
            record.data && record.data.includes('v=DMARC1')
          );
          hasDmarc = dmarcRecords.length > 0;
          
          if (hasDmarc) {
            console.log(`✓ Found DMARC record: ${dmarcRecords[0].data}`);
          } else {
            console.log(`ℹ️ No DMARC record found for _dmarc.${domain} (optional but recommended)`);
            // DMARC is optional - add as info, not an issue that prevents verification
          }
        }
      }
    } catch (error) {
      console.error('DMARC record check failed:', error);
      // Don't add DMARC failures as blocking issues
    }

    // Check DKIM record (Resend specific) - check both TXT and CNAME types
    try {
      console.log(`Checking DKIM record for resend._domainkey.${domain}`);
      
      // First check for TXT record (Resend's preferred method)
      const dkimTxtResponse = await fetch(`${dnsApiBase}?name=resend._domainkey.${domain}&type=TXT`);
      if (dkimTxtResponse.ok) {
        const dkimTxtData = await dkimTxtResponse.json();
        const hasTxtRecord = dkimTxtData.Answer && dkimTxtData.Answer.length > 0;
        
        if (hasTxtRecord) {
          hasDkim = true;
          console.log(`✓ Found DKIM TXT record: ${dkimTxtData.Answer[0].data}`);
        }
      }
      
      // If no TXT found, check for CNAME record (alternative method)
      if (!hasDkim) {
        console.log(`Checking DKIM CNAME record for resend._domainkey.${domain}`);
        const dkimCnameResponse = await fetch(`${dnsApiBase}?name=resend._domainkey.${domain}&type=CNAME`);
        
        if (dkimCnameResponse.ok) {
          const dkimCnameData = await dkimCnameResponse.json();
          hasDkim = dkimCnameData.Answer && dkimCnameData.Answer.length > 0;
          
          if (hasDkim) {
            console.log(`✓ Found DKIM CNAME record: ${dkimCnameData.Answer[0].data}`);
          }
        }
      }
      
      if (!hasDkim) {
        console.log(`✗ No DKIM record found for resend._domainkey.${domain}`);
        issues.push(`DKIM record not found - add TXT record: resend._domainkey.${domain} with the value from your Resend dashboard`);
      }
    } catch (error) {
      console.error('DKIM record check failed:', error);
      issues.push('Failed to check DKIM record');
    }

  } catch (error: any) {
    console.error('DNS check failed:', error);
    issues.push(`DNS check failed: ${error.message}`);
  }

  console.log(`DNS check results for ${domain}:`, {
    domainExists,
    hasSpf,
    hasDmarc,
    hasDkim,
    issuesCount: issues.length
  });

  return {
    domainExists,
    hasSpf,
    hasDmarc,
    hasDkim,
    issues
  };
}

// Internal mutation to update verification status
export const updateVerificationStatus = internalMutation({
  args: {
    emailSettingsId: v.id("emailSettings"),
    verificationStatus: v.object({
      domainVerified: v.boolean(),
      dkimSetup: v.boolean(),
      spfSetup: v.boolean(),
      dmarcSetup: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.emailSettingsId, {
      verificationStatus: args.verificationStatus,
      updatedAt: Date.now(),
    });
  },
});

// Helper functions for encryption (simplified - use proper encryption in production)
async function encryptApiKey(key: string): Promise<string> {
  // In production, use proper encryption like crypto.subtle or a secure library
  // For now, just base64 encode using btoa (NOT SECURE - just for demo)
  return btoa(key);
}

async function decryptApiKey(encryptedKey: string): Promise<string> {
  // In production, decrypt using the same method used for encryption
  return atob(encryptedKey);
}

// Email sending helper functions
async function sendTestEmailResend(emailSettings: any, testEmail: string) {
  console.log('Sending test email with settings:', {
    domain: emailSettings.configuration.domain,
    fromEmail: emailSettings.configuration.defaultFromEmail,
    fromName: emailSettings.configuration.defaultFromName,
    toEmail: testEmail,
    hasApiKey: !!emailSettings.configuration.apiKey
  });

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${emailSettings.configuration.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${emailSettings.configuration.defaultFromName} <${emailSettings.configuration.defaultFromEmail}>`,
      to: [testEmail],
      subject: 'Test Email from SmartBatch',
      html: `
        <h2>Email Configuration Test</h2>
        <p>This is a test email from your SmartBatch email configuration.</p>
        <p><strong>Provider:</strong> Resend</p>
        <p><strong>Domain:</strong> ${emailSettings.configuration.domain}</p>
        <p><strong>From:</strong> ${emailSettings.configuration.defaultFromEmail}</p>
        <p><strong>To:</strong> ${testEmail}</p>
        <p>If you received this email, your configuration is working correctly!</p>
        <hr>
        <p><small>Test sent at: ${new Date().toISOString()}</small></p>
      `,
    }),
  });

  console.log('Resend API response status:', response.status);

  if (!response.ok) {
    const error = await response.text();
    console.error('Resend API error:', error);
    throw new Error(`Resend API error (${response.status}): ${error}`);
  }

  const result = await response.json();
  console.log('Resend API success result:', result);
  return { messageId: result.id };
}

// Get all API keys for a user (alias for compatibility)
export const list = getUserEmailSettings;
