"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useConvexAuth, Authenticated, Unauthenticated, AuthLoading } from 'convex/react';
import { useUser } from '@clerk/nextjs';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Play, 
  Pause, 
  Copy, 
  Edit, 
  Trash2, 
  Calendar,
  Users,
  Mail,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  TrendingUp,
  Eye,
  MousePointer
} from 'lucide-react';
import { CampaignForm } from './CampaignForm';
import { CampaignStats } from '@/components/campaigns/CampaignStats';
import { CampaignDetailModal } from '@/components/campaigns/CampaignDetailModal';
import { LoadingCard, TableLoadingSkeleton } from '@/components/ui/loading';
import { toast } from 'sonner';
import { AutomatedCampaigns } from '@/components/campaigns/AutomatedCampaigns';
import { VisualWorkflowBuilder } from '@/components/campaigns/VisualWorkflowBuilder';
import { BehavioralTriggers } from '@/components/campaigns/BehavioralTriggers';
import { AdvancedScheduling } from '@/components/campaigns/AdvancedScheduling';
import { CampaignTemplates } from '@/components/campaigns/CampaignTemplates';

type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';

const statusConfig = {
  draft: { 
    label: 'Draft', 
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: Edit,
    description: 'Campaign is being prepared'
  },
  scheduled: { 
    label: 'Scheduled', 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Clock,
    description: 'Campaign is scheduled to send'
  },
  sending: { 
    label: 'Sending', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Send,
    description: 'Campaign is currently being sent'
  },
  sent: { 
    label: 'Sent', 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle2,
    description: 'Campaign has been sent successfully'
  },
  paused: { 
    label: 'Paused', 
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: Pause,
    description: 'Campaign sending is paused'
  },
  cancelled: { 
    label: 'Cancelled', 
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertCircle,
    description: 'Campaign has been cancelled'
  },
};

export default function CampaignsPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const campaigns = useQuery(api.campaigns.getCampaignsByUser);
  const testAuth = useQuery(api.test.testAuth);
  const testPublic = useQuery(api.test.testPublic);
  const deleteCampaign = useMutation(api.campaigns.deleteCampaign);
  const updateCampaign = useMutation(api.campaigns.updateCampaign);
  const duplicateCampaign = useMutation(api.campaigns.duplicateCampaign);
  const seedSampleData = useMutation(api.seed.seedSampleData);
  const ensureUser = useMutation(api.lib.ensureUser);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Id<"campaigns"> | null>(null);
  const [detailCampaign, setDetailCampaign] = useState<Id<"campaigns"> | null>(null);
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<Id<"campaigns">>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Utility functions
  const formatDate = (date: number) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCampaignSelect = (campaignId: Id<"campaigns">, checked: boolean) => {
    const newSelected = new Set(selectedCampaigns);
    if (checked) {
      newSelected.add(campaignId);
    } else {
      newSelected.delete(campaignId);
    }
    setSelectedCampaigns(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredCampaigns.map(c => c._id));
      setSelectedCampaigns(allIds);
      setShowBulkActions(true);
    } else {
      setSelectedCampaigns(new Set());
      setShowBulkActions(false);
    }
  };

  const toggleCampaignSelection = (campaignId: Id<"campaigns">) => {
    const newSelected = new Set(selectedCampaigns);
    if (newSelected.has(campaignId)) {
      newSelected.delete(campaignId);
    } else {
      newSelected.add(campaignId);
    }
    setSelectedCampaigns(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const selectAllCampaigns = (checked: boolean) => {
    handleSelectAll(checked);
  };

  const clearSelection = () => {
    setSelectedCampaigns(new Set());
    setShowBulkActions(false);
  };

  // Ensure user exists in database
  useEffect(() => {
    if (user && userLoaded) {
      ensureUser({
        email: user.emailAddresses[0]?.emailAddress || '',
        name: user.fullName || user.firstName || 'User',
      });
    }
  }, [user, userLoaded, ensureUser]);

  // Filter campaigns based on search and status
  const filteredCampaigns = campaigns?.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         campaign.settings.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  // Calculate quick stats
  const stats = campaigns?.reduce((acc, campaign) => {
    acc.total++;
    if (campaign.status === 'sent') acc.sent++;
    if (campaign.status === 'sending') acc.sending++;
    if (campaign.status === 'scheduled') acc.scheduled++;
    return acc;
  }, { total: 0, sent: 0, sending: 0, scheduled: 0 }) || { total: 0, sent: 0, sending: 0, scheduled: 0 };

  const handleStatusChange = async (campaignId: Id<"campaigns">, newStatus: CampaignStatus) => {
    try {
      await updateCampaign({ id: campaignId, status: newStatus });
    } catch (error) {
      console.error('Failed to update campaign status:', error);
    }
  };

  const handleDeleteCampaign = async (campaignId: Id<"campaigns">) => {
    if (confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      try {
        await deleteCampaign({ id: campaignId });
      } catch (error) {
        console.error('Failed to delete campaign:', error);
      }
    }
  };

  const handleDuplicateCampaign = async (campaign: {
    _id: string;
    name: string;
    status: string;
    settings: {
      subject: string;
      templateId?: string;
      customContent?: string;
      targetTags: string[];
      sendDelay: number;
      trackOpens: boolean;
      trackClicks: boolean;
    };
  }) => {
    try {
      await duplicateCampaign({ id: campaign._id });
    } catch (error) {
      console.error('Failed to duplicate campaign:', error);
    }
  };

  const handleSeedSampleData = async () => {
    if (confirm('This will create sample campaigns, templates, and contacts for testing. Continue?')) {
      try {
        await seedSampleData();
        toast.success('Sample data created successfully!');
      } catch (error) {
        console.error('Failed to seed sample data:', error);
        toast.error('Failed to create sample data');
      }
    }
  };

  const handleTestAuth = async () => {
    try {
      console.log('User from Clerk:', user);
      await ensureUser({
        email: user?.emailAddresses[0]?.emailAddress || 'test@example.com',
        name: user?.fullName || user?.firstName || 'Test User',
      });
      toast.success('User created/updated successfully!');
    } catch (error) {
      console.error('Auth test failed:', error);
      toast.error('Authentication test failed');
    }
  };

  const handleBulkStatusChange = async (newStatus: CampaignStatus) => {
    if (confirm(`Change status to "${newStatus}" for ${selectedCampaigns.size} selected campaigns?`)) {
      try {
        const promises = Array.from(selectedCampaigns).map(id => 
          updateCampaign({ id, status: newStatus })
        );
        await Promise.all(promises);
        toast.success(`Updated ${selectedCampaigns.size} campaigns`);
        clearSelection();
      } catch (error) {
        console.error('Failed to update campaigns:', error);
        toast.error('Failed to update campaigns');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Delete ${selectedCampaigns.size} selected campaigns? This action cannot be undone.`)) {
      try {
        const promises = Array.from(selectedCampaigns).map(id => deleteCampaign({ id }));
        await Promise.all(promises);
        toast.success(`Deleted ${selectedCampaigns.size} campaigns`);
        clearSelection();
      } catch (error) {
        console.error('Failed to delete campaigns:', error);
        toast.error('Failed to delete campaigns');
      }
    }
  };

  // Show loading while auth is being determined
  if (isLoading) {
    return (
      <AuthLoading>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
              <p className="mt-1 text-sm text-gray-600">Loading...</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <LoadingCard key={i} />
            ))}
          </div>
          <div className="mt-6">
            <TableLoadingSkeleton />
          </div>
        </div>
      </AuthLoading>
    );
  }

  return (
    <>
      <Unauthenticated>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
              <p className="mt-1 text-sm text-gray-600">Please sign in to continue</p>
            </div>
          </div>
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-600">
                You need to be signed in to view your campaigns.
              </p>
            </CardContent>
          </Card>
        </div>
      </Unauthenticated>
      
      <Authenticated>
        <CampaignsContent 
          campaigns={campaigns}
          filteredCampaigns={filteredCampaigns}
          stats={stats}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          selectedCampaigns={selectedCampaigns}
          setSelectedCampaigns={setSelectedCampaigns}
          showBulkActions={showBulkActions}
          setShowBulkActions={setShowBulkActions}
          isNewCampaignOpen={isNewCampaignOpen}
          setIsNewCampaignOpen={setIsNewCampaignOpen}
          selectedCampaign={selectedCampaign}
          setSelectedCampaign={setSelectedCampaign}
          detailCampaign={detailCampaign}
          setDetailCampaign={setDetailCampaign}
          handleStatusChange={handleStatusChange}
          handleDeleteCampaign={handleDeleteCampaign}
          handleDuplicateCampaign={handleDuplicateCampaign}
          handleSeedSampleData={handleSeedSampleData}
          handleBulkStatusChange={handleBulkStatusChange}
          handleBulkDelete={handleBulkDelete}
          handleCampaignSelect={handleCampaignSelect}
          handleSelectAll={handleSelectAll}
          toggleCampaignSelection={toggleCampaignSelection}
          selectAllCampaigns={selectAllCampaigns}
          testAuth={testAuth}
          testPublic={testPublic}
          formatDate={formatDate}
        />
      </Authenticated>
    </>
  );
}

function CampaignsContent({ 
  campaigns, 
  filteredCampaigns, 
  stats, 
  searchQuery, 
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  selectedCampaigns,
  setSelectedCampaigns,
  showBulkActions,
  setShowBulkActions,
  isNewCampaignOpen,
  setIsNewCampaignOpen,
  selectedCampaign,
  setSelectedCampaign,
  detailCampaign,
  setDetailCampaign,
  handleStatusChange,
  handleDeleteCampaign,
  handleDuplicateCampaign,
  handleSeedSampleData,
  handleBulkStatusChange,
  handleBulkDelete,
  handleCampaignSelect,
  handleSelectAll,
  toggleCampaignSelection,
  selectAllCampaigns,
  clearSelection,
  testAuth,
  testPublic,
  formatDate
}: {
  campaigns: any[];
  isLoading: boolean;
  isNewCampaignOpen: boolean;
  setIsNewCampaignOpen: (open: boolean) => void;
  selectedCampaign: any;
  setSelectedCampaign: (campaign: any) => void;
  detailCampaign: any;
  setDetailCampaign: (campaign: any) => void;
  handleStatusChange: (id: string, status: string) => void;
  handleDeleteCampaign: (id: string) => void;
  handleDuplicateCampaign: (campaign: any) => void;
  handleSeedSampleData: () => void;
  handleBulkStatusChange: (status: string) => void;
  handleBulkDelete: () => void;
  handleCampaignSelect: (campaignId: string) => void;
  handleSelectAll: () => void;
  toggleCampaignSelection: (campaignId: string) => void;
  selectAllCampaigns: () => void;
  clearSelection: () => void;
  testAuth: () => void;
  testPublic: () => void;
  formatDate: (timestamp: number) => string;
}) {
  const StatusBadge = ({ status }: { status: CampaignStatus }) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (!campaigns) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
            <p className="mt-1 text-sm text-gray-600">Setting up your account...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
        <div className="mt-6">
          <TableLoadingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="mt-1 text-sm text-gray-600">
            Create and manage your email campaigns
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Monitoring Dashboard Link */}
          <Button 
            variant="outline" 
            onClick={() => window.open('/campaigns/monitoring', '_blank')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Monitoring Dashboard
          </Button>
          
          {/* Seed Sample Data Button - only show if no campaigns exist */}
          {filteredCampaigns.length === 0 && (
            <Button 
              variant="outline" 
              onClick={handleSeedSampleData}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Add Sample Data
            </Button>
          )}
          <Dialog open={isNewCampaignOpen} onOpenChange={setIsNewCampaignOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Campaign
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Set up your email campaign with templates, recipients, and scheduling options.
              </DialogDescription>
            </DialogHeader>
            <CampaignForm onSuccess={() => setIsNewCampaignOpen(false)} />
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Mail className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sent</p>
                <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.sending}</p>
              </div>
              <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Send className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Campaigns</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Label htmlFor="status-filter">Filter by Status</Label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="sending">Sending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <p className="text-sm font-medium text-blue-900">
                  {selectedCampaigns.size} campaign{selectedCampaigns.size !== 1 ? 's' : ''} selected
                </p>
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Change Status
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleBulkStatusChange('draft')}>
                        <Edit className="h-4 w-4 mr-2" />
                        Set to Draft
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkStatusChange('scheduled')}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Set to Scheduled
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkStatusChange('paused')}>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleBulkStatusChange('cancelled')}>
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Cancel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleBulkDelete}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearSelection}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaigns ({filteredCampaigns.length})</CardTitle>
          <CardDescription>
            Manage your email campaigns and track their performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📧</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {campaigns.length === 0 ? 'No campaigns yet' : 'No campaigns match your filters'}
              </h3>
              <p className="text-gray-600 mb-6">
                {campaigns.length === 0 
                  ? 'Get started by creating your first email campaign.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              {campaigns.length === 0 && (
                <Button onClick={() => setIsNewCampaignOpen(true)}>
                  Create Campaign
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedCampaigns.size === filteredCampaigns.length && filteredCampaigns.length > 0}
                      onCheckedChange={selectAllCampaigns}
                      aria-label="Select all campaigns"
                    />
                  </TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((campaign: any) => (
                  <TableRow 
                    key={campaign._id} 
                    className={`cursor-pointer hover:bg-gray-50 ${selectedCampaigns.has(campaign._id) ? 'bg-blue-50' : ''}`}
                    onClick={() => setDetailCampaign(campaign._id)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedCampaigns.has(campaign._id)}
                        onCheckedChange={() => toggleCampaignSelection(campaign._id)}
                        aria-label={`Select campaign ${campaign.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{campaign.name}</div>
                        <div className="text-sm text-gray-500">{campaign.settings.subject}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={campaign.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        {campaign.settings.targetTags.length} tag{campaign.settings.targetTags.length !== 1 ? 's' : ''}
                      </div>
                    </TableCell>
                    <TableCell>
                      <CampaignStats 
                        campaignId={campaign._id} 
                        status={campaign.status}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(campaign.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {campaign.scheduledAt ? formatDate(campaign.scheduledAt) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {campaign.status === 'draft' && (
                            <>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(campaign._id, 'scheduled');
                              }}>
                                <Calendar className="h-4 w-4 mr-2" />
                                Schedule
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(campaign._id, 'sending');
                              }}>
                                <Play className="h-4 w-4 mr-2" />
                                Send Now
                              </DropdownMenuItem>
                            </>
                          )}
                          {campaign.status === 'scheduled' && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(campaign._id, 'sending');
                            }}>
                              <Play className="h-4 w-4 mr-2" />
                              Send Now
                            </DropdownMenuItem>
                          )}
                          {campaign.status === 'sending' && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(campaign._id, 'paused');
                            }}>
                              <Pause className="h-4 w-4 mr-2" />
                              Pause
                            </DropdownMenuItem>
                          )}
                          {campaign.status === 'paused' && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(campaign._id, 'sending');
                            }}>
                              <Play className="h-4 w-4 mr-2" />
                              Resume
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/campaigns/monitoring?campaign=${campaign._id}`, '_blank');
                          }}>
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Monitor
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateCampaign(campaign);
                          }}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCampaign(campaign._id);
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCampaign(campaign._id);
                            }}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Campaign Dialog */}
      {selectedCampaign && (
        <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Campaign</DialogTitle>
              <DialogDescription>
                Update your campaign settings and configuration.
              </DialogDescription>
            </DialogHeader>
            <CampaignForm 
              campaignId={selectedCampaign}
              onSuccess={() => setSelectedCampaign(null)} 
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Campaign Detail Modal */}
      <CampaignDetailModal
        campaignId={detailCampaign}
        isOpen={!!detailCampaign}
        onClose={() => setDetailCampaign(null)}
      />
    </div>
  );
}
