import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'SmartBatch Email Marketing',
  description: 'Comprehensive GDPR-compliant email marketing platform',
  base: '/docs/',

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }]
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'User Guide', link: '/user-guide/' },
      { text: 'API Docs', link: '/api/' },
      { text: 'Developer Guide', link: '/developer/' },
      { text: 'Deployment', link: '/deployment/' }
    ],

    sidebar: {
      '/user-guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/user-guide/' },
            { text: 'Quick Start', link: '/user-guide/quick-start' },
            { text: 'Dashboard Overview', link: '/user-guide/dashboard' }
          ]
        },
        {
          text: 'GDPR Compliance',
          items: [
            { text: 'Overview', link: '/user-guide/gdpr/' },
            { text: 'Consent Management', link: '/user-guide/gdpr/consent' },
            { text: 'Data Requests', link: '/user-guide/gdpr/data-requests' },
            { text: 'Compliance Dashboard', link: '/user-guide/gdpr/dashboard' }
          ]
        },
        {
          text: 'Email Campaigns',
          items: [
            { text: 'Creating Campaigns', link: '/user-guide/campaigns/creation' },
            { text: 'Templates', link: '/user-guide/campaigns/templates' },
            { text: 'Scheduling', link: '/user-guide/campaigns/scheduling' },
            { text: 'Analytics', link: '/user-guide/campaigns/analytics' }
          ]
        },
        {
          text: 'Contact Management',
          items: [
            { text: 'Adding Contacts', link: '/user-guide/contacts/adding' },
            { text: 'Segmentation', link: '/user-guide/contacts/segmentation' },
            { text: 'Import/Export', link: '/user-guide/contacts/import-export' }
          ]
        }
      ],

      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Authentication', link: '/api/auth' },
            { text: 'GDPR Endpoints', link: '/api/gdpr' },
            { text: 'Contacts', link: '/api/contacts' },
            { text: 'Campaigns', link: '/api/campaigns' },
            { text: 'Analytics', link: '/api/analytics' }
          ]
        }
      ],

      '/developer/': [
        {
          text: 'Development Setup',
          items: [
            { text: 'Installation', link: '/developer/' },
            { text: 'Environment Setup', link: '/developer/setup' },
            { text: 'Running Tests', link: '/developer/testing' },
            { text: 'Contributing', link: '/developer/contributing' }
          ]
        },
        {
          text: 'Architecture',
          items: [
            { text: 'System Overview', link: '/developer/architecture' },
            { text: 'Database Schema', link: '/developer/schema' },
            { text: 'Security', link: '/developer/security' }
          ]
        }
      ],

      '/deployment/': [
        {
          text: 'Deployment Guide',
          items: [
            { text: 'Overview', link: '/deployment/' },
            { text: 'Staging Environment', link: '/deployment/staging' },
            { text: 'Production Deployment', link: '/deployment/production' },
            { text: 'Monitoring', link: '/deployment/monitoring' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/your-org/smartbatch-email' }
    ],

    search: {
      provider: 'local'
    },

    editLink: {
      pattern: 'https://github.com/your-org/smartbatch-email/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    }
  },

  markdown: {
    theme: 'github-dark'
  }
})
