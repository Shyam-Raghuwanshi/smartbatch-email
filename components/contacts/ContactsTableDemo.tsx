import React from 'react';
import { ContactsTable } from '@/components/contacts/ContactsTable';
import { ErrorBoundary, NetworkStatus } from '@/components/ui/performance';
import { Id } from '@/convex/_generated/dataModel';

// Mock data generator for testing performance
function generateMockContacts(count: number) {
  const contacts = [];
  const companies = ['Acme Corp', 'TechStart Inc', 'DataFlow Ltd', 'CloudSync', 'DevTools Co'];
  const tags = ['lead', 'customer', 'vip', 'newsletter', 'prospect', 'partner'];
  
  for (let i = 0; i < count; i++) {
    contacts.push({
      _id: `contact_${i}` as Id<"contacts">,
      email: `user${i}@example.com`,
      firstName: `User${i}`,
      lastName: `LastName${i}`,
      phone: i % 3 === 0 ? `+1-555-${String(i).padStart(4, '0')}` : undefined,
      company: companies[i % companies.length],
      position: i % 2 === 0 ? 'Manager' : 'Developer',
      tags: tags.slice(0, Math.floor(Math.random() * 3) + 1),
      isActive: Math.random() > 0.2,
      createdAt: Date.now() - (i * 24 * 60 * 60 * 1000), // Spread over days
      updatedAt: Date.now() - (i * 12 * 60 * 60 * 1000),
      source: i % 4 === 0 ? 'import' : 'manual',
      lastEngagement: Math.random() > 0.5 ? Date.now() - (Math.random() * 7 * 24 * 60 * 60 * 1000) : undefined,
      emailStats: {
        totalSent: Math.floor(Math.random() * 50) + 1,
        totalOpened: Math.floor(Math.random() * 30),
        totalClicked: Math.floor(Math.random() * 10),
        lastOpenedAt: Math.random() > 0.5 ? Date.now() - (Math.random() * 7 * 24 * 60 * 60 * 1000) : undefined,
        lastClickedAt: Math.random() > 0.7 ? Date.now() - (Math.random() * 7 * 24 * 60 * 60 * 1000) : undefined,
      },
      customFields: i % 5 === 0 ? { industry: 'Technology', region: 'North America' } : undefined,
    });
  }
  
  return contacts;
}

export function ContactsTableDemo() {
  // Generate different dataset sizes for performance testing
  const [datasetSize, setDatasetSize] = React.useState(100);
  const [selectedContacts, setSelectedContacts] = React.useState<Id<"contacts">[]>([]);
  const [selectedContact, setSelectedContact] = React.useState(null);
  
  const contacts = React.useMemo(() => generateMockContacts(datasetSize), [datasetSize]);
  
  const handleSelectContact = React.useCallback((contactId: Id<"contacts">, selected: boolean) => {
    setSelectedContacts(prev => 
      selected 
        ? [...prev, contactId]
        : prev.filter(id => id !== contactId)
    );
  }, []);
  
  const handleSelectAll = React.useCallback((selected: boolean) => {
    setSelectedContacts(selected ? contacts.map(c => c._id) : []);
  }, [contacts]);
  
  const handleContactClick = React.useCallback((contact: any) => {
    setSelectedContact(contact);
    console.log('Contact clicked:', contact);
  }, []);
  
  return (
    <div className="space-y-6 p-6">
      <NetworkStatus />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ContactsTable Performance Demo</h1>
          <p className="text-muted-foreground">
            Test the optimized contacts table with different dataset sizes
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Dataset Size:</label>
          <select 
            value={datasetSize} 
            onChange={(e) => setDatasetSize(Number(e.target.value))}
            className="px-3 py-1 border rounded-md"
          >
            <option value={50}>50 contacts</option>
            <option value={100}>100 contacts</option>
            <option value={500}>500 contacts</option>
            <option value={1000}>1,000 contacts</option>
            <option value={5000}>5,000 contacts</option>
            <option value={10000}>10,000 contacts</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{contacts.length}</div>
          <div className="text-sm text-blue-800">Total Contacts</div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{selectedContacts.length}</div>
          <div className="text-sm text-green-800">Selected</div>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {contacts.filter(c => c.isActive).length}
          </div>
          <div className="text-sm text-purple-800">Active Contacts</div>
        </div>
      </div>
      
      <ErrorBoundary>
        <ContactsTable
          contacts={contacts}
          selectedContacts={selectedContacts}
          onSelectContact={handleSelectContact}
          onSelectAll={handleSelectAll}
          onContactClick={handleContactClick}
          loading={false}
        />
      </ErrorBoundary>
      
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Performance Features Enabled:</h3>
        <ul className="text-sm space-y-1 text-gray-700">
          <li>✅ Virtual scrolling for large datasets (10,000+ items)</li>
          <li>✅ In-memory caching with 5-minute TTL</li>
          <li>✅ Optimistic UI updates for selections</li>
          <li>✅ Multiple view modes (Table, List, Virtual)</li>
          <li>✅ Client-side sorting and filtering</li>
          <li>✅ Performance monitoring and render time tracking</li>
          <li>✅ Error boundaries for graceful error handling</li>
          <li>✅ Network status monitoring</li>
          <li>✅ Skeleton loading states</li>
          <li>✅ Debounced search and interactions</li>
        </ul>
      </div>
    </div>
  );
}

export default ContactsTableDemo;
