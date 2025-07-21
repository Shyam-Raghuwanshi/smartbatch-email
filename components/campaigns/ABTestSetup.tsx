"use client";

import React, { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { 
  BeakerIcon, 
  Users, 
  Target, 
  Clock, 
  TrendingUp, 
  BarChart3, 
  Brain, 
  Zap,
  Plus,
  Trash2,
  AlertCircle,
  Settings,
  Shuffle,
  PieChart
} from 'lucide-react';

interface ABTestSetupProps {
  onTestCreated?: (testId: Id<"abTests">) => void;
}

interface TestVariant {
  id: string;
  name: string;
  isControl: boolean;
  trafficAllocation: number;
  campaignConfig: {
    subject: string;
    templateId?: Id<"templates">;
    customContent?: string;
    fromName?: string;
    fromEmail?: string;
    sendTime?: {
      type: 'immediate' | 'scheduled' | 'optimal';
      scheduledAt?: number;
      timezone?: string;
    };
    multivariateElements?: {
      subjectLineVariants?: string[];
      contentVariants?: string[];
      ctaVariants?: string[];
      imageVariants?: string[];
    };
  };
}

const ABTestSetup: React.FC<ABTestSetupProps> = ({ onTestCreated }) => {
  const createABTest = useMutation(api.abTesting.createABTest);
  const createVariant = useMutation(api.abTesting.createABTestVariant);
  const templates = useQuery(api.templates.getTemplatesByUser);
  const contacts = useQuery(api.contacts.getContactsByUser);

  const [activeTab, setActiveTab] = useState('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test Configuration State
  const [testConfig, setTestConfig] = useState({
    name: '',
    description: '',
    type: 'subject_line' as const,
    audienceSettings: {
      totalAudience: 0,
      testPercentage: 20,
      segmentFilters: {
        tags: [] as string[],
        companies: [] as string[],
        engagementRange: { min: 0, max: 100 },
      },
    },
    successMetrics: {
      primary: 'open_rate' as const,
      secondary: [] as string[],
      conversionGoal: {
        url: '',
        value: 0,
      },
    },
    statisticalSettings: {
      confidenceLevel: 95,
      minimumDetectableEffect: 10,
      testDuration: {
        type: 'fixed' as const,
        maxDays: 14,
        minSampleSize: 100,
      },
      automaticWinner: true,
      winnerSelectionCriteria: {
        significanceThreshold: 0.05,
        minimumImprovement: 5,
      },
    },
    bayesianSettings: {
      enabled: false,
      priorBelief: {
        expectedLift: 10,
        confidence: 50,
      },
      dynamicAllocation: false,
      explorationRate: 0.1,
    },
  });

  const [variants, setVariants] = useState<TestVariant[]>([
    {
      id: 'control',
      name: 'Control (Original)',
      isControl: true,
      trafficAllocation: 50,
      campaignConfig: {
        subject: '',
        customContent: '',
        fromName: '',
        fromEmail: '',
      },
    },
    {
      id: 'variant-1',
      name: 'Variant A',
      isControl: false,
      trafficAllocation: 50,
      campaignConfig: {
        subject: '',
        customContent: '',
        fromName: '',
        fromEmail: '',
      },
    },
  ]);

  // Calculate eligible audience based on filters
  const eligibleAudience = React.useMemo(() => {
    if (!contacts) return 0;
    
    let filtered = contacts.filter(contact => contact.isActive);
    
    if (testConfig.audienceSettings.segmentFilters.tags.length > 0) {
      filtered = filtered.filter(contact =>
        testConfig.audienceSettings.segmentFilters.tags.some(tag => contact.tags.includes(tag))
      );
    }
    
    if (testConfig.audienceSettings.segmentFilters.companies.length > 0) {
      filtered = filtered.filter(contact =>
        contact.company && testConfig.audienceSettings.segmentFilters.companies.includes(contact.company)
      );
    }
    
    return filtered.length;
  }, [contacts, testConfig.audienceSettings.segmentFilters]);

  const testAudienceSize = Math.floor(eligibleAudience * (testConfig.audienceSettings.testPercentage / 100));

  // Get unique tags and companies from contacts
  const availableTags = React.useMemo(() => {
    if (!contacts) return [];
    const tags = new Set<string>();
    contacts.forEach(contact => contact.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags);
  }, [contacts]);

  const availableCompanies = React.useMemo(() => {
    if (!contacts) return [];
    const companies = new Set<string>();
    contacts.forEach(contact => contact.company && companies.add(contact.company));
    return Array.from(companies);
  }, [contacts]);

  const addVariant = () => {
    const newVariant: TestVariant = {
      id: `variant-${variants.length}`,
      name: `Variant ${String.fromCharCode(65 + variants.length - 1)}`, // A, B, C, etc.
      isControl: false,
      trafficAllocation: 0,
      campaignConfig: {
        subject: '',
        customContent: '',
        fromName: '',
        fromEmail: '',
      },
    };
    setVariants([...variants, newVariant]);
    
    // Redistribute traffic equally
    const equalAllocation = 100 / (variants.length + 1);
    setVariants(prev => prev.map(v => ({ ...v, trafficAllocation: equalAllocation })));
  };

  const removeVariant = (variantId: string) => {
    if (variants.length <= 2) return; // Must have at least 2 variants
    
    const removedVariant = variants.find(v => v.id === variantId);
    if (removedVariant?.isControl) return; // Cannot remove control
    
    setVariants(prev => {
      const filtered = prev.filter(v => v.id !== variantId);
      // Redistribute traffic equally
      const equalAllocation = 100 / filtered.length;
      return filtered.map(v => ({ ...v, trafficAllocation: equalAllocation }));
    });
  };

  const updateVariant = (variantId: string, updates: Partial<TestVariant>) => {
    setVariants(prev => prev.map(v => 
      v.id === variantId ? { ...v, ...updates } : v
    ));
  };

  const redistributeTraffic = () => {
    const equalAllocation = 100 / variants.length;
    setVariants(prev => prev.map(v => ({ ...v, trafficAllocation: equalAllocation })));
  };

  const validateConfiguration = (): string[] => {
    const errors: string[] = [];
    
    if (!testConfig.name.trim()) {
      errors.push('Test name is required');
    }
    
    if (variants.length < 2) {
      errors.push('At least 2 variants are required');
    }
    
    const totalAllocation = variants.reduce((sum, v) => sum + v.trafficAllocation, 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      errors.push('Total traffic allocation must equal 100%');
    }
    
    const controlVariants = variants.filter(v => v.isControl);
    if (controlVariants.length !== 1) {
      errors.push('Exactly one control variant is required');
    }
    
    const hasEmptySubjects = variants.some(v => !v.campaignConfig.subject.trim());
    if (hasEmptySubjects) {
      errors.push('All variants must have a subject line');
    }
    
    if (testAudienceSize < testConfig.statisticalSettings.testDuration.minSampleSize) {
      errors.push(`Test audience size (${testAudienceSize}) is below minimum sample size (${testConfig.statisticalSettings.testDuration.minSampleSize})`);
    }
    
    return errors;
  };

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    
    try {
      const validationErrors = validateConfiguration();
      if (validationErrors.length > 0) {
        setError(validationErrors.join(', '));
        return;
      }
      
      // Create the test
      const testId = await createABTest({
        name: testConfig.name,
        description: testConfig.description,
        type: testConfig.type,
        testConfiguration: {
          audienceSettings: {
            ...testConfig.audienceSettings,
            totalAudience: eligibleAudience,
          },
          successMetrics: testConfig.successMetrics,
          statisticalSettings: testConfig.statisticalSettings,
          bayesianSettings: testConfig.bayesianSettings.enabled ? testConfig.bayesianSettings : undefined,
        },
      });
      
      // Create variants
      for (const variant of variants) {
        await createVariant({
          testId,
          name: variant.name,
          isControl: variant.isControl,
          trafficAllocation: variant.trafficAllocation,
          campaignConfig: variant.campaignConfig,
        });
      }
      
      onTestCreated?.(testId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BeakerIcon className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Create A/B Test</h1>
          <p className="text-gray-600">Set up experiments to optimize your email campaigns</p>
        </div>
      </div>

      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic Setup</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="metrics">Success Metrics</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Basic Setup Tab */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Test Configuration
              </CardTitle>
              <CardDescription>
                Define the basic settings for your A/B test
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="test-name">Test Name</Label>
                <Input
                  id="test-name"
                  placeholder="e.g., Subject Line Test - Holiday Campaign"
                  value={testConfig.name}
                  onChange={(e) => setTestConfig(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="test-description">Description (Optional)</Label>
                <Textarea
                  id="test-description"
                  placeholder="Describe what you're testing and your hypothesis..."
                  value={testConfig.description}
                  onChange={(e) => setTestConfig(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div>
                <Label>Test Type</Label>
                <Select 
                  value={testConfig.type} 
                  onValueChange={(value: any) => setTestConfig(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subject_line">Subject Line Test</SelectItem>
                    <SelectItem value="content">Email Content Test</SelectItem>
                    <SelectItem value="send_time">Send Time Test</SelectItem>
                    <SelectItem value="from_name">From Name Test</SelectItem>
                    <SelectItem value="multivariate">Multivariate Test</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audience Tab */}
        <TabsContent value="audience" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Test Audience
              </CardTitle>
              <CardDescription>
                Define who will participate in your A/B test
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Audience Size */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Test Audience Size</Label>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {testAudienceSize} contacts
                  </Badge>
                </div>
                
                <div>
                  <Label>Percentage of audience to include in test</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Slider
                      value={[testConfig.audienceSettings.testPercentage]}
                      onValueChange={([value]) => 
                        setTestConfig(prev => ({
                          ...prev,
                          audienceSettings: { ...prev.audienceSettings, testPercentage: value }
                        }))
                      }
                      min={10}
                      max={50}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12">
                      {testConfig.audienceSettings.testPercentage}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Testing with {testConfig.audienceSettings.testPercentage}% leaves {100 - testConfig.audienceSettings.testPercentage}% 
                    of your audience for the winning variant rollout
                  </p>
                </div>
              </div>

              <Separator />

              {/* Segment Filters */}
              <div className="space-y-4">
                <h4 className="font-medium">Audience Filters</h4>
                
                <div>
                  <Label>Tags (Optional)</Label>
                  <Select
                    value=""
                    onValueChange={(tag) => {
                      if (!testConfig.audienceSettings.segmentFilters.tags.includes(tag)) {
                        setTestConfig(prev => ({
                          ...prev,
                          audienceSettings: {
                            ...prev.audienceSettings,
                            segmentFilters: {
                              ...prev.audienceSettings.segmentFilters,
                              tags: [...prev.audienceSettings.segmentFilters.tags, tag]
                            }
                          }
                        }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Add tags to filter audience..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTags.map(tag => (
                        <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {testConfig.audienceSettings.segmentFilters.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 hover:bg-transparent"
                          onClick={() => setTestConfig(prev => ({
                            ...prev,
                            audienceSettings: {
                              ...prev.audienceSettings,
                              segmentFilters: {
                                ...prev.audienceSettings.segmentFilters,
                                tags: prev.audienceSettings.segmentFilters.tags.filter(t => t !== tag)
                              }
                            }
                          }))}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Companies (Optional)</Label>
                  <Select
                    value=""
                    onValueChange={(company) => {
                      if (!testConfig.audienceSettings.segmentFilters.companies.includes(company)) {
                        setTestConfig(prev => ({
                          ...prev,
                          audienceSettings: {
                            ...prev.audienceSettings,
                            segmentFilters: {
                              ...prev.audienceSettings.segmentFilters,
                              companies: [...prev.audienceSettings.segmentFilters.companies, company]
                            }
                          }
                        }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Add companies to filter audience..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCompanies.map(company => (
                        <SelectItem key={company} value={company}>{company}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {testConfig.audienceSettings.segmentFilters.companies.map(company => (
                      <Badge key={company} variant="secondary" className="flex items-center gap-1">
                        {company}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 hover:bg-transparent"
                          onClick={() => setTestConfig(prev => ({
                            ...prev,
                            audienceSettings: {
                              ...prev.audienceSettings,
                              segmentFilters: {
                                ...prev.audienceSettings.segmentFilters,
                                companies: prev.audienceSettings.segmentFilters.companies.filter(c => c !== company)
                              }
                            }
                          }))}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Engagement Score Range</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex-1">
                      <Label className="text-xs">Min</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={testConfig.audienceSettings.segmentFilters.engagementRange.min}
                        onChange={(e) => setTestConfig(prev => ({
                          ...prev,
                          audienceSettings: {
                            ...prev.audienceSettings,
                            segmentFilters: {
                              ...prev.audienceSettings.segmentFilters,
                              engagementRange: {
                                ...prev.audienceSettings.segmentFilters.engagementRange,
                                min: parseInt(e.target.value) || 0
                              }
                            }
                          }
                        }))}
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Max</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={testConfig.audienceSettings.segmentFilters.engagementRange.max}
                        onChange={(e) => setTestConfig(prev => ({
                          ...prev,
                          audienceSettings: {
                            ...prev.audienceSettings,
                            segmentFilters: {
                              ...prev.audienceSettings.segmentFilters,
                              engagementRange: {
                                ...prev.audienceSettings.segmentFilters.engagementRange,
                                max: parseInt(e.target.value) || 100
                              }
                            }
                          }
                        }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Audience Summary */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Audience Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Total Eligible:</span>
                    <span className="font-medium ml-2">{eligibleAudience.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Test Size:</span>
                    <span className="font-medium ml-2">{testAudienceSize.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Remaining:</span>
                    <span className="font-medium ml-2">{(eligibleAudience - testAudienceSize).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Test %:</span>
                    <span className="font-medium ml-2">{testConfig.audienceSettings.testPercentage}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Variants Tab */}
        <TabsContent value="variants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shuffle className="h-5 w-5" />
                Test Variants
              </CardTitle>
              <CardDescription>
                Create and configure your test variations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Traffic Allocation Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Traffic Allocation</h4>
                  <Button variant="outline" size="sm" onClick={redistributeTraffic}>
                    <PieChart className="h-4 w-4 mr-2" />
                    Equal Split
                  </Button>
                </div>
                <div className="flex gap-2">
                  {variants.map(variant => (
                    <div 
                      key={variant.id}
                      className="bg-blue-100 px-3 py-1 rounded text-sm font-medium"
                      style={{ width: `${variant.trafficAllocation}%` }}
                    >
                      {variant.name}: {variant.trafficAllocation}%
                    </div>
                  ))}
                </div>
              </div>

              {/* Variants */}
              <div className="space-y-4">
                {variants.map((variant, index) => (
                  <Card key={variant.id} className={variant.isControl ? "border-green-200 bg-green-50" : ""}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{variant.name}</CardTitle>
                          {variant.isControl && (
                            <Badge variant="default" className="bg-green-600">Control</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={variant.trafficAllocation}
                            onChange={(e) => updateVariant(variant.id, {
                              trafficAllocation: parseFloat(e.target.value) || 0
                            })}
                            className="w-20"
                          />
                          <span className="text-sm text-gray-600">%</span>
                          {!variant.isControl && variants.length > 2 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeVariant(variant.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Variant Name</Label>
                        <Input
                          value={variant.name}
                          onChange={(e) => updateVariant(variant.id, { name: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label>Subject Line</Label>
                        <Input
                          placeholder="Enter subject line for this variant..."
                          value={variant.campaignConfig.subject}
                          onChange={(e) => updateVariant(variant.id, {
                            campaignConfig: {
                              ...variant.campaignConfig,
                              subject: e.target.value
                            }
                          })}
                        />
                      </div>

                      {testConfig.type === 'content' && (
                        <div>
                          <Label>Email Content</Label>
                          <RichTextEditor
                            content={variant.campaignConfig.customContent || ''}
                            onChange={(content) => updateVariant(variant.id, {
                              campaignConfig: {
                                ...variant.campaignConfig,
                                customContent: content
                              }
                            })}
                            placeholder="Enter email content for this variant..."
                          />
                        </div>
                      )}

                      {testConfig.type === 'from_name' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>From Name</Label>
                            <Input
                              placeholder="e.g., John Smith"
                              value={variant.campaignConfig.fromName || ''}
                              onChange={(e) => updateVariant(variant.id, {
                                campaignConfig: {
                                  ...variant.campaignConfig,
                                  fromName: e.target.value
                                }
                              })}
                            />
                          </div>
                          <div>
                            <Label>From Email</Label>
                            <Input
                              placeholder="e.g., john@company.com"
                              value={variant.campaignConfig.fromEmail || ''}
                              onChange={(e) => updateVariant(variant.id, {
                                campaignConfig: {
                                  ...variant.campaignConfig,
                                  fromEmail: e.target.value
                                }
                              })}
                            />
                          </div>
                        </div>
                      )}

                      {testConfig.type === 'multivariate' && (
                        <div className="space-y-4">
                          <div>
                            <Label>Subject Line Variants</Label>
                            <Textarea
                              placeholder="Enter multiple subject lines, one per line..."
                              value={variant.campaignConfig.multivariateElements?.subjectLineVariants?.join('\n') || ''}
                              onChange={(e) => updateVariant(variant.id, {
                                campaignConfig: {
                                  ...variant.campaignConfig,
                                  multivariateElements: {
                                    ...variant.campaignConfig.multivariateElements,
                                    subjectLineVariants: e.target.value.split('\n').filter(line => line.trim())
                                  }
                                }
                              })}
                            />
                          </div>
                          <div>
                            <Label>CTA Variants</Label>
                            <Textarea
                              placeholder="Enter different call-to-action texts, one per line..."
                              value={variant.campaignConfig.multivariateElements?.ctaVariants?.join('\n') || ''}
                              onChange={(e) => updateVariant(variant.id, {
                                campaignConfig: {
                                  ...variant.campaignConfig,
                                  multivariateElements: {
                                    ...variant.campaignConfig.multivariateElements,
                                    ctaVariants: e.target.value.split('\n').filter(line => line.trim())
                                  }
                                }
                              })}
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                <Button variant="outline" onClick={addVariant} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Variant
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Success Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Success Metrics
              </CardTitle>
              <CardDescription>
                Define how you'll measure test success
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Primary Success Metric</Label>
                <Select
                  value={testConfig.successMetrics.primary}
                  onValueChange={(value: any) => setTestConfig(prev => ({
                    ...prev,
                    successMetrics: { ...prev.successMetrics, primary: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open_rate">Open Rate</SelectItem>
                    <SelectItem value="click_rate">Click-Through Rate</SelectItem>
                    <SelectItem value="conversion_rate">Conversion Rate</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="engagement_time">Engagement Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Secondary Metrics (Optional)</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { value: 'open_rate', label: 'Open Rate' },
                    { value: 'click_rate', label: 'Click Rate' },
                    { value: 'conversion_rate', label: 'Conversion Rate' },
                    { value: 'revenue', label: 'Revenue' },
                    { value: 'engagement_time', label: 'Engagement Time' },
                    { value: 'unsubscribe_rate', label: 'Unsubscribe Rate' },
                  ].filter(metric => metric.value !== testConfig.successMetrics.primary).map(metric => (
                    <label key={metric.value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={testConfig.successMetrics.secondary?.includes(metric.value) || false}
                        onChange={(e) => {
                          const secondary = testConfig.successMetrics.secondary || [];
                          if (e.target.checked) {
                            setTestConfig(prev => ({
                              ...prev,
                              successMetrics: {
                                ...prev.successMetrics,
                                secondary: [...secondary, metric.value]
                              }
                            }));
                          } else {
                            setTestConfig(prev => ({
                              ...prev,
                              successMetrics: {
                                ...prev.successMetrics,
                                secondary: secondary.filter(m => m !== metric.value)
                              }
                            }));
                          }
                        }}
                      />
                      <span className="text-sm">{metric.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {(testConfig.successMetrics.primary === 'conversion_rate' || 
                testConfig.successMetrics.secondary?.includes('conversion_rate')) && (
                <div className="space-y-4">
                  <h4 className="font-medium">Conversion Goal</h4>
                  <div>
                    <Label>Conversion URL</Label>
                    <Input
                      placeholder="https://yoursite.com/thank-you"
                      value={testConfig.successMetrics.conversionGoal?.url || ''}
                      onChange={(e) => setTestConfig(prev => ({
                        ...prev,
                        successMetrics: {
                          ...prev.successMetrics,
                          conversionGoal: {
                            ...prev.successMetrics.conversionGoal,
                            url: e.target.value
                          }
                        }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Conversion Value (Optional)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={testConfig.successMetrics.conversionGoal?.value || ''}
                      onChange={(e) => setTestConfig(prev => ({
                        ...prev,
                        successMetrics: {
                          ...prev.successMetrics,
                          conversionGoal: {
                            ...prev.successMetrics.conversionGoal,
                            value: parseFloat(e.target.value) || 0
                          }
                        }
                      }))}
                    />
                  </div>
                </div>
              )}

              {/* Statistical Settings */}
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">Statistical Settings</h4>
                
                <div>
                  <Label>Confidence Level</Label>
                  <Select
                    value={testConfig.statisticalSettings.confidenceLevel.toString()}
                    onValueChange={(value) => setTestConfig(prev => ({
                      ...prev,
                      statisticalSettings: {
                        ...prev.statisticalSettings,
                        confidenceLevel: parseInt(value)
                      }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90%</SelectItem>
                      <SelectItem value="95">95%</SelectItem>
                      <SelectItem value="99">99%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Minimum Detectable Effect</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Slider
                      value={[testConfig.statisticalSettings.minimumDetectableEffect]}
                      onValueChange={([value]) => setTestConfig(prev => ({
                        ...prev,
                        statisticalSettings: {
                          ...prev.statisticalSettings,
                          minimumDetectableEffect: value
                        }
                      }))}
                      min={5}
                      max={50}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12">
                      {testConfig.statisticalSettings.minimumDetectableEffect}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    The smallest improvement you want to detect
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Maximum Test Duration (Days)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="90"
                      value={testConfig.statisticalSettings.testDuration.maxDays}
                      onChange={(e) => setTestConfig(prev => ({
                        ...prev,
                        statisticalSettings: {
                          ...prev.statisticalSettings,
                          testDuration: {
                            ...prev.statisticalSettings.testDuration,
                            maxDays: parseInt(e.target.value) || 14
                          }
                        }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Minimum Sample Size</Label>
                    <Input
                      type="number"
                      min="50"
                      value={testConfig.statisticalSettings.testDuration.minSampleSize}
                      onChange={(e) => setTestConfig(prev => ({
                        ...prev,
                        statisticalSettings: {
                          ...prev.statisticalSettings,
                          testDuration: {
                            ...prev.statisticalSettings.testDuration,
                            minSampleSize: parseInt(e.target.value) || 100
                          }
                        }
                      }))}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-winner">Automatically declare winner when significant?</Label>
                  <Switch
                    id="auto-winner"
                    checked={testConfig.statisticalSettings.automaticWinner}
                    onCheckedChange={(checked) => setTestConfig(prev => ({
                      ...prev,
                      statisticalSettings: {
                        ...prev.statisticalSettings,
                        automaticWinner: checked
                      }
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Advanced Features
              </CardTitle>
              <CardDescription>
                Configure advanced testing features and Bayesian optimization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bayesian Optimization */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Bayesian Optimization</h4>
                    <p className="text-sm text-gray-600">
                      Use Bayesian statistics for more efficient testing
                    </p>
                  </div>
                  <Switch
                    checked={testConfig.bayesianSettings.enabled}
                    onCheckedChange={(checked) => setTestConfig(prev => ({
                      ...prev,
                      bayesianSettings: {
                        ...prev.bayesianSettings,
                        enabled: checked
                      }
                    }))}
                  />
                </div>

                {testConfig.bayesianSettings.enabled && (
                  <div className="space-y-4 border-l-4 border-blue-200 pl-4">
                    <div>
                      <Label>Expected Lift (%)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={testConfig.bayesianSettings.priorBelief.expectedLift}
                        onChange={(e) => setTestConfig(prev => ({
                          ...prev,
                          bayesianSettings: {
                            ...prev.bayesianSettings,
                            priorBelief: {
                              ...prev.bayesianSettings.priorBelief,
                              expectedLift: parseInt(e.target.value) || 10
                            }
                          }
                        }))}
                      />
                    </div>

                    <div>
                      <Label>Prior Confidence (%)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={testConfig.bayesianSettings.priorBelief.confidence}
                        onChange={(e) => setTestConfig(prev => ({
                          ...prev,
                          bayesianSettings: {
                            ...prev.bayesianSettings,
                            priorBelief: {
                              ...prev.bayesianSettings.priorBelief,
                              confidence: parseInt(e.target.value) || 50
                            }
                          }
                        }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="dynamic-allocation">Dynamic Traffic Allocation</Label>
                      <Switch
                        id="dynamic-allocation"
                        checked={testConfig.bayesianSettings.dynamicAllocation}
                        onCheckedChange={(checked) => setTestConfig(prev => ({
                          ...prev,
                          bayesianSettings: {
                            ...prev.bayesianSettings,
                            dynamicAllocation: checked
                          }
                        }))}
                      />
                    </div>

                    <div>
                      <Label>Exploration Rate</Label>
                      <div className="flex items-center gap-4 mt-2">
                        <Slider
                          value={[testConfig.bayesianSettings.explorationRate * 100]}
                          onValueChange={([value]) => setTestConfig(prev => ({
                            ...prev,
                            bayesianSettings: {
                              ...prev.bayesianSettings,
                              explorationRate: value / 100
                            }
                          }))}
                          min={5}
                          max={30}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium w-12">
                          {(testConfig.bayesianSettings.explorationRate * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Test Duration Settings */}
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">Test Duration</h4>
                
                <div>
                  <Label>Duration Type</Label>
                  <Select
                    value={testConfig.statisticalSettings.testDuration.type}
                    onValueChange={(value: any) => setTestConfig(prev => ({
                      ...prev,
                      statisticalSettings: {
                        ...prev.statisticalSettings,
                        testDuration: {
                          ...prev.statisticalSettings.testDuration,
                          type: value
                        }
                      }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Duration</SelectItem>
                      <SelectItem value="sequential">Sequential Testing</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-600 mt-1">
                    {testConfig.statisticalSettings.testDuration.type === 'fixed' 
                      ? 'Test runs for a fixed duration regardless of results'
                      : 'Test can end early when statistical significance is reached'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="text-sm text-gray-600">
          {validateConfiguration().length > 0 ? (
            <span className="text-red-600">
              {validateConfiguration().length} validation error(s)
            </span>
          ) : (
            <span className="text-green-600">Configuration valid</span>
          )}
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" disabled={isSubmitting}>
            Save as Draft
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || validateConfiguration().length > 0}
          >
            {isSubmitting ? (
              <>
                <Zap className="h-4 w-4 mr-2 animate-spin" />
                Creating Test...
              </>
            ) : (
              <>
                <BeakerIcon className="h-4 w-4 mr-2" />
                Create A/B Test
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ABTestSetup;
